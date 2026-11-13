import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { recoverMissingPaystackPayment } from "@/lib/payments/paystack-recovery";

const allowedRoles = ["job_seeker", "professional", "employer"];
const allowedIntervals = ["monthly", "yearly"];
type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}
function jsonResponse(body: JsonRecord, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}
function isValidReference(value: unknown): value is string {
  return typeof value === "string" && /^ABIJOB-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Please log in to verify your payment." }, 401);

    let body: JsonRecord;
    try { body = asRecord(await request.json()); }
    catch { return jsonResponse({ error: "Invalid verification request." }, 400); }

    const reference = body.reference;
    if (!isValidReference(reference)) return jsonResponse({ error: "A valid Abi Job payment reference is required." }, 400);

    const admin = createAdminClient();
    const { data: foundPayment, error: paymentError } = await admin
      .from("payment_transactions")
      .select("id,user_id,subscription_id,provider,provider_reference,amount_kobo,currency,billing_interval,status,metadata")
      .eq("provider_reference", reference).eq("provider", "paystack").eq("user_id", user.id).maybeSingle();

    if (paymentError) {
      console.error("Payment lookup failed:", paymentError.message);
      return jsonResponse({ error: "We could not retrieve your payment record." }, 500);
    }

    let payment = foundPayment;
    if (!payment) {
      // The signed-in owner can recover a missing row only when Paystack
      // independently verifies the exact reference and its original metadata.
      const recovery = await recoverMissingPaystackPayment(admin, reference, user.id);
      if (!recovery.payment) {
        console.error("Authenticated payment recovery rejected:", reference, recovery.error);
        return jsonResponse({ error: recovery.error ?? "Payment record not found." }, 404);
      }
      payment = recovery.payment;
      console.info("Recovered missing payment during authenticated verification:", reference);
    }

    if (payment.user_id !== user.id) return jsonResponse({ error: "Payment does not belong to this account." }, 403);
    if (payment.status === "successful") {
      return jsonResponse({ success: true, alreadyProcessed: true, message: "Payment has already been verified and activated." });
    }
    if (payment.status !== "pending") return jsonResponse({ error: "This payment cannot be verified." }, 409);
    if (!payment.subscription_id) return jsonResponse({ error: "Payment subscription information is invalid." }, 400);

    const metadata = asRecord(payment.metadata);
    const role = metadata.account_role;
    const interval = payment.billing_interval;
    const amount = Number(payment.amount_kobo);
    const currency = typeof payment.currency === "string" ? payment.currency.toUpperCase() : "";

    if (
      typeof role !== "string" || !allowedRoles.includes(role) ||
      typeof interval !== "string" || !allowedIntervals.includes(interval) ||
      metadata.user_id !== user.id ||
      metadata.billing_interval !== interval ||
      String(metadata.subscription_id) !== String(payment.subscription_id) ||
      !Number.isSafeInteger(amount) || amount <= 0 || currency !== "NGN"
    ) return jsonResponse({ error: "Stored payment information is invalid." }, 400);

    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions").select("id,user_id,account_role")
      .eq("id", payment.subscription_id).eq("user_id", user.id).maybeSingle();

    if (subscriptionError) {
      console.error("Subscription lookup failed:", subscriptionError.message);
      return jsonResponse({ error: "Could not validate your subscription record." }, 500);
    }
    if (!subscription || subscription.user_id !== user.id || subscription.account_role !== role) {
      return jsonResponse({ error: "Your payment does not match your subscription." }, 400);
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !secret.startsWith("sk_live_")) {
      console.error("Paystack live verification key is not configured.");
      return jsonResponse({ error: "Live payment verification is not correctly configured. Please contact support." }, 503);
    }

    let response: Response;
    try {
      response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error("Paystack verification network failure:", error);
      return jsonResponse({ error: "Could not connect to Paystack. Please retry payment verification." }, 502);
    }

    if (!response.ok) {
      console.error("Paystack verification HTTP failure:", response.status);
      return jsonResponse({ error: "Paystack verification is temporarily unavailable." }, 502);
    }

    let result: JsonRecord;
    try { result = asRecord(await response.json()); }
    catch { return jsonResponse({ error: "Paystack returned an invalid verification response." }, 502); }
    if (result.status !== true) return jsonResponse({ error: "Paystack could not confirm this transaction." }, 502);

    const transaction = asRecord(result.data);
    const verifiedMetadata = asRecord(transaction.metadata);
    const verifiedAmount = Number(transaction.amount);
    const verifiedCurrency = typeof transaction.currency === "string" ? transaction.currency.toUpperCase() : "";

    if (
      transaction.status !== "success" ||
      transaction.reference !== reference ||
      !Number.isSafeInteger(verifiedAmount) || verifiedAmount !== amount ||
      verifiedCurrency !== currency ||
      verifiedMetadata.user_id !== user.id ||
      verifiedMetadata.account_role !== role ||
      verifiedMetadata.billing_interval !== interval ||
      String(verifiedMetadata.subscription_id) !== String(payment.subscription_id)
    ) {
      console.error("Paystack transaction validation mismatch:", reference);
      return jsonResponse({ error: "Payment details could not be validated. Please contact support." }, 400);
    }

    const { data: activationResult, error: activationError } = await admin.rpc("complete_paystack_subscription", {
      p_reference: reference,
      p_user_id: user.id,
      p_amount_kobo: verifiedAmount,
      p_currency: verifiedCurrency,
      p_billing_interval: interval,
      p_account_role: role,
    });

    if (activationError || activationResult !== true) {
      console.error("Subscription activation RPC failed:", activationError);
      return jsonResponse({ error: "Paystack confirmed your payment, but subscription activation failed. Please contact support." }, 500);
    }

    return jsonResponse({ success: true, alreadyProcessed: false, message: "Payment verified and subscription activated successfully." });
  } catch (error) {
    console.error("Unexpected Paystack verification error:", error);
    return jsonResponse({ error: "An unexpected error occurred while verifying payment." }, 500);
  }
}
