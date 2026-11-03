
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";


type BillingInterval = "monthly" | "yearly";

const allowedRoles = ["job_seeker", "professional", "employer"];

function asRecord(value: unknown): Record<string, any> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Record<string, any>;
}

export async function POST(request: Request) {
  let adminSupabase: any = null;
  let paymentReference: string | null = null;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey || !appUrl) {
      return NextResponse.json(
        {
          error:
            "Payment configuration is incomplete. Check your server environment variables.",
        },
        { status: 500 }
      );
    }

    // Validate the application URL.
    let parsedAppUrl: URL;

    try {
      parsedAppUrl = new URL(appUrl);
    } catch {
      return NextResponse.json(
        { error: "The application URL is invalid." },
        { status: 500 }
      );
    }

    const isSecureUrl = parsedAppUrl.protocol === "https:";
    const isLocalhost =
      parsedAppUrl.protocol === "http:" &&
      parsedAppUrl.hostname === "localhost";

    if (
      (!isSecureUrl && !isLocalhost) ||
      parsedAppUrl.username ||
      parsedAppUrl.password ||
      parsedAppUrl.search ||
      parsedAppUrl.hash
    ) {
      return NextResponse.json(
        { error: "The application URL must use HTTPS." },
        { status: 500 }
      );
    }

    // Validate the request body.
    let body: Record<string, any>;

    try {
      body = asRecord(await request.json());
    } catch {
      return NextResponse.json(
        { error: "Invalid payment request." },
        { status: 400 }
      );
    }

    const billingInterval = body.billingInterval as BillingInterval;

    if (!["monthly", "yearly"].includes(billingInterval)) {
      return NextResponse.json(
        { error: "Please select a valid billing option." },
        { status: 400 }
      );
    }

    // Authenticate the customer.
    const userSupabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in before making a payment." },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          error:
            "Your account needs a valid email address before payment.",
        },
        { status: 400 }
      );
    }

    // Retrieve the authenticated user's account role.
    const { data: profile, error: profileError } = await userSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Your account profile could not be found." },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        {
          error:
            "This account cannot purchase a platform subscription.",
        },
        { status: 403 }
      );
    }

    // Create the server-side Supabase admin client.
    adminSupabase = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Retrieve the subscription plan and database-controlled price.
    const { data: plan, error: planError } = await adminSupabase
      .from("subscription_plans")
      .select("account_role,billing_interval,amount_kobo")
      .eq("account_role", profile.role)
      .eq("billing_interval", billingInterval)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        {
          error:
            "The selected subscription plan could not be found.",
        },
        { status: 404 }
      );
    }

    const amountKobo = Number(plan.amount_kobo);

    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      return NextResponse.json(
        { error: "The selected subscription price is invalid." },
        { status: 400 }
      );
    }

    // Retrieve the user's subscription.
    const { data: subscription, error: subscriptionError } =
      await adminSupabase
        .from("subscriptions")
        .select("id,user_id,account_role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (subscriptionError) {
      console.error("Subscription lookup error:", subscriptionError);

      return NextResponse.json(
        { error: "Could not load your subscription record." },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        {
          error:
            "Your subscription record is missing. Please contact support.",
        },
        { status: 400 }
      );
    }

    if (
      subscription.user_id !== user.id ||
      subscription.account_role !== profile.role ||
      plan.account_role !== profile.role ||
      plan.billing_interval !== billingInterval
    ) {
      return NextResponse.json(
        {
          error:
            "Your subscription details do not match your account.",
        },
        { status: 403 }
      );
    }

    // Generate a unique payment reference.
    const reference = `ABI-${Date.now()}-${randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)}`;

    paymentReference = reference;

    const callbackUrl = new URL(
      "/subscription/success",
      parsedAppUrl.origin
    ).toString();

    // Save the pending payment before initializing Paystack.
    const { error: transactionError } = await adminSupabase
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        provider: "paystack",
        provider_reference: reference,
        amount_kobo: amountKobo,
        currency: "NGN",
        billing_interval: billingInterval,
        status: "pending",
        metadata: {
          user_id: user.id,
          account_role: profile.role,
          billing_interval: billingInterval,
          subscription_id: subscription.id,
        },
      });

    if (transactionError) {
      console.error("Transaction record error:", transactionError);

      return NextResponse.json(
        {
          error:
            "We could not create your payment record. Please try again.",
        },
        { status: 500 }
      );
    }

    // Mark unsuccessful initialization attempts as failed.
    const markPaymentFailed = async () => {
      const { error } = await adminSupabase
        .from("payment_transactions")
        .update({ status: "failed" })
        .eq("provider_reference", reference)
        .eq("provider", "paystack")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error) {
        console.error("Failed to update payment status:", error);
      }
    };

    // Initialize the payment with Paystack.
    let paystackResponse: Response;

    try {
      paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: amountKobo,
            currency: "NGN",
            reference,
            callback_url: callbackUrl,
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
    } catch (error) {
      console.error("Paystack connection error:", error);

      await markPaymentFailed();

      return NextResponse.json(
        {
          error:
            "We could not connect to Paystack. Please try again.",
        },
        { status: 502 }
      );
    }

    // Safely parse Paystack's response.
    let paystackResult: Record<string, any>;

    try {
      paystackResult = asRecord(await paystackResponse.json());
    } catch {
      await markPaymentFailed();

      return NextResponse.json(
        {
          error:
            "Paystack returned an invalid response. Please try again.",
        },
        { status: 502 }
      );
    }

    const paystackData = asRecord(paystackResult.data);

    if (
      !paystackResponse.ok ||
      paystackResult.status !== true ||
      typeof paystackData.authorization_url !== "string" ||
      typeof paystackData.access_code !== "string"
    ) {
      console.error("Paystack initialization failed:", {
        status: paystackResponse.status,
        message: paystackResult.message,
      });

      await markPaymentFailed();

      return NextResponse.json(
        {
          error:
            typeof paystackResult.message === "string"
              ? paystackResult.message
              : "Paystack could not initialize this payment. Please try again.",
        },
        { status: 502 }
      );
    }

    // Validate the checkout URL.
    let authorizationUrl: URL;

    try {
      authorizationUrl = new URL(paystackData.authorization_url);
    } catch {
      await markPaymentFailed();

      return NextResponse.json(
        { error: "Paystack returned an invalid checkout URL." },
        { status: 502 }
      );
    }

    if (
      authorizationUrl.protocol !== "https:" ||
      authorizationUrl.hostname !== "checkout.paystack.com"
    ) {
      await markPaymentFailed();

      return NextResponse.json(
        { error: "Paystack returned an unsafe checkout URL." },
        { status: 502 }
      );
    }

    // Store Paystack's access code for reference.
    const { error: metadataError } = await adminSupabase
      .from("payment_transactions")
      .update({
        metadata: {
          user_id: user.id,
          account_role: profile.role,
          billing_interval: billingInterval,
          subscription_id: subscription.id,
          paystack_access_code: paystackData.access_code,
        },
      })
      .eq("provider_reference", reference)
      .eq("provider", "paystack")
      .eq("user_id", user.id);

    if (metadataError) {
      console.error(
        "Paystack access code storage error:",
        metadataError
      );
    }

    return NextResponse.json({
      authorization_url: authorizationUrl.toString(),
      reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);

    // Mark an existing pending payment as failed after an unexpected error.
    if (adminSupabase && paymentReference) {
      const { error: updateError } = await adminSupabase
        .from("payment_transactions")
        .update({ status: "failed" })
        .eq("provider_reference", paymentReference)
        .eq("provider", "paystack")
        .eq("status", "pending");

      if (updateError) {
        console.error(
          "Failed to update payment after unexpected error:",
          updateError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while starting payment.",
      },
      { status: 500 }
    );
  }
}
