
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
  amount_kobo: number;
  trial_days: number;
  trial_access_percent: number;
};

const roleLabels: Record<AccountRole, string> = {
  job_seeker: "Job Seeker",
  professional: "Skilled Professionals & Artisans",
  employer: "Employer",
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [role, setRole] = useState<AccountRole | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  const requestedType = searchParams.get("type");
  const requestedPlan = searchParams.get("plan");

  const billingInterval: BillingInterval =
    requestedPlan === "annual" || requestedPlan === "yearly"
      ? "yearly"
      : "monthly";

  useEffect(() => {
    let cancelled = false;

    async function loadCheckout() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?next=/subscription/checkout");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const accountRole = profile?.role as AccountRole;

        if (
          !accountRole ||
          !["job_seeker", "professional", "employer"].includes(accountRole)
        ) {
          throw new Error("Your account type could not be identified.");
        }

        // The account role comes from the authenticated profile,
        // not from the URL parameter.
        const requestedRoleMatches =
          !requestedType ||
          requestedType === accountRole ||
          (requestedType === "job-seeker" && accountRole === "job_seeker");

        if (!requestedRoleMatches) {
          throw new Error(
            "The selected account category does not match your account. Please return to the subscription page."
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

        if (!cancelled) {
          setRole(accountRole);
          setPlan(planData as Plan);
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
        if (!cancelled) setLoading(false);
      }
    }

    loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, requestedType, billingInterval]);

  const formatPrice = (amountKobo: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amountKobo / 100);

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
          billingInterval: plan.billing_interval,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to start your payment.");
      }

      if (!result.authorization_url) {
        throw new Error("Paystack did not return a checkout link.");
      }

      window.location.assign(result.authorization_url);
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
          <Link href="/subscription" className="checkout-logo">
            <img src="/images/abijob-logo-green.png" alt="Abi Job" />
          </Link>

          <div className="checkout-secure-label">
            <ShieldCheck size={17} />
            Secure checkout
          </div>
        </header>

        <Link href="/subscription" className="checkout-back">
          <ArrowLeft size={16} />
          Back to subscription plans
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
            <Link href="/subscription">Return to subscription plans</Link>
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

              {plan.billing_interval === "yearly" && (
                <p className="checkout-saving">
                  You save ₦3,840 compared with 12 monthly payments.
                </p>
              )}

              <div className="checkout-divider" />

              <h3>Your membership includes</h3>

              <ul className="checkout-includes">
                <li>
                  <CheckCircle2 size={17} />
                  30-day free trial with full platform benefits
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
                  Your account includes a 30-day trial with 100% platform
                  benefits. This checkout is for the paid plan you selected.
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
                    <LoaderCircle className="checkout-button-spinner" size={19} />
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

              <Link href="/subscription" className="checkout-cancel-link">
                Cancel and return to plans
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
