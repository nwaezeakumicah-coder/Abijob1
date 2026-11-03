
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../../../components/Logo";
import { createClient } from "../../../../lib/supabase/client";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  BriefcaseBusiness,
  GraduationCap,
  CalendarDays,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  UserRound,
  Award,
  ShieldCheck,
  Users,
  Settings,
  Building2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import "./applicant-details.css";

type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

type ApplicationRecord = {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  cv_path: string | null;
  status: ApplicationStatus;
  created_at: string;
};

type JobRecord = {
  id: string;
  employer_id: string;
  title: string;
  location: string | null;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  about: string | null;
  skills: string[] | null;
  experience: string | null;
  education: string | null;
  cv_path: string | null;
};

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Pending",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ApplicantDetailsClient() {
  const router = useRouter();
  const supabase = createClient();

  const [applicationId, setApplicationId] = useState("");

  const [application, setApplication] =
    useState<ApplicationRecord | null>(null);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [applicant, setApplicant] =
    useState<ProfileRecord | null>(null);

  const [cvUrl, setCvUrl] = useState("");
  const [status, setStatus] =
    useState<ApplicationStatus>("submitted");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const segments = window.location.pathname
      .split("/")
      .filter(Boolean);

    setApplicationId(segments[segments.length - 1] ?? "");
  }, []);

  const loadApplicant = useCallback(async () => {
    if (!applicationId) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: account, error: accountError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (accountError || account?.role !== "employer") {
        if (account?.role === "job_seeker") {
          router.replace("/dashboard");
        } else if (account?.role === "professional") {
          router.replace("/professional/dashboard");
        } else if (account?.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/login");
        }

        return;
      }

      const { data: applicationData, error: applicationError } =
        await supabase
          .from("job_applications")
          .select(
            "id, job_id, applicant_id, cover_letter, cv_path, status, created_at"
          )
          .eq("id", applicationId)
          .single();

      if (applicationError || !applicationData) {
        throw new Error(
          "This application could not be found or is no longer available."
        );
      }

      const applicationRecord =
        applicationData as ApplicationRecord;

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id, employer_id, title, location")
        .eq("id", applicationRecord.job_id)
        .single();

      if (
        jobError ||
        !jobData ||
        jobData.employer_id !== user.id
      ) {
        throw new Error(
          "You are not authorised to view this applicant."
        );
      }

      const jobRecord = jobData as JobRecord;

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, location, headline, about, skills, experience, education, cv_path"
        )
        .eq("id", applicationRecord.applicant_id)
        .maybeSingle();

      const profileRecord = profileData as
        | ProfileRecord
        | null;

      const filePath =
        applicationRecord.cv_path || profileRecord?.cv_path;

      if (filePath) {
        const { data: signedFile } = await supabase.storage
          .from("abi-job-profile-files")
          .createSignedUrl(filePath, 300);

        if (signedFile?.signedUrl) {
          setCvUrl(signedFile.signedUrl);
        } else {
          setCvUrl("");
        }
      } else {
        setCvUrl("");
      }

      setApplication(applicationRecord);
      setJob(jobRecord);
      setApplicant(profileRecord);
      setStatus(applicationRecord.status);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading this application."
      );
    } finally {
      setLoading(false);
    }
  }, [applicationId, router, supabase]);

  useEffect(() => {
    if (applicationId) {
      loadApplicant();
    }
  }, [applicationId, loadApplicant]);

  async function updateStatus(nextStatus: ApplicationStatus) {
    if (!application) return;

    setUpdating(true);
    setNotice("");
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: nextStatus })
        .eq("id", application.id);

      if (updateError) {
        throw updateError;
      }

      setStatus(nextStatus);
      setApplication({
        ...application,
        status: nextStatus,
      });

      setNotice(
        `Application status successfully updated to ${statusLabels[nextStatus]}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the application status."
      );
    } finally {
      setUpdating(false);
    }
  }

  const applicantName =
    applicant?.full_name || "Applicant";

  const initials = applicantName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AP";

  const skills = applicant?.skills || [];

  if (loading) {
    return (
      <main className="applicant-details-page">
        <div className="applicant-details-container">
          <div className="applicant-loading">
            <RefreshCw size={25} className="loading-spinner" />
            <p>Loading applicant information...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !application) {
    return (
      <main className="applicant-details-page">
        <div className="applicant-details-container">
          <Link
            href="/employer/applicants"
            className="applicant-back-link"
          >
            <ArrowLeft size={18} />
            Back to applicants
          </Link>

          <div className="applicant-error">
            <XCircle size={24} />
            <h2>Unable to load application</h2>
            <p>{error}</p>

            <button
              type="button"
              onClick={loadApplicant}
              className="applicant-refresh-button"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!application || !job) return null;

  return (
    <>
      <header
        className="applicant-details-workspace-header"
        style={{
          background: "#103c2b",
          color: "#ffffff",
          minHeight: "76px",
          padding: "12px 5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <Logo href="/employer/dashboard" size="medium" light />

        <nav
          aria-label="Employer workspace navigation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/employer/dashboard" style={{ color: "#ffffff", textDecoration: "none" }}>
            <BriefcaseBusiness size={16} /> Overview
          </Link>

          <Link href="/employer/jobs" style={{ color: "#ffffff", textDecoration: "none" }}>
            <FileText size={16} /> My jobs
          </Link>

          <Link href="/employer/applicants" style={{ color: "#ffffff", textDecoration: "none" }}>
            <Users size={16} /> Applicants
          </Link>

          <Link href="/employer/profile" style={{ color: "#ffffff", textDecoration: "none" }}>
            <Building2 size={16} /> Company profile
          </Link>

          <Link href="/employer/settings" style={{ color: "#ffffff", textDecoration: "none" }}>
            <Settings size={16} /> Settings
          </Link>
        </nav>
      </header>

      <main className="applicant-details-page">
        <div className="applicant-details-container">
          <Link
            href="/employer/applicants"
            className="applicant-back-link"
          >
            <ArrowLeft size={18} />
            Back to applicants
          </Link>

          <div className="applicant-page-heading">
            <div>
              <span className="applicant-page-eyebrow">
                EMPLOYER WORKSPACE
              </span>
              <h1>Applicant details</h1>
              <p>
                Review this candidate&apos;s profile and manage their
                application for {job.title}.
              </p>
            </div>

            <span className="applicant-reference">
              Application ID: {application.id}
            </span>
          </div>

          {notice && (
            <div className="applicant-notice">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="applicant-error">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="applicant-details-layout">
            <section className="applicant-main-column">
              <div className="applicant-profile-card">
                <div className="applicant-profile-top">
                  <div className="applicant-avatar">
                    {initials}
                  </div>

                  <div className="applicant-profile-identity">
                    <h2>{applicantName}</h2>
                    <p>
                      {applicant?.headline || "Job applicant"}
                    </p>

                    <div className="applicant-location">
                      <MapPin size={15} />
                      {applicant?.location || job.location || "Location not provided"}
                    </div>
                  </div>

                  <span
                    className={`applicant-status status-${status
                      .toLowerCase()
                      .replaceAll("_", "-")
                      .replaceAll(" ", "-")}`}
                  >
                    {statusLabels[status]}
                  </span>
                </div>

                <div className="applicant-profile-stats">
                  <div>
                    <BriefcaseBusiness size={19} />
                    <span>Experience</span>
                    <strong>
                      {applicant?.experience || "Not provided"}
                    </strong>
                  </div>

                  <div>
                    <GraduationCap size={20} />
                    <span>Education</span>
                    <strong>
                      {applicant?.education || "Not provided"}
                    </strong>
                  </div>

                  <div>
                    <CalendarDays size={19} />
                    <span>Applied</span>
                    <strong>
                      {formatDate(application.created_at)}
                    </strong>
                  </div>
                </div>
              </div>

              <section className="applicant-content-card">
                <div className="applicant-section-heading">
                  <UserRound size={20} />
                  <h3>Professional summary</h3>
                </div>

                <p className="applicant-summary">
                  {applicant?.about ||
                    "This applicant has not added a professional summary to their profile."}
                </p>
              </section>

              <section className="applicant-content-card">
                <div className="applicant-section-heading">
                  <Award size={20} />
                  <h3>Skills and expertise</h3>
                </div>

                {skills.length > 0 ? (
                  <div className="applicant-skills">
                    {skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="applicant-summary">
                    No skills have been added to this profile.
                  </p>
                )}
              </section>

              <section className="applicant-content-card">
                <div className="applicant-section-heading">
                  <BriefcaseBusiness size={20} />
                  <h3>Work experience</h3>
                </div>

                <p className="applicant-summary">
                  {applicant?.experience ||
                    "Work experience has not been provided."}
                </p>
              </section>

              <section className="applicant-content-card">
                <div className="applicant-section-heading">
                  <GraduationCap size={21} />
                  <h3>Education</h3>
                </div>

                <p className="applicant-summary">
                  {applicant?.education ||
                    "Education details have not been provided."}
                </p>
              </section>

              <section className="applicant-content-card">
                <div className="applicant-section-heading">
                  <FileText size={20} />
                  <h3>Cover letter</h3>
                </div>

                <p className="applicant-summary">
                  {application.cover_letter ||
                    "No cover letter was submitted with this application."}
                </p>
              </section>

              <section className="applicant-content-card">
                <div className="applicant-section-heading">
                  <FileText size={20} />
                  <h3>Resume / CV</h3>
                </div>

                <div className="applicant-cv-card">
                  <div className="applicant-cv-icon">
                    <FileText size={25} />
                  </div>

                  <div className="applicant-cv-info">
                    <strong>Applicant CV</strong>
                    <span>
                      {cvUrl
                        ? "The applicant uploaded a CV."
                        : "No accessible CV file was found."}
                    </span>
                  </div>

                  {cvUrl ? (
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="applicant-cv-unavailable"
                    >
                      View CV <ExternalLink size={15} />
                    </a>
                  ) : (
                    <span className="applicant-cv-unavailable">
                      Not available
                    </span>
                  )}
                </div>
              </section>
            </section>

            <aside className="applicant-side-column">
              <section className="applicant-action-card">
                <h3>Manage application</h3>
                <p>Choose the next step for this applicant.</p>

                <button
                  type="button"
                  className="applicant-action-button shortlist-button"
                  onClick={() => updateStatus("shortlisted")}
                  disabled={updating || status === "shortlisted"}
                >
                  <CheckCircle2 size={18} />
                  Shortlist applicant
                </button>

                <button
                  type="button"
                  className="applicant-action-button interview-button"
                  onClick={() => updateStatus("under_review")}
                  disabled={updating || status === "under_review"}
                >
                  <CalendarDays size={18} />
                  Keep under review
                </button>

                <button
                  type="button"
                  className="applicant-action-button reject-button"
                  onClick={() => updateStatus("rejected")}
                  disabled={updating || status === "rejected"}
                >
                  <XCircle size={18} />
                  Reject application
                </button>

                <button
                  type="button"
                  className="applicant-reset-button"
                  onClick={() => updateStatus("submitted")}
                  disabled={updating || status === "submitted"}
                >
                  <Clock size={16} />
                  Return to pending
                </button>

                <button
                  type="button"
                  className="applicant-action-button shortlist-button"
                  onClick={() => updateStatus("hired")}
                  disabled={updating || status === "hired"}
                >
                  <CheckCircle2 size={18} />
                  Mark as hired
                </button>

                {updating && (
                  <p className="applicant-summary">
                    Saving application status...
                  </p>
                )}
              </section>

              <section className="applicant-contact-card">
                <h3>Contact information</h3>

                <div className="applicant-contact-item">
                  <Mail size={18} />
                  <div>
                    <span>Email address</span>
                    <strong>Email is not available in the public profile.</strong>
                  </div>
                </div>

                <div className="applicant-contact-item">
                  <Phone size={18} />
                  <div>
                    <span>Phone number</span>
                    {applicant?.phone ? (
                      <a href={`tel:${applicant.phone}`}>
                        {applicant.phone}
                      </a>
                    ) : (
                      <strong>Not provided</strong>
                    )}
                  </div>
                </div>

                <div className="applicant-contact-item">
                  <MapPin size={18} />
                  <div>
                    <span>Location</span>
                    <strong>
                      {applicant?.location || "Not provided"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="applicant-expectation-card">
                <span>POSITION APPLIED FOR</span>
                <h3>{job.title}</h3>
                <p>{job.location || "Location not specified"}</p>
              </section>

              <div className="applicant-security-note">
                <ShieldCheck size={20} />
                <p>
                  Keep applicant information confidential.
                  Use it only for recruitment purposes.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
