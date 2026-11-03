
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import "./applications.css";

type DatabaseStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

type ApplicationStatus =
  | "Submitted"
  | "Under review"
  | "Shortlisted"
  | "Rejected"
  | "Successful"
  | "Withdrawn";

type Application = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  initials: string;
  color: string;
  location: string;
  employment: string;
  salary: string;
  appliedDate: string;
  appliedTimestamp: number;
  status: ApplicationStatus;
  updated: string;
  description: string;
  cvPath: string | null;
  coverLetter: string | null;
};

const statusOptions = [
  "All",
  "Submitted",
  "Under review",
  "Shortlisted",
  "Successful",
  "Rejected",
  "Withdrawn",
];

function formatStatus(status: DatabaseStatus): ApplicationStatus {
  const statuses: Record<DatabaseStatus, ApplicationStatus> = {
    submitted: "Submitted",
    under_review: "Under review",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    hired: "Successful",
    withdrawn: "Withdrawn",
  };

  return statuses[status] || "Submitted";
}

function getStatusClass(status: ApplicationStatus) {
  const classes: Record<ApplicationStatus, string> = {
    Submitted: "pending",
    "Under review": "review",
    Shortlisted: "shortlisted",
    Successful: "successful",
    Rejected: "rejected",
    Withdrawn: "rejected",
  };

  return classes[status];
}

function getStatusIcon(status: ApplicationStatus) {
  switch (status) {
    case "Successful":
      return <CheckCircle2 size={14} />;
    case "Rejected":
    case "Withdrawn":
      return <XCircle size={14} />;
    case "Shortlisted":
      return <CheckCircle2 size={14} />;
    case "Under review":
      return <Clock3 size={14} />;
    default:
      return <FileText size={14} />;
  }
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRelativeDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  const today = new Date();

  const difference = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (difference <= 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference < 7) return `${difference} days ago`;

  return formatDate(value);
}

function formatSalary(
  minimum: number | null,
  maximum: number | null,
  currency: string | null
) {
  if (minimum === null && maximum === null) {
    return "Salary not specified";
  }

  const code = currency || "NGN";

  const amount = (value: number) => {
    const formatted = new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(value);

    return code.toUpperCase() === "NGN"
      ? `₦${formatted}`
      : `${code} ${formatted}`;
  };

  if (minimum !== null && maximum !== null) {
    return `${amount(minimum)} – ${amount(maximum)}`;
  }

  if (minimum !== null) return `From ${amount(minimum)}`;

  return `Up to ${amount(maximum as number)}`;
}

function formatEmployment(value: string | null) {
  if (!value) return "Not specified";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getCompanyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "AJ";
}

function getCompanyColor(name: string) {
  const colors = ["green", "orange", "blue", "purple", "pink", "teal"];
  const total = name
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return colors[total % colors.length];
}

export default function ApplicationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login?redirect=%2Fapplications");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Your account profile could not be loaded.");
      }

      if (profile.role !== "job_seeker") {
        if (profile.role === "professional") {
          router.replace("/professional/dashboard");
        } else if (profile.role === "employer") {
          router.replace("/employer/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }

      const { data, error: applicationsError } = await supabase
        .from("job_applications")
        .select(`
          id,
          job_id,
          applicant_id,
          cover_letter,
          cv_path,
          status,
          created_at,
          updated_at,
          jobs (
            id,
            title,
            location,
            employment_type,
            salary_min,
            salary_max,
            currency,
            description,
            employer_id
          )
        `)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationsError) {
        throw applicationsError;
      }

      const records = (data || []) as any[];

      const employerIds = [
        ...new Set(
          records
            .map((record) => record.jobs?.employer_id)
            .filter(Boolean)
        ),
      ];

      let employerNames: Record<string, string> = {};

      if (employerIds.length > 0) {
        const { data: employers } = await supabase
          .from("employer_profiles")
          .select("id, business_name")
          .in("id", employerIds);

        if (employers) {
          employerNames = Object.fromEntries(
            employers.map((employer) => [
              employer.id,
              employer.business_name,
            ])
          );
        }
      }

      const mappedApplications: Application[] = records
        .filter((record) => record.jobs)
        .map((record) => {
          const job = record.jobs;
          const company =
            employerNames[job.employer_id] || "Abi Job Employer";

          return {
            id: record.id,
            jobId: record.job_id,
            title: job.title || "Untitled vacancy",
            company,
            initials: getCompanyInitials(company),
            color: getCompanyColor(company),
            location: job.location || "Location not specified",
            employment: formatEmployment(job.employment_type),
            salary: formatSalary(
              job.salary_min,
              job.salary_max,
              job.currency
            ),
            appliedDate: formatDate(record.created_at),
            appliedTimestamp: record.created_at
              ? new Date(record.created_at).getTime()
              : 0,
            status: formatStatus(record.status as DatabaseStatus),
            updated: formatRelativeDate(
              record.updated_at || record.created_at
            ),
            description: job.description || "No job description available.",
            cvPath: record.cv_path || null,
            coverLetter: record.cover_letter || null,
          };
        });

      setApplications(mappedApplications);
    } catch (err) {
      console.error("Applications loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const counts = useMemo(() => {
    return {
      total: applications.length,
      submitted: applications.filter(
        (app) => app.status === "Submitted"
      ).length,
      review: applications.filter(
        (app) => app.status === "Under review"
      ).length,
      shortlisted: applications.filter(
        (app) => app.status === "Shortlisted"
      ).length,
      successful: applications.filter(
        (app) => app.status === "Successful"
      ).length,
      rejected: applications.filter(
        (app) => app.status === "Rejected"
      ).length,
      withdrawn: applications.filter(
        (app) => app.status === "Withdrawn"
      ).length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    let results = applications.filter((application) => {
      const searchableText = [
        application.title,
        application.company,
        application.location,
        application.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase()
      );

      const matchesStatus =
        statusFilter === "All" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    results = [...results].sort((a, b) => {
      if (sortOrder === "alphabetical") {
        return a.title.localeCompare(b.title);
      }

      if (sortOrder === "company") {
        return a.company.localeCompare(b.company);
      }

      return b.appliedTimestamp - a.appliedTimestamp;
    });

    return results;
  }, [applications, search, statusFilter, sortOrder]);

  function resetFilters() {
    setSearch("");
    setStatusFilter("All");
    setSortOrder("newest");
  }

  async function openCv(path: string) {
    const { data, error: signedUrlError } = await supabase.storage
      .from("abi-job-profile-files")
      .createSignedUrl(path, 60 * 5);

    if (signedUrlError || !data?.signedUrl) {
      setError("Your CV could not be opened. Please try again.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main className="applications-page">
        <div className="applications-loading">
          <LoaderCircle size={34} className="animate-spin" />
          <p>Loading your applications...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="applications-page">
      <aside className="applications-sidebar">
        <Link href="/dashboard" className="applications-brand">
          <span className="applications-brand-mark">a.</span>
          <span>
            abi<span className="applications-brand-green">job</span>
          </span>
        </Link>

        <div className="applications-nav-label">WORKSPACE</div>

        <nav className="applications-navigation">
          <Link href="/dashboard" className="applications-nav-link">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/jobs" className="applications-nav-link">
            <Search size={19} />
            <span>Find Jobs</span>
          </Link>

          <Link href="/saved-jobs" className="applications-nav-link">
            <FileText size={19} />
            <span>Saved Jobs</span>
          </Link>

          <Link
            href="/applications"
            className="applications-nav-link active"
          >
            <CheckCircle2 size={19} />
            <span>My Applications</span>
            <span className="applications-nav-count">
              {counts.total}
            </span>
          </Link>

          <Link href="/messages" className="applications-nav-link">
            <BriefcaseBusiness size={19} />
            <span>Messages</span>
          </Link>

          <Link
            href="/notifications"
            className="applications-nav-link"
          >
            <Bell size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="applications-sidebar-bottom">
          <div className="applications-help-card">
            <div className="applications-help-icon">
              <FileText size={19} />
            </div>
            <h4>Stay application-ready.</h4>
            <p>
              Keep your CV and professional profile updated to improve
              your chances.
            </p>
            <Link href="/cv-builder">
              Improve your CV <ArrowRight size={14} />
            </Link>
          </div>

          <div className="applications-sidebar-footer">
            <span />
            Abi Job Workspace
          </div>
        </div>
      </aside>

      <section className="applications-main">
        <header className="applications-topbar">
          <div>
            <div className="applications-breadcrumb">
              Workspace <span>/</span> My Applications
            </div>
            <h1>My Applications</h1>
            <p>Track your job applications and follow your progress.</p>
          </div>

          <div className="applications-top-actions">
            <Link
              href="/notifications"
              className="applications-notification"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </Link>

            <div className="applications-user-avatar">AJ</div>

            <div className="applications-user-details">
              <strong>My Account</strong>
              <span>Job Seeker</span>
            </div>
          </div>
        </header>

        <div className="applications-content">
          {error && (
            <div className="applications-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          <section className="applications-hero">
            <div className="applications-hero-content">
              <span className="applications-hero-eyebrow">
                <BriefcaseBusiness size={15} />
                YOUR CAREER JOURNEY
              </span>

              <h2>
                Every application brings you <span>closer.</span>
              </h2>

              <p>
                Stay informed about your applications, monitor employer
                responses and prepare for your next opportunity.
              </p>

              <Link
                href="/jobs"
                className="applications-hero-button"
              >
                Find more opportunities <ArrowRight size={17} />
              </Link>
            </div>

            <div className="applications-hero-visual">
              <div className="applications-hero-circle circle-one" />
              <div className="applications-hero-circle circle-two" />

              <div className="applications-hero-document">
                <div className="document-top">
                  <FileText size={23} />
                  <span>APPLICATION</span>
                </div>
                <div className="document-line long" />
                <div className="document-line medium" />
                <div className="document-line short" />
                <div className="document-check">
                  <CheckCircle2 size={24} />
                  <span>Progress tracked</span>
                </div>
              </div>
            </div>
          </section>

          <section className="applications-statistics">
            <article className="applications-stat-card">
              <div className="applications-stat-icon total-icon">
                <BriefcaseBusiness size={20} />
              </div>
              <div>
                <span>Total applications</span>
                <strong>{counts.total}</strong>
                <small>All submitted applications</small>
              </div>
            </article>

            <article className="applications-stat-card">
              <div className="applications-stat-icon review-icon">
                <Clock3 size={20} />
              </div>
              <div>
                <span>Awaiting response</span>
                <strong>{counts.submitted + counts.review}</strong>
                <small>Submitted or under review</small>
              </div>
            </article>

            <article className="applications-stat-card">
              <div className="applications-stat-icon shortlist-icon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span>Shortlisted</span>
                <strong>{counts.shortlisted}</strong>
                <small>Progressing in recruitment</small>
              </div>
            </article>

            <article className="applications-stat-card">
              <div className="applications-stat-icon interview-icon">
                <CalendarDays size={20} />
              </div>
              <div>
                <span>Successful</span>
                <strong>{counts.successful}</strong>
                <small>Marked as hired</small>
              </div>
            </article>
          </section>

          <section className="applications-progress-section">
            <div className="applications-section-heading">
              <div>
                <h2>Application overview</h2>
                <p>A breakdown of your current application outcomes.</p>
              </div>
            </div>

            <div className="applications-progress-card">
              {[
                {
                  label: "Submitted",
                  count: counts.submitted,
                  dot: "pending-dot",
                  fill: "pending-fill",
                },
                {
                  label: "Under review",
                  count: counts.review,
                  dot: "review-dot",
                  fill: "review-fill",
                },
                {
                  label: "Shortlisted",
                  count: counts.shortlisted,
                  dot: "shortlist-dot",
                  fill: "shortlist-fill",
                },
                {
                  label: "Successful",
                  count: counts.successful,
                  dot: "success-dot",
                  fill: "success-fill",
                },
                {
                  label: "Rejected",
                  count: counts.rejected,
                  dot: "rejected-dot",
                  fill: "rejected-fill",
                },
                {
                  label: "Withdrawn",
                  count: counts.withdrawn,
                  dot: "rejected-dot",
                  fill: "rejected-fill",
                },
              ].map((item) => (
                <div className="applications-progress-item" key={item.label}>
                  <div className="progress-item-heading">
                    <span className={`progress-dot ${item.dot}`} />
                    {item.label}
                    <strong>{item.count}</strong>
                  </div>
                  <div className="progress-track">
                    <span
                      className={`progress-fill ${item.fill}`}
                      style={{
                        width: `${
                          counts.total
                            ? (item.count / counts.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="applications-list-section">
            <div className="applications-list-heading">
              <div>
                <h2>All applications</h2>
                <p>
                  {filteredApplications.length} applications displayed
                </p>
              </div>

              <Link
                href="/jobs"
                className="applications-browse-link"
              >
                Browse jobs <ArrowRight size={15} />
              </Link>
            </div>

            <div className="applications-toolbar">
              <div className="applications-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search job title, employer or location..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                className={`applications-filter-button ${
                  showFilters ? "active" : ""
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={17} />
                Filter
              </button>

              <select
                className="applications-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-label="Sort applications"
              >
                <option value="newest">Newest first</option>
                <option value="alphabetical">Job title A–Z</option>
                <option value="company">Employer A–Z</option>
              </select>
            </div>

            {showFilters && (
              <div className="applications-filter-panel">
                <div>
                  <strong>Application status</strong>
                  <div className="applications-filter-options">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        className={
                          statusFilter === status ? "selected" : ""
                        }
                        onClick={() => setStatusFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="applications-clear-filter"
                  onClick={resetFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}

            <div className="applications-status-tabs">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={
                    statusFilter === status ? "selected" : ""
                  }
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                  {status === "All" && <span>{counts.total}</span>}
                  {status === "Shortlisted" && (
                    <span>{counts.shortlisted}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="applications-list">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <article
                    className="application-card"
                    key={application.id}
                  >
                    <div className="application-card-main">
                      <div
                        className={`application-company-logo ${application.color}`}
                      >
                        {application.initials}
                      </div>

                      <div className="application-information">
                        <div className="application-title-row">
                          <h3>{application.title}</h3>
                          <span
                            className={`application-status ${getStatusClass(
                              application.status
                            )}`}
                          >
                            {getStatusIcon(application.status)}
                            {application.status}
                          </span>
                        </div>

                        <div className="application-company">
                          <Building2 size={14} />
                          {application.company}
                        </div>

                        <p>{application.description}</p>

                        <div className="application-meta">
                          <span>
                            <MapPin size={14} />
                            {application.location}
                          </span>
                          <span>
                            <Clock3 size={14} />
                            {application.employment}
                          </span>
                          <span>
                            <BriefcaseBusiness size={14} />
                            {application.salary}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="application-card-footer">
                      <div className="application-date">
                        <CalendarDays size={14} />
                        Applied {application.appliedDate}
                      </div>

                      <div className="application-footer-actions">
                        <span>Updated: {application.updated}</span>
                        <button
                          onClick={() =>
                            setSelectedApplication(application)
                          }
                          className="application-details-button"
                        >
                          View details <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="applications-empty">
                  <div>
                    <Filter size={30} />
                  </div>
                  <h3>
                    {applications.length === 0
                      ? "You haven't applied for any jobs yet"
                      : "No applications found"}
                  </h3>
                  <p>
                    {applications.length === 0
                      ? "When you apply for an opportunity, it will appear here so you can track its progress."
                      : "No applications match your current search or selected status. Try changing your filters."}
                  </p>
                  {applications.length === 0 ? (
                    <Link href="/jobs" className="applications-empty-link">
                      Find jobs <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <button onClick={resetFilters}>Clear filters</button>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="applications-bottom-tip">
            <div className="applications-bottom-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <strong>Keep moving forward.</strong>
              <p>
                A strong CV and an updated profile can help you stand
                out to employers.
              </p>
            </div>
            <Link href="/profile">
              Update my profile <ArrowRight size={15} />
            </Link>
          </section>

          <button
            className="applications-refresh-button"
            onClick={loadApplications}
          >
            Refresh applications
          </button>
        </div>
      </section>

      {selectedApplication && (
        <div
          className="application-modal-overlay"
          onClick={() => setSelectedApplication(null)}
        >
          <section
            className="application-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="application-modal-header">
              <div>
                <span>APPLICATION DETAILS</span>
                <h2>Application overview</h2>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                aria-label="Close application details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="application-modal-job">
              <div
                className={`application-company-logo ${selectedApplication.color}`}
              >
                {selectedApplication.initials}
              </div>
              <div>
                <h3>{selectedApplication.title}</h3>
                <p>{selectedApplication.company}</p>
              </div>
            </div>

            <div className="application-modal-status">
              <span>Current application status</span>
              <strong
                className={`application-status ${getStatusClass(
                  selectedApplication.status
                )}`}
              >
                {getStatusIcon(selectedApplication.status)}
                {selectedApplication.status}
              </strong>
            </div>

            <div className="application-modal-details">
              <div>
                <span>Location</span>
                <strong>{selectedApplication.location}</strong>
              </div>
              <div>
                <span>Employment type</span>
                <strong>{selectedApplication.employment}</strong>
              </div>
              <div>
                <span>Salary range</span>
                <strong>{selectedApplication.salary}</strong>
              </div>
              <div>
                <span>Date applied</span>
                <strong>{selectedApplication.appliedDate}</strong>
              </div>
              <div>
                <span>Last update</span>
                <strong>{selectedApplication.updated}</strong>
              </div>
            </div>

            <div className="application-modal-description">
              <strong>Job description</strong>
              <p>{selectedApplication.description}</p>
            </div>

            {selectedApplication.coverLetter && (
              <div className="application-modal-description">
                <strong>Your cover letter</strong>
                <p>{selectedApplication.coverLetter}</p>
              </div>
            )}

            {selectedApplication.cvPath && (
              <button
                className="application-details-button"
                onClick={() => openCv(selectedApplication.cvPath!)}
              >
                <FileText size={16} />
                View submitted CV
                <ArrowRight size={15} />
              </button>
            )}

            <div className="application-modal-footer">
              <button onClick={() => setSelectedApplication(null)}>
                Close details
              </button>
              <Link href="/jobs">
                Find more jobs <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
