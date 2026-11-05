
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import Logo from "../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./subscription.css";

type SubscriptionRecord = {
  id: string;
  account_role: string;
  billing_interval: string | null;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

type TransactionRecord = {
  id: string;
  provider: string;
  provider_reference: string | null;
  amount_kobo: number;
  currency: string;
  billing_interval: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type PlanRecord = {
  billing_interval: string;
  amount_kobo: number;
  amount_naira: number | null;
  trial_days: number;
  trial_access_percent: number;
};

type BillingData = {
  fullName: string;
  subscription: SubscriptionRecord | null;
  transactions: TransactionRecord[];
  plans: PlanRecord[];
};

function normalizeInterval(value: string | null | undefined) {
  const interval = (value || "").toLowerCase();

  if (interval === "annual" || interval === "annually") {
    return "yearly";
  }

  return interval;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: string) {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case "active":
      return "Active";
    case "trial":
    case "trialing":
      return "Free trial";
    case "pending":
      return "Pending";
    case "past_due":
      return "Payment overdue";
    case "expired":
      return "Expired";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ");
  }
}

function getTransactionStatus(status: string) {
  const normalized = status.toLowerCase();

  if (["success", "successful", "paid"].includes(normalized)) {
    return "success";
  }

  if (["failed", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }

  return "pending";
}

export default function JobSeekerSubscriptionPage() {
  const router = useRouter();

  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadBilling = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login?redirect=%2Fdashboard%2Fsubscription");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Your account profile could not be loaded.");
      }

      if (!["job_seeker", "job-seeker"].includes(profile.role)) {
        if (profile.role === "employer") {
          router.replace("/employer/dashboard");
        } else if (
          ["professional", "skilled_professional"].includes(profile.role)
        ) {
          router.replace("/professional/dashboard");
        } else if (profile.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/login");
        }

        return;
      }

      const [
        { data: subscription, error: subscriptionError },
        { data: transactions, error: transactionsError },
        { data: plans, error: plansError },
      ] = await Promise.all([
        supabase
          .from("subscriptions")
          .select(
            "id, account_role, billing_interval, status, trial_started_at, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end"
          )
          .eq("user_id", user.id)
          .eq("account_role", "job_seeker")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("payment_transactions")
          .select(
            "id, provider, provider_reference, amount_kobo, currency, billing_interval, status, paid_at, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("subscription_plans")
          .select(
            "billing_interval, amount_kobo, amount_naira, trial_days, trial_access_percent"
          )
          .eq("account_role", "job_seeker"),
      ]);

      if (subscriptionError) throw subscriptionError;
      if (transactionsError) throw transactionsError;
      if (plansError) throw plansError;

      setData({
        fullName: profile.full_name || "Job Seeker",
        subscription: subscription as SubscriptionRecord | null,
        transactions: (transactions || []) as TransactionRecord[],
        plans: (plans || []) as PlanRecord[],
      });
    } catch (err) {
      console.error("Job seeker billing error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your subscription information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  if (loading) {
    return (
      <main className="js-billing-loading">
        <LoaderCircle size={35} className="js-billing-spin" />
        <p>Loading your subscription information...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="js-billing-error-page">
        <div>
          <ShieldCheck size={38} />
          <h2>We couldn't load your billing information.</h2>
          <p>{error || "Please try again."}</p>
          <button type="button" onClick={() => loadBilling()}>
            <RefreshCw size={17} />
            Try again
          </button>
          <Link href="/dashboard">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const subscription = data.subscription;

  const monthlyPlan = data.plans.find(
    (plan) => normalizeInterval(plan.billing_interval) === "monthly"
  );

  const yearlyPlan = data.plans.find(
    (plan) => normalizeInterval(plan.billing_interval) === "yearly"
  );

  const monthlyPrice = monthlyPlan?.amount_naira ??
    (monthlyPlan ? monthlyPlan.amount_kobo / 100 : null);

  const yearlyPrice = yearlyPlan?.amount_naira ??
    (yearlyPlan ? yearlyPlan.amount_kobo / 100 : null);

  const annualSavings =
    monthlyPrice !== null && yearlyPrice !== null
      ? monthlyPrice * 12 - yearlyPrice
      : null;

  const successfulTransactions = data.transactions.filter((transaction) =>
    ["success", "successful", "paid"].includes(
      transaction.status.toLowerCase()
    )
  );

  const totalPaid = successfulTransactions.reduce(
    (total, transaction) => total + transaction.amount_kobo / 100,
    0
  );

  const status = subscription?.status.toLowerCase() || "none";

  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;

  const trialIsActive =
    Boolean(trialEnd) &&
    !Number.isNaN(trialEnd!.getTime()) &&
    trialEnd!.getTime() > Date.now() &&
    ["trial", "trialing", "active"].includes(status);

  const trialDaysRemaining = trialIsActive
    ? Math.max(
        0,
        Math.ceil((trialEnd!.getTime() - Date.now()) / 86400000)
      )
    : 0;

  const trialDuration = Math.max(monthlyPlan?.trial_days || 30, 1);

  const trialProgress = trialIsActive
    ? Math.min(
        100,
        Math.max(
          0,
          ((trialDuration - trialDaysRemaining) / trialDuration) * 100
        )
      )
    : 0;

  const isActive = status === "active" && !trialIsActive;
  const currentInterval = normalizeInterval(subscription?.billing_interval);

  const currentStatusLabel = trialIsActive
    ? "Free trial"
    : subscription
      ? getStatusLabel(status)
      : "No subscription";

  const statusTone = trialIsActive
    ? "trial"
    : isActive
      ? "active"
      : ["past_due", "expired", "cancelled", "canceled"].includes(status)
        ? "attention"
        : "pending";

  return (
    <main className="js-billing">
      <aside className="js-billing-sidebar">
        <div className="js-billing-brand">
          <Logo href="/dashboard" size="medium" light />
        </div>

        <div className="js-billing-account">
          <span className="js-billing-account-avatar">
            {data.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() || "")
              .join("")}
          </span>
          <div>
            <strong>{data.fullName}</strong>
            <span>Job Seeker</span>
          </div>
        </div>

        <span className="js-billing-nav-label">MY WORKSPACE</span>

        <nav className="js-billing-nav">
          <Link href="/dashboard">
            <Activity size={18} />
            Dashboard
          </Link>
          <Link href="/jobs">
            <BriefcaseBusiness size={18} />
            Find jobs
          </Link>
          <Link href="/applications">
            <FileText size={18} />
            My applications
          </Link>
          <Link href="/notifications">
            <Bell size={18} />
            Notifications
          </Link>
        </nav>

        <span className="js-billing-nav-label">ACCOUNT</span>

        <nav className="js-billing-nav">
          <Link href="/profile">
            <Activity size={18} />
            My profile
          </Link>
          <Link href="/dashboard/subscription" className="active">
            <CreditCard size={18} />
            Subscription & Billing
          </Link>
          <Link href="/settings">
            <HelpCircle size={18} />
            Settings
          </Link>
        </nav>

        <div className="js-billing-sidebar-bottom">
          <div className="js-billing-sidebar-help">
            <ShieldCheck size={22} />
            <strong>Your next opportunity starts here.</strong>
            <p>Manage your subscription and keep your career moving.</p>
            <Link href="/about">
              About Abi Job <ArrowRight size={14} />
            </Link>
          </div>

          <Link href="/dashboard" className="js-billing-back-link">
            <LogOut size={17} />
            Back to workspace
          </Link>
        </div>
      </aside>

      <section className="js-billing-main">
        <header className="js-billing-topbar">
          <div>
            <span>Job Seeker Workspace</span>
            <span>/</span>
            <strong>Subscription & Billing</strong>
          </div>

          <button
            type="button"
            onClick={() => loadBilling(true)}
            disabled={refreshing}
            className="js-billing-refresh"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "js-billing-spin" : ""}
            />
            <span>Refresh</span>
          </button>
        </header>

        <div className="js-billing-content">
          <section className="js-billing-heading">
            <div>
              <span className="js-billing-eyebrow">
                ACCOUNT MANAGEMENT
              </span>
              <h1>Subscription & Billing</h1>
              <p>
                Manage your Abi Job membership, monitor your free trial,
                and review your payment history.
              </p>
            </div>
            <Link href="/dashboard" className="js-billing-back">
              <ArrowLeft size={16} />
              Dashboard
            </Link>
          </section>

          <section className="js-billing-overview">
            <article className="js-billing-current">
              <div className="js-billing-current-top">
                <div>
                  <span className="js-billing-card-label">
                    YOUR MEMBERSHIP
                  </span>
                  <h2>
                    {trialIsActive
                      ? "30-Day Free Trial"
                      : isActive
                        ? `${currentInterval === "yearly" ? "Annual" : "Monthly"} Membership`
                        : "Abi Job Membership"}
                  </h2>
                </div>
                <div className="js-billing-current-icon">
                  <CreditCard size={24} />
                </div>
              </div>

              <div className="js-billing-status-row">
                <span className={`js-billing-status ${statusTone}`}>
                  <i />
                  {currentStatusLabel}
                </span>

                {subscription?.cancel_at_period_end && (
                  <span className="js-billing-cancel-note">
                    Scheduled to end at period expiry
                  </span>
                )}
              </div>

              {trialIsActive && (
                <div className="js-billing-trial">
                  <div className="js-billing-trial-info">
                    <strong>
                      {trialDaysRemaining}{" "}
                      {trialDaysRemaining === 1 ? "day" : "days"} remaining
                    </strong>
                    <span>
                      Your trial ends {formatDate(subscription?.trial_ends_at || null)}
                    </span>
                  </div>

                  <div className="js-billing-trial-track">
                    <span style={{ width: `${trialProgress}%` }} />
                  </div>

                  <p>
                    You currently have full access during your free trial.
                    Choose a plan whenever you're ready.
                  </p>
                </div>
              )}

              <div className="js-billing-period">
                <div>
                  <span>Membership started</span>
                  <strong>
                    {formatDate(
                      subscription?.trial_started_at ||
                        subscription?.current_period_start ||
                        null
                    )}
                  </strong>
                </div>
                <div>
                  <span>
                    {trialIsActive ? "Trial expiry" : "Current period ends"}
                  </span>
                  <strong>
                    {formatDate(
                      trialIsActive
                        ? subscription?.trial_ends_at || null
                        : subscription?.current_period_end || null
                    )}
                  </strong>
                </div>
              </div>

              <div className="js-billing-current-footer">
                <span>Abi Job · Opportunity starts here.</span>
                <Link href="#billing-plans">
                  View membership plans <ArrowRight size={15} />
                </Link>
              </div>
            </article>

            <article className="js-billing-summary">
              <div className="js-billing-summary-icon">
                <Wallet size={22} />
              </div>
              <span>Total successful payments</span>
              <strong>{formatMoney(totalPaid)}</strong>
              <small>
                Based on your recorded successful transactions
              </small>

              <div className="js-billing-summary-divider" />

              <div className="js-billing-summary-row">
                <span>Payment records</span>
                <strong>{data.transactions.length}</strong>
              </div>

              <div className="js-billing-summary-row">
                <span>Successful payments</span>
                <strong>{successfulTransactions.length}</strong>
              </div>
            </article>
          </section>

          <section id="billing-plans" className="js-billing-section">
            <div className="js-billing-section-heading">
              <div>
                <span>MEMBERSHIP OPTIONS</span>
                <h2>Choose your subscription plan</h2>
                <p>
                  Your first verified account receives one 30-day free trial.
                </p>
              </div>
              <span className="js-billing-trial-tag">
                <Sparkles size={14} />
                30-day free trial
              </span>
            </div>

            <div className="js-billing-plans">
              <article
                className={`js-billing-plan ${
                  currentInterval === "monthly" && isActive ? "current" : ""
                }`}
              >
                <div className="js-billing-plan-heading">
                  <div>
                    <h3>Monthly Plan</h3>
                    <p>Flexible monthly membership</p>
                  </div>
                  {currentInterval === "monthly" && isActive && (
                    <span className="js-billing-current-tag">
                      Current plan
                    </span>
                  )}
                </div>

                <div className="js-billing-price">
                  <strong>
                    {monthlyPrice !== null
                      ? formatMoney(monthlyPrice)
                      : "Unavailable"}
                  </strong>
                  <span>/ month</span>
                </div>

                <div className="js-billing-plan-benefit">
                  <CheckCircle2 size={17} />
                  30-day trial for eligible verified accounts
                </div>
                <div className="js-billing-plan-benefit">
                  <CheckCircle2 size={17} />
                  Access to job opportunities and applications
                </div>
                <div className="js-billing-plan-benefit">
                  <CheckCircle2 size={17} />
                  Manage your career profile
                </div>

                {monthlyPlan ? (
                  <Link
                    href="/subscription/checkout?type=job-seeker&interval=monthly"
                    className="js-billing-plan-button secondary"
                  >
                    {isActive && currentInterval === "monthly"
                      ? "Manage membership"
                      : "Choose monthly"}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="js-billing-plan-button disabled"
                    disabled
                  >
                    Plan currently unavailable
                  </button>
                )}
              </article>

              <article
                className={`js-billing-plan featured ${
                  currentInterval === "yearly" && isActive ? "current" : ""
                }`}
              >
                <span className="js-billing-popular">BEST VALUE</span>

                <div className="js-billing-plan-heading">
                  <div>
                    <h3>Annual Plan</h3>
                    <p>One payment for twelve months</p>
                  </div>
                  {currentInterval === "yearly" && isActive && (
                    <span className="js-billing-current-tag">
                      Current plan
                    </span>
                  )}
                </div>

                <div className="js-billing-price">
                  <strong>
                    {yearlyPrice !== null
                      ? formatMoney(yearlyPrice)
                      : "Unavailable"}
                  </strong>
                  <span>/ year</span>
                </div>

                {annualSavings !== null && annualSavings > 0 && (
                  <span className="js-billing-savings">
                    Save {formatMoney(annualSavings)} compared with monthly
                    billing
                  </span>
                )}

                <div className="js-billing-plan-benefit">
                  <CheckCircle2 size={17} />
                  30-day trial for eligible verified accounts
                </div>
                <div className="js-billing-plan-benefit">
                  <CheckCircle2 size={17} />
                  Access to job opportunities and applications
                </div>
                <div className="js-billing-plan-benefit">
                  <CheckCircle2 size={17} />
                  Convenient annual billing
                </div>

                {yearlyPlan ? (
                  <Link
                    href="/subscription/checkout?type=job-seeker&interval=yearly"
                    className="js-billing-plan-button"
                  >
                    {isActive && currentInterval === "yearly"
                      ? "Manage membership"
                      : "Choose annual"}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="js-billing-plan-button disabled"
                    disabled
                  >
                    Plan currently unavailable
                  </button>
                )}
              </article>
            </div>
          </section>

          <section className="js-billing-lower">
            <article className="js-billing-history">
              <div className="js-billing-section-heading compact">
                <div>
                  <span>PAYMENT RECORDS</span>
                  <h2>Transaction history</h2>
                  <p>Your recent subscription payment records.</p>
                </div>
                <CalendarDays size={23} />
              </div>

              {data.transactions.length > 0 ? (
                <div className="js-billing-table-wrap">
                  <table className="js-billing-table">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>REFERENCE</th>
                        <th>PLAN</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.map((transaction) => {
                        const transactionStatus = getTransactionStatus(
                          transaction.status
                        );

                        return (
                          <tr key={transaction.id}>
                            <td>
                              {formatDate(
                                transaction.paid_at || transaction.created_at
                              )}
                            </td>
                            <td>
                              {transaction.provider_reference || "Pending"}
                            </td>
                            <td>
                              {normalizeInterval(transaction.billing_interval) ===
                              "yearly"
                                ? "Annual"
                                : "Monthly"}
                            </td>
                            <td>
                              <strong>
                                {formatMoney(transaction.amount_kobo / 100)}
                              </strong>
                            </td>
                            <td>
                              <span
                                className={`js-billing-transaction-status ${transactionStatus}`}
                              >
                                {transactionStatus === "success" ? (
                                  <CheckCircle2 size={13} />
                                ) : transactionStatus === "failed" ? (
                                  <XCircle size={13} />
                                ) : (
                                  <Clock3 size={13} />
                                )}
                                {getStatusLabel(transaction.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="js-billing-empty">
                  <div>
                    <FileText size={25} />
                  </div>
                  <strong>No payment history yet</strong>
                  <p>
                    Your subscription transactions will appear here when
                    payment records are created.
                  </p>
                </div>
              )}
            </article>

            <aside className="js-billing-help">
              <div className="js-billing-help-icon">
                <HelpCircle size={23} />
              </div>
              <span>NEED ASSISTANCE?</span>
              <h3>We're here to help.</h3>
              <p>
                If you have questions about your subscription, payments,
                or trial period, contact the Abi Job support team.
              </p>

              <div className="js-billing-help-divider" />

              <div className="js-billing-help-row">
                <ShieldCheck size={17} />
                Secure payment processing
              </div>
              <div className="js-billing-help-row">
                <CheckCircle2 size={17} />
                Transparent subscription pricing
              </div>
              <div className="js-billing-help-row">
                <CalendarDays size={17} />
                Clear billing periods
              </div>

              <Link href="/contact">
                Contact support <ArrowRight size={16} />
              </Link>
            </aside>
          </section>

          <div className="js-billing-notice">
            <ShieldCheck size={19} />
            <p>
              <strong>Your account and profile are yours.</strong> If your
              trial or subscription expires, your profile information remains
              available. Subscription-protected features may require an active
              membership.
            </p>
          </div>

          <footer className="js-billing-footer">
            <span>© 2026 Abi Job. Opportunity starts here.</span>
            <span>
              <CheckCircle2 size={14} />
              Secure account billing
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}
