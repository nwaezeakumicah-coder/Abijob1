
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const allowedRoles = ["job_seeker", "professional", "employer"];
const allowedIntervals = ["monthly", "yearly"];

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  return {};
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to verify your payment." },
        { status: 401 }
      );
    }

    let body: JsonRecord;

    try {
      body = asRecord(await request.json());
    } catch {
      return NextResponse.json(
        { error: "Invalid verification request." },
        { status: 400 }
      );
    }

    const reference = body.reference;

    if (
      typeof reference !== "string" ||
      reference.length < 5 ||
      reference.length > 100
    ) {
      return NextResponse.json(
        { error: "A valid payment reference is required." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    const { data: payment, error: paymentError } = await admin
      .from("payment_transactions")
      .select("*")
      .eq("provider_reference", reference)
      .eq("provider", "paystack")
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) {
      console.error("Payment lookup error:", paymentError);

      return NextResponse.json(
        { error: "We could not retrieve your payment record." },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    if (payment.status === "successful") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment has already been verified and activated.",
      });
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "This payment cannot be verified." },
        { status: 400 }
      );
    }

    if (!payment.subscription_id || !payment.user_id) {
      return NextResponse.json(
        { error: "Payment is missing its user or subscription information." },
        { status: 400 }
      );
    }

    const paymentMetadata = asRecord(payment.metadata);

    const accountRole = paymentMetadata.account_role;
    const billingInterval = payment.billing_interval;
    const storedAmount = Number(payment.amount_kobo);
    const storedCurrency = payment.currency;

    if (
      typeof accountRole !== "string" ||
      !allowedRoles.includes(accountRole) ||
      typeof billingInterval !== "string" ||
      !allowedIntervals.includes(billingInterval) ||
      paymentMetadata.billing_interval !== billingInterval ||
      String(paymentMetadata.subscription_id) !==
        String(payment.subscription_id) ||
      !Number.isSafeInteger(storedAmount) ||
      storedAmount <= 0 ||
      typeof storedCurrency !== "string"
    ) {
      return NextResponse.json(
        { error: "Stored payment information is invalid." },
        { status: 400 }
      );
    }

    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("id,user_id,account_role")
      .eq("id", payment.subscription_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error("Subscription lookup error:", subscriptionError);

      return NextResponse.json(
        { error: "Could not validate your subscription record." },
        { status: 500 }
      );
    }

    if (
      !subscription ||
      subscription.account_role !== accountRole
    ) {
      return NextResponse.json(
        { error: "Your payment does not match your subscription." },
        { status: 400 }
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      throw new Error("Paystack secret key is missing.");
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Paystack verification HTTP error:",
        response.status
      );

      return NextResponse.json(
        { error: "Paystack verification is temporarily unavailable." },
        { status: 502 }
      );
    }

    let result: JsonRecord;

    try {
      result = asRecord(await response.json());
    } catch {
      return NextResponse.json(
        { error: "Paystack returned an invalid verification response." },
        { status: 502 }
      );
    }

    if (result.status !== true) {
      return NextResponse.json(
        { error: "Paystack could not verify this transaction." },
        { status: 502 }
      );
    }

    const transaction = asRecord(result.data);
    const metadata = asRecord(transaction.metadata);
    const verifiedAmount = Number(transaction.amount);

    if (
      transaction.status !== "success" ||
      transaction.reference !== reference ||
      !Number.isSafeInteger(verifiedAmount) ||
      verifiedAmount !== storedAmount ||
      transaction.currency !== storedCurrency ||
      String(metadata.user_id) !== String(user.id) ||
      metadata.account_role !== accountRole ||
      metadata.billing_interval !== billingInterval ||
      String(metadata.subscription_id) !==
        String(payment.subscription_id)
    ) {
      console.error("Payment verification mismatch:", reference);

      return NextResponse.json(
        { error: "Payment details could not be validated." },
        { status: 400 }
      );
    }

    const { error: activationError } = await admin.rpc(
      "complete_paystack_subscription",
      {
        p_reference: reference,
        p_user_id: user.id,
        p_amount_kobo: verifiedAmount,
        p_currency: String(transaction.currency),
        p_billing_interval: billingInterval,
        p_account_role: accountRole,
      }
    );

    if (activationError) {
      console.error("Subscription activation error:", activationError);

      return NextResponse.json(
        {
          error:
            "Payment was verified, but subscription activation failed. Please retry or contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: false,
      message:
        "Payment verified and subscription activated successfully.",
    });
  } catch (error) {
    console.error("Paystack verification error:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while verifying payment.",
      },
      { status: 500 }
    );
  }
}
