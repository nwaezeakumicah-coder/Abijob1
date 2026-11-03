
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Filter,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Users,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import Logo from "../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./jobs.css";

type JobStatus = "pending" | "approved" | "rejected" | "closed";

type EmployerJob = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  employment_type: string | null;
  status: JobStatus;
  created_at: string;
  application_deadline: string | null;
  rejection_reason: string | null;
  job_applications?: { count: number }[];
};

type DisplayJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  posted: string;
  applicants: number;
  status: "Active" | "Pending" | "Rejected" | "Closed";
  rejectionReason: string | null;
};

const filters = ["All jobs", "Active", "Pending", "Rejected", "Closed"];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: JobStatus): DisplayJob["status"] {
  switch (status) {
    case "approved":
      return "Active";
    case "pending":
      return "Pending";
    case "rejected":
      return "Rejected";
    case "closed":
      return "Closed";
    default:
      return "Pending";
  }
}

function formatJobType(type: string | null) {
  if (!type) return "Not specified";

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function EmployerJobsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [jobs, setJobs] = useState<DisplayJob[]>([]);
  const [activeFilter, setActiveFilter] = useState("All jobs");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("Your Company");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (showRefresh = false) => {
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
        window.location.href = "/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "employer") {
        window.location.href =
          profile?.role === "professional"
            ? "/professional/dashboard"
            : profile?.role === "job_seeker"
              ? "/dashboard"
              : "/login";
        return;
      }

      const { data: employerProfile } = await supabase
        .from("employer_profiles")
        .select("business_name")
        .eq("id", user.id)
        .maybeSingle();

      if (employerProfile?.business_name) {
        setCompanyName(employerProfile.business_name);
      }

      const { data, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          category,
          location,
          employment_type,
          status,
          created_at,
          application_deadline,
          rejection_reason,
          job_applications(count)
        `)
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) {
        throw jobsError;
      }

      const formattedJobs: DisplayJob[] = ((data || []) as EmployerJob[]).map(
        (job) => ({
          id: job.id,
          title: job.title,
          department: job.category || "General",
          location: job.location || "Location not specified",
          type: formatJobType(job.employment_type),
          posted: formatDate(job.created_at),
          applicants: job.job_applications?.[0]?.count || 0,
          status: formatStatus(job.status),
          rejectionReason: job.rejection_reason,
        })
      );

      setJobs(formattedJobs);
    } catch (err) {
      console.error("Employer jobs loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "We could not load your job posts. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const results = jobs.filter((job) => {
      const matchesFilter =
        activeFilter === "All jobs" || job.status === activeFilter;

      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        job.title.toLowerCase().includes(search) ||
        job.location.toLowerCase().includes(search) ||
        job.department.toLowerCase().includes(search) ||
        job.id.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });

    return [...results].sort((a, b) => {
      const dateA = new Date(a.posted).getTime();
      const dateB = new Date(b.posted).getTime();

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [jobs, activeFilter, searchTerm, sortOrder]);

  const activeJobs = jobs.filter((job) => job.status === "Active").length;

  const totalApplicants = jobs.reduce(
    (total, job) => total + job.applicants,
    0
  );

  function toggleSort() {
    setSortOrder((current) =>
      current === "newest" ? "oldest" : "newest"
    );
  }

  return (
    <main className="employer-jobs-page">
      <aside className="employer-jobs-sidebar">
        <div className="employer-jobs-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="employer-jobs-company">
          <div className="company-avatar">
            <Building2 size={22} />
          </div>

          <div>
            <strong>{companyName}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="employer-jobs-nav-label">WORKSPACE</p>

        <nav className="employer-jobs-nav">
          <Link href="/employer/dashboard">
            <BriefcaseBusiness size={18} />
            <span>Overview</span>
          </Link>

          <Link href="/employer/jobs" className="active">
            <FileText size={18} />
            <span>My job posts</span>
            <span className="nav-count">{jobs.length}</span>
          </Link>

          <Link href="/employer/applicants">
            <Users size={18} />
            <span>Applicants</span>
          </Link>

          <Link href="/employer/messages">
            <MessageCircle size={18} />
            <span>Messages</span>
          </Link>

          <Link href="/employer/notifications">
            <Bell size={18} />
            <span>Notifications</span>
          </Link>

          <Link href="/employer/profile">
            <Building2 size={18} />
            <span>Company profile</span>
          </Link>
        </nav>

        <p className="employer-jobs-nav-label settings-label">
          PREFERENCES
        </p>

        <nav className="employer-jobs-nav">
          <Link href="/employer/settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="employer-jobs-sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              <Users size={19} />
            </div>

            <strong>Need a hand?</strong>

            <p>
              Get help with posting jobs and managing applicants.
            </p>

            <Link href="/support">
              Visit help centre <ArrowRight size={14} />
            </Link>
          </div>

          <Link href="/" className="back-to-platform">
            <ArrowLeft size={16} />
            Back to Abi Job
          </Link>
        </div>
      </aside>

      <section className="employer-jobs-main">
        <header className="employer-jobs-topbar">
          <div>
            <span className="topbar-eyebrow">
              EMPLOYER WORKSPACE
            </span>

            <p>Manage your recruitment activities</p>
          </div>

          <div className="topbar-profile">
            <div className="topbar-company-icon">
              <Building2 size={19} />
            </div>

            <div>
              <strong>{companyName}</strong>
              <span>Employer</span>
            </div>

            <ChevronDown size={16} />
          </div>
        </header>

        <div className="employer-jobs-content">
          <div className="employer-jobs-heading">
            <div>
              <span className="section-kicker">
                RECRUITMENT CENTRE
              </span>

              <h1>My job posts</h1>

              <p>
                Keep track of your vacancies and find the right people
                for your team.
              </p>
            </div>

            <Link
              href="/employer/jobs/new"
              className="create-job-button"
            >
              <Plus size={18} />
              Post a new job
            </Link>
          </div>

          {error && (
            <div className="jobs-error-message" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>

              <button
                type="button"
                onClick={() => loadJobs(true)}
              >
                Try again
              </button>
            </div>
          )}

          <div className="employer-jobs-stats">
            <div className="job-stat-card">
              <div className="job-stat-icon green-stat">
                <BriefcaseBusiness size={21} />
              </div>

              <div>
                <span>Total job posts</span>
                <strong>{loading ? "—" : jobs.length}</strong>
                <small>Across all statuses</small>
              </div>
            </div>

            <div className="job-stat-card">
              <div className="job-stat-icon lime-stat">
                <CheckCircle2 size={21} />
              </div>

              <div>
                <span>Active vacancies</span>
                <strong>{loading ? "—" : activeJobs}</strong>
                <small>Approved and accepting applications</small>
              </div>
            </div>

            <div className="job-stat-card">
              <div className="job-stat-icon orange-stat">
                <Users size={21} />
              </div>

              <div>
                <span>Total applicants</span>
                <strong>{loading ? "—" : totalApplicants}</strong>
                <small>Across all job posts</small>
              </div>
            </div>
          </div>

          <section className="jobs-management-card">
            <div className="jobs-card-heading">
              <div>
                <h2>Your vacancies</h2>

                <p>
                  Review and manage the jobs published by your company.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="jobs-sort-button"
                  type="button"
                  onClick={() => loadJobs(true)}
                  disabled={refreshing}
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  className="jobs-sort-button"
                  type="button"
                  onClick={toggleSort}
                  aria-label="Change job sorting order"
                  title="Change sorting order"
                >
                  <ArrowDownUp size={16} />

                  {sortOrder === "newest"
                    ? "Recently posted"
                    : "Oldest first"}

                  <ChevronDown size={15} />
                </button>
              </div>
            </div>

            <div className="jobs-toolbar">
              <div className="jobs-filter-tabs">
                {filters.map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={
                      activeFilter === filter ? "selected" : ""
                    }
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}

                    {filter === "All jobs" && (
                      <span>{jobs.length}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="jobs-search-box">
                <Search size={17} />

                <input
                  type="search"
                  placeholder="Search job title, ID or location..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  aria-label="Search job posts"
                />

                <Filter size={16} />
              </div>
            </div>

            <div className="jobs-table-wrap">
              <table className="employer-jobs-table">
                <thead>
                  <tr>
                    <th>JOB TITLE</th>
                    <th>LOCATION</th>
                    <th>JOB TYPE</th>
                    <th>DATE POSTED</th>
                    <th>APPLICANTS</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="jobs-empty-state">
                          <RefreshCw size={24} />
                          <strong>Loading your job posts...</strong>
                          <span>Please wait while we retrieve your vacancies.</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="job-title-cell">
                          <strong>{job.title}</strong>

                          <span>
                            {job.department} · {job.id.slice(0, 8)}
                          </span>
                        </div>
                      </td>

                      <td>{job.location}</td>

                      <td>
                        <span className="job-type-label">
                          {job.type}
                        </span>
                      </td>

                      <td>{job.posted}</td>

                      <td>
                        <Link
                          href={`/employer/applicants?job=${job.id}`}
                          className="applicant-count"
                        >
                          <Users size={15} />
                          {job.applicants}
                        </Link>
                      </td>

                      <td>
                        <span
                          className={`job-status ${job.status.toLowerCase()}`}
                        >
                          {job.status === "Active" && (
                            <CheckCircle2 size={13} />
                          )}

                          {job.status === "Pending" && (
                            <Clock3 size={13} />
                          )}

                          {job.status === "Rejected" && (
                            <XCircle size={13} />
                          )}

                          {job.status === "Closed" && (
                            <XCircle size={13} />
                          )}

                          {job.status}
                        </span>

                        {job.status === "Rejected" && job.rejectionReason && (
                          <small
                            title={job.rejectionReason}
                            style={{
                              display: "block",
                              marginTop: "5px",
                              maxWidth: "180px",
                            }}
                          >
                            {job.rejectionReason}
                          </small>
                        )}
                      </td>

                      <td>
                        <div className="job-actions-wrapper">
                          <button
                            type="button"
                            className="job-more-button"
                            aria-label={`More actions for ${job.title}`}
                            aria-expanded={openMenuId === job.id}
                            title="More actions"
                            onClick={() =>
                              setOpenMenuId((current) =>
                                current === job.id ? null : job.id
                              )
                            }
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {openMenuId === job.id && (
                            <div className="job-actions-menu">
                              <Link
                                href={`/employer/applicants?job=${job.id}`}
                                onClick={() => setOpenMenuId(null)}
                              >
                                <Users size={15} />
                                View applicants
                              </Link>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  window.location.href =
                                    `/jobs/${job.id}`;
                                }}
                              >
                                <Eye size={15} />
                                View job
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="jobs-empty-state">
                          <Search size={25} />

                          <strong>
                            {jobs.length === 0
                              ? "You haven't posted any jobs yet"
                              : "No matching jobs found"}
                          </strong>

                          <span>
                            {jobs.length === 0
                              ? "Create your first vacancy to start receiving applications."
                              : "Try another search term or change the status filter."}
                          </span>

                          {jobs.length === 0 && (
                            <Link
                              href="/employer/jobs/new"
                              className="create-job-button"
                              style={{ marginTop: "12px" }}
                            >
                              <Plus size={16} />
                              Post your first job
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="jobs-table-footer">
              <span>
                Showing <strong>{filteredJobs.length}</strong> of{" "}
                <strong>{jobs.length}</strong> job posts
              </span>

              <div className="jobs-pagination">
                <button type="button" disabled>
                  Previous
                </button>

                <button
                  type="button"
                  className="current-page"
                  aria-current="page"
                >
                  1
                </button>

                <button type="button" disabled>
                  Next
                </button>
              </div>
            </div>
          </section>

          <div className="jobs-bottom-note">
            <Eye size={17} />

            <p>
              Job posts are subject to Abi Job&apos;s review and approval
              process before they become publicly visible.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
