import { createAdminClient } from "@/lib/supabase/admin";

type JsonRecord = Record<string, unknown>;

type RecoveryResult = {
  payment: Record<string, any> | null;
  error: string | null;
};

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

/**
 * Reconstructs a missing pending row only from Paystack's independently
 * verified transaction and server-created metadata. Never trusts the webhook
 * body alone and never activates a subscription.
 */
export async function recoverMissingPaystackPayment(
  admin: ReturnType<typeof createAdminClient>,
  reference: string,
  expectedUserId?: string
): Promise<RecoveryResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !secret.startsWith("sk_live_")) {
    return { payment: null, error: "Live Paystack verification is unavailable." };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch {
    return { payment: null, error: "Paystack verification is temporarily unavailable." };
  }

  if (!response.ok) {
    return { payment: null, error: "Paystack could not verify this transaction." };
  }

  let payload: JsonRecord;
  try {
    payload = asRecord(await response.json());
  } catch {
    return { payment: null, error: "Paystack returned an invalid response." };
  }

  if (payload.status !== true) {
    return { payment: null, error: "Paystack did not confirm this transaction." };
  }

  const transaction = asRecord(payload.data);
  const metadata = asRecord(transaction.metadata);
  const userId = metadata.user_id;
  const role = metadata.account_role;
  const interval = metadata.billing_interval;
  const subscriptionId = metadata.subscription_id;
  const amount = Number(transaction.amount);
  const currency = typeof transaction.currency === "string"
    ? transaction.currency.toUpperCase()
    : "";

  if (
    transaction.status !== "success" ||
    transaction.reference !== reference ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    currency !== "NGN" ||
    typeof userId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ||
    (expectedUserId && userId !== expectedUserId) ||
    typeof role !== "string" ||
    !["job_seeker", "professional", "employer"].includes(role) ||
    typeof interval !== "string" ||
    !["monthly", "yearly"].includes(interval) ||
    typeof subscriptionId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subscriptionId)
  ) {
    return { payment: null, error: "Verified transaction metadata is incomplete or invalid." };
  }

  const [{ data: profile, error: profileError }, { data: subscription, error: subscriptionError }, { data: plan, error: planError }] =
    await Promise.all([
      admin.from("profiles").select("id,role").eq("id", userId).maybeSingle(),
      admin.from("subscriptions").select("id,user_id,account_role").eq("id", subscriptionId).eq("user_id", userId).maybeSingle(),
      admin.from("subscription_plans").select("amount_kobo,currency").eq("account_role", role).eq("billing_interval", interval).maybeSingle(),
    ]);

  if (profileError || subscriptionError || planError) {
    return { payment: null, error: "Could not validate the original account and subscription." };
  }

  if (
    !profile ||
    profile.role !== role ||
    !subscription ||
    subscription.user_id !== userId ||
    subscription.account_role !== role ||
    !plan ||
    Number(plan.amount_kobo) !== amount ||
    String(plan.currency).toUpperCase() !== currency
  ) {
    return { payment: null, error: "Verified payment does not match an active Abi Job account plan." };
  }

  const row = {
    user_id: userId,
    subscription_id: subscriptionId,
    provider: "paystack",
    provider_reference: reference,
    amount_kobo: amount,
    currency,
    billing_interval: interval,
    status: "pending",
    metadata: {
      user_id: userId,
      account_role: role,
      billing_interval: interval,
      subscription_id: subscriptionId,
      recovered_from_verified_paystack_transaction: true,
    },
    paid_at: null,
  };

  const { data: inserted, error: insertError } = await admin
    .from("payment_transactions")
    .insert(row)
    .select("*")
    .single();

  if (!insertError && inserted) {
    return { payment: inserted, error: null };
  }

  // Concurrent webhook/callback recovery may win the unique-reference race.
  const { data: existing, error: lookupError } = await admin
    .from("payment_transactions")
    .select("*")
    .eq("provider", "paystack")
    .eq("provider_reference", reference)
    .maybeSingle();

  if (
    !lookupError &&
    existing &&
    existing.user_id === userId &&
    existing.subscription_id === subscriptionId &&
    Number(existing.amount_kobo) === amount &&
    existing.currency === currency &&
    existing.billing_interval === interval &&
    ["pending", "successful"].includes(existing.status)
  ) {
    return { payment: existing, error: null };
  }

  console.error("Paystack recovery insert failed:", insertError?.code, insertError?.message);
  return { payment: null, error: "Could not safely restore the verified payment record." };
}
