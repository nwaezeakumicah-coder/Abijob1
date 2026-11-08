import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const allowedRoles = ["job_seeker", "professional", "employer"] as const;
const allowedIntervals = ["monthly", "yearly"] as const;

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

function jsonResponse(
  body: JsonRecord,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function isValidReference(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^ABIJOB-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(
        { error: "Please log in to verify your payment." },
        401
      );
    }

    let body: JsonRecord;

    try {
      body = asRecord(await request.json());
    } catch {
      return jsonResponse(
        { error: "Invalid verification request." },
        400
      );
    }

    const reference = body.reference;

    if (!isValidReference(reference)) {
      return jsonResponse(
        { error: "A valid Abi Job payment reference is required." },
        400
      );
    }

    const admin = createAdminClient();

    const { data: payment, error: paymentError } = await admin
      .from("payment_transactions")
      .select(
        "id,user_id,subscription_id,provider,provider_reference,amount_kobo,currency,billing_interval,status,metadata"
      )
      .eq("provider_reference", reference)
      .eq("provider", "paystack")
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) {
      console.error("Payment lookup error:", paymentError);

      return jsonResponse(
        { error: "We could not retrieve your payment record." },
        500
      );
    }

    if (!payment) {
      return jsonResponse(
        { error: "Payment record not found." },
        404
      );
    }

    if (payment.status === "successful") {
      return jsonResponse({
        success: true,
        alreadyProcessed: true,
        message: "Payment has already been verified and activated.",
      });
    }

    if (payment.status !== "pending") {
      return jsonResponse(
        { error: "This payment cannot be verified." },
        409
      );
    }

    if (
      !payment.subscription_id ||
      payment.user_id !== user.id ||
      payment.provider_reference !== reference
    ) {
      return jsonResponse(
        { error: "Payment ownership or subscription information is invalid." },
        400
      );
    }

    const paymentMetadata = asRecord(payment.metadata);

    const accountRole = paymentMetadata.account_role;
    const billingInterval = payment.billing_interval;
    const storedAmount = Number(payment.amount_kobo);
    const storedCurrency =
      typeof payment.currency === "string"
        ? payment.currency.toUpperCase()
        : "";

    if (
      typeof accountRole !== "string" ||
      !allowedRoles.includes(
        accountRole as (typeof allowedRoles)[number]
      ) ||
      typeof billingInterval !== "string" ||
      !allowedIntervals.includes(
        billingInterval as (typeof allowedIntervals)[number]
      ) ||
      paymentMetadata.user_id !== user.id ||
      paymentMetadata.billing_interval !== billingInterval ||
      String(paymentMetadata.subscription_id) !==
        String(payment.subscription_id) ||
      !Number.isSafeInteger(storedAmount) ||
      storedAmount <= 0 ||
      storedCurrency !== "NGN"
    ) {
      return jsonResponse(
        { error: "Stored payment information is invalid." },
        400
      );
    }

    const { data: subscription, error: subscriptionError } =
      await admin
        .from("subscriptions")
        .select("id,user_id,account_role")
        .eq("id", payment.subscription_id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Subscription lookup error:",
        subscriptionError
      );

      return jsonResponse(
        { error: "Could not validate your subscription record." },
        500
      );
    }

    if (
      !subscription ||
      subscription.user_id !== user.id ||
      subscription.account_role !== accountRole
    ) {
      return jsonResponse(
        { error: "Your payment does not match your subscription." },
        400
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

      return jsonResponse(
        { error: "Paystack verification is temporarily unavailable." },
        502
      );
    }

    let result: JsonRecord;

    try {
      result = asRecord(await response.json());
    } catch {
      return jsonResponse(
        { error: "Paystack returned an invalid verification response." },
        502
      );
    }

    if (result.status !== true) {
      return jsonResponse(
        { error: "Paystack could not verify this transaction." },
        502
      );
    }

    const transaction = asRecord(result.data);
    const metadata = asRecord(transaction.metadata);
    const verifiedAmount = Number(transaction.amount);
    const verifiedCurrency =
      typeof transaction.currency === "string"
        ? transaction.currency.toUpperCase()
        : "";

    if (
      transaction.status !== "success" ||
      transaction.reference !== reference ||
      !Number.isSafeInteger(verifiedAmount) ||
      verifiedAmount !== storedAmount ||
      verifiedCurrency !== storedCurrency ||
      metadata.user_id !== user.id ||
      metadata.account_role !== accountRole ||
      metadata.billing_interval !== billingInterval ||
      String(metadata.subscription_id) !==
        String(payment.subscription_id)
    ) {
      console.error(
        "Payment verification mismatch:",
        reference
      );

      return jsonResponse(
        { error: "Payment details could not be validated." },
        400
      );
    }

    const { data: activationResult, error: activationError } =
      await admin.rpc("complete_paystack_subscription", {
        p_reference: reference,
        p_user_id: user.id,
        p_amount_kobo: verifiedAmount,
        p_currency: verifiedCurrency,
        p_billing_interval: billingInterval,
        p_account_role: accountRole,
      });

    if (activationError) {
      console.error(
        "Subscription activation error:",
        activationError
      );

      return jsonResponse(
        {
          error:
            "Payment was verified, but subscription activation failed. Please retry or contact support.",
        },
        500
      );
    }

    if (activationResult !== true) {
      console.error(
        "Subscription activation returned an unexpected result:",
        activationResult
      );

      return jsonResponse(
        {
          error:
            "Payment was verified, but subscription activation could not be confirmed. Please contact support.",
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      alreadyProcessed: false,
      message:
        "Payment verified and subscription activated successfully.",
    });
  } catch (error) {
    console.error("Paystack verification error:", error);

    return jsonResponse(
      {
        error:
          "An unexpected error occurred while verifying payment.",
      },
      500
    );
  }
}