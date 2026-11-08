
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const allowedRoles = ["job_seeker", "professional", "employer"] as const;
const allowedIntervals = ["monthly", "yearly"] as const;

type JsonRecord = Record<string, unknown>;

type PendingPayment = {
  id: string;
  provider_reference: string;
  amount_kobo: number | string;
  currency: string;
  billing_interval: string;
  metadata: JsonRecord | null;
};

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

function jsonResponse(body: JsonRecord, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is missing.");
  }

  const parsedUrl = new URL(appUrl);

  const isLocalhost =
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1";

  if (
    parsedUrl.protocol !== "https:" &&
    !(isLocalhost && parsedUrl.protocol === "http:")
  ) {
    throw new Error("Invalid application URL.");
  }

  return parsedUrl.origin;
}

function getSafePaystackCheckoutUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.hostname !== "checkout.paystack.com" ||
      url.username !== "" ||
      url.password !== "" ||
      url.port !== ""
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function getReusableCheckout(
  payment: PendingPayment,
  expected: {
    userId: string;
    subscriptionId: string;
    accountRole: string;
    billingInterval: string;
    amountKobo: number;
    currency: string;
  }
) {
  const metadata = asRecord(payment.metadata);

  const checkoutUrl = getSafePaystackCheckoutUrl(
    metadata.paystack_authorization_url
  );

  const matches =
    payment.amount_kobo !== null &&
    Number(payment.amount_kobo) === expected.amountKobo &&
    payment.currency?.toUpperCase() === expected.currency &&
    payment.billing_interval === expected.billingInterval &&
    metadata.user_id === expected.userId &&
    metadata.subscription_id === expected.subscriptionId &&
    metadata.account_role === expected.accountRole &&
    metadata.billing_interval === expected.billingInterval;

  if (!matches || !checkoutUrl) {
    return null;
  }

  return {
    authorizationUrl: checkoutUrl,
    reference: payment.provider_reference,
  };
}

async function findPendingPayment(
  admin: ReturnType<typeof createAdminClient>,
  subscriptionId: string
) {
  return admin
    .from("payment_transactions")
    .select(
      "id,provider_reference,amount_kobo,currency,billing_interval,metadata"
    )
    .eq("subscription_id", subscriptionId)
    .eq("provider", "paystack")
    .eq("status", "pending")
    .maybeSingle();
}

export async function POST(request: Request) {
  let userId: string | null = null;
  let transactionId: string | null = null;

  // After sending a request to Paystack, its outcome may be
  // ambiguous. Never automatically fail that transaction.
  let paystackRequestStarted = false;

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(
        { error: "Please log in to continue." },
        401
      );
    }

    userId = user.id;

    if (!user.email) {
      return jsonResponse(
        { error: "Your account does not have a valid email address." },
        400
      );
    }

    let body: JsonRecord;

    try {
      body = asRecord(await request.json());
    } catch {
      return jsonResponse(
        { error: "Invalid payment request." },
        400
      );
    }

    const billingInterval = body.billingInterval;
    const requestedRole = body.accountRole;

    if (
      typeof billingInterval !== "string" ||
      !allowedIntervals.includes(
        billingInterval as (typeof allowedIntervals)[number]
      )
    ) {
      return jsonResponse(
        { error: "Invalid billing interval." },
        400
      );
    }

    if (
      typeof requestedRole !== "string" ||
      !allowedRoles.includes(
        requestedRole as (typeof allowedRoles)[number]
      )
    ) {
      return jsonResponse(
        { error: "Invalid account type." },
        400
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile lookup error:", profileError);

      return jsonResponse(
        { error: "Could not verify your account." },
        400
      );
    }

    if (profile.role !== requestedRole) {
      return jsonResponse(
        { error: "Account type does not match your profile." },
        403
      );
    }

    if (
      !allowedRoles.includes(
        profile.role as (typeof allowedRoles)[number]
      )
    ) {
      return jsonResponse(
        { error: "This account type cannot purchase a membership." },
        403
      );
    }

    const { data: plan, error: planError } = await admin
      .from("subscription_plans")
      .select("amount_kobo,currency")
      .eq("account_role", profile.role)
      .eq("billing_interval", billingInterval)
      .maybeSingle();

    if (planError || !plan) {
      console.error("Subscription plan lookup error:", planError);

      return jsonResponse(
        { error: "Selected subscription plan is unavailable." },
        404
      );
    }

    const amountKobo = Number(plan.amount_kobo);
    const currency =
      typeof plan.currency === "string"
        ? plan.currency.toUpperCase()
        : "";

    if (
      !Number.isSafeInteger(amountKobo) ||
      amountKobo <= 0 ||
      currency !== "NGN"
    ) {
      return jsonResponse(
        { error: "Subscription plan pricing is invalid." },
        400
      );
    }

    const { data: subscription, error: subscriptionError } =
      await admin
        .from("subscriptions")
        .select("id,user_id,account_role")
        .eq("user_id", user.id)
        .eq("account_role", profile.role)
        .maybeSingle();

    if (subscriptionError || !subscription) {
      console.error("Subscription lookup error:", subscriptionError);

      return jsonResponse(
        { error: "Your subscription record could not be found." },
        404
      );
    }

    if (
      subscription.user_id !== user.id ||
      subscription.account_role !== profile.role
    ) {
      return jsonResponse(
        { error: "Your subscription could not be verified." },
        403
      );
    }

    const expectedPayment = {
      userId: user.id,
      subscriptionId: subscription.id,
      accountRole: profile.role,
      billingInterval,
      amountKobo,
      currency,
    };

    // Reuse an existing valid pending checkout.
    const {
      data: existingPending,
      error: pendingLookupError,
    } = await findPendingPayment(admin, subscription.id);

    if (pendingLookupError) {
      console.error(
        "Pending payment lookup error:",
        pendingLookupError
      );

      return jsonResponse(
        { error: "Could not check your existing payment." },
        500
      );
    }

    if (existingPending) {
      const reusable = getReusableCheckout(
        existingPending as PendingPayment,
        expectedPayment
      );

      if (reusable) {
        return jsonResponse({
          success: true,
          authorizationUrl: reusable.authorizationUrl,
          reference: reusable.reference,
          reused: true,
          message: "Your existing payment checkout is ready.",
        });
      }

      return jsonResponse(
        {
          error:
            "You already have a pending payment. Please complete it or contact support to verify its status before starting another payment.",
          code: "PENDING_PAYMENT_EXISTS",
          reference: existingPending.provider_reference,
        },
        409
      );
    }

    const reference = `ABIJOB-${randomUUID()}`;

    const metadata = {
      user_id: user.id,
      account_role: profile.role,
      billing_interval: billingInterval,
      subscription_id: subscription.id,
    };

    const { data: payment, error: paymentError } = await admin
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        provider: "paystack",
        provider_reference: reference,
        amount_kobo: amountKobo,
        currency,
        billing_interval: billingInterval,
        status: "pending",
        metadata,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      // The database unique index protects simultaneous requests.
      if (paymentError?.code === "23505") {
        const {
          data: racedPayment,
          error: racedLookupError,
        } = await findPendingPayment(admin, subscription.id);

        if (racedLookupError) {
          console.error(
            "Concurrent payment lookup error:",
            racedLookupError
          );

          return jsonResponse(
            { error: "Could not check your existing payment." },
            500
          );
        }

        if (racedPayment) {
          const reusable = getReusableCheckout(
            racedPayment as PendingPayment,
            expectedPayment
          );

          if (reusable) {
            return jsonResponse({
              success: true,
              authorizationUrl: reusable.authorizationUrl,
              reference: reusable.reference,
              reused: true,
              message: "Your existing payment checkout is ready.",
            });
          }

          return jsonResponse(
            {
              error:
                "Another payment request is already being processed. Please wait for its status to be confirmed before trying again.",
              code: "PENDING_PAYMENT_EXISTS",
              reference: racedPayment.provider_reference,
            },
            409
          );
        }
      }

      console.error(
        "Payment record creation error:",
        paymentError
      );

      return jsonResponse(
        { error: "Could not create your payment record." },
        500
      );
    }

    transactionId = payment.id;

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      throw new Error("Paystack secret key is missing.");
    }

    const appUrl = getAppUrl();

    // Once the request is sent, a timeout or lost response could
    // mean Paystack initialized the transaction successfully.
    paystackRequestStarted = true;

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountKobo,
          currency,
          reference,
          callback_url: `${appUrl}/subscription/checkout/callback`,
          metadata,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!response.ok) {
      console.error(
        "Paystack initialization HTTP error:",
        response.status
      );

      throw new Error(
        "Paystack initialization response was unsuccessful."
      );
    }

    let result: JsonRecord;

    try {
      result = asRecord(await response.json());
    } catch {
      throw new Error(
        "Invalid Paystack initialization response."
      );
    }

    if (result.status !== true) {
      throw new Error(
        "Paystack could not initialize payment."
      );
    }

    const data = asRecord(result.data);

    if (data.reference !== reference) {
      console.error(
        "Paystack initialization reference mismatch:",
        reference
      );

      throw new Error(
        "Paystack returned an unexpected payment reference."
      );
    }

    const authorizationUrl = getSafePaystackCheckoutUrl(
      data.authorization_url
    );

    const accessCode = data.access_code;

    if (
      !authorizationUrl ||
      typeof accessCode !== "string" ||
      !accessCode
    ) {
      throw new Error(
        "Invalid Paystack checkout details."
      );
    }

    // Store the URL to allow safe checkout reuse.
    const { data: updatedPayment, error: updateError } =
      await admin
        .from("payment_transactions")
        .update({
          metadata: {
            ...metadata,
            paystack_access_code: accessCode,
            paystack_authorization_url: authorizationUrl,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("user_id", user.id)
        .eq("provider_reference", reference)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

    if (updateError || !updatedPayment) {
      console.error(
        "Payment metadata update error:",
        updateError
      );

      throw new Error(
        "Paystack initialized the payment, but Abi Job could not save the checkout details."
      );
    }

    return jsonResponse({
      success: true,
      authorizationUrl,
      reference,
      reused: false,
      message: "Payment initialized successfully.",
    });
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Only mark failed if the request was never sent to Paystack.
    if (
      transactionId &&
      userId &&
      !paystackRequestStarted
    ) {
      try {
        const admin = createAdminClient();

        const { error: cleanupError } = await admin
          .from("payment_transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", transactionId)
          .eq("user_id", userId)
          .eq("status", "pending");

        if (cleanupError) {
          console.error(
            "Payment cleanup error:",
            cleanupError
          );
        }
      } catch (cleanupError) {
        console.error(
          "Payment cleanup error:",
          cleanupError instanceof Error
            ? cleanupError.message
            : "Unknown error"
        );
      }
    }

    return jsonResponse(
      {
        error:
          "We could not confirm your payment checkout. If a transaction was started, do not make another payment until its status has been checked.",
        code: paystackRequestStarted
          ? "PAYMENT_INITIALIZATION_UNCONFIRMED"
          : "PAYMENT_INITIALIZATION_FAILED",
      },
      paystackRequestStarted ? 503 : 500
    );
  }
}
