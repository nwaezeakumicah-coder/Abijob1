
import { NextResponse, connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  await connection();

  try {
    // Authenticate the current user.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to view your payment history." },
        { status: 401 }
      );
    }

    // Retrieve only this user's payment records.
    const { data: payments, error: paymentError } = await supabase
      .from("payment_transactions")
      .select(
        "id, provider, provider_reference, amount_kobo, currency, billing_interval, status, paid_at, created_at, subscription_id"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (paymentError) {
      console.error("Payment history error:", paymentError);

      return NextResponse.json(
        { error: "Could not retrieve your payment history." },
        { status: 500 }
      );
    }

    const formattedTransactions = (payments ?? []).map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      provider_reference: payment.provider_reference,
      amount_kobo: Number(payment.amount_kobo),
      amount_naira: Number(payment.amount_kobo) / 100,
      currency: payment.currency,
      billing_interval: payment.billing_interval,
      status: payment.status,
      paid_at: payment.paid_at,
      created_at: payment.created_at,
      subscription_id: payment.subscription_id,
    }));

    return NextResponse.json({
      success: true,
      total: formattedTransactions.length,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Payment history API error:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while retrieving payment history.",
      },
      { status: 500 }
    );
  }
}
