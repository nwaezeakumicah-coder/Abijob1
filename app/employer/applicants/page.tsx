
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Filter,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  Users,
  XCircle,
  Bell,
  LoaderCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import Logo from "../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./applicants.css";

type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

type Applicant = {
  id: string;
  jobId: string;
  applicantId: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  role: string;
  skills: string;
  experience: string;
  location: string;
  professionalTitle: string;
  date: string;
  status: ApplicationStatus;
  coverLetter: string;
  cvPath: string | null;
};

type ApplicantProfile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  skills: string[] | null;
  experience: string | null;
  location: string | null;
};

const CV_BUCKET = "abi-job-profile-files";

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Pending",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

const statusOptions: {
  value: ApplicationStatus;
  label: string;
}[] = [
  { value: "submitted", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const statusTabs = [
  "All applicants",
  "Pending",
  "Under review",
  "Shortlisted",
  "Rejected",
  "Hired",
  "Withdrawn",
];

function isApplicationStatus(value: string): value is ApplicationStatus {
  return [
    "submitted",
    "under_review",
    "shortlisted",
    "rejected",
    "hired",
    "withdrawn",
  ].includes(value);
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "AJ"
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatExperience(value: string | null) {
  return value?.trim() || "Experience not specified";
}

function normaliseSkills(
  snapshotSkills: string | null | undefined,
  profileSkills: string[] | null | undefined
) {
  if (snapshotSkills?.trim()) return snapshotSkills.trim();

  if (Array.isArray(profileSkills) && profileSkills.length > 0) {
    return profileSkills.join(", ");
  }

  return "Skills not provided";
}

export default function EmployerApplicantsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [companyName, setCompanyName] = useState("Your Company");
  const [activeStatus, setActiveStatus] = useState("All applicants");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState("All jobs");
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplicants = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          window.location.href =
            "/login?redirect=%2Femployer%2Fapplicants";
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

        if (profile.role !== "employer") {
          if (profile.role === "job_seeker") {
            window.location.href = "/dashboard";
          } else if (profile.role === "professional") {
            window.location.href = "/professional/dashboard";
          } else if (profile.role === "admin") {
            window.location.href = "/admin";
          } else {
            window.location.href = "/login";
          }
          return;
        }

        // employer_profiles is keyed by user_id.
        const { data: employerProfile, error: employerProfileError } =
          await supabase
            .from("employer_profiles")
            .select("business_name")
            .eq("user_id", user.id)
            .maybeSingle();

        if (employerProfileError) {
          console.error(
            "Employer profile lookup:",
            employerProfileError.message
          );
        }

        setCompanyName(
          employerProfile?.business_name?.trim() || "Your Company"
        );

        // RLS ensures that this query returns only this employer's jobs.
        const { data: jobData, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title")
          .eq("employer_id", user.id)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        const employerJobs = jobData || [];
        setJobs(employerJobs);

        if (employerJobs.length === 0) {
          setApplicants([]);
          return;
        }

        const jobIds = employerJobs.map((job) => job.id);

        // Applications are restricted to the employer's own job IDs.
        const { data: applicationData, error: applicationsError } =
          await supabase
            .from("job_applications")
            .select(
              `
                id,
                job_id,
                applicant_id,
                cover_letter,
                cv_path,
                status,
                created_at,
                applicant_name,
                applicant_email,
                applicant_phone,
                applicant_location,
                applicant_title,
                applicant_experience,
                applicant_skills
              `
            )
            .in("job_id", jobIds)
            .order("created_at", { ascending: false });

        if (applicationsError) throw applicationsError;

        const applications = applicationData || [];

        if (applications.length === 0) {
          setApplicants([]);
          return;
        }

        // Older applications may not have snapshot values. Use the
        // approved SECURITY DEFINER RPC as a fallback instead of querying
        // other users' profiles directly and violating profiles RLS.
        const applicantIds = [
          ...new Set(applications.map((item) => item.applicant_id)),
        ];

        const { data: applicantProfiles, error: applicantProfilesError } =
          await supabase.rpc("get_employer_applicant_profiles", {
            p_applicant_ids: applicantIds,
          });

        if (applicantProfilesError) {
          console.error(
            "Secure applicant profile lookup:",
            applicantProfilesError.message
          );
        }

        const profileMap = new Map<string, ApplicantProfile>(
          ((applicantProfiles || []) as ApplicantProfile[]).map((item) => [
            item.id,
            item,
          ])
        );

        const jobMap = new Map(
          employerJobs.map((item) => [item.id, item.title])
        );

        const mappedApplicants: Applicant[] = applications.map(
          (application) => {
            const applicantProfile = profileMap.get(
              application.applicant_id
            );

            const name =
              application.applicant_name?.trim() ||
              applicantProfile?.full_name?.trim() ||
              "Abijob Applicant";

            const statusValue = String(application.status || "submitted");

            const status: ApplicationStatus = isApplicationStatus(
              statusValue
            )
              ? statusValue
              : "submitted";

            const profileSkills = applicantProfile?.skills || [];

            const snapshotSkills =
              application.applicant_skills ||
              (Array.isArray(profileSkills)
                ? profileSkills.join(", ")
                : "");

            return {
              id: application.id,
              jobId: application.job_id,
              applicantId: application.applicant_id,
              name,
              email: application.applicant_email || "",
              phone: application.applicant_phone || "",
              initials: getInitials(name),
              role: jobMap.get(application.job_id) || "Job vacancy",
              skills: normaliseSkills(
                snapshotSkills,
                profileSkills
              ),
              experience: formatExperience(
                application.applicant_experience ||
                  applicantProfile?.experience ||
                  null
              ),
              location:
                application.applicant_location?.trim() ||
                applicantProfile?.location?.trim() ||
                "Location not provided",
              professionalTitle:
                application.applicant_title?.trim() ||
                applicantProfile?.headline?.trim() ||
                "",
              date: formatDate(application.created_at),
              status,
              coverLetter: application.cover_letter || "",
              cvPath: application.cv_path,
            };
          }
        );

        setApplicants(mappedApplicants);
      } catch (err) {
        console.error("Employer applicants loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load applicants. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      const matchesStatus =
        activeStatus === "All applicants" ||
        statusLabels[applicant.status] === activeStatus;

      const matchesJob =
        selectedJob === "All jobs" ||
        applicant.jobId === selectedJob;

      const search = searchTerm.trim().toLowerCase();

      const searchableText = [
        applicant.name,
        applicant.email,
        applicant.phone,
        applicant.skills,
        applicant.role,
        applicant.location,
        applicant.professionalTitle,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      return matchesStatus && matchesJob && matchesSearch;
    });
  }, [applicants, activeStatus, selectedJob, searchTerm]);

  const countStatus = (status: string) =>
    applicants.filter(
      (applicant) =>
        status === "All applicants" ||
        statusLabels[applicant.status] === status
    ).length;

  const updateStatus = async (
    applicant: Applicant,
    nextStatus: ApplicationStatus
  ) => {
    if (applicant.status === "withdrawn") {
      setError("A withdrawn application cannot be changed by the employer.");
      return;
    }

    if (applicant.status === nextStatus) return;

    setUpdatingId(applicant.id);
    setError("");
    setSuccess("");

    try {
      const { data, error: updateError } = await supabase
        .from("job_applications")
        .update({ status: nextStatus })
        .eq("id", applicant.id)
        .eq("job_id", applicant.jobId)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;

      if (!data) {
        throw new Error(
          "The application could not be updated. Confirm that this vacancy belongs to your employer account and try again."
        );
      }

      setApplicants((previous) =>
        previous.map((item) =>
          item.id === applicant.id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      setSuccess(
        `Application status changed to ${statusLabels[nextStatus]}.`
      );
    } catch (err) {
      console.error("Applicant status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not update applicant status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openCv = async (applicant: Applicant) => {
    if (!applicant.cvPath || openingCvId) return;

    setOpeningCvId(applicant.id);
    setError("");
    setSuccess("");

    // Open a tab synchronously during the click so the browser is less
    // likely to block it while the signed URL is being requested.
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      setError(
        "Your browser blocked the CV window. Please allow pop-ups for Abijob and try again."
      );
      setOpeningCvId(null);
      return;
    }

    try {
      newTab.opener = null;

      const { data, error: signedUrlError } = await supabase.storage
        .from(CV_BUCKET)
        .createSignedUrl(applicant.cvPath, 300);

      if (signedUrlError || !data?.signedUrl) {
        throw new Error(
          signedUrlError?.message ||
            "A secure CV link could not be created."
        );
      }

      newTab.location.href = data.signedUrl;
    } catch (err) {
      newTab.close();

      console.error("Applicant CV access error:", err);

      setError(
        err instanceof Error
          ? `Unable to open this CV: ${err.message}`
          : "Unable to open this CV. Please try again."
      );
    } finally {
      setOpeningCvId(null);
    }
  };

  if (loading) {
    return (
      <main className="employer-applicants-page">
        <div className="application-loading">
          <LoaderCircle size={34} className="animate-spin" />
          <p>Loading your applicants...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="employer-applicants-page">
      <aside className="applicants-sidebar">
        <div className="applicants-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="applicants-company">
          <div className="applicants-company-icon">
            <Building2 size={21} />
          </div>
          <div>
            <strong>{companyName}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="applicants-nav-label">WORKSPACE</p>

        <nav className="applicants-nav">
          <Link href="/employer/dashboard">
            <BriefcaseBusiness size={18} />
            <span>Overview</span>
          </Link>

          <Link href="/employer/jobs">
            <FileText size={18} />
            <span>My job posts</span>
          </Link>

          <Link href="/employer/applicants" className="active">
            <Users size={18} />
            <span>Applicants</span>
            <span className="applicants-nav-count">
              {applicants.length}
            </span>
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

        <p className="applicants-nav-label applicants-settings-label">
          PREFERENCES
        </p>

        <nav className="applicants-nav">
          <Link href="/employer/settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="applicants-sidebar-bottom">
          <div className="applicants-help-card">
            <div className="applicants-help-icon">
              <Users size={19} />
            </div>
            <strong>Need a hand?</strong>
            <p>
              Get help with reviewing candidates and managing recruitment.
            </p>
            <Link href="/support">Visit help centre →</Link>
          </div>

          <Link href="/" className="applicants-back-link">
            <ArrowLeft size={16} />
            Back to Abijob
          </Link>
        </div>
      </aside>

      <section className="applicants-main">
        <header className="applicants-topbar">
          <div>
            <span>EMPLOYER WORKSPACE</span>
            <p>Find the right people for your team</p>
          </div>

          <div className="applicants-topbar-account">
            <div className="applicants-account-icon">
              <Building2 size={18} />
            </div>
            <div>
              <strong>{companyName}</strong>
              <small>Employer</small>
            </div>
            <ChevronDown size={16} />
          </div>
        </header>

        <div className="applicants-content">
          <div className="applicants-heading">
            <div>
              <span className="applicants-kicker">
                TALENT MANAGEMENT
              </span>
              <h1>Applicants</h1>
              <p>
                Review applications, discover talent and manage your
                recruitment pipeline.
              </p>
            </div>

            <div className="applicants-heading-actions">
              <button
                type="button"
                className="applicants-refresh-button"
                onClick={() => loadApplicants(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <Link
                href="/employer/jobs"
                className="applicants-view-jobs"
              >
                <BriefcaseBusiness size={17} />
                Manage job posts
              </Link>
            </div>
          </div>

          {error && (
            <div className="application-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div
              className="applicants-success-message"
              role="status"
            >
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          <div className="applicants-stats">
            <div className="applicant-stat-card">
              <div className="applicant-stat-icon green">
                <Users size={21} />
              </div>
              <div>
                <span>Total applicants</span>
                <strong>{applicants.length}</strong>
                <small>Across all job posts</small>
              </div>
            </div>

            <div className="applicant-stat-card">
              <div className="applicant-stat-icon yellow">
                <Clock3 size={21} />
              </div>
              <div>
                <span>Pending review</span>
                <strong>{countStatus("Pending")}</strong>
                <small>Awaiting your attention</small>
              </div>
            </div>

            <div className="applicant-stat-card">
              <div className="applicant-stat-icon blue">
                <CheckCircle2 size={21} />
              </div>
              <div>
                <span>Shortlisted</span>
                <strong>{countStatus("Shortlisted")}</strong>
                <small>Potential candidates</small>
              </div>
            </div>

            <div className="applicant-stat-card">
              <div className="applicant-stat-icon purple">
                <CalendarDays size={21} />
              </div>
              <div>
                <span>Hired</span>
                <strong>{countStatus("Hired")}</strong>
                <small>Successful candidates</small>
              </div>
            </div>
          </div>

          <section className="applicants-management-card">
            <div className="applicants-card-heading">
              <div>
                <h2>Application pipeline</h2>
                <p>
                  Review and manage candidates who applied to your jobs.
                </p>
              </div>
              <span className="applicants-total-label">
                {filteredApplicants.length} results
              </span>
            </div>

            <div className="applicants-filters">
              <div className="applicants-status-tabs">
                {statusTabs.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={
                      activeStatus === status ? "selected" : ""
                    }
                    onClick={() => setActiveStatus(status)}
                  >
                    {status}
                    <span>{countStatus(status)}</span>
                  </button>
                ))}
              </div>

              <div className="applicants-filter-row">
                <div className="applicants-search">
                  <Search size={17} />
                  <input
                    type="search"
                    placeholder="Search by name, skill, job or location..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                  />
                </div>

                <label className="applicants-job-filter">
                  <Filter size={16} />
                  <select
                    value={selectedJob}
                    onChange={(event) =>
                      setSelectedJob(event.target.value)
                    }
                    aria-label="Filter applicants by job"
                  >
                    <option value="All jobs">All jobs</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
            </div>

            <div className="applicants-list">
              {filteredApplicants.map((applicant) => (
                <article
                  className="applicant-row"
                  key={applicant.id}
                >
                  <div className="applicant-avatar green">
                    {applicant.initials}
                  </div>

                  <div className="applicant-details">
                    <div className="applicant-name-line">
                      <h3>{applicant.name}</h3>

                      <span
                        className={`applicant-status ${applicant.status}`}
                      >
                        {applicant.status === "submitted" && (
                          <Clock3 size={12} />
                        )}
                        {applicant.status === "under_review" && (
                          <Eye size={12} />
                        )}
                        {applicant.status === "shortlisted" && (
                          <CheckCircle2 size={12} />
                        )}
                        {applicant.status === "rejected" && (
                          <XCircle size={12} />
                        )}
                        {applicant.status === "hired" && (
                          <CheckCircle2 size={12} />
                        )}
                        {applicant.status === "withdrawn" && (
                          <XCircle size={12} />
                        )}
                        {statusLabels[applicant.status]}
                      </span>
                    </div>

                    {applicant.professionalTitle && (
                      <strong className="applicant-job-title">
                        {applicant.professionalTitle}
                      </strong>
                    )}

                    <strong className="applicant-job-title">
                      Applied for: {applicant.role}
                    </strong>

                    <p className="applicant-skills">
                      {applicant.skills}
                    </p>

                    <div className="applicant-meta">
                      <span>{applicant.experience}</span>
                      <span>
                        <MapPin size={12} />
                        {applicant.location}
                      </span>
                      <span>
                        <CalendarDays size={12} />
                        {applicant.date}
                      </span>
                    </div>

                    {(applicant.email || applicant.phone) && (
                      <div className="applicant-meta">
                        {applicant.email && (
                          <span>{applicant.email}</span>
                        )}
                        {applicant.phone && (
                          <span>{applicant.phone}</span>
                        )}
                      </div>
                    )}

                    {applicant.coverLetter && (
                      <details className="applicant-cover-letter">
                        <summary>Read cover letter</summary>
                        <p>{applicant.coverLetter}</p>
                      </details>
                    )}
                  </div>

                  <div className="applicant-actions">
                    <Link
                      href={`/employer/applicants/${applicant.id}`}
                      className="applicant-view-button"
                    >
                      <Eye size={15} />
                      View details
                    </Link>

                    {applicant.cvPath && (
                      <button
                        type="button"
                        className="applicant-view-button"
                        onClick={() => openCv(applicant)}
                        disabled={openingCvId === applicant.id}
                      >
                        {openingCvId === applicant.id ? (
                          <LoaderCircle
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <FileText size={15} />
                        )}
                        {openingCvId === applicant.id
                          ? "Opening..."
                          : "View CV"}
                        <ExternalLink size={13} />
                      </button>
                    )}

                    <label className="applicant-status-select">
                      <span className="sr-only">
                        Change status for {applicant.name}
                      </span>

                      <select
                        value={applicant.status}
                        disabled={
                          updatingId === applicant.id ||
                          applicant.status === "withdrawn"
                        }
                        onChange={(event) => {
                          const nextStatus = event.target.value;

                          if (isApplicationStatus(nextStatus)) {
                            updateStatus(applicant, nextStatus);
                          }
                        }}
                        aria-label={`Change status for ${applicant.name}`}
                      >
                        {applicant.status === "withdrawn" && (
                          <option value="withdrawn">Withdrawn</option>
                        )}

                        {statusOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {updatingId === applicant.id ? (
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </label>
                  </div>
                </article>
              ))}

              {filteredApplicants.length === 0 && (
                <div className="applicants-empty">
                  <Search size={27} />
                  <strong>
                    {applicants.length === 0
                      ? "No applications yet"
                      : "No applicants found"}
                  </strong>
                  <p>
                    {applicants.length === 0
                      ? "Applications received for your job posts will appear here."
                      : "Try changing your search or filter settings."}
                  </p>

                  {applicants.length === 0 && (
                    <Link href="/employer/jobs">
                      View your job posts
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="applicants-list-footer">
              <span>
                Showing <strong>{filteredApplicants.length}</strong> of{" "}
                <strong>{applicants.length}</strong> applicants
              </span>
            </div>
          </section>

          <div className="applicants-note">
            <CheckCircle2 size={17} />
            <p>
              Keep candidate information confidential. Only authorised
              members of your organisation should access applicant details.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
