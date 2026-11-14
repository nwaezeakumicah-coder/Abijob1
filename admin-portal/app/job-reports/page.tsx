import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Flag,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";
import AdminShell from "../../components/AdminShell";
import { reviewJobReport } from "./actions";

type Report = {
  id: string;
  job_id: string;
  reporter_id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  jobs: { title: string } | { title: string }[] | null;
};

type PageProps = {
  searchParams: Promise<{ status?: string; success?: string; error?: string }>;
};

const labels: Record<string, string> = {
  fraud: "Fake or fraudulent vacancy",
  payment_request: "Requests payment",
  misleading: "Misleading information",
  duplicate: "Duplicate vacancy",
  expired: "Expired or unavailable",
  other: "Other concern",
};

function jobTitle(report: Report) {
  const relation = Array.isArray(report.jobs) ? report.jobs[0] : report.jobs;
  return relation?.title || "Vacancy no longer available";
}

function date(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function JobReportsPage({ searchParams }: PageProps) {
  const admin = await getActiveAdmin();
  const canView = ["jobs.view", "jobs.review", "jobs.manage", "support.manage"].some(
    (permission) => admin.permissions.includes(permission)
  );

  if (!canView) {
    return (
      <AdminShell>
        <main className="job-reports-page">
          <div className="job-reports-empty">
            <ShieldCheck size={34} />
            <h1>Access restricted</h1>
            <p>You do not have permission to review job safety reports.</p>
          </div>
        </main>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const allowed = ["open", "in_review", "resolved", "dismissed", "all"];
  const selected = allowed.includes(params.status || "") ? params.status! : "open";
  const supabase = createAdminClient();
  let query = supabase
    .from("job_reports")
    .select("id, job_id, reporter_id, reason, details, status, created_at, reviewed_at, admin_notes, jobs(title)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (selected !== "all") query = query.eq("status", selected);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load job safety reports.");

  const reports = (data || []) as unknown as Report[];

  return (
    <AdminShell>
      <main className="job-reports-page">
        <header className="job-reports-heading">
          <div>
            <span>TRUST &amp; SAFETY</span>
            <h1>Job Safety Reports</h1>
            <p>Review suspicious vacancies and document moderation decisions.</p>
          </div>
          <div className="job-reports-heading-icon"><ShieldCheck size={28} /></div>
        </header>

        <div className="job-reports-notice">
          <AlertTriangle size={20} />
          <div>
            <strong>Confidential reports</strong>
            <p>Reports are visible only to authorised administrators. Every status change is written to the audit log.</p>
          </div>
        </div>

        {params.success && <div className="job-reports-flash success"><CheckCircle2 size={17} />{params.success}</div>}
        {params.error && <div className="job-reports-flash error"><XCircle size={17} />{params.error}</div>}

        <form className="job-reports-filter" method="GET">
          <label htmlFor="report-status">Filter reports</label>
          <select id="report-status" name="status" defaultValue={selected}>
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All reports</option>
          </select>
          <button type="submit">Apply</button>
          <span>{reports.length} reports shown</span>
        </form>

        {reports.length === 0 ? (
          <div className="job-reports-empty">
            <Flag size={34} />
            <h2>No reports in this view</h2>
            <p>New reports submitted by job seekers will appear here.</p>
          </div>
        ) : (
          <section className="job-reports-list">
            {reports.map((report) => (
              <article className="job-report-card" key={report.id}>
                <div className="job-report-card-top">
                  <div>
                    <span className="job-report-reason">{labels[report.reason] || report.reason}</span>
                    <h2>{jobTitle(report)}</h2>
                    <span className="job-report-meta">Submitted {date(report.created_at)} · Reporter {report.reporter_id.slice(0, 8)}…</span>
                  </div>
                  <span className={`job-report-status status-${report.status}`}>
                    {report.status === "open" ? <Flag size={14} /> : report.status === "in_review" ? <Eye size={14} /> : report.status === "resolved" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {report.status.replace("_", " ")}
                  </span>
                </div>
                <p className="job-report-details">{report.details}</p>
                {report.admin_notes && <p className="job-report-notes"><strong>Admin notes:</strong> {report.admin_notes}</p>}
                {report.status !== "resolved" && report.status !== "dismissed" && (
                  <form action={reviewJobReport} className="job-report-review-form">
                    <input type="hidden" name="reportId" value={report.id} />
                    <label>
                      Review notes (optional)
                      <input name="notes" maxLength={2000} placeholder="Record what was checked or what action was taken" />
                    </label>
                    <div>
                      <button name="status" value="in_review" type="submit" className="review-button">
                        <Clock3 size={15} /> Mark in review
                      </button>
                      <button name="status" value="resolved" type="submit" className="resolve-button">
                        <CheckCircle2 size={15} /> Resolve
                      </button>
                      <button name="status" value="dismissed" type="submit" className="dismiss-button">
                        <XCircle size={15} /> Dismiss
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
      <style>{`
        .job-reports-page{max-width:1200px;margin:0 auto;padding:30px;color:#17251d}
        .job-reports-heading{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}
        .job-reports-heading>div:first-child>span{font-size:11px;font-weight:800;letter-spacing:1.6px;color:#176b45}
        .job-reports-heading h1{font-size:30px;margin:7px 0}
        .job-reports-heading p,.job-reports-notice p,.job-reports-empty p{color:#68766c;margin:0;line-height:1.6}
        .job-reports-heading-icon{width:54px;height:54px;border-radius:14px;background:#edf5ed;color:#176b45;display:grid;place-items:center}
        .job-reports-notice{display:flex;gap:12px;padding:16px;border:1px solid #dce9dc;background:#f3f8f2;border-radius:12px;margin-bottom:22px}
        .job-reports-notice>svg{color:#176b45;flex-shrink:0}
        .job-reports-notice strong{display:block;margin-bottom:4px}
        .job-reports-flash{display:flex;gap:8px;align-items:center;padding:12px;border-radius:8px;margin:12px 0}
        .job-reports-flash.success{background:#edf7ef;color:#176b45}.job-reports-flash.error{background:#fff1ed;color:#9a3412}
        .job-reports-filter{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid #e5eae4;border-radius:10px;padding:14px;margin-bottom:20px}
        .job-reports-filter label{font-weight:700;font-size:13px}.job-reports-filter select,.job-report-review-form input{border:1px solid #dce4dc;border-radius:7px;padding:10px;background:#fff;color:#17251d}
        .job-reports-filter button,.review-button,.resolve-button,.dismiss-button{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:7px;padding:9px 12px;font-weight:700;cursor:pointer}
        .job-reports-filter button,.resolve-button{background:#176b45;color:#fff}.job-reports-filter span{margin-left:auto;color:#68766c;font-size:13px}
        .job-reports-list{display:grid;gap:15px}.job-report-card,.job-reports-empty{background:#fff;border:1px solid #e5eae4;border-radius:12px;padding:20px}
        .job-report-card-top{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.job-report-reason{font-size:11px;font-weight:800;color:#176b45;text-transform:uppercase;letter-spacing:.6px}
        .job-report-card h2{font-size:18px;margin:6px 0}.job-report-meta{font-size:12px;color:#758178}
        .job-report-status{display:inline-flex;align-items:center;gap:5px;border-radius:20px;padding:7px 10px;font-size:12px;font-weight:800;text-transform:capitalize;white-space:nowrap;background:#fff4e5;color:#9a5b00}
        .job-report-status.status-resolved{background:#edf7ef;color:#176b45}.job-report-status.status-dismissed{background:#f2f3f2;color:#59645c}.job-report-status.status-in_review{background:#edf3ff;color:#24549a}
        .job-report-details{white-space:pre-wrap;line-height:1.7;color:#34463a;margin:17px 0}.job-report-notes{font-size:13px;color:#59645c;background:#f7f8f3;padding:10px;border-radius:7px}
        .job-report-review-form{border-top:1px solid #edf0eb;padding-top:14px;display:grid;gap:12px}.job-report-review-form label{display:grid;gap:6px;font-size:12px;font-weight:700}.job-report-review-form>div{display:flex;gap:8px;flex-wrap:wrap}
        .review-button{background:#edf3ff;color:#24549a}.dismiss-button{background:#fff1ed;color:#9a3412}
        .job-reports-empty{text-align:center;padding:50px 20px;color:#176b45}.job-reports-empty h1,.job-reports-empty h2{color:#17251d;margin:12px 0 8px}
        @media(max-width:650px){.job-reports-page{padding:20px 14px}.job-reports-heading h1{font-size:25px}.job-report-card-top{flex-direction:column}.job-reports-filter span{margin-left:0;width:100%}}
      `}</style>
    </AdminShell>
  );
}
