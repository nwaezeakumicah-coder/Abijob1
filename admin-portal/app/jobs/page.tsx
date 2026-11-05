
import { getActiveAdmin } from "../../lib/admin-auth";
import { getAdminJobs } from "../../lib/admin-jobs";
import { approveJob, rejectJob } from "./actions";
import AdminShell from "../../components/AdminShell";

export const dynamic = "force-dynamic";

type JobsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatSalary(
  minimum: number | null,
  maximum: number | null,
  currency: string
) {
  if (minimum === null && maximum === null) return "Salary not specified";

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-NG").format(amount);

  if (minimum !== null && maximum !== null) {
    return `${currency} ${formatAmount(minimum)} – ${formatAmount(maximum)}`;
  }

  if (minimum !== null) return `From ${currency} ${formatAmount(minimum)}`;

  return `Up to ${currency} ${formatAmount(maximum!)}`;
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const admin = await getActiveAdmin();

  const canViewJobs =
    admin.permissions.includes("jobs.view") ||
    admin.permissions.includes("jobs.review") ||
    admin.permissions.includes("jobs.manage");

  if (!canViewJobs) {
    return (
      <AdminShell>
        <div className="jobs-page">
          <div className="jobs-empty-state">
            <h2>Access restricted</h2>
            <p>You do not have permission to view job management.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const canReviewJobs =
    admin.permissions.includes("jobs.review") ||
    admin.permissions.includes("jobs.manage");

  const [{ jobs, counts }, params] = await Promise.all([
    getAdminJobs(),
    searchParams,
  ]);

  const searchTerm = (params.q ?? "").trim().toLowerCase();
  const selectedStatus = params.status ?? "all";

  const validStatuses = ["all", "pending", "approved", "rejected", "closed"];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm) ||
      job.category.toLowerCase().includes(searchTerm) ||
      job.location.toLowerCase().includes(searchTerm) ||
      job.employer_id.toLowerCase().includes(searchTerm);

    const matchesStatus =
      selectedStatus === "all" || job.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statusCards = [
    { label: "All jobs", value: counts.total, key: "all" },
    { label: "Pending review", value: counts.pending, key: "pending" },
    { label: "Approved", value: counts.approved, key: "approved" },
    { label: "Rejected", value: counts.rejected, key: "rejected" },
    { label: "Closed", value: counts.closed, key: "closed" },
  ];

  return (
    <AdminShell>
      <main className="jobs-page">
        <div className="jobs-page-header">
          <div>
            <span className="jobs-eyebrow">CONTENT MANAGEMENT</span>
            <h1>Job Management</h1>
            <p>
              Review job submissions and manage opportunities published on
              the Abi Job platform.
            </p>
          </div>

          <div className="jobs-total-label">
            <strong>{counts.total}</strong>
            <span>Total jobs</span>
          </div>
        </div>

        <section className="jobs-stats-grid">
          {statusCards.map((card) => (
            <a
              key={card.key}
              href={
                card.key === "all"
                  ? "/jobs"
                  : `/jobs?status=${card.key}`
              }
              className={`jobs-stat-card ${
                selectedStatus === card.key ? "active" : ""
              }`}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </a>
          ))}
        </section>

        <section className="jobs-directory">
          <div className="jobs-directory-header">
            <div>
              <h2>Job submissions</h2>
              <p>
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1 ? "job" : "jobs"} displayed
              </p>
            </div>

            <form method="GET" action="/jobs" className="jobs-search-form">
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search title, category or location..."
              />

              {selectedStatus !== "all" && (
                <input
                  type="hidden"
                  name="status"
                  value={selectedStatus}
                />
              )}

              <button type="submit">Search</button>
            </form>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="jobs-empty-state">
              <h3>No jobs found</h3>
              <p>
                {jobs.length === 0
                  ? "There are currently no job submissions in the database."
                  : "Try another search term or status filter."}
              </p>
              {(searchTerm || selectedStatus !== "all") && (
                <a href="/jobs">Clear filters</a>
              )}
            </div>
          ) : (
            <div className="jobs-list">
              {filteredJobs.map((job) => (
                <article className="admin-job-card" key={job.id}>
                  <div className="admin-job-top">
                    <div>
                      <span className="admin-job-category">
                        {job.category}
                      </span>
                      <h3>{job.title}</h3>
                      <p className="admin-job-location">
                        {job.location}
                        {job.workplace_type
                          ? ` · ${job.workplace_type}`
                          : ""}
                      </p>
                    </div>

                    <span className={`job-status status-${job.status}`}>
                      {statusLabel(job.status)}
                    </span>
                  </div>

                  <div className="admin-job-details">
                    <div>
                      <span>Employment type</span>
                      <strong>{job.employment_type}</strong>
                    </div>

                    <div>
                      <span>Experience level</span>
                      <strong>{job.experience_level || "Not specified"}</strong>
                    </div>

                    <div>
                      <span>Salary</span>
                      <strong>
                        {formatSalary(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Date submitted</span>
                      <strong>{formatDate(job.created_at)}</strong>
                    </div>
                  </div>

                  <div className="admin-job-description">
                    <h4>Job description</h4>
                    <p>{job.description}</p>
                  </div>

                  {job.requirements && (
                    <div className="admin-job-description">
                      <h4>Requirements</h4>
                      <p>{job.requirements}</p>
                    </div>
                  )}

                  {job.skills_required?.length > 0 && (
                    <div className="admin-job-skills">
                      {job.skills_required.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="admin-job-footer">
                    <div className="admin-job-employer">
                      <span>Employer ID</span>
                      <strong>{job.employer_id}</strong>
                    </div>

                    {canReviewJobs && job.status === "pending" && (
                      <div className="admin-job-actions">
                        <form
                          action={async () => {
                            "use server";
                            await approveJob(job.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="job-approve-button"
                          >
                            Approve job
                          </button>
                        </form>

                        <details className="job-reject-details">
                          <summary>Reject job</summary>

                          <form
                            action={rejectJob}
                            className="job-reject-form"
                          >
                            <input
                              type="hidden"
                              name="jobId"
                              value={job.id}
                            />

                            <label htmlFor={`reason-${job.id}`}>
                              Reason for rejection
                            </label>

                            <textarea
                              id={`reason-${job.id}`}
                              name="reason"
                              placeholder="Explain why this job cannot be approved..."
                              minLength={10}
                              maxLength={1000}
                              required
                            />

                            <button type="submit">
                              Confirm rejection
                            </button>
                          </form>
                        </details>
                      </div>
                    )}

                    {job.status === "rejected" && job.rejection_reason && (
                      <div className="job-rejection-reason">
                        <strong>Rejection reason</strong>
                        <p>{job.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}
