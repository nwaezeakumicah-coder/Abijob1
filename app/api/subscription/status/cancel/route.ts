
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST() {
  try {
    // Authenticate the current user.
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

    // Retrieve only this user's subscription.
    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select(
          "id,user_id,status,current_period_end,cancel_at_period_end"
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
        { error: "No subscription was found for your account." },
        { status: 404 }
      );
    }

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end).getTime()
      : null;

    if (
      subscription.status !== "active" ||
      periodEnd === null ||
      !Number.isFinite(periodEnd) ||
      periodEnd <= Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "There is no active paid subscription available to mark as not renewing.",
        },
        { status: 400 }
      );
    }

    // Return the existing preference if it has already been recorded.
    if (subscription.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        alreadyScheduled: true,
        message:
          "Your subscription is already marked as not renewing. Your paid access remains available until the current billing period expires.",
        accessUntil: subscription.current_period_end,
        automaticRecurringBilling: false,
      });
    }

    // Record the user's preference not to renew.
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
          "id,cancel_at_period_end,current_period_end"
        )
        .single();

    if (updateError || !updatedSubscription) {
      console.error("Subscription cancellation error:", updateError);

      return NextResponse.json(
        {
          error:
            "We could not update your subscription preference. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyScheduled: false,
      message:
        "Your subscription has been marked as not renewing. Your paid access remains available until your current billing period expires.",
      automaticRecurringBilling: false,
      subscription: {
        id: updatedSubscription.id,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        accessUntil: updatedSubscription.current_period_end,
      },
    });
  } catch (error) {
    console.error("Subscription cancellation API error:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while managing your subscription.",
      },
      { status: 500 }
    );
  }
}
