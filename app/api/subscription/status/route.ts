import { NextResponse, connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function timestamp(value: string | null | undefined): number | null {
  if (!value) return null;

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET() {
  await connection();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(
        { error: "Please log in to view your subscription." },
        401
      );
    }

    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select(
          "id,user_id,account_role,billing_interval,status,trial_started_at,trial_ends_at,current_period_start,current_period_end,cancel_at_period_end"
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (subscriptionError) {
      console.error("Subscription lookup error:", subscriptionError);

      return jsonResponse(
        { error: "Could not retrieve your subscription information." },
        500
      );
    }

    if (!subscription) {
      return jsonResponse({
        success: true,
        hasSubscription: false,
        hasAccess: false,
        hasPlatformAccess: false,
        subscription: null,
        access: {
          hasAccess: false,
          hasPlatformAccess: false,
          isTrialActive: false,
          isPaidSubscriptionActive: false,
          hasScheduledPaidPeriod: false,
        },
        message: "No subscription record was found for this account.",
      });
    }

    const { data: databaseAccess, error: accessError } =
      await supabase.rpc("has_platform_access");

    if (accessError) {
      console.error("Subscription access check error:", accessError);

      return jsonResponse(
        { error: "Could not verify your platform access." },
        500
      );
    }

    const now = Date.now();

    const trialStartedAt = timestamp(subscription.trial_started_at);
    const trialEndsAt = timestamp(subscription.trial_ends_at);
    const periodStartsAt = timestamp(subscription.current_period_start);
    const periodEndsAt = timestamp(subscription.current_period_end);

    const isTrialActive =
      ["trialing", "active"].includes(subscription.status) &&
      trialStartedAt !== null &&
      trialStartedAt <= now &&
      trialEndsAt !== null &&
      trialEndsAt > now;

    const isPaidSubscriptionActive =
      subscription.status === "active" &&
      periodStartsAt !== null &&
      periodStartsAt <= now &&
      periodEndsAt !== null &&
      periodEndsAt > now;

    const hasScheduledPaidPeriod =
      subscription.status === "active" &&
      periodStartsAt !== null &&
      periodStartsAt > now &&
      periodEndsAt !== null &&
      periodEndsAt > now;

    const hasPlatformAccess = databaseAccess === true;

    return jsonResponse({
      success: true,
      hasSubscription: true,
      hasAccess: hasPlatformAccess,
      hasPlatformAccess,

      subscription: {
        id: subscription.id,
        accountRole: subscription.account_role,
        billingInterval: subscription.billing_interval,
        status: subscription.status,

        trial: {
          startedAt: subscription.trial_started_at,
          endsAt: subscription.trial_ends_at,
          isActive: isTrialActive,
        },

        paidPeriod: {
          startedAt: subscription.current_period_start,
          endsAt: subscription.current_period_end,
          isActive: isPaidSubscriptionActive,
          isScheduled: hasScheduledPaidPeriod,
        },

        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },

      access: {
        hasAccess: hasPlatformAccess,
        hasPlatformAccess,
        isTrialActive,
        isPaidSubscriptionActive,
        hasScheduledPaidPeriod,
      },
    });
  } catch (error) {
    console.error("Subscription status API error:", error);

    return jsonResponse(
      {
        error:
          "An unexpected error occurred while checking your subscription.",
      },
      500
    );
  }
}