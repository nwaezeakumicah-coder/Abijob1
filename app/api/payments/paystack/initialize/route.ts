
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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

function jsonResponse(body: JsonRecord, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createAdminClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
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

export async function POST(request: Request) {
  let userId: string | null = null;
  let transactionId: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Please log in to continue." }, 401);
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
      return jsonResponse({ error: "Invalid payment request." }, 400);
    }

    const billingInterval = body.billingInterval;
    const requestedRole = body.accountRole;

    if (
      typeof billingInterval !== "string" ||
      !allowedIntervals.includes(billingInterval)
    ) {
      return jsonResponse({ error: "Invalid billing interval." }, 400);
    }

    if (
      typeof requestedRole !== "string" ||
      !allowedRoles.includes(requestedRole)
    ) {
      return jsonResponse({ error: "Invalid account type." }, 400);
    }

    const admin = getAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile lookup error:", profileError);
      return jsonResponse({ error: "Could not verify your account." }, 400);
    }

    if (profile.role !== requestedRole) {
      return jsonResponse(
        { error: "Account type does not match your profile." },
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
    const currency = String(plan.currency || "NGN").toUpperCase();

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

    const { data: subscription, error: subscriptionError } = await admin
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

    const reference = `ABIJOB-${randomUUID()}`;

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
        metadata: {
          user_id: user.id,
          account_role: profile.role,
          billing_interval: billingInterval,
          subscription_id: subscription.id,
        },
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("Payment record creation error:", paymentError);
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
          metadata: {
            user_id: user.id,
            account_role: profile.role,
            billing_interval: billingInterval,
            subscription_id: subscription.id,
          },
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Paystack initialization HTTP error:", response.status);
      throw new Error("Paystack initialization failed.");
    }

    let result: JsonRecord;

    try {
      result = asRecord(await response.json());
    } catch {
      throw new Error("Invalid Paystack initialization response.");
    }

    if (result.status !== true) {
      throw new Error("Paystack could not initialize payment.");
    }

    const data = asRecord(result.data);
    const authorizationUrl = data.authorization_url;
    const accessCode = data.access_code;

    if (
      typeof authorizationUrl !== "string" ||
      typeof accessCode !== "string"
    ) {
      throw new Error("Invalid Paystack checkout details.");
    }

    const checkoutUrl = new URL(authorizationUrl);

    if (
      checkoutUrl.protocol !== "https:" ||
      checkoutUrl.hostname !== "checkout.paystack.com"
    ) {
      throw new Error("Invalid Paystack checkout URL.");
    }

    const { error: updateError } = await admin
      .from("payment_transactions")
      .update({
        metadata: {
          user_id: user.id,
          account_role: profile.role,
          billing_interval: billingInterval,
          subscription_id: subscription.id,
          paystack_access_code: accessCode,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (updateError) {
      console.error("Payment metadata update error:", updateError);
      throw new Error("Could not save payment details.");
    }

    return jsonResponse({
      success: true,
      authorizationUrl,
      reference,
      message: "Payment initialized successfully.",
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);

    if (transactionId && userId) {
      try {
        const admin = getAdminClient();

        await admin
          .from("payment_transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", transactionId)
          .eq("user_id", userId)
          .eq("status", "pending");
      } catch (cleanupError) {
        console.error("Payment cleanup error:", cleanupError);
      }
    }

    return jsonResponse(
      {
        error: "We could not initialize your payment. Please try again.",
      },
      500
    );
  }
}
