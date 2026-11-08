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
        { error: "Please log in to view your payment history." },
        401
      );
    }

    const { data: payments, error: paymentError } = await supabase
      .from("payment_transactions")
      .select(
        "id,provider,provider_reference,amount_kobo,currency,billing_interval,status,paid_at,created_at,subscription_id"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (paymentError) {
      console.error("Payment history error:", paymentError);

      return jsonResponse(
        { error: "Could not retrieve your payment history." },
        500
      );
    }

    const formattedTransactions = (payments ?? []).map((payment) => {
      const amountKobo = Number(payment.amount_kobo);

      return {
        id: payment.id,
        provider: payment.provider,
        provider_reference: payment.provider_reference,
        amount_kobo: amountKobo,
        amount_naira: amountKobo / 100,
        currency: payment.currency,
        billing_interval: payment.billing_interval,
        status: payment.status,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
        subscription_id: payment.subscription_id,
      };
    });

    return jsonResponse({
      success: true,
      total: formattedTransactions.length,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Payment history API error:", error);

    return jsonResponse(
      {
        error:
          "An unexpected error occurred while retrieving payment history.",
      },
      500
    );
  }
}