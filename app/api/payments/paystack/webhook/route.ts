
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";


const allowedRoles = ["job_seeker", "professional", "employer"];
const allowedIntervals = ["monthly", "yearly"];

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as JsonRecord;
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

function isValidPaystackSignature(
  rawBody: string,
  signature: string,
  secret: string
) {
  if (!/^[a-fA-F0-9]{128}$/.test(signature)) {
    return false;
  }

  const expectedSignature = createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export async function POST(request: Request) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      throw new Error("Paystack secret key is missing.");
    }

    // Read the original request body for signature verification.
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (
      !signature ||
      !isValidPaystackSignature(rawBody, signature, paystackSecret)
    ) {
      return NextResponse.json(
        { error: "Invalid Paystack signature." },
        { status: 401 }
      );
    }

    // Safely parse the webhook payload.
    let event: JsonRecord;

    try {
      event = asRecord(JSON.parse(rawBody));
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook payload." },
        { status: 400 }
      );
    }

    // Ignore events unrelated to successful charges.
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const eventData = asRecord(event.data);
    const reference = eventData.reference;

    if (
      typeof reference !== "string" ||
      reference.length < 5 ||
      reference.length > 100 ||
      eventData.status !== "success"
    ) {
      return NextResponse.json(
        { error: "Invalid successful payment event." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // Find the payment record created during checkout initialization.
    const { data: payment, error: paymentError } = await admin
      .from("payment_transactions")
      .select("*")
      .eq("provider_reference", reference)
      .eq("provider", "paystack")
      .maybeSingle();

    if (paymentError) {
      console.error("Payment lookup error:", paymentError);

      return NextResponse.json(
        { error: "Could not retrieve payment record." },
        { status: 500 }
      );
    }

    if (!payment) {
      console.error("Webhook payment record not found:", reference);

      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    // Protect against repeated webhook deliveries.
    if (payment.status === "paid") {
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
      });
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "Payment is not pending." },
        { status: 400 }
      );
    }

    if (!payment.subscription_id || !payment.user_id) {
      return NextResponse.json(
        {
          error:
            "Payment is missing its user or subscription information.",
        },
        { status: 400 }
      );
    }

    // Validate the stored payment information.
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
      paymentMetadata.user_id !== payment.user_id ||
      paymentMetadata.billing_interval !== billingInterval ||
      paymentMetadata.subscription_id !== payment.subscription_id ||
      !Number.isSafeInteger(storedAmount) ||
      storedAmount <= 0 ||
      storedCurrency !== "NGN"
    ) {
      return NextResponse.json(
        { error: "Stored payment information is invalid." },
        { status: 400 }
      );
    }

    // Confirm that the subscription belongs to this user and role.
    const { data: subscription, error: subscriptionError } =
      await admin
        .from("subscriptions")
        .select("id,user_id,account_role")
        .eq("id", payment.subscription_id)
        .eq("user_id", payment.user_id)
        .maybeSingle();

    if (subscriptionError) {
      console.error("Subscription lookup error:", subscriptionError);

      return NextResponse.json(
        { error: "Could not validate the subscription record." },
        { status: 500 }
      );
    }

    if (
      !subscription ||
      subscription.account_role !== accountRole
    ) {
      return NextResponse.json(
        { error: "Payment does not match its subscription." },
        { status: 400 }
      );
    }

    // Independently verify the transaction with Paystack.
    let verificationResponse: Response;

    try {
      verificationResponse = await fetch(
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
    } catch (error) {
      console.error("Paystack verification connection error:", error);

      return NextResponse.json(
        {
          error:
            "Paystack verification is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    if (!verificationResponse.ok) {
      console.error(
        "Paystack verification HTTP error:",
        verificationResponse.status
      );

      return NextResponse.json(
        {
          error:
            "Paystack verification is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    // Safely parse Paystack's verification response.
    let verification: JsonRecord;

    try {
      verification = asRecord(await verificationResponse.json());
    } catch {
      return NextResponse.json(
        { error: "Paystack returned an invalid verification response." },
        { status: 502 }
      );
    }

    if (verification.status !== true) {
      return NextResponse.json(
        { error: "Paystack transaction verification failed." },
        { status: 502 }
      );
    }

    const transaction = asRecord(verification.data);
    const transactionMetadata = asRecord(transaction.metadata);

    const verifiedAmount = Number(transaction.amount);

    // Compare Paystack's verified transaction against our database.
    if (
      transaction.status !== "success" ||
      transaction.reference !== reference ||
      !Number.isSafeInteger(verifiedAmount) ||
      verifiedAmount !== storedAmount ||
      transaction.currency !== storedCurrency ||
      transactionMetadata.user_id !== payment.user_id ||
      transactionMetadata.account_role !== accountRole ||
      transactionMetadata.billing_interval !== billingInterval ||
      transactionMetadata.subscription_id !== payment.subscription_id ||
      Number(eventData.amount) !== verifiedAmount ||
      eventData.currency !== transaction.currency
    ) {
      console.error(
        "Paystack transaction mismatch:",
        reference
      );

      return NextResponse.json(
        {
          error:
            "Transaction details do not match the payment record.",
        },
        { status: 400 }
      );
    }

    // Activate through the protected database function.
    // The function handles locking, validation and duplicate protection.
    const { error: activationError } = await admin.rpc(
      "complete_paystack_subscription",
      {
        p_reference: reference,
        p_user_id: payment.user_id,
        p_amount_kobo: verifiedAmount,
        p_currency: String(transaction.currency),
        p_billing_interval: billingInterval,
        p_account_role: accountRole,
      }
    );

    if (activationError) {
      console.error(
        "Webhook subscription activation error:",
        activationError
      );

      // Return 500 so Paystack can retry the webhook.
      return NextResponse.json(
        {
          error:
            "Subscription activation failed. Please retry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      success: true,
      message: "Payment verified and subscription activated.",
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
