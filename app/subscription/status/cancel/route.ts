
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to manage your subscription." },
        { status: 401 }
      );
    }

    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select(
          "id,user_id,status,trial_ends_at,current_period_start,current_period_end,cancel_at_period_end"
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (subscriptionError) {
      console.error("Subscription lookup error:", subscriptionError);

      return NextResponse.json(
        { error: "Could not retrieve your subscription." },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription was found for this account." },
        { status: 404 }
      );
    }

    const now = Date.now();

    const periodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start).getTime()
      : null;

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end).getTime()
      : null;

    const trialEnd = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at).getTime()
      : null;

    // A paid plan must have been successfully activated
    // and must still have time remaining.
    if (
      subscription.status !== "active" ||
      periodStart === null ||
      !Number.isFinite(periodStart) ||
      periodEnd === null ||
      !Number.isFinite(periodEnd) ||
      periodEnd <= now
    ) {
      return NextResponse.json(
        {
          error:
            "There is no active or scheduled paid subscription available to mark as not renewing.",
        },
        { status: 400 }
      );
    }

    if (subscription.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        alreadyScheduled: true,
        message:
          "Your subscription is already marked as not renewing. Your remaining trial and paid access will continue according to their expiry dates.",
        trialEndsAt: subscription.trial_ends_at,
        paidPeriodStartsAt: subscription.current_period_start,
        paidPeriodEndsAt: subscription.current_period_end,
        automaticRecurringBilling: false,
      });
    }

    const { data: updatedSubscription, error: updateError } =
      await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)
        .eq("user_id", user.id)
        .select(
          "id,cancel_at_period_end,trial_ends_at,current_period_start,current_period_end"
        )
        .single();

    if (updateError || !updatedSubscription) {
      console.error("Subscription cancellation update error:", updateError);

      return NextResponse.json(
        { error: "Could not update your subscription preferences." },
        { status: 500 }
      );
    }

    const trialStillActive =
      trialEnd !== null &&
      Number.isFinite(trialEnd) &&
      trialEnd > now;

    return NextResponse.json({
      success: true,
      alreadyScheduled: false,
      message: trialStillActive
        ? "Your plan has been marked as not renewing. Your free trial continues until it expires, and your paid period remains scheduled afterward."
        : "Your plan has been marked as not renewing. Your paid access remains available until the current paid period expires.",
      trialEndsAt: updatedSubscription.trial_ends_at,
      paidPeriodStartsAt: updatedSubscription.current_period_start,
      paidPeriodEndsAt: updatedSubscription.current_period_end,
      automaticRecurringBilling: false,
    });
  } catch (error) {
    console.error("Subscription cancellation API error:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating your subscription.",
      },
      { status: 500 }
    );
  }
}
