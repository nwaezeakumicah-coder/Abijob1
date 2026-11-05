"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import Logo from "../../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./applicant-detail.css";

type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

type ApplicantDetails = {
  id: string;
  applicantId: string;
  jobId: string;
  name: string;
  headline: string;
  skills: string[];
  experience: string;
  location: string;
  coverLetter: string;
  cvUrl: string | null;
  cvPath: string | null;
  status: ApplicationStatus;
  createdAt: string;
  jobTitle: string;
};

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

function formatDate(value: string) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatExperience(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "number") {
    return value === 1 ? "1 year" : `${value} years`;
  }

  return String(value);
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "A"
  );
}

export default function EmployerApplicantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.id || "");

  const supabase = useMemo(() => createClient(), []);

  const [applicant, setApplicant] =
    useState<ApplicantDetails | null>(null);
  const [companyName, setCompanyName] = useState("Your company");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus>("submitted");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplicant = useCallback(
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
          router.replace(
            `/login?redirect=/employer/applicants/${applicationId}`
          );
          return;
        }

        const { data: account, error: accountError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (accountError || account?.role !== "employer") {
          router.replace("/dashboard");
          return;
        }

        const { data: employerProfile } = await supabase
          .from("employer_profiles")
          .select("business_name")
          .eq("id", user.id)
          .maybeSingle();

        setCompanyName(
          employerProfile?.business_name || "Your company"
        );

        if (!applicationId) {
          throw new Error("The application ID is missing.");
        }

        const { data: application, error: applicationError } =
          await supabase
            .from("job_applications")
            .select(
              "id, job_id, applicant_id, cover_letter, cv_path, status, created_at"
            )
            .eq("id", applicationId)
            .single();

        if (applicationError || !application) {
          throw new Error(
            "This application could not be found or you do not have permission to view it."
          );
        }

        // Verify that the application belongs to this employer's job.
        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .select("id, title, employer_id")
          .eq("id", application.job_id)
          .eq("employer_id", user.id)
          .single();

        if (jobError || !job) {
          throw new Error(
            "You are not authorised to view this applicant."
          );
        }

        // Other users' profile details may be restricted by profile RLS.
        // If access is denied, the application remains viewable with fallbacks.
        const { data: applicantProfile } = await supabase
          .from("profiles")
          .select("id, full_name, headline, skills, experience, location")
          .eq("id", application.applicant_id)
          .maybeSingle();

        let cvUrl: string | null = null;

        if (application.cv_path) {
          const { data: signedFile } = await supabase.storage
            .from("abi-job-profile-files")
            .createSignedUrl(application.cv_path, 300);

          cvUrl = signedFile?.signedUrl || null;
        }

        const rawSkills = applicantProfile?.skills;

        const skills = Array.isArray(rawSkills)
          ? rawSkills.map(String).filter(Boolean)
          : typeof rawSkills === "string"
            ? rawSkills
                .split(",")
                .map((skill: string) => skill.trim())
                .filter(Boolean)
            : [];

        const name =
          applicantProfile?.full_name || "Abi Job Applicant";

        const status = application.status as ApplicationStatus;

        const details: ApplicantDetails = {
          id: application.id,
          applicantId: application.applicant_id,
          jobId: application.job_id,
          name,
          headline: applicantProfile?.headline || "Job applicant",
          skills,
          experience: formatExperience(
            applicantProfile?.experience
          ),
          location: applicantProfile?.location || "Not provided",
          coverLetter: application.cover_letter || "",
          cvUrl,
          cvPath: application.cv_path || null,
          status,
          createdAt: application.created_at,
          jobTitle: job.title || "Job vacancy",
        };

        setApplicant(details);
        setSelectedStatus(status);
      } catch (err) {
        console.error("Applicant details loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load applicant details. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applicationId, router, supabase]
  );

  useEffect(() => {
    loadApplicant();
  }, [loadApplicant]);

  const updateStatus = async () => {
    if (!applicant) return;

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: selectedStatus })
        .eq("id", applicant.id);

      if (updateError) throw updateError;

      setApplicant((current) =>
        current
          ? { ...current, status: selectedStatus }
          : current
      );

      setSuccess("Application status updated successfully.");
    } catch (err) {
      console.error("Applicant status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not update the application status."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="applicant-detail-page">
        <div className="applicant-detail-loading">
          <LoaderCircle size={34} className="animate-spin" />
          <p>Loading applicant details...</p>
        </div>
      </main>
    );
  }

  if (!applicant) {
    return (
      <main className="applicant-detail-page">
        <div className="applicant-detail-error-state">
          <XCircle size={36} />
          <h1>Applicant details unavailable</h1>
          <p>{error || "This application could not be loaded."}</p>
          <Link href="/employer/applicants">
            <ArrowLeft size={16} />
            Back to applicants
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="applicant-detail-page">
      <aside className="applicant-detail-sidebar">
        <div className="applicant-detail-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="applicant-detail-company">
          <div className="applicant-detail-company-icon">
            <Building2 size={21} />
          </div>
          <div>
            <strong>{companyName}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="applicant-detail-nav-label">WORKSPACE</p>

        <nav className="applicant-detail-nav">
          <Link href="/employer/dashboard">
            <BriefcaseBusiness size={18} />
            Overview
          </Link>
          <Link href="/employer/jobs">
            <FileText size={18} />
            My job posts
          </Link>
          <Link href="/employer/applicants" className="active">
            <UserRound size={18} />
            Applicants
          </Link>
          <Link href="/employer/messages">
            <MessageCircle size={18} />
            Messages
          </Link>
          <Link href="/employer/notifications">
            <CalendarDays size={18} />
            Notifications
          </Link>
          <Link href="/employer/profile">
            <Building2 size={18} />
            Company profile
          </Link>
        </nav>

        <div className="applicant-detail-sidebar-bottom">
          <div className="applicant-detail-privacy">
            <ShieldCheck size={20} />
            <strong>Protect candidate privacy</strong>
            <p>
              Keep applicant information confidential and secure.
            </p>
          </div>

          <Link href="/" className="applicant-detail-back-home">
            <ArrowLeft size={16} />
            Back to Abi Job
          </Link>
        </div>
      </aside>

      <section className="applicant-detail-main">
        <header className="applicant-detail-topbar">
          <div>
            <span>EMPLOYER WORKSPACE</span>
            <p>Applicant review</p>
          </div>

          <div className="applicant-detail-topbar-company">
            <Building2 size={18} />
            <span>{companyName}</span>
          </div>
        </header>

        <div className="applicant-detail-content">
          <Link
            href="/employer/applicants"
            className="applicant-detail-back-link"
          >
            <ArrowLeft size={17} />
            Back to applicants
          </Link>

          {error && (
            <div className="applicant-detail-alert error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div
              className="applicant-detail-alert success"
              role="status"
            >
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          <div className="applicant-detail-heading">
            <div>
              <span className="applicant-detail-kicker">
                CANDIDATE PROFILE
              </span>
              <h1>Applicant details</h1>
              <p>
                Review this candidate's application and recruitment status.
              </p>
            </div>

            <button
              type="button"
              className="applicant-detail-refresh"
              onClick={() => loadApplicant(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <section className="applicant-detail-profile-card">
            <div className="applicant-detail-avatar">
              {getInitials(applicant.name)}
            </div>

            <div className="applicant-detail-identity">
              <h2>{applicant.name}</h2>
              <p>{applicant.headline}</p>

              <div className="applicant-detail-identity-meta">
                <span>
                  <MapPin size={14} />
                  {applicant.location}
                </span>
                <span>
                  <CalendarDays size={14} />
                  Applied {formatDate(applicant.createdAt)}
                </span>
              </div>
            </div>

            <span
              className={`applicant-detail-status ${applicant.status}`}
            >
              {applicant.status === "shortlisted" ||
              applicant.status === "hired" ? (
                <CheckCircle2 size={15} />
              ) : applicant.status === "rejected" ||
                applicant.status === "withdrawn" ? (
                <XCircle size={15} />
              ) : (
                <Clock3 size={15} />
              )}
              {statusLabels[applicant.status] || "Application"}
            </span>
          </section>

          <div className="applicant-detail-grid">
            <div className="applicant-detail-primary">
              <section className="applicant-detail-card">
                <div className="applicant-detail-card-heading">
                  <div>
                    <span>APPLICATION</span>
                    <h2>Job applied for</h2>
                  </div>
                  <BriefcaseBusiness size={21} />
                </div>

                <h3 className="applicant-detail-job-title">
                  {applicant.jobTitle}
                </h3>
                <p className="applicant-detail-muted">
                  Application reference: {applicant.id}
                </p>
              </section>

              <section className="applicant-detail-card">
                <div className="applicant-detail-card-heading">
                  <div>
                    <span>BACKGROUND</span>
                    <h2>Skills and experience</h2>
                  </div>
                  <UserRound size={21} />
                </div>

                <div className="applicant-detail-info-row">
                  <span>Experience</span>
                  <strong>{applicant.experience}</strong>
                </div>

                <div className="applicant-detail-info-row">
                  <span>Location</span>
                  <strong>{applicant.location}</strong>
                </div>

                <div className="applicant-detail-skills">
                  <h3>Skills</h3>
                  {applicant.skills.length > 0 ? (
                    <div className="applicant-detail-skill-list">
                      {applicant.skills.map((skill, index) => (
                        <span key={`${skill}-${index}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="applicant-detail-muted">
                      Skills have not been provided or are not available
                      to this employer account.
                    </p>
                  )}
                </div>
              </section>

              <section className="applicant-detail-card">
                <div className="applicant-detail-card-heading">
                  <div>
                    <span>APPLICATION MESSAGE</span>
                    <h2>Cover letter</h2>
                  </div>
                  <FileText size={21} />
                </div>

                {applicant.coverLetter ? (
                  <p className="applicant-detail-cover-letter">
                    {applicant.coverLetter}
                  </p>
                ) : (
                  <p className="applicant-detail-muted">
                    This applicant did not include a cover letter.
                  </p>
                )}
              </section>
            </div>

            <aside className="applicant-detail-secondary">
              <section className="applicant-detail-card">
                <div className="applicant-detail-card-heading">
                  <div>
                    <span>RECRUITMENT</span>
                    <h2>Update status</h2>
                  </div>
                  <CheckCircle2 size={21} />
                </div>

                <label className="applicant-detail-field-label">
                  Application status
                </label>

                <div className="applicant-detail-status-select">
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(
                        event.target.value as ApplicationStatus
                      )
                    }
                    disabled={
                      updating || applicant.status === "withdrawn"
                    }
                  >
                    {statusOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </div>

                {applicant.status === "withdrawn" ? (
                  <p className="applicant-detail-muted">
                    Withdrawn applications cannot be changed here.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="applicant-detail-primary-button"
                    onClick={updateStatus}
                    disabled={
                      updating ||
                      selectedStatus === applicant.status
                    }
                  >
                    {updating ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2 size={17} />
                    )}
                    Save status
                  </button>
                )}
              </section>

              <section className="applicant-detail-card">
                <div className="applicant-detail-card-heading">
                  <div>
                    <span>DOCUMENTS</span>
                    <h2>Curriculum Vitae</h2>
                  </div>
                  <FileText size={21} />
                </div>

                {applicant.cvUrl ? (
                  <>
                    <p className="applicant-detail-muted">
                      The applicant provided a CV with this application.
                    </p>
                    <a
                      href={applicant.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="applicant-detail-primary-button"
                    >
                      <ExternalLink size={17} />
                      Open CV
                    </a>
                    <a
                      href={applicant.cvUrl}
                      download
                      className="applicant-detail-download-link"
                    >
                      <Download size={16} />
                      Download CV
                    </a>
                  </>
                ) : (
                  <p className="applicant-detail-muted">
                    No CV is attached to this application, or the file
                    is currently unavailable.
                  </p>
                )}
              </section>

              <section className="applicant-detail-message-card">
                <MessageCircle size={23} />
                <h2>Contact this applicant</h2>
                <p>
                  Continue the conversation about this application through
                  Abi Job Messages.
                </p>
                <Link href="/employer/messages">
                  Open messages
                  <ArrowLeft size={15} />
                </Link>
              </section>
            </aside>
          </div>

          <div className="applicant-detail-confidential">
            <ShieldCheck size={18} />
            <p>
              Applicant information is confidential. Use it only for
              legitimate recruitment activities within your organisation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}