
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  History,
  Info,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import Logo from "../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import "../dashboard/dashboard.css";
import "./subscription.css";

type SubscriptionRecord = {
  id: string;
  user_id: string;
  account_role: string;
  billing_interval: string | null;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

type TransactionRecord = {
  id: string;
  subscription_id: string | null;
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
  trial_days: number;
  trial_access_percent: number;
};

const money = (amountKobo: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);

const formatDate = (value: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getDaysRemaining = (dateValue: string | null) => {
  if (!dateValue) return 0;

  const expiry = new Date(dateValue).getTime();

  if (Number.isNaN(expiry)) return 0;

  return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000));
};

const readableStatus = (status: string) => {
  const normalized = status.toLowerCase().replaceAll("_", " ");

  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const normalizeInterval = (interval: string | null | undefined) => {
  const normalized = interval?.toLowerCase().trim() || "";

  if (normalized === "annual" || normalized === "annually") {
    return "yearly";
  }

  return normalized;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "EM";

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
};

export default function EmployerSubscriptionPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("Employer");
  const [businessName, setBusinessName] = useState("Your business");
  const [subscription, setSubscription] =
    useState<SubscriptionRecord | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [plans, setPlans] = useState<PlanRecord[]>([]);

  const loadBillingData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace(
            "/login?redirect=%2Femployer%2Fsubscription"
          );
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile || profile.role !== "employer") {
          if (profile?.role === "job_seeker") {
            router.replace("/dashboard");
          } else if (profile?.role === "professional") {
            router.replace("/professional/dashboard");
          } else if (profile?.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/login");
          }

          return;
        }

        setFullName(profile.full_name || "Employer");

        const [
          { data: employerProfile, error: employerError },
          { data: subscriptionRows, error: subscriptionError },
          { data: transactionRows, error: transactionError },
          { data: planRows, error: planError },
        ] = await Promise.all([
          supabase
            .from("employer_profiles")
            .select("business_name")
            .eq("user_id", user.id)
            .maybeSingle(),

          supabase
            .from("subscriptions")
            .select(
              "id, user_id, account_role, billing_interval, status, trial_started_at, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at"
            )
            .eq("user_id", user.id)
            .eq("account_role", "employer")
            .order("created_at", { ascending: false })
            .limit(1),

          supabase
            .from("payment_transactions")
            .select(
              "id, subscription_id, provider, provider_reference, amount_kobo, currency, billing_interval, status, paid_at, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),

          supabase
            .from("subscription_plans")
            .select(
              "billing_interval, amount_kobo, trial_days, trial_access_percent"
            )
            .eq("account_role", "employer"),
        ]);

        if (employerError) throw employerError;
        if (subscriptionError) throw subscriptionError;
        if (transactionError) throw transactionError;
        if (planError) throw planError;

        setBusinessName(
          employerProfile?.business_name || "Your business"
        );

        setSubscription(
          (subscriptionRows?.[0] as SubscriptionRecord) || null
        );

        setTransactions(
          (transactionRows || []) as TransactionRecord[]
        );

        setPlans((planRows || []) as PlanRecord[]);
      } catch (err) {
        console.error("Employer billing page error:", err);

        setError(
          "We couldn't load your billing information. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const isTrial =
    subscription?.status?.toLowerCase() === "trialing" ||
    (Boolean(subscription?.trial_ends_at) &&
      getDaysRemaining(subscription?.trial_ends_at || null) > 0 &&
      !["active", "cancelled", "canceled", "expired", "past_due"].includes(
        subscription?.status?.toLowerCase() || ""
      ));

  const trialDaysRemaining = getDaysRemaining(
    subscription?.trial_ends_at || null
  );

  const currentInterval = normalizeInterval(
    subscription?.billing_interval
  );

  const paidTransactions = transactions.filter(
    (transaction) => transaction.status.toLowerCase() === "success"
  );

  const latestSuccessfulPayment = paidTransactions[0] || null;

  const totalPaid = paidTransactions.reduce(
    (total, transaction) =>
      total + Number(transaction.amount_kobo || 0),
    0
  );

  const status = subscription?.status?.toLowerCase() || "not subscribed";

  const statusClass = isTrial
    ? "trial"
    : ["active", "success"].includes(status)
      ? "active"
      : ["cancelled", "canceled", "expired", "past_due", "failed"].includes(
            status
          )
        ? "attention"
        : "pending";

  if (loading) {
    return (
      <div className="employer-subscription-loading">
        <LoaderCircle size={32} className="subscription-spin" />
        <p>Loading your billing information...</p>
      </div>
    );
  }

  return (
    <div className="employer-dashboard employer-subscription">
      <aside className="employer-sidebar">
        <div className="employer-brand">
          <Logo href="/employer/dashboard" size="medium" light />
        </div>

        <div className="employer-company-card">
          <div className="employer-company-avatar">
            {getInitials(businessName)}
          </div>
          <div>
            <strong>{businessName}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <span className="employer-nav-label">WORKSPACE</span>

        <nav className="employer-nav">
          <Link href="/employer/dashboard">
            <Wallet size={18} />
            <span>Overview</span>
          </Link>
          <Link href="/employer/jobs">
            <FileText size={18} />
            <span>My Jobs</span>
          </Link>
          <Link href="/employer/applicants">
            <ArrowDownLeft size={18} />
            <span>Applicants</span>
          </Link>
          <Link href="/employer/messages">
            <FileText size={18} />
            <span>Messages</span>
          </Link>
          <Link href="/professionals">
            <ArrowUpRight size={18} />
            <span>Find Professionals</span>
          </Link>
          <Link href="/employer/notifications">
            <Info size={18} />
            <span>Notifications</span>
          </Link>
        </nav>

        <span className="employer-nav-label">ACCOUNT</span>

        <nav className="employer-nav">
          <Link
            href="/employer/subscription"
            className="active"
            aria-current="page"
          >
            <CreditCard size={18} />
            <span>Subscription & Billing</span>
          </Link>
          <Link href="/employer/profile">
            <FileText size={18} />
            <span>Company Profile</span>
          </Link>
          <Link href="/employer/settings">
            <ShieldCheck size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="employer-sidebar-bottom">
          <div className="employer-user">
            <div className="employer-user-avatar">
              {getInitials(fullName)}
            </div>
            <div>
              <strong>{fullName}</strong>
              <span>Employer</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="employer-main">
        <div className="employer-mobile-nav">
          <Link href="/employer/dashboard">Overview</Link>
          <Link href="/employer/jobs">My Jobs</Link>
          <Link href="/employer/applicants">Applicants</Link>
          <Link href="/employer/subscription" className="active">
            Billing
          </Link>
          <Link href="/employer/settings">Settings</Link>
        </div>

        <header className="employer-topbar">
          <div className="employer-breadcrumb">
            <span>Employer Workspace</span>
            <span>/</span>
            <strong>Subscription & Billing</strong>
          </div>

          <div className="employer-topbar-actions">
            <button
              type="button"
              className="employer-subscription-refresh"
              onClick={() => loadBillingData(true)}
              disabled={refreshing}
              aria-label="Refresh billing information"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "subscription-spin" : ""}
              />
              <span>{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>

            <Link
              href="/employer/profile"
              className="employer-subscription-profile"
            >
              {getInitials(fullName)}
            </Link>
          </div>
        </header>

        <section className="employer-dashboard-content">
          <div className="employer-subscription-heading">
            <div>
              <span className="employer-subscription-eyebrow">
                ACCOUNT MANAGEMENT
              </span>
              <h1>Subscription & Billing</h1>
              <p>
                Manage your employer subscription, review your billing
                information and keep track of your payments.
              </p>
            </div>

            <Link
              href="/subscription?type=employer"
              className="employer-subscription-primary"
            >
              View plans <ArrowRight size={17} />
            </Link>
          </div>

          {error && (
            <div className="employer-subscription-error">
              <Info size={19} />
              <div>
                <strong>Billing information unavailable</strong>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => loadBillingData(true)}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!error && (
            <>
              <div className="employer-subscription-overview">
                <div className="employer-subscription-current">
                  <div className="employer-subscription-card-top">
                    <div>
                      <span className="employer-subscription-label">
                        CURRENT SUBSCRIPTION
                      </span>

                      <h2>
                        {subscription
                          ? isTrial
                            ? "30-Day Free Trial"
                            : currentInterval === "yearly"
                              ? "Annual Plan"
                              : currentInterval === "monthly"
                                ? "Monthly Plan"
                                : "Subscription"
                          : "No active subscription"}
                      </h2>
                    </div>

                    <div className="employer-subscription-card-icon">
                      <CreditCard size={23} />
                    </div>
                  </div>

                  <div className="employer-subscription-status-row">
                    <span
                      className={`employer-subscription-status ${statusClass}`}
                    >
                      <span />
                      {subscription
                        ? readableStatus(subscription.status)
                        : "Not subscribed"}
                    </span>

                    {subscription?.cancel_at_period_end && (
                      <span className="employer-subscription-cancel-note">
                        Ends at period close
                      </span>
                    )}
                  </div>

                  {isTrial && subscription?.trial_ends_at ? (
                    <div className="employer-subscription-trial">
                      <div>
                        <strong>
                          {trialDaysRemaining}{" "}
                          {trialDaysRemaining === 1 ? "day" : "days"} left
                        </strong>
                        <span>
                          Your free trial ends{" "}
                          {formatDate(subscription.trial_ends_at)}
                        </span>
                      </div>

                      <div className="employer-subscription-trial-track">
                        <span
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                ((30 - trialDaysRemaining) / 30) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="employer-subscription-period">
                      <div>
                        <span>Current period</span>
                        <strong>
                          {formatDate(
                            subscription?.current_period_start || null
                          )}
                          {" – "}
                          {formatDate(
                            subscription?.current_period_end || null
                          )}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div className="employer-subscription-card-footer">
                    <span>
                      {subscription
                        ? `Member since ${formatDate(subscription.created_at)}`
                        : "Choose a plan to activate your subscription"}
                    </span>

                    <Link href="/subscription?type=employer">
                      {subscription ? "Manage plan" : "Explore plans"}{" "}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                <div className="employer-subscription-summary">
                  <div className="employer-subscription-summary-icon">
                    <Wallet size={21} />
                  </div>

                  <span>Total successful payments</span>
                  <strong>{money(totalPaid)}</strong>

                  <small>
                    {paidTransactions.length} successful{" "}
                    {paidTransactions.length === 1 ? "payment" : "payments"}{" "}
                    recorded
                  </small>

                  <div className="employer-subscription-summary-divider" />

                  <div className="employer-subscription-summary-bottom">
                    <span>Latest successful payment</span>
                    <strong>
                      {latestSuccessfulPayment
                        ? formatDate(
                            latestSuccessfulPayment.paid_at ||
                              latestSuccessfulPayment.created_at
                          )
                        : "No successful payment yet"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="employer-subscription-section-heading">
                <div>
                  <span>YOUR OPTIONS</span>
                  <h2>Available plans</h2>
                  <p>
                    Choose the billing period that works best for your
                    business.
                  </p>
                </div>
              </div>

              <div className="employer-subscription-plans">
                {[
                  {
                    interval: "monthly",
                    name: "Monthly",
                    description: "Flexible monthly billing",
                    suffix: "/ month",
                  },
                  {
                    interval: "yearly",
                    name: "Annual",
                    description:
                      "Save ₦1,200 compared with monthly billing",
                    suffix: "/ year",
                  },
                ].map((plan) => {
                  const databasePlan = plans.find(
                    (item) =>
                      normalizeInterval(item.billing_interval) ===
                      plan.interval
                  );

                  const isCurrent =
                    !isTrial &&
                    currentInterval === plan.interval &&
                    Boolean(subscription);

                  return (
                    <div
                      className={`employer-subscription-plan ${
                        isCurrent ? "current" : ""
                      }`}
                      key={plan.interval}
                    >
                      <div className="employer-subscription-plan-heading">
                        <div>
                          <h3>{plan.name}</h3>
                          <p>{plan.description}</p>
                        </div>

                        {isCurrent && (
                          <span className="employer-subscription-current-tag">
                            Current plan
                          </span>
                        )}
                      </div>

                      <div className="employer-subscription-plan-price">
                        {databasePlan ? (
                          <strong>
                            {money(databasePlan.amount_kobo)}
                          </strong>
                        ) : (
                          <strong>Unavailable</strong>
                        )}

                        <span>{plan.suffix}</span>
                      </div>

                      <div className="employer-subscription-plan-trial">
                        <CheckCircle2 size={16} />
                        30-day free trial for eligible verified accounts
                      </div>

                      {databasePlan ? (
                        <Link
                          href={`/subscription/checkout?type=employer&interval=${plan.interval}`}
                          className={
                            isCurrent
                              ? "employer-subscription-plan-link secondary"
                              : "employer-subscription-plan-link"
                          }
                        >
                          {isCurrent
                            ? "View checkout options"
                            : "Choose plan"}
                          <ArrowRight size={16} />
                        </Link>
                      ) : (
                        <span className="employer-subscription-plan-link secondary">
                          Plan currently unavailable
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="employer-subscription-lower-grid">
                <section className="employer-subscription-history">
                  <div className="employer-subscription-section-heading compact">
                    <div>
                      <span>TRANSACTION RECORDS</span>
                      <h2>Payment history</h2>
                      <p>Your latest payment transactions.</p>
                    </div>

                    <History size={22} />
                  </div>

                  {transactions.length === 0 ? (
                    <div className="employer-subscription-empty">
                      <div>
                        <FileText size={24} />
                      </div>
                      <strong>No payment history yet</strong>
                      <p>
                        Payments made through Abi Job will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="employer-subscription-table-wrap">
                      <table className="employer-subscription-table">
                        <thead>
                          <tr>
                            <th>Transaction</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td>
                                <strong>
                                  {transaction.billing_interval
                                    .charAt(0)
                                    .toUpperCase() +
                                    transaction.billing_interval.slice(1)}{" "}
                                  subscription
                                </strong>

                                <span>
                                  {transaction.provider_reference ||
                                    transaction.provider ||
                                    "Payment"}
                                </span>
                              </td>

                              <td>
                                {formatDate(
                                  transaction.paid_at ||
                                    transaction.created_at
                                )}
                              </td>

                              <td>
                                <strong>
                                  {money(
                                    Number(transaction.amount_kobo),
                                    transaction.currency || "NGN"
                                  )}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={`employer-transaction-status ${transaction.status.toLowerCase()}`}
                                >
                                  {transaction.status.toLowerCase() ===
                                  "success" ? (
                                    <CheckCircle2 size={14} />
                                  ) : transaction.status.toLowerCase() ===
                                    "failed" ? (
                                    <XCircle size={14} />
                                  ) : (
                                    <Clock3 size={14} />
                                  )}

                                  {readableStatus(transaction.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <aside className="employer-subscription-help">
                  <div className="employer-subscription-help-icon">
                    <ShieldCheck size={22} />
                  </div>

                  <span>PAYMENT SECURITY</span>
                  <h3>Your payment information stays protected</h3>

                  <p>
                    Payments are processed through our payment provider.
                    Your billing page only displays transaction information
                    associated with your account.
                  </p>

                  <div className="employer-subscription-help-divider" />

                  <div className="employer-subscription-help-row">
                    <CalendarDays size={17} />
                    <span>
                      30-day trial for eligible verified accounts
                    </span>
                  </div>

                  <div className="employer-subscription-help-row">
                    <ShieldCheck size={17} />
                    <span>Secure payment processing</span>
                  </div>
                </aside>
              </div>

              {subscription?.cancel_at_period_end && (
                <div className="employer-subscription-notice">
                  <Info size={19} />
                  <p>
                    Your subscription is marked to end at the close of its
                    current billing period. Your current period ends on{" "}
                    <strong>
                      {formatDate(subscription.current_period_end)}
                    </strong>
                    . This page displays the saved billing status; it does
                    not change cancellation settings.
                  </p>
                </div>
              )}
            </>
          )}

          <footer className="employer-dashboard-footer">
            <span>
              © {new Date().getFullYear()} Abi Job. All rights reserved.
            </span>
            <span>Subscription & Billing</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
