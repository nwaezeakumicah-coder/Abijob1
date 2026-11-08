import { NextResponse } from "next/server";
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

function isValidDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value))
  );
}

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(
        {
          success: false,
          error: "Please sign in to manage your subscription.",
        },
        401
      );
    }

    const { data, error } = await supabase.rpc(
      "schedule_subscription_cancellation"
    );

    if (error) {
      console.error(
        "Subscription cancellation RPC failed:",
        error.message
      );

      return jsonResponse(
        {
          success: false,
          error: "We could not update your subscription. Please try again.",
        },
        500
      );
    }

    if (
      typeof data !== "object" ||
      data === null ||
      Array.isArray(data)
    ) {
      return jsonResponse(
        {
          success: false,
          error: "The subscription service returned an invalid response.",
        },
        500
      );
    }

    const result = data as {
      result?: string;
      trial_started_at?: unknown;
      trial_ends_at?: unknown;
      paid_period_starts_at?: unknown;
      paid_period_ends_at?: unknown;
    };

    switch (result.result) {
      case "unauthenticated":
        return jsonResponse(
          {
            success: false,
            error: "Your session has expired. Please sign in again.",
          },
          401
        );

      case "not_found":
        return jsonResponse(
          {
            success: false,
            error: "No subscription was found for your account.",
          },
          404
        );

      case "not_eligible":
        return jsonResponse(
          {
            success: false,
            error:
              "This membership is no longer eligible for cancellation.",
          },
          409
        );

      case "scheduled":
      case "already_scheduled": {
        const trialStartedAt = isValidDate(result.trial_started_at)
          ? result.trial_started_at
          : null;

        const trialEndsAt = isValidDate(result.trial_ends_at)
          ? result.trial_ends_at
          : null;

        const paidPeriodStartsAt = isValidDate(
          result.paid_period_starts_at
        )
          ? result.paid_period_starts_at
          : null;

        const paidPeriodEndsAt = isValidDate(
          result.paid_period_ends_at
        )
          ? result.paid_period_ends_at
          : null;

        const now = Date.now();

        const trialIsActive =
          trialStartedAt !== null &&
          trialEndsAt !== null &&
          Date.parse(trialStartedAt) <= now &&
          Date.parse(trialEndsAt) > now;

        const paidPeriodIsScheduled =
          paidPeriodStartsAt !== null &&
          paidPeriodEndsAt !== null &&
          Date.parse(paidPeriodStartsAt) > now &&
          Date.parse(paidPeriodEndsAt) > now;

        const alreadyScheduled = result.result === "already_scheduled";

        let message: string;

        if (alreadyScheduled) {
          message =
            "Your membership is already marked as not renewing. Your existing access will continue until its applicable expiry date.";
        } else if (trialIsActive && paidPeriodIsScheduled) {
          message =
            "Your membership is marked as not renewing. Your current free trial and already-scheduled paid period will remain available until their applicable expiry dates.";
        } else if (trialIsActive) {
          message =
            "Your membership is marked as not renewing. Your free trial will remain available until it expires.";
        } else {
          message =
            "Your membership is marked as not renewing. Your existing paid access will continue until the current paid period expires.";
        }

        return jsonResponse({
          success: true,
          alreadyScheduled,
          message,
          automaticRecurringBilling: false,
          trialStartedAt,
          trialEndsAt,
          paidPeriodStartsAt,
          paidPeriodEndsAt,
          cancelAtPeriodEnd: true,
        });
      }

      default:
        console.error(
          "Unexpected cancellation result:",
          result.result
        );

        return jsonResponse(
          {
            success: false,
            error: "We could not confirm the cancellation request.",
          },
          500
        );
    }
  } catch (error) {
    console.error("Subscription cancellation error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Something went wrong. Please try again.",
      },
      500
    );
  }
}