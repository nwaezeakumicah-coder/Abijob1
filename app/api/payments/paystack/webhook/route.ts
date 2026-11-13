import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { recoverMissingPaystackPayment } from "@/lib/payments/paystack-recovery";

const allowedRoles = ["job_seeker", "professional", "employer"];
const allowedIntervals = ["monthly", "yearly"];
type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Supabase server environment variables are missing.");
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}

function isValidPaystackSignature(rawBody: string, signature: string, secret: string) {
  if (!/^[a-fA-F0-9]{128}$/.test(signature)) return false;
  const expected = Buffer.from(createHmac("sha512", secret).update(rawBody).digest("hex"), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) throw new Error("Paystack secret key is missing.");

    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    if (!signature || !isValidPaystackSignature(rawBody, signature, paystackSecret)) {
      return NextResponse.json({ error: "Invalid Paystack signature." }, { status: 401 });
    }

    let event: JsonRecord;
    try { event = asRecord(JSON.parse(rawBody)); }
    catch { return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 }); }

    if (event.event !== "charge.success") return NextResponse.json({ received: true });

    const eventData = asRecord(event.data);
    const reference = eventData.reference;
    if (typeof reference !== "string" || reference.length < 5 || reference.length > 100 || eventData.status !== "success") {
      return NextResponse.json({ error: "Invalid successful payment event." }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: foundPayment, error: lookupError } = await admin
      .from("payment_transactions").select("*")
      .eq("provider_reference", reference).eq("provider", "paystack").maybeSingle();

    if (lookupError) {
      console.error("Payment lookup error:", lookupError);
      return NextResponse.json({ error: "Could not retrieve payment record." }, { status: 500 });
    }

    // If the original row was lost or initialized in a different deployment,
    // rebuild it only from Paystack's independent verification + matching plan,
    // profile and subscription. The recovery helper never activates the plan.
    let payment = foundPayment;
    if (!payment) {
      const recovery = await recoverMissingPaystackPayment(admin, reference);
      if (!recovery.payment) {
        console.error("Paystack payment recovery rejected:", reference, recovery.error);
        return NextResponse.json({ error: recovery.error ?? "Payment recovery failed." }, { status: 500 });
      }
      payment = recovery.payment;
      console.info("Recovered missing Paystack payment record:", reference);
    }

    const alreadySuccessful = payment.status === "successful";
    if (payment.status !== "pending" && !alreadySuccessful) {
      return NextResponse.json({ error: "Payment is not in a processable state." }, { status: 409 });
    }
    if (!payment.subscription_id || !payment.user_id) {
      return NextResponse.json({ error: "Payment is missing owner or subscription information." }, { status: 400 });
    }

    const storedMetadata = asRecord(payment.metadata);
    const role = storedMetadata.account_role;
    const interval = payment.billing_interval;
    const amount = Number(payment.amount_kobo);
    const currency = typeof payment.currency === "string" ? payment.currency.toUpperCase() : "";

    if (
      typeof role !== "string" || !allowedRoles.includes(role) ||
      typeof interval !== "string" || !allowedIntervals.includes(interval) ||
      storedMetadata.user_id !== payment.user_id ||
      storedMetadata.billing_interval !== interval ||
      String(storedMetadata.subscription_id) !== String(payment.subscription_id) ||
      !Number.isSafeInteger(amount) || amount <= 0 || currency !== "NGN"
    ) {
      return NextResponse.json({ error: "Stored payment information is invalid." }, { status: 400 });
    }

    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions").select("id,user_id,account_role")
      .eq("id", payment.subscription_id).eq("user_id", payment.user_id).maybeSingle();

    if (subscriptionError) {
      console.error("Subscription lookup error:", subscriptionError);
      return NextResponse.json({ error: "Could not validate subscription." }, { status: 500 });
    }
    if (!subscription || subscription.account_role !== role) {
      return NextResponse.json({ error: "Payment does not match its subscription." }, { status: 400 });
    }

    let verifyResponse: Response;
    try {
      verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${paystackSecret}`, Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );
    } catch (error) {
      console.error("Paystack verification network failure:", error);
      return NextResponse.json({ error: "Paystack verification is temporarily unavailable." }, { status: 502 });
    }

    if (!verifyResponse.ok) {
      console.error("Paystack verification HTTP status:", verifyResponse.status);
      return NextResponse.json({ error: "Paystack verification is temporarily unavailable." }, { status: 502 });
    }

    let verification: JsonRecord;
    try { verification = asRecord(await verifyResponse.json()); }
    catch { return NextResponse.json({ error: "Invalid Paystack verification response." }, { status: 502 }); }

    if (verification.status !== true) {
      return NextResponse.json({ error: "Paystack transaction verification failed." }, { status: 502 });
    }

    const transaction = asRecord(verification.data);
    const verifiedMetadata = asRecord(transaction.metadata);
    const verifiedAmount = Number(transaction.amount);
    const verifiedCurrency = typeof transaction.currency === "string" ? transaction.currency.toUpperCase() : "";

    if (
      transaction.status !== "success" ||
      transaction.reference !== reference ||
      !Number.isSafeInteger(verifiedAmount) || verifiedAmount !== amount ||
      verifiedCurrency !== currency ||
      verifiedMetadata.user_id !== payment.user_id ||
      verifiedMetadata.account_role !== role ||
      verifiedMetadata.billing_interval !== interval ||
      String(verifiedMetadata.subscription_id) !== String(payment.subscription_id) ||
      Number(eventData.amount) !== verifiedAmount ||
      String(eventData.currency).toUpperCase() !== verifiedCurrency
    ) {
      console.error("Paystack webhook verification mismatch:", reference);
      return NextResponse.json({ error: "Transaction details do not match the verified payment." }, { status: 400 });
    }

    const { data: activated, error: activationError } = await admin.rpc("complete_paystack_subscription", {
      p_reference: reference,
      p_user_id: payment.user_id,
      p_amount_kobo: verifiedAmount,
      p_currency: verifiedCurrency,
      p_billing_interval: interval,
      p_account_role: role,
    });

    if (activationError || activated !== true) {
      console.error("Subscription activation RPC failed:", activationError);
      return NextResponse.json({ error: "Subscription activation failed. Paystack may retry this webhook." }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      success: true,
      alreadyProcessed: alreadySuccessful,
      message: alreadySuccessful ? "Payment was already processed." : "Payment verified and subscription activated.",
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
