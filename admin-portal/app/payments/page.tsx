
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock3,
  XCircle,
  Search,
  ShieldCheck,
  AlertCircle,
  ReceiptText,
} from "lucide-react";

import AdminShell from "../../components/AdminShell";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

import "./payments.css";

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
  updated_at: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    provider?: string;
    page?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amountKobo: number | null, currency: string | null) {
  if (amountKobo === null || amountKobo === undefined) return "—";

  const safeCurrency = currency || "NGN";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(Number(amountKobo) / 100);
  } catch {
    return `${safeCurrency} ${(Number(amountKobo) / 100).toLocaleString("en-NG")}`;
  }
}

function normaliseStatus(status: string | null) {
  return (status || "unknown").trim().toLowerCase();
}

function statusClass(status: string | null) {
  return normaliseStatus(status).replace(/[^a-z0-9]+/g, "-");
}

function isSuccessful(status: string | null) {
  return ["success", "successful", "paid", "completed"].includes(
    normaliseStatus(status)
  );
}

function isPending(status: string | null) {
  return ["pending", "processing", "initiated"].includes(
    normaliseStatus(status)
  );
}

function isFailed(status: string | null) {
  return ["failed", "failure", "cancelled", "canceled", "abandoned"].includes(
    normaliseStatus(status)
  );
}

function labelInterval(interval: string | null) {
  if (!interval) return "—";
  if (interval.toLowerCase() === "monthly") return "Monthly";
  if (["annual", "yearly"].includes(interval.toLowerCase())) return "Annual";
  return interval;
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const admin = await getActiveAdmin();

  const canView =
    admin.permissions.includes("payments.view") ||
    admin.permissions.includes("payments.manage");

  if (!canView) {
    return (
      <AdminShell>
        <div className="payments-access-denied">
          <ShieldCheck size={38} />
          <h1>Access restricted</h1>
          <p>
            You do not have permission to view platform payment records.
          </p>
        </div>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim()
    .replace(/[,%()\\*%_'""]/g, " ")
    .replace(/\\s+/g, " ")
    .slice(0, 100);
  const validStatuses = ["all", "success", "successful", "paid", "pending", "processing", "failed", "cancelled", "abandoned", "refunded"];
  const selectedStatus = validStatuses.includes(params.status ?? "all")
    ? (params.status ?? "all")
    : "all";
  const selectedProvider = params.provider === "paystack" ? "paystack" : "all";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 50;

  const supabase = createAdminClient();

  let paymentQuery = supabase
    .from("payment_transactions")
    .select(
      "id,user_id,subscription_id,provider,provider_reference,amount_kobo,currency,billing_interval,status,paid_at,created_at,updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((requestedPage - 1) * pageSize, requestedPage * pageSize - 1);

  if (selectedStatus !== "all") {
    paymentQuery = paymentQuery.eq("status", selectedStatus);
  }
  if (selectedProvider !== "all") {
    paymentQuery = paymentQuery.eq("provider", selectedProvider);
  }
  if (query) {
    const clauses = [`provider_reference.ilike.%${query}%`];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query)) {
      clauses.push(`id.eq.${query}`, `user_id.eq.${query}`, `subscription_id.eq.${query}`);
    }
    paymentQuery = paymentQuery.or(clauses.join(","));
  }

  const [{ data, error, count }, providerResult] = await Promise.all([
    paymentQuery,
    supabase.from("payment_transactions").select("provider").not("provider", "is", null).limit(1000),
  ]);

  if (error) {
    console.error("PAYMENTS PAGE ERROR:", error);

    return (
      <AdminShell>
        <div className="payments-error">
          <AlertCircle size={32} />
          <h1>Unable to load payments</h1>
          <p>
            Supabase could not retrieve payment transactions. Check the
            server logs and database permissions.
          </p>
        </div>
      </AdminShell>
    );
  }

  const payments = (data ?? []) as Payment[];

  const userIds = Array.from(new Set(payments.map((payment) => payment.user_id)));

  // Resolve payment owners in bounded batches instead of issuing one Auth
  // request per transaction (the previous implementation was an N+1 query).
  const emailMap = new Map<string, string>();
  const unresolvedUserIds = new Set(userIds);
  const authPageSize = 1000;
  const maxAuthPages = 20;

  for (let page = 1; page <= maxAuthPages && unresolvedUserIds.size > 0; page += 1) {
    const { data: userPage, error: userPageError } =
      await supabase.auth.admin.listUsers({
        page,
        perPage: authPageSize,
      });

    if (userPageError) {
      console.error("PAYMENT USER BATCH LOOKUP ERROR:", userPageError);
      break;
    }

    const users = userPage?.users ?? [];
    for (const user of users) {
      if (unresolvedUserIds.has(user.id)) {
        emailMap.set(user.id, user.email ?? "Email unavailable");
        unresolvedUserIds.delete(user.id);
      }
    }

    if (users.length < authPageSize) break;
  }

  for (const userId of unresolvedUserIds) {
    emailMap.set(userId, "Email unavailable");
  }

  const providers = Array.from(
    new Set(
      (providerResult.data ?? [])
        .map((item) => item.provider)
        .filter((provider): provider is string => Boolean(provider))
    )
  ).sort();

  const filteredPayments = payments;
  const totalFiltered = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const pageNumber = Math.min(requestedPage, totalPages);

  const pageUrl = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (selectedStatus !== "all") search.set("status", selectedStatus);
    if (selectedProvider !== "all") search.set("provider", selectedProvider);
    search.set("page", String(nextPage));
    return `/payments?${search.toString()}`;
  };

  const successfulPayments = payments.filter((payment) =>
    isSuccessful(payment.status)
  );

  const pendingPayments = payments.filter((payment) =>
    isPending(payment.status)
  );

  const failedPayments = payments.filter((payment) =>
    isFailed(payment.status)
  );

  const successfulRevenue = successfulPayments.reduce(
    (total, payment) => total + Number(payment.amount_kobo ?? 0),
    0
  );

  const canManage = admin.permissions.includes("payments.manage");

  return (
    <AdminShell>
      <div className="payments-page">
        <header className="payments-heading">
          <div>
            <span className="payments-eyebrow">FINANCE & TRANSACTIONS</span>
            <h1>Payments</h1>
            <p>
              Monitor payment transactions, successful payments, pending
              transactions and payment failures across Abi Job.
            </p>
          </div>

          <div className="payments-heading-icon">
            <CreditCard size={27} />
          </div>
        </header>

        <div className="payments-security-notice">
          <ShieldCheck size={21} />
          <div>
            <strong>Secure payment monitoring</strong>
            <p>
              Transaction records are retrieved securely from Supabase.
              This page does not display secret payment credentials or
              modify transaction records.
            </p>
          </div>
        </div>

        <section className="payments-stats-grid">
          <article className="payments-stat-card">
            <span className="payments-stat-icon green">
              <ReceiptText size={20} />
            </span>
            <div>
              <span>Total transactions</span>
              <strong>{count ?? payments.length}</strong>
              <small>Matching transactions across all pages</small>
            </div>
          </article>

          <article className="payments-stat-card">
            <span className="payments-stat-icon blue">
              <Wallet size={20} />
            </span>
            <div>
              <span>Successful revenue</span>
              <strong>
                {formatMoney(successfulRevenue, "NGN")}
              </strong>
              <small>Successful transactions on this page</small>
            </div>
          </article>

          <article className="payments-stat-card">
            <span className="payments-stat-icon green">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <span>Successful payments</span>
              <strong>{successfulPayments.length}</strong>
              <small>Transactions on this page</small>
            </div>
          </article>

          <article className="payments-stat-card">
            <span className="payments-stat-icon orange">
              <Clock3 size={20} />
            </span>
            <div>
              <span>Pending payments</span>
              <strong>{pendingPayments.length}</strong>
              <small>Loaded records</small>
            </div>
          </article>

          <article className="payments-stat-card">
            <span className="payments-stat-icon red">
              <XCircle size={20} />
            </span>
            <div>
              <span>Failed or cancelled</span>
              <strong>{failedPayments.length}</strong>
              <small>Loaded records</small>
            </div>
          </article>
        </section>

        <section className="payments-records-panel">
          <div className="payments-section-heading">
            <div>
              <h2>Transaction history</h2>
              <p>
                Review payment references, subscribers, providers and
                transaction status.
              </p>
            </div>

            <span className="payments-count">
              {filteredPayments.length} shown · {totalFiltered} matching · Page {pageNumber} of {totalPages}
            </span>
          </div>

          <form className="payments-filter-form" method="get" action="/payments">
            <label className="payments-search">
              <Search size={18} />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search reference or exact transaction/account ID..."
              />
            </label>

            <select
              name="status"
              defaultValue={selectedStatus}
              aria-label="Filter payment status"
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="successful">Successful</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="abandoned">Abandoned</option>
            </select>

            <select
              name="provider"
              defaultValue={selectedProvider}
              aria-label="Filter payment provider"
            >
              <option value="all">All providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>

            <button type="submit">Apply filters</button>

            <Link href="/payments" className="payments-reset">
              Reset
            </Link>
          </form>

          {filteredPayments.length === 0 ? (
            <div className="payments-empty">
              <Search size={30} />
              <h3>No matching transactions</h3>
              <p>
                No payment records match your search. Try changing the
                status or provider filters.
              </p>
            </div>
          ) : (
            <div className="payments-table-wrap">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>SUBSCRIBER</th>
                    <th>TRANSACTION REFERENCE</th>
                    <th>PROVIDER</th>
                    <th>AMOUNT</th>
                    <th>BILLING</th>
                    <th>STATUS</th>
                    <th>PAYMENT DATE</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div className="payments-subscriber">
                          <strong>
                            {emailMap.get(payment.user_id) ??
                              "Email unavailable"}
                          </strong>
                          <span title={payment.user_id}>
                            Account: {payment.user_id.slice(0, 8)}…
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="payments-reference">
                          <strong>
                            {payment.provider_reference || "No reference"}
                          </strong>
                          <span title={payment.id}>
                            ID: {payment.id.slice(0, 8)}…
                          </span>
                        </div>
                      </td>

                      <td>{payment.provider || "—"}</td>

                      <td>
                        <strong className="payments-amount">
                          {formatMoney(
                            payment.amount_kobo,
                            payment.currency
                          )}
                        </strong>
                      </td>

                      <td>{labelInterval(payment.billing_interval)}</td>

                      <td>
                        <span
                          className={`payments-status payments-status-${statusClass(
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

          {totalPages > 1 && (
            <nav className="payments-pagination" aria-label="Payment history pages">
              {pageNumber > 1 ? <Link href={pageUrl(pageNumber - 1)}>← Previous</Link> : <span>← Previous</span>}
              <strong>Page {pageNumber} of {totalPages}</strong>
              {pageNumber < totalPages ? <Link href={pageUrl(pageNumber + 1)}>Next →</Link> : <span>Next →</span>}
            </nav>
          )}

          <p className="payments-data-note">
            Showing {pageSize} transactions per page. Revenue and status summaries are calculated from the visible page.
          </p>
        </section>

        {canManage && (
          <div className="payments-admin-note">
            <ShieldCheck size={18} />
            Your administrator role includes payment management permission.
            Transaction editing, refunds and payment reversals are not
            enabled on this monitoring page.
          </div>
        )}
      </div>
      <style>{`.payments-pagination{display:flex;justify-content:center;align-items:center;gap:18px;padding:22px 12px;color:#526157;font-size:13px}.payments-pagination a{color:#176b45;font-weight:700;text-decoration:none}.payments-pagination span{color:#9aa59b}`}</style>
    </AdminShell>
  );
}
