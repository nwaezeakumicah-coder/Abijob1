
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
  trial_days: number;
  trial_access_percent: number;
};

type PaymentInitializationResponse = {
  success?: boolean;
  authorization_url?: string;
  authorizationUrl?: string;
  reference?: string;
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

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [role, setRole] = useState<AccountRole | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [annualSavings, setAnnualSavings] = useState<number | null>(null);
  const [error, setError] = useState("");

  const requestedType = searchParams.get("type");

  const requestedInterval =
    searchParams.get("interval") || searchParams.get("plan");

  const billingInterval: BillingInterval =
    requestedInterval === "annual" || requestedInterval === "yearly"
      ? "yearly"
      : "monthly";

  useEffect(() => {
    let cancelled = false;

    async function loadCheckout() {
      setLoading(true);
      setError("");
      setPlan(null);
      setAnnualSavings(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace(
            `/login?next=${encodeURIComponent(
              `/subscription/checkout?type=${requestedType || ""}&interval=${billingInterval}`
            )}`
          );
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const accountRole = normalizeRole(profile?.role);

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
            "account_role,billing_interval,amount_kobo,trial_days,trial_access_percent"
          )
          .eq("account_role", accountRole)
          .eq("billing_interval", billingInterval)
          .single();

        if (planError) throw planError;

        if (!planData) {
          throw new Error(
            "The selected subscription plan is currently unavailable."
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
              Number(monthlyPlan.amount_kobo) * 12 -
              Number(planData.amount_kobo);

            if (calculatedSavings > 0) {
              savings = calculatedSavings;
            }
          }
        }

        if (!cancelled) {
          setRole(accountRole);
          setPlan(planData as Plan);
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
  }, [supabase, router, requestedType, billingInterval]);

  const formatPrice = (amountKobo: number | string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amountKobo) / 100);

  async function handlePayment() {
    if (!plan || !role || processing) return;

    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountRole: role,
          billingInterval: plan.billing_interval,
        }),
        cache: "no-store",
      });

      let result: PaymentInitializationResponse;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "We could not understand the payment server response. Please try again."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Unable to start your payment."
        );
      }

      const authorizationUrl =
        result.authorization_url || result.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error("Paystack did not return a checkout link.");
      }

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
            <img src="/image/abijob-logo-green.png" alt="Abi Job" />
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
                  {plan.trial_days}-day free trial with{" "}
                  {plan.trial_access_percent}% platform access
                </li>

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
                <strong>Your free trial</strong>
                <p>
                  Your account includes a {plan.trial_days}-day trial with{" "}
                  {plan.trial_access_percent}% platform access. You can
                  subscribe during your trial. This checkout is for the paid
                  plan you selected.
                </p>
              </div>
            </section>

            <aside className="checkout-payment-card">
              <div className="checkout-payment-icon">
                <ShieldCheck size={27} />
              </div>

              <h2>Ready to continue?</h2>

              <p>
                You will be redirected to Paystack to complete payment using
                the payment methods available to you.
              </p>

              <div className="checkout-payment-total">
                <span>Amount to pay</span>
                <strong>{formatPrice(plan.amount_kobo)}</strong>
              </div>

              <button
                type="button"
                className="checkout-pay-button"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <LoaderCircle
                      className="checkout-button-spinner"
                      size={19}
                    />
                    Connecting to Paystack...
                  </>
                ) : (
                  <>
                    Continue to Paystack
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
          <span>© {new Date().getFullYear()} Abi Job</span>
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
