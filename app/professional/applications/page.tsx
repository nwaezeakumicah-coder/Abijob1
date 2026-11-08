
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import { createClient } from "../../../lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import "./applications.css";

type DatabaseApplicationStatus =
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
  | "Hired"
  | "Withdrawn";

type Application = {
  id: string;
  role: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  applied: string;
  status: ApplicationStatus;
  description: string;
  coverLetter: string;
  hasCv: boolean;
};

type JobRow = {
  id: string;
  employer_id: string;
  title: string | null;
  category: string | null;
  location: string | null;
  employment_type: string | null;
  workplace_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  description: string | null;
};

type ApplicationRow = {
  id: string;
  job_id: string;
  status: string | null;
  created_at: string;
  cover_letter: string | null;
  cv_path: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

const filters = [
  "All",
  "Submitted",
  "Under review",
  "Shortlisted",
  "Hired",
  "Rejected",
  "Withdrawn",
] as const;

const STATUS_LABELS: Record<DatabaseApplicationStatus, ApplicationStatus> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

function normalizeStatus(value: string | null): ApplicationStatus {
  if (
    value &&
    Object.prototype.hasOwnProperty.call(STATUS_LABELS, value)
  ) {
    return STATUS_LABELS[value as DatabaseApplicationStatus];
  }

  return "Submitted";
}

function StatusIcon({ status }: { status: ApplicationStatus }) {
  if (status === "Shortlisted" || status === "Hired") {
    return <CheckCircle2 size={15} />;
  }

  if (status === "Rejected" || status === "Withdrawn") {
    return <XCircle size={15} />;
  }

  return <Clock3 size={15} />;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatSalary(
  minimum: number | null,
  maximum: number | null,
  currency: string | null
) {
  if (minimum == null && maximum == null) {
    return "Salary not specified";
  }

  const currencyCode = currency || "NGN";

  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  });

  if (minimum != null && maximum != null) {
    return minimum === maximum
      ? formatter.format(minimum)
      : `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
  }

  if (minimum != null) return `From ${formatter.format(minimum)}`;

  return `Up to ${formatter.format(maximum as number)}`;
}

function formatEmploymentType(
  employmentType: string | null,
  workplaceType: string | null
) {
  const values = [employmentType, workplaceType]
    .filter(Boolean)
    .map((value) =>
      String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );

  return values.length > 0 ? [...new Set(values)].join(" · ") : "Not specified";
}

export default function ProfessionalApplicationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const [fullName, setFullName] = useState("Professional");
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
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error("We could not verify your account. Please try again.");
      }

      if (!profile) {
        router.replace("/login");
        return;
      }

      if (profile.role !== "professional") {
        const destination =
          profile.role === "job_seeker"
            ? "/dashboard"
            : profile.role === "employer"
              ? "/employer/dashboard"
              : profile.role === "admin"
                ? "/admin"
                : "/login";

        router.replace(destination);
        return;
      }

      setFullName(profile.full_name?.trim() || "Professional");

      const { data: applicationRows, error: applicationsError } =
        await supabase
          .from("job_applications")
          .select(
            "id, job_id, status, created_at, cover_letter, cv_path"
          )
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false });

      if (applicationsError) {
        throw new Error(
          "Your applications could not be loaded. Please refresh the page."
        );
      }

      const rows = (applicationRows || []) as ApplicationRow[];

      if (rows.length === 0) {
        setApplications([]);
        return;
      }

      const jobIds = [
        ...new Set(rows.map((application) => application.job_id).filter(Boolean)),
      ];

      const { data: jobRows, error: jobsError } = await supabase
        .from("jobs")
        .select(
          "id, employer_id, title, category, location, employment_type, workplace_type, salary_min, salary_max, salary_currency, description"
        )
        .in("id", jobIds);

      if (jobsError) {
        // Keep the application history visible even if vacancy details
        // are unavailable because of the current vacancy access policy.
        console.warn("Application vacancy details could not be loaded.");
      }

      const jobs = (jobRows || []) as JobRow[];
      const jobMap = new Map(jobs.map((job) => [job.id, job]));

      const employerIds = [
        ...new Set(jobs.map((job) => job.employer_id).filter(Boolean)),
      ];

      let employerMap = new Map<string, string>();

      if (employerIds.length > 0) {
        const { data: employerRows, error: employersError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", employerIds);

        if (!employersError && employerRows) {
          employerMap = new Map(
            (employerRows as ProfileRow[]).map((employer) => [
              employer.id,
              employer.full_name?.trim() || "Employer",
            ])
          );
        }
      }

      const mappedApplications: Application[] = rows.map((application) => {
        const job = jobMap.get(application.job_id);

        return {
          id: application.id,
          role: job?.title || "Vacancy details unavailable",
          company: job
            ? employerMap.get(job.employer_id) || "Employer"
            : "Employer",
          location: job?.location || "Location unavailable",
          type: formatEmploymentType(
            job?.employment_type || null,
            job?.workplace_type || null
          ),
          salary: job
            ? formatSalary(
                job.salary_min,
                job.salary_max,
                job.salary_currency
              )
            : "Salary unavailable",
          applied: formatDate(application.created_at),
          status: normalizeStatus(application.status),
          description:
            job?.description || "The original vacancy description is unavailable.",
          coverLetter: application.cover_letter || "",
          hasCv: Boolean(application.cv_path),
        };
      });

      setApplications(mappedApplications);
    } catch (loadError) {
      console.error("Professional applications loading error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Something went wrong while loading your applications."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesFilter =
        activeFilter === "All" || application.status === activeFilter;

      const matchesSearch =
        !query ||
        application.role.toLowerCase().includes(query) ||
        application.company.toLowerCase().includes(query) ||
        application.location.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [applications, activeFilter, searchQuery]);

  const countStatus = (status: ApplicationStatus) =>
    applications.filter((item) => item.status === status).length;

  const initials = getInitials(fullName);

  return (
    <main className="professional-applications">
      <aside className="professional-applications-sidebar">
        <div className="professional-applications-brand">
          <Logo href="/" light />
        </div>

        <div className="professional-applications-sidebar-label">
          WORKSPACE
        </div>

        <nav className="professional-applications-nav">
          <Link href="/professional/dashboard">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/professional/opportunities">
            <Search size={19} />
            <span>Find opportunities</span>
          </Link>

          <Link href="/professional/applications" className="active">
            <FileText size={19} />
            <span>My applications</span>
            <span className="professional-applications-nav-count">
              {applications.length}
            </span>
          </Link>

          <Link href="/interviews">
            <CalendarDays size={19} />
            <span>My interviews</span>
          </Link>

          <Link href="/professional/experience">
            <CheckCircle2 size={19} />
            <span>Experience</span>
          </Link>

          <Link href="/professional/messages">
            <BriefcaseBusiness size={19} />
            <span>Messages</span>
          </Link>

          <Link href="/professional/notifications">
            <Clock3 size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="professional-applications-sidebar-bottom">
          <div className="professional-applications-help">
            <div className="professional-applications-help-icon">
              <BriefcaseBusiness size={20} />
            </div>
            <strong>Grow your career</strong>
            <p>Discover opportunities that match your skills.</p>
            <Link href="/professional/opportunities">
              Explore jobs <ArrowRight size={15} />
            </Link>
          </div>

          <Link
            href="/professional/profile"
            className="professional-applications-profile-link"
          >
            <div className="professional-applications-avatar">{initials}</div>
            <div>
              <strong>My profile</strong>
              <span>{fullName}</span>
            </div>
          </Link>
        </div>
      </aside>

      <section className="professional-applications-main">
        <header className="professional-applications-topbar">
          <div>
            <span className="professional-applications-topbar-label">
              PROFESSIONAL WORKSPACE
            </span>
            <h2>My applications</h2>
          </div>

          <div className="professional-applications-topbar-actions">
            <Link
              href="/professional/messages"
              className="professional-applications-top-icon"
              aria-label="Messages"
            >
              <BriefcaseBusiness size={19} />
            </Link>
            <Link
              href="/professional/notifications"
              className="professional-applications-top-icon"
              aria-label="Notifications"
            >
              <Clock3 size={19} />
            </Link>
            <Link
              href="/professional/profile"
              className="professional-applications-top-avatar"
              aria-label="My profile"
            >
              {initials}
            </Link>
          </div>
        </header>

        <div className="professional-applications-content">
          <Link
            href="/professional/dashboard"
            className="professional-applications-back"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="professional-applications-heading">
            <div>
              <span className="professional-applications-eyebrow">
                YOUR CAREER ACTIVITY
              </span>
              <h1>Track your applications</h1>
              <p>
                Keep an eye on the opportunities you have applied for and
                follow every application update.
              </p>
            </div>

            <Link
              href="/professional/opportunities"
              className="professional-applications-find-button"
            >
              Find opportunities <ArrowRight size={17} />
            </Link>
          </div>

          <div className="professional-applications-stats">
            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon total">
                <FileText size={20} />
              </div>
              <div>
                <span>Total applications</span>
                <strong>{loading ? "—" : applications.length}</strong>
              </div>
            </div>

            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon review">
                <Clock3 size={20} />
              </div>
              <div>
                <span>Under review</span>
                <strong>
                  {loading ? "—" : countStatus("Under review")}
                </strong>
              </div>
            </div>

            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon shortlisted">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span>Shortlisted</span>
                <strong>
                  {loading ? "—" : countStatus("Shortlisted")}
                </strong>
              </div>
            </div>

            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon interview">
                <CalendarDays size={20} />
              </div>
              <div>
                <span>Hired</span>
                <strong>{loading ? "—" : countStatus("Hired")}</strong>
              </div>
            </div>
          </div>

          <section className="professional-applications-list-section">
            <div className="professional-applications-list-heading">
              <div>
                <h2>Application history</h2>
                <p>Review the applications you have submitted.</p>
              </div>
              <span className="professional-applications-results">
                {loading ? "Loading..." : `${filteredApplications.length} results`}
              </span>
            </div>

            <div className="professional-applications-toolbar">
              <div className="professional-applications-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search job title, company or location..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search applications"
                />
              </div>

              <div className="professional-applications-filter-label">
                <Filter size={17} />
                Filter:
              </div>

              <div className="professional-applications-filters">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={activeFilter === filter ? "active" : ""}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="professional-applications-list">
              {loading ? (
                <div className="professional-applications-empty">
                  <div>
                    <Clock3 size={26} />
                  </div>
                  <h3>Loading your applications</h3>
                  <p>Please wait while we retrieve your application history.</p>
                </div>
              ) : error ? (
                <div className="professional-applications-empty">
                  <div>
                    <XCircle size={26} />
                  </div>
                  <h3>Unable to load applications</h3>
                  <p>{error}</p>
                  <button type="button" onClick={() => void loadApplications()}>
                    Try again
                  </button>
                </div>
              ) : filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <article
                    className="professional-application-card"
                    key={application.id}
                  >
                    <div className="professional-application-company-icon">
                      {application.company.charAt(0).toUpperCase()}
                    </div>

                    <div className="professional-application-details">
                      <div className="professional-application-title-row">
                        <div>
                          <h3>{application.role}</h3>
                          <span>{application.company}</span>
                        </div>

                        <div
                          className={`professional-application-status ${application.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          <StatusIcon status={application.status} />
                          {application.status}
                        </div>
                      </div>

                      <div className="professional-application-meta">
                        <span>
                          <MapPin size={15} />
                          {application.location}
                        </span>
                        <span>
                          <BriefcaseBusiness size={15} />
                          {application.type}
                        </span>
                        <span>
                          <CalendarDays size={15} />
                          Applied {application.applied}
                        </span>
                      </div>

                      <div className="professional-application-bottom">
                        <strong>{application.salary}</strong>
                        <button
                          type="button"
                          onClick={() => setSelectedApplication(application)}
                        >
                          View details <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="professional-applications-empty">
                  <div>
                    <Search size={26} />
                  </div>
                  <h3>
                    {applications.length === 0
                      ? "No applications yet"
                      : "No applications found"}
                  </h3>
                  <p>
                    {applications.length === 0
                      ? "When you apply for an approved vacancy, your application will appear here."
                      : "Try changing your search or selecting another status."}
                  </p>
                  {applications.length === 0 ? (
                    <Link href="/professional/opportunities">
                      Find opportunities <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveFilter("All");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {selectedApplication && (
        <div
          className="professional-application-modal-overlay"
          onClick={() => setSelectedApplication(null)}
        >
          <section
            className="professional-application-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="professional-application-modal-close"
              onClick={() => setSelectedApplication(null)}
              aria-label="Close details"
            >
              <XCircle size={22} />
            </button>

            <span className="professional-applications-eyebrow">
              APPLICATION DETAILS
            </span>
            <h2>{selectedApplication.role}</h2>
            <p className="professional-application-modal-company">
              {selectedApplication.company}
            </p>

            <div
              className={`professional-application-status ${selectedApplication.status
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              <StatusIcon status={selectedApplication.status} />
              {selectedApplication.status}
            </div>

            <div className="professional-application-modal-info">
              <div>
                <MapPin size={17} />
                <span>{selectedApplication.location}</span>
              </div>
              <div>
                <BriefcaseBusiness size={17} />
                <span>{selectedApplication.type}</span>
              </div>
              <div>
                <CalendarDays size={17} />
                <span>Applied {selectedApplication.applied}</span>
              </div>
            </div>

            <div className="professional-application-modal-description">
              <h3>Job description</h3>
              <p>{selectedApplication.description}</p>
            </div>

            <div className="professional-application-modal-salary">
              <span>Salary listed</span>
              <strong>{selectedApplication.salary}</strong>
            </div>

            {selectedApplication.coverLetter && (
              <div className="professional-application-modal-description">
                <h3>Your cover letter</h3>
                <p>{selectedApplication.coverLetter}</p>
              </div>
            )}

            <div className="professional-application-modal-salary">
              <span>CV submitted</span>
              <strong>
                {selectedApplication.hasCv ? "Yes" : "No CV recorded"}
              </strong>
            </div>

            <button
              type="button"
              className="professional-application-modal-done"
              onClick={() => setSelectedApplication(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
