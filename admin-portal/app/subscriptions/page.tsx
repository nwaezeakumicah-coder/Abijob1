
import Link from "next/link";
import {
  ArrowDownToLine,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  Clock3,
  AlertCircle,
} from "lucide-react";

import AdminShell from "../../components/AdminShell";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

import "./subscriptions.css";

type Subscription = {
  id: string;
  user_id: string;
  account_role: string | null;
  billing_interval: string | null;
  status: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
};

type Payment = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  provider: string | null;
  provider_reference: string | null;
  amount_kobo: number | null;
  currency: string | null;
  billing_interval: string | null;
  status: string | null;
  paid_at: string | null;
  created_at: string;
};

type Plan = {
  id: string;
  account_role: string | null;
  billing_interval: string | null;
  amount_kobo: number | null;
  currency: string | null;
  trial_days: number | null;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    role?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amountKobo: number | null, currency = "NGN") {
  if (amountKobo === null || amountKobo === undefined) return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amountKobo) / 100);
}

function labelRole(role: string | null) {
  switch (role?.toLowerCase()) {
    case "job_seeker":
      return "Job Seeker";
    case "professional":
      return "Skilled Professional";
    case "employer":
      return "Employer";
    default:
      return role || "Unknown";
  }
}

function labelInterval(interval: string | null) {
  if (interval === "monthly") return "Monthly";
  if (interval === "yearly" || interval === "annual") return "Annual";
  return interval || "—";
}

function statusClass(status: string | null) {
  return (status || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function trialDaysRemaining(endDate: string | null) {
  if (!endDate) return null;

  const remaining = new Date(endDate).getTime() - Date.now();

  if (Number.isNaN(remaining)) return null;

  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
}

function isTrial(subscription: Subscription) {
  return (
    subscription.status?.toLowerCase().includes("trial") ||
    Boolean(subscription.trial_started_at)
  );
}

export default async function SubscriptionsPage({
  searchParams,
}: PageProps) {
  const admin = await getActiveAdmin();

  const canView =
    admin.permissions.includes("subscriptions.view") ||
    admin.permissions.includes("subscriptions.manage");

  if (!canView) {
    return (
      <AdminShell>
        <div className="sub-access-denied">
          <ShieldCheck size={38} />
          <h1>Access restricted</h1>
          <p>
            You do not have permission to view subscription records.
          </p>
        </div>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const selectedStatus = params.status ?? "all";
  const selectedRole = params.role ?? "all";

  const supabase = createAdminClient();

  const [
    subscriptionResult,
    paymentResult,
    planResult,
    activeCountResult,
    trialCountResult,
    expiredCountResult,
    cancelledCountResult,
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id,user_id,account_role,billing_interval,status,trial_started_at,trial_ends_at,current_period_start,current_period_end,cancel_at_period_end,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),

    supabase
      .from("payment_transactions")
      .select(
        "id,user_id,subscription_id,provider,provider_reference,amount_kobo,currency,billing_interval,status,paid_at,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("subscription_plans")
      .select(
        "id,account_role,billing_interval,amount_kobo,currency,trial_days"
      ),

    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),

    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["trialing", "trial"]),

    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "expired"),

    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled"),
  ]);

  const loadError =
    subscriptionResult.error ||
    paymentResult.error ||
    planResult.error ||
    activeCountResult.error ||
    trialCountResult.error ||
    expiredCountResult.error ||
    cancelledCountResult.error;

  if (loadError) {
    console.error("SUBSCRIPTION PAGE ERROR:", loadError);

    return (
      <AdminShell>
        <div className="sub-error">
          <AlertCircle size={30} />
          <h1>Unable to load subscription data</h1>
          <p>
            Supabase returned an error while retrieving subscription
            records. Check the server logs and database permissions.
          </p>
        </div>
      </AdminShell>
    );
  }

  const subscriptions =
    (subscriptionResult.data ?? []) as Subscription[];

  const payments = (paymentResult.data ?? []) as Payment[];
  const plans = (planResult.data ?? []) as Plan[];

  const uniqueUserIds = Array.from(
    new Set([
      ...subscriptions.map((item) => item.user_id),
      ...payments.map((item) => item.user_id),
    ])
  );

  const emailEntries = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const { data, error } =
        await supabase.auth.admin.getUserById(userId);

      if (error) {
        console.error("SUBSCRIBER LOOKUP ERROR:", userId, error);
      }

      return [userId, data?.user?.email ?? "Email unavailable"] as const;
    })
  );

  const emailMap = new Map(emailEntries);

  const filteredSubscriptions = subscriptions.filter((item) => {
    const email = emailMap.get(item.user_id) ?? "";
    const role = item.account_role ?? "";
    const status = item.status ?? "";

    const matchesSearch = [
      email,
      item.user_id,
      item.id,
      role,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

    const matchesStatus =
      selectedStatus === "all" ||
      status.toLowerCase() === selectedStatus.toLowerCase();

    const matchesRole =
      selectedRole === "all" ||
      role.toLowerCase() === selectedRole.toLowerCase();

    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalLoaded = subscriptions.length;
  const activeCount = activeCountResult.count ?? 0;
  const trialCount = trialCountResult.count ?? 0;
  const expiredCount = expiredCountResult.count ?? 0;
  const cancelledCount = cancelledCountResult.count ?? 0;

  const totalPaidKobo = payments
    .filter((payment) =>
      ["success", "successful"].includes(
        payment.status?.toLowerCase() ?? ""
      )
    )
    .reduce(
      (total, payment) => total + Number(payment.amount_kobo ?? 0),
      0
    );

  const canManage = admin.permissions.includes("subscriptions.manage");

  const planPrice = (role: string, interval: string) => {
    const plan = plans.find(
      (item) =>
        item.account_role?.toLowerCase() === role.toLowerCase() &&
        item.billing_interval?.toLowerCase() === interval.toLowerCase()
    );

    return plan
      ? formatMoney(plan.amount_kobo, plan.currency ?? "NGN")
      : "Not configured";
  };

  return (
    <AdminShell>
      <div className="subscriptions-page">
        <header className="sub-page-heading">
          <div>
            <span className="sub-eyebrow">REVENUE & BILLING</span>
            <h1>Subscriptions</h1>
            <p>
              Monitor subscriber accounts, free trials, billing plans
              and subscription payments across Abi Job.
            </p>
          </div>

          <div className="sub-heading-icon">
            <CreditCard size={27} />
          </div>
        </header>

        <div className="sub-security-notice">
          <ShieldCheck size={21} />
          <div>
            <strong>Protected billing records</strong>
            <p>
              Subscription and payment records are retrieved directly
              from Supabase. This page does not expose payment secrets
              or allow unauthorised billing changes.
            </p>
          </div>
        </div>

        <section className="sub-stats-grid">
          <article className="sub-stat-card">
            <span className="sub-stat-icon green">
              <Users size={20} />
            </span>
            <div>
              <span>Total records loaded</span>
              <strong>{totalLoaded}</strong>
              <small>Latest 200 subscription records</small>
            </div>
          </article>

          <article className="sub-stat-card">
            <span className="sub-stat-icon blue">
              <BadgeCheck size={20} />
            </span>
            <div>
              <span>Active subscriptions</span>
              <strong>{activeCount}</strong>
              <small>Database count</small>
            </div>
          </article>

          <article className="sub-stat-card">
            <span className="sub-stat-icon purple">
              <Clock3 size={20} />
            </span>
            <div>
              <span>Free trials</span>
              <strong>{trialCount}</strong>
              <small>Trialing or trial status</small>
            </div>
          </article>

          <article className="sub-stat-card">
            <span className="sub-stat-icon orange">
              <RefreshCw size={20} />
            </span>
            <div>
              <span>Expired</span>
              <strong>{expiredCount}</strong>
              <small>Database count</small>
            </div>
          </article>

          <article className="sub-stat-card">
            <span className="sub-stat-icon red">
              <CalendarDays size={20} />
            </span>
            <div>
              <span>Cancelled</span>
              <strong>{cancelledCount}</strong>
              <small>Database count</small>
            </div>
          </article>

          <article className="sub-stat-card">
            <span className="sub-stat-icon gold">
              <Wallet size={20} />
            </span>
            <div>
              <span>Successful payments loaded</span>
              <strong>{formatMoney(totalPaidKobo)}</strong>
              <small>Latest 100 payment records</small>
            </div>
          </article>
        </section>

        <section className="sub-plans-section">
          <div className="sub-section-heading">
            <div>
              <h2>Subscription plans</h2>
              <p>Configured prices retrieved from your subscription_plans table.</p>
            </div>
          </div>

          <div className="sub-plan-grid">
            {[
              {
                role: "job_seeker",
                title: "Job Seekers",
                icon: <Users size={21} />,
              },
              {
                role: "professional",
                title: "Skilled Professionals & Artisans",
                icon: <BadgeCheck size={21} />,
              },
              {
                role: "employer",
                title: "Employers",
                icon: <CreditCard size={21} />,
              },
            ].map((item) => (
              <article className="sub-plan-card" key={item.role}>
                <div className="sub-plan-title">
                  <span>{item.icon}</span>
                  <h3>{item.title}</h3>
                </div>

                <div className="sub-plan-price">
                  <span>Monthly</span>
                  <strong>{planPrice(item.role, "monthly")}</strong>
                </div>

                <div className="sub-plan-price">
                  <span>Annual</span>
                  <strong>{planPrice(item.role, "yearly")}</strong>
                </div>

                <small>
                  Trial duration is configured in the database.
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="sub-records-section">
          <div className="sub-section-heading">
            <div>
              <h2>Subscriber records</h2>
              <p>
                Review account type, subscription status and billing dates.
              </p>
            </div>
            <span className="sub-record-count">
              {filteredSubscriptions.length} shown
            </span>
          </div>

          <form className="sub-filter-form" method="get" action="/subscriptions">
            <label className="sub-search">
              <Search size={18} />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search email or account ID..."
              />
            </label>

            <select
              name="status"
              defaultValue={selectedStatus}
              aria-label="Filter by subscription status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past due</option>
              <option value="pending">Pending</option>
            </select>

            <select
              name="role"
              defaultValue={selectedRole}
              aria-label="Filter by account type"
            >
              <option value="all">All account types</option>
              <option value="job_seeker">Job Seekers</option>
              <option value="professional">
                Skilled Professionals & Artisans
              </option>
              <option value="employer">Employers</option>
            </select>

            <button type="submit">Apply filters</button>
            <Link href="/subscriptions" className="sub-reset-button">
              Reset
            </Link>
          </form>

          {filteredSubscriptions.length === 0 ? (
            <div className="sub-empty">
              <Search size={30} />
              <h3>No subscription records found</h3>
              <p>
                Try changing your filters. New subscriptions will appear
                here when records are created.
              </p>
            </div>
          ) : (
            <div className="sub-table-wrap">
              <table className="sub-table">
                <thead>
                  <tr>
                    <th>SUBSCRIBER</th>
                    <th>ACCOUNT TYPE</th>
                    <th>PLAN</th>
                    <th>STATUS</th>
                    <th>TRIAL ENDS</th>
                    <th>PERIOD ENDS</th>
                    <th>CREATED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((item) => {
                    const days = trialDaysRemaining(item.trial_ends_at);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="sub-subscriber">
                            <strong>
                              {emailMap.get(item.user_id) ??
                                "Email unavailable"}
                            </strong>
                            <span title={item.user_id}>
                              ID: {item.user_id.slice(0, 8)}…
                            </span>
                          </div>
                        </td>
                        <td>{labelRole(item.account_role)}</td>
                        <td>{labelInterval(item.billing_interval)}</td>
                        <td>
                          <span
                            className={`sub-status sub-status-${statusClass(
                              item.status
                            )}`}
                          >
                            {item.status || "Unknown"}
                          </span>
                          {item.cancel_at_period_end && (
                            <small className="sub-cancel-note">
                              Cancels at period end
                            </small>
                          )}
                        </td>
                        <td>
                          {isTrial(item) ? (
                            <span className="sub-trial-date">
                              {formatDate(item.trial_ends_at)}
                              {days !== null && (
                                <small>
                                  {days > 0
                                    ? `${days} days remaining`
                                    : "Trial ended"}
                                </small>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{formatDate(item.current_period_end)}</td>
                        <td>{formatDate(item.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="sub-data-note">
            This view shows up to 200 of the latest subscription records.
            Statistics are database counts. Search and filters apply to
            the records loaded on this page.
          </p>
        </section>

        <section className="sub-payments-section">
          <div className="sub-section-heading">
            <div>
              <h2>Recent payment transactions</h2>
              <p>Latest 100 payment records from Supabase.</p>
            </div>
            <span className="sub-record-count">
              {payments.length} transactions
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="sub-empty compact">
              <Wallet size={28} />
              <h3>No payment transactions yet</h3>
              <p>Payment records will appear here when transactions are created.</p>
            </div>
          ) : (
            <div className="sub-table-wrap">
              <table className="sub-table">
                <thead>
                  <tr>
                    <th>SUBSCRIBER</th>
                    <th>REFERENCE</th>
                    <th>PROVIDER</th>
                    <th>AMOUNT</th>
                    <th>INTERVAL</th>
                    <th>STATUS</th>
                    <th>PAYMENT DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div className="sub-subscriber">
                          <strong>
                            {emailMap.get(payment.user_id) ??
                              "Email unavailable"}
                          </strong>
                          <span>{payment.user_id.slice(0, 8)}…</span>
                        </div>
                      </td>
                      <td>
                        <span className="sub-reference">
                          {payment.provider_reference || "—"}
                        </span>
                      </td>
                      <td>{payment.provider || "—"}</td>
                      <td>
                        <strong>
                          {formatMoney(
                            payment.amount_kobo,
                            payment.currency ?? "NGN"
                          )}
                        </strong>
                      </td>
                      <td>{labelInterval(payment.billing_interval)}</td>
                      <td>
                        <span
                          className={`sub-status sub-status-${statusClass(
                            payment.status
                          )}`}
                        >
                          {payment.status || "Unknown"}
                        </span>
                      </td>
                      <td>{formatDate(payment.paid_at || payment.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {canManage && (
          <div className="sub-admin-note">
            <ShieldCheck size={18} />
            Your administrator role includes subscription management
            permission. Billing modification actions are not enabled on
            this read-only page.
          </div>
        )}
      </div>
    </AdminShell>
  );
}
