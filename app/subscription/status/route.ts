
import { NextResponse } from "next/server";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  await connection();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to view your subscription." },
        { status: 401 }
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

      return NextResponse.json(
        { error: "Could not retrieve your subscription information." },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json({
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

      return NextResponse.json(
        { error: "Could not verify your platform access." },
        { status: 500 }
      );
    }

    const now = Date.now();

    const trialStartedAt = subscription.trial_started_at
      ? new Date(subscription.trial_started_at).getTime()
      : null;

    const trialEndsAt = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at).getTime()
      : null;

    const periodStartsAt = subscription.current_period_start
      ? new Date(subscription.current_period_start).getTime()
      : null;

    const periodEndsAt = subscription.current_period_end
      ? new Date(subscription.current_period_end).getTime()
      : null;

    // Trial remains active until its actual expiry,
    // even if a paid period has already been scheduled.
    const isTrialActive =
      trialEndsAt !== null &&
      Number.isFinite(trialEndsAt) &&
      trialEndsAt > now;

    // A paid subscription is active only during its paid period.
    const isPaidSubscriptionActive =
      subscription.status === "active" &&
      periodStartsAt !== null &&
      Number.isFinite(periodStartsAt) &&
      periodEndsAt !== null &&
      Number.isFinite(periodEndsAt) &&
      periodStartsAt <= now &&
      periodEndsAt > now;

    // Payment has been completed, but the paid period
    // has not started because the free trial is still running.
    const hasScheduledPaidPeriod =
      subscription.status === "active" &&
      periodStartsAt !== null &&
      Number.isFinite(periodStartsAt) &&
      periodEndsAt !== null &&
      Number.isFinite(periodEndsAt) &&
      periodStartsAt > now &&
      periodEndsAt > now;

    const hasPlatformAccess = Boolean(databaseAccess);

    return NextResponse.json({
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

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while checking your subscription.",
      },
      { status: 500 }
    );
  }
}
