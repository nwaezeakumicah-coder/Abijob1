
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LoaderCircle,
  CreditCard,
} from "lucide-react";
import "./checkout.css";

type AccountRole = "job_seeker" | "professional" | "employer";
type BillingInterval = "monthly" | "yearly";

type Plan = {
  account_role: AccountRole;
  billing_interval: BillingInterval;
  amount_kobo: number | string;
  currency: string;
  trial_days: number;
  trial_access_percent: number;
};

type Subscription = {
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  billing_interval: string | null;
};

type PaymentInitializationResponse = {
  success?: boolean;
  authorization_url?: string;
  authorizationUrl?: string;
  reference?: string;
  reused?: boolean;
  code?: string;
  error?: string;
  message?: string;
};

const roleLabels: Record<AccountRole, string> = {
  job_seeker: "Job Seeker",
  professional: "Skilled Professionals & Artisans",
  employer: "Employer",
};

function normalizeRole(value: string | null): AccountRole | null {
  if (!value) return null;

  const normalized = value.toLowerCase().replace(/-/g, "_");

  if (normalized === "job_seeker") return "job_seeker";

  if (
    normalized === "professional" ||
    normalized === "skilled_professional"
  ) {
    return "professional";
  }

  if (normalized === "employer") return "employer";

  return null;
}

function getBillingPath(role: AccountRole | null) {
  if (role === "job_seeker") return "/dashboard/subscription";
  if (role === "professional") return "/professional/subscription";
  if (role === "employer") return "/employer/subscription";
  return "/subscription";
}

function isPaystackCheckoutUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "checkout.paystack.com" &&
      url.username === "" &&
      url.password === "" &&
      url.port === ""
    );
  } catch {
    return false;
  }
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [role, setRole] = useState<AccountRole | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);
  const [annualSavings, setAnnualSavings] = useState<number | null>(null);
  const [error, setError] = useState("");

  const requestedType = searchParams.get("type");
  const requestedInterval =
    searchParams.get("interval") || searchParams.get("plan");

  const invalidInterval =
    requestedInterval !== null &&
    !["monthly", "yearly", "annual"].includes(
      requestedInterval.toLowerCase()
    );

  const billingInterval: BillingInterval =
    requestedInterval?.toLowerCase() === "annual" ||
    requestedInterval?.toLowerCase() === "yearly"
      ? "yearly"
      : "monthly";

  useEffect(() => {
    let cancelled = false;

    async function loadCheckout() {
      setLoading(true);
      setError("");
      setPlan(null);
      setSubscription(null);
      setAnnualSavings(null);
      setPaymentBlocked(false);

      try {
        if (invalidInterval) {
          throw new Error(
            "The selected billing interval is invalid. Please return to your billing page and select a valid plan."
          );
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          const next = `/subscription/checkout?type=${encodeURIComponent(
            requestedType || ""
          )}&interval=${billingInterval}`;

          router.replace(`/login?next=${encodeURIComponent(next)}`);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error(
            "We could not verify your account. Please try again."
          );
        }

        const accountRole = normalizeRole(profile.role);

        if (!accountRole) {
          throw new Error(
            "Your account type could not be identified. Please contact support."
          );
        }

        const selectedRole = normalizeRole(requestedType);

        if (requestedType && selectedRole !== accountRole) {
          throw new Error(
            "The selected account category does not match your account. Please return to your Subscription & Billing page."
          );
        }

        const { data: planData, error: planError } = await supabase
          .from("subscription_plans")
          .select(
            "account_role,billing_interval,amount_kobo,currency,trial_days,trial_access_percent"
          )
          .eq("account_role", accountRole)
          .eq("billing_interval", billingInterval)
          .maybeSingle();

        if (planError || !planData) {
          throw new Error(
            "The selected subscription plan is currently unavailable."
          );
        }

        const amount = Number(planData.amount_kobo);

        if (
          !Number.isSafeInteger(amount) ||
          amount <= 0 ||
          typeof planData.currency !== "string" ||
          planData.currency.toUpperCase() !== "NGN"
        ) {
          throw new Error(
            "The selected plan has invalid pricing. Please contact support."
          );
        }

        const { data: subscriptionData, error: subscriptionError } =
          await supabase
            .from("subscriptions")
            .select(
              "status,trial_started_at,trial_ends_at,current_period_end,billing_interval"
            )
            .eq("user_id", user.id)
            .eq("account_role", accountRole)
            .maybeSingle();

        if (subscriptionError) {
          console.error(
            "Could not load subscription status:",
            subscriptionError
          );
        }

        let savings: number | null = null;

        if (billingInterval === "yearly") {
          const { data: monthlyPlan, error: monthlyPlanError } =
            await supabase
              .from("subscription_plans")
              .select("amount_kobo")
              .eq("account_role", accountRole)
              .eq("billing_interval", "monthly")
              .maybeSingle();

          if (monthlyPlanError) {
            console.error(
              "Could not calculate annual savings:",
              monthlyPlanError
            );
          }

          if (monthlyPlan) {
            const calculatedSavings =
              Number(monthlyPlan.amount_kobo) * 12 - amount;

            if (
              Number.isSafeInteger(calculatedSavings) &&
              calculatedSavings > 0
            ) {
              savings = calculatedSavings;
            }
          }
        }

        if (!cancelled) {
          setRole(accountRole);
          setPlan(planData as Plan);
          setSubscription(
            subscriptionData as Subscription | null
          );
          setAnnualSavings(savings);
        }
      } catch (err) {
        console.error("Checkout loading error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "We could not load your checkout details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [
    supabase,
    router,
    requestedType,
    billingInterval,
    invalidInterval,
  ]);

  const formatPrice = (amountKobo: number | string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amountKobo) / 100);

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "an unavailable date";
    }

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const trialIsActive =
    subscription?.status === "trialing" &&
    !!subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at).getTime() > Date.now();

  const trialHasExpired =
    subscription?.status === "trialing" &&
    !!subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at).getTime() <= Date.now();

  async function handlePayment() {
    if (
      !plan ||
      !role ||
      processing ||
      paymentBlocked
    ) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payments/paystack/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountRole: role,
            billingInterval: plan.billing_interval,
          }),
          cache: "no-store",
        }
      );

      let result: PaymentInitializationResponse;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "We could not understand the payment server response. Please try again."
        );
      }

      if (!response.ok) {
        if (
          result.code === "PENDING_PAYMENT_EXISTS" ||
          result.code === "PAYMENT_INITIALIZATION_UNCONFIRMED"
        ) {
          setPaymentBlocked(true);
        }

        throw new Error(
          result.error ||
            result.message ||
            "Unable to start your payment."
        );
      }

      const authorizationUrl =
        result.authorization_url || result.authorizationUrl;

      if (
        result.success !== true ||
        !authorizationUrl ||
        !isPaystackCheckoutUrl(authorizationUrl)
      ) {
        throw new Error(
          "Paystack did not return a valid secure checkout link. Please contact support if this continues."
        );
      }

      // Reused and newly initialized checkouts are both valid.
      window.location.assign(authorizationUrl);
    } catch (err) {
      console.error("Payment initialization error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Payment could not be started. Please try again."
      );

      setProcessing(false);
    }
  }

  const billingPath = getBillingPath(role);

  if (loading) {
    return (
      <main className="checkout-page">
        <div className="checkout-loading">
          <LoaderCircle className="checkout-spinner" size={34} />
          <p>Preparing your secure checkout...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <Link href={billingPath} className="checkout-logo">
            <img src="/images/abijob-logo-green.png" alt="Abi Job" />
          </Link>

          <div className="checkout-secure-label">
            <ShieldCheck size={17} />
            Secure checkout
          </div>
        </header>

        <Link href={billingPath} className="checkout-back">
          <ArrowLeft size={16} />
          Back to Subscription & Billing
        </Link>

        <section className="checkout-heading">
          <span>ABI JOB MEMBERSHIP</span>
          <h1>Complete your subscription</h1>
          <p>
            Review your selected plan before continuing to secure payment.
          </p>
        </section>

        {error && (
          <div className="checkout-error" role="alert">
            <strong>Checkout issue</strong>
            <p>{error}</p>

            {paymentBlocked && (
              <p>
                Do not start another payment while this transaction is
                unresolved. Check your payment history or contact support
                to confirm its status first.
              </p>
            )}

            {!plan && (
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry loading checkout
              </button>
            )}

            <Link href={billingPath}>
              Return to Subscription & Billing
            </Link>
          </div>
        )}

        {plan && role && (
          <div className="checkout-layout">
            <section className="checkout-summary">
              <div className="checkout-summary-heading">
                <div>
                  <span>YOUR SELECTED PLAN</span>
                  <h2>{roleLabels[role]}</h2>
                </div>

                <div className="checkout-summary-icon">
                  <CreditCard size={24} />
                </div>
              </div>

              <div className="checkout-plan-name">
                {plan.billing_interval === "yearly"
                  ? "Annual membership"
                  : "Monthly membership"}
              </div>

              <div className="checkout-total">
                <strong>{formatPrice(plan.amount_kobo)}</strong>
                <span>
                  / {plan.billing_interval === "yearly" ? "year" : "month"}
                </span>
              </div>

              {plan.billing_interval === "yearly" &&
                annualSavings !== null && (
                  <p className="checkout-saving">
                    You save {formatPrice(annualSavings)} compared with 12
                    monthly payments.
                  </p>
                )}

              <div className="checkout-divider" />

              <h3>Your membership includes</h3>

              <ul className="checkout-includes">
                <li>
                  <CheckCircle2 size={17} />
                  Access to features for your account category
                </li>

                <li>
                  <CheckCircle2 size={17} />
                  Secure payment processing through Paystack
                </li>

                <li>
                  <CheckCircle2 size={17} />
                  Subscription and payment history
                </li>
              </ul>

              <div className="checkout-trial-notice">
                <strong>Membership and free trial</strong>

                {trialIsActive ? (
                  <p>
                    Your {plan.trial_days}-day free trial is currently active
                    until {formatDate(subscription!.trial_ends_at!)}. You can
                    continue using your trial or choose to pay now. If you
                    pay now, the selected plan will be charged immediately.
                  </p>
                ) : trialHasExpired ? (
                  <p>
                    Your free trial ended on{" "}
                    {formatDate(subscription!.trial_ends_at!)}. You can still
                    subscribe now. The selected plan will be charged
                    immediately.
                  </p>
                ) : (
                  <p>
                    You can purchase this membership at any time. Choosing
                    Continue to Paystack will charge the selected plan
                    immediately.
                  </p>
                )}
              </div>
            </section>

            <aside className="checkout-payment-card">
              <div className="checkout-payment-icon">
                <ShieldCheck size={27} />
              </div>

              <h2>Ready to continue?</h2>

              <p>
                You will be redirected to Paystack to pay for your selected
                plan using the payment methods available to you.
              </p>

              <div className="checkout-payment-total">
                <span>Amount to pay now</span>
                <strong>{formatPrice(plan.amount_kobo)}</strong>
              </div>

              <button
                type="button"
                className="checkout-pay-button"
                onClick={handlePayment}
                disabled={processing || paymentBlocked}
              >
                {processing ? (
                  <>
                    <LoaderCircle
                      className="checkout-button-spinner"
                      size={19}
                    />
                    Connecting to Paystack...
                  </>
                ) : paymentBlocked ? (
                  "Payment status needs checking"
                ) : (
                  <>
                    Pay now with Paystack
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="checkout-security-note">
                <ShieldCheck size={16} />
                Your payment is processed securely by Paystack. Abi Job does
                not collect or store your card details.
              </div>

              <Link href={billingPath} className="checkout-cancel-link">
                Cancel and return to billing
              </Link>
            </aside>
          </div>
        )}

        <footer className="checkout-footer">
          <span>Abi Job</span>
          <span>Opportunity starts here.</span>
        </footer>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="checkout-page">
          <div className="checkout-loading">
            <LoaderCircle className="checkout-spinner" size={34} />
            <p>Loading checkout...</p>
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
