
import AdminShell from "../../components/AdminShell";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";
import "./reports.css";

export const dynamic = "force-dynamic";

type ReportRow = Record<string, any>;

function isSuccessful(status: unknown) {
  return ["success", "successful", "paid", "completed"].includes(
    String(status ?? "").toLowerCase()
  );
}

function formatMoney(amountKobo: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amountKobo / 100);
  } catch {
    return `₦${Math.round(amountKobo / 100).toLocaleString("en-NG")}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function label(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClass(value?: string | null) {
  const status = String(value ?? "").toLowerCase();

  if (["success", "successful", "paid", "completed", "active", "approved"].includes(status)) {
    return "report-status success";
  }

  if (["pending", "trial", "trialing", "processing"].includes(status)) {
    return "report-status pending";
  }

  if (["failed", "cancelled", "canceled", "rejected", "expired"].includes(status)) {
    return "report-status danger";
  }

  return "report-status neutral";
}

function MetricCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: string;
}) {
  return (
    <article className="report-metric-card">
      <div className="report-metric-top">
        <span>{title}</span>
        <span className="report-metric-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default async function ReportsPage() {
  const admin = await getActiveAdmin();

  const allowed =
    admin.permissions.includes("reports.view") ||
    admin.permissions.includes("reports.manage");

  if (!allowed) {
    return (
      <AdminShell>
        <div className="reports-page">
          <div className="reports-empty">
            <h2>Access restricted</h2>
            <p>You do not have permission to view platform reports.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const supabase = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const [
    jobsResult,
    employersResult,
    subscriptionsResult,
    paymentsResult,
    recentPaymentsResult,
    opportunityMapResult,
    applicationsResult,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id,status,created_at,category,location", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("employer_profiles")
      .select("user_id,verification_status,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("subscriptions")
      .select(
        "id,user_id,account_role,billing_interval,status,trial_started_at,trial_ends_at,current_period_end,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("payment_transactions")
      .select(
        "id,user_id,provider,provider_reference,amount_kobo,currency,billing_interval,status,paid_at,created_at"
      )
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("payment_transactions")
      .select(
        "id,user_id,provider,provider_reference,amount_kobo,currency,billing_interval,status,paid_at,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(10),

    supabase.rpc("get_abia_opportunity_map"),
    supabase.from("job_applications").select("id,status", { count: "exact" }).limit(1000),
  ]);

  const jobs: ReportRow[] = jobsResult.data ?? [];
  const employers: ReportRow[] = employersResult.data ?? [];
  const subscriptions: ReportRow[] = subscriptionsResult.data ?? [];
  const payments: ReportRow[] = paymentsResult.data ?? [];
  const recentPayments: ReportRow[] = recentPaymentsResult.data ?? [];
  const opportunityMap: ReportRow[] = opportunityMapResult.data ?? [];
  const applications: ReportRow[] = applicationsResult.data ?? [];

  const jobCategories = jobs.reduce<Record<string, number>>((result, job) => {
    const key = String(job.category ?? "Uncategorised").trim() || "Uncategorised";
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});

  const applicationStatuses = applications.reduce<Record<string, number>>((result, application) => {
    const key = String(application.status ?? "unknown").toLowerCase();
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  const hiredCount = applicationStatuses.hired ?? 0;
  const shortlistedCount = applicationStatuses.shortlisted ?? 0;

  const jobStatuses = jobs.reduce<Record<string, number>>((result, job) => {
    const key = String(job.status ?? "unknown").toLowerCase();
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});

  const employerStatuses = employers.reduce<Record<string, number>>((result, employer) => {
    const key = String(employer.verification_status ?? "unknown").toLowerCase();
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});

  const subscriptionStatuses = subscriptions.reduce<Record<string, number>>(
    (result, subscription) => {
      const key = String(subscription.status ?? "unknown").toLowerCase();
      result[key] = (result[key] ?? 0) + 1;
      return result;
    },
    {}
  );

  const roleBreakdown = subscriptions.reduce<Record<string, number>>(
    (result, subscription) => {
      const key = String(subscription.account_role ?? "unknown").toLowerCase();
      result[key] = (result[key] ?? 0) + 1;
      return result;
    },
    {}
  );

  const successfulPayments = payments.filter((payment) =>
    isSuccessful(payment.status)
  );

  const revenueKobo = successfulPayments.reduce(
    (total, payment) => total + Number(payment.amount_kobo ?? 0),
    0
  );

  const successfulCount = successfulPayments.length;
  const pendingCount = payments.filter((payment) =>
    ["pending", "processing"].includes(String(payment.status ?? "").toLowerCase())
  ).length;
  const failedCount = payments.filter((payment) =>
    ["failed", "cancelled", "canceled"].includes(String(payment.status ?? "").toLowerCase())
  ).length;

  const activeSubscriptions = subscriptions.filter(
    (subscription) => String(subscription.status ?? "").toLowerCase() === "active"
  ).length;

  const trialSubscriptions = subscriptions.filter((subscription) => {
    const status = String(subscription.status ?? "").toLowerCase();
    return status === "trial" || status === "trialing";
  }).length;

  const jobsError = jobsResult.error;
  const employersError = employersResult.error;
  const subscriptionsError = subscriptionsResult.error;
  const paymentsError = paymentsResult.error;

  return (
    <AdminShell>
      <main className="reports-page">
        <header className="reports-header">
          <div>
            <span className="reports-eyebrow">PLATFORM PERFORMANCE</span>
            <h1>Reports &amp; Analytics</h1>
            <p>
              Monitor platform activity, employer verification, subscriptions,
              and payment performance.
            </p>
          </div>

          <div className="reports-updated">
            <span className="reports-live-dot" />
            Report generated
            <strong>{new Date().toLocaleString("en-NG")}</strong>
          </div>
        </header>

        <section className="reports-section">
          <div className="reports-section-heading">
            <div>
              <h2>Platform overview</h2>
              <p>Latest available records from the platform database.</p>
            </div>
          </div>

          <div className="reports-metrics-grid">
            <MetricCard
              title="Jobs recorded"
              value={jobsResult.count ?? jobs.length}
              detail="Total matching job records"
              icon="▤"
            />
            <MetricCard
              title="Employers"
              value={employersResult.count ?? employers.length}
              detail="Employer profiles recorded"
              icon="▣"
            />
            <MetricCard
              title="Subscriptions"
              value={subscriptions.length}
              detail="Latest 1,000 subscription records"
              icon="◷"
            />
            <MetricCard
              title="Active subscriptions"
              value={activeSubscriptions}
              detail="Among the latest 1,000 records"
              icon="✓"
            />
          </div>
        </section>

        <section className="reports-section">
          <div className="reports-section-heading">
            <div>
              <h2>Job activity</h2>
              <p>Breakdown of job records by their current status.</p>
            </div>
            <span className="reports-total">
              {jobsResult.count ?? jobs.length} jobs
            </span>
          </div>

          {jobsError ? (
            <div className="reports-warning">
              Job report is unavailable: {jobsError.message}
            </div>
          ) : (
            <div className="reports-breakdown-grid">
              {Object.entries(jobStatuses).length > 0 ? (
                Object.entries(jobStatuses).map(([key, count]) => (
                  <div className="reports-breakdown-item" key={key}>
                    <span>{label(key)}</span>
                    <strong>{count}</strong>
                  </div>
                ))
              ) : (
                <p className="reports-muted">No job records were returned.</p>
              )}
            </div>
          )}
        </section>

        <section className="reports-section">
          <div className="reports-section-heading">
            <div>
              <h2>Abia labour market intelligence</h2>
              <p>Current vacancy and public talent signals grouped by local government area. These are platform records, not estimates of total employment in each LGA.</p>
            </div>
            <span className="reports-total">17 LGAs</span>
          </div>
          {opportunityMapResult.error ? (
            <div className="reports-warning">Opportunity intelligence is unavailable: {opportunityMapResult.error.message}</div>
          ) : (
            <>
              <div className="reports-metrics-grid reports-small-grid">
                <MetricCard title="Applicants hired" value={hiredCount} detail="Applications marked hired" icon="✓" />
                <MetricCard title="Shortlisted applicants" value={shortlistedCount} detail="Current shortlist records loaded" icon="★" />
              </div>
              <div className="reports-breakdown-grid">
                {Object.entries(jobCategories).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([key,count])=>(
                  <div className="reports-breakdown-item" key={key}><span>{label(key)}</span><strong>{count}</strong></div>
                ))}
                {Object.keys(jobCategories).length===0 && <p className="reports-muted">No category records available yet.</p>}
              </div>
              <div className="reports-table-wrap">
                <table className="reports-table">
                  <thead><tr><th>Local government area</th><th>Approved vacancies</th><th>Public professionals</th></tr></thead>
                  <tbody>
                    {opportunityMap.map((row)=>(
                      <tr key={String(row.lga)}><td><strong>{String(row.lga)}</strong></td><td>{Number(row.approved_jobs||0)}</td><td>{Number(row.public_professionals||0)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <p className="reports-footnote">LGA counts only include records whose stored location contains the full LGA name. Town-only or broad "Abia" entries are not assigned to a specific LGA. Do not interpret these figures as statewide employment statistics.</p>
        </section>

        <section className="reports-section">
          <div className="reports-section-heading">
            <div>
              <h2>Employer verification</h2>
              <p>Employer profiles grouped by verification status.</p>
            </div>
            <span className="reports-total">
              {employersResult.count ?? employers.length} employers
            </span>
          </div>

          {employersError ? (
            <div className="reports-warning">
              Employer report is unavailable: {employersError.message}
            </div>
          ) : (
            <div className="reports-breakdown-grid">
              {Object.entries(employerStatuses).length > 0 ? (
                Object.entries(employerStatuses).map(([key, count]) => (
                  <div className="reports-breakdown-item" key={key}>
                    <span>{label(key)}</span>
                    <strong>{count}</strong>
                  </div>
                ))
              ) : (
                <p className="reports-muted">No employer records were returned.</p>
              )}
            </div>
          )}
        </section>

        <section className="reports-section">
          <div className="reports-section-heading">
            <div>
              <h2>Subscription performance</h2>
              <p>Subscription statuses and account categories.</p>
            </div>
          </div>

          {subscriptionsError ? (
            <div className="reports-warning">
              Subscription report is unavailable: {subscriptionsError.message}
            </div>
          ) : (
            <>
              <div className="reports-metrics-grid reports-small-grid">
                <MetricCard
                  title="Active"
                  value={activeSubscriptions}
                  detail="Active subscription records"
                  icon="✓"
                />
                <MetricCard
                  title="Trial"
                  value={trialSubscriptions}
                  detail="Trial or trialing records"
                  icon="◷"
                />
                <MetricCard
                  title="Other statuses"
                  value={Math.max(0, subscriptions.length - activeSubscriptions - trialSubscriptions)}
                  detail="Expired, cancelled, and other statuses"
                  icon="—"
                />
              </div>

              <div className="reports-breakdown-grid">
                {Object.entries(roleBreakdown).length > 0 ? (
                  Object.entries(roleBreakdown).map(([key, count]) => (
                    <div className="reports-breakdown-item" key={key}>
                      <span>{label(key)}</span>
                      <strong>{count}</strong>
                    </div>
                  ))
                ) : (
                  <p className="reports-muted">No subscription role data available.</p>
                )}
              </div>

              <div className="reports-breakdown-grid reports-status-breakdown">
                {Object.entries(subscriptionStatuses).map(([key, count]) => (
                  <div className="reports-breakdown-item" key={key}>
                    <span>{label(key)}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="reports-section">
          <div className="reports-section-heading">
            <div>
              <h2>Payment performance</h2>
              <p>Transactions created in the last 30 days.</p>
            </div>
            <span className="reports-total">Last 30 days</span>
          </div>

          {paymentsError ? (
            <div className="reports-warning">
              Payment report is unavailable: {paymentsError.message}
            </div>
          ) : (
            <div className="reports-metrics-grid">
              <MetricCard
                title="Successful revenue"
                value={formatMoney(revenueKobo)}
                detail="Successful transactions in loaded records"
                icon="₦"
              />
              <MetricCard
                title="Successful payments"
                value={successfulCount}
                detail="Last 30 days"
                icon="✓"
              />
              <MetricCard
                title="Pending payments"
                value={pendingCount}
                detail="Awaiting confirmation"
                icon="◷"
              />
              <MetricCard
                title="Failed payments"
                value={failedCount}
                detail="Failed or cancelled"
                icon="!"
              />
            </div>
          )}

          <p className="reports-footnote">
            Revenue is calculated from successful transactions returned by the
            latest 1,000 matching records. It is not an accounting settlement
            report.
          </p>
        </section>

        <section className="reports-section">
          <div className="reports-section-heading">
            <div>
              <h2>Recent transactions</h2>
              <p>The ten most recently created payment records.</p>
            </div>
          </div>

          {recentPaymentsResult.error ? (
            <div className="reports-warning">
              Recent transactions are unavailable: {recentPaymentsResult.error.message}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="reports-empty">
              <h3>No transactions yet</h3>
              <p>Payment records will appear here when transactions are created.</p>
            </div>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Provider</th>
                    <th>Amount</th>
                    <th>Billing</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>
                          {payment.provider_reference || payment.id}
                        </strong>
                        <small>{payment.id}</small>
                      </td>
                      <td>{label(payment.provider)}</td>
                      <td className="reports-amount">
                        {formatMoney(
                          Number(payment.amount_kobo ?? 0),
                          payment.currency || "NGN"
                        )}
                      </td>
                      <td>{label(payment.billing_interval)}</td>
                      <td>
                        <span className={statusClass(payment.status)}>
                          {label(payment.status)}
                        </span>
                      </td>
                      <td>{formatDate(payment.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="reports-footer">
          Reports are generated from available database records. Some totals
          are limited to the latest records retrieved by this page.
        </footer>
      </main>
    </AdminShell>
  );
}
