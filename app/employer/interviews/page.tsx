"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  MapPin,
  MessageCircle,
  RefreshCw,
  Settings,
  Users,
  Video,
  X,
  XCircle,
} from "lucide-react";
import Logo from "../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./interviews.css";

type InterviewStatus = "scheduled" | "completed" | "cancelled";

type Interview = {
  id: string;
  application_id: string;
  employer_id: string;
  applicant_id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  status: InterviewStatus;
  created_at: string;
  applicant_name: string;
  job_title: string;
};

type ShortlistedApplication = {
  id: string;
  applicant_id: string;
  job_id: string;
  job_title: string;
  applicant_name: string;
};

type InterviewForm = {
  applicationId: string;
  scheduledAt: string;
  duration: string;
  interviewType: string;
  meetingLink: string;
  location: string;
  notes: string;
};

const emptyForm: InterviewForm = {
  applicationId: "",
  scheduledAt: "",
  duration: "30",
  interviewType: "online",
  meetingLink: "",
  location: "",
  notes: "",
};

const employerLinks = [
  { href: "/employer/dashboard", label: "Overview", icon: Activity },
  { href: "/employer/jobs", label: "My job posts", icon: FileText },
  { href: "/employer/applicants", label: "Applicants", icon: Users },
  { href: "/employer/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/employer/messages", label: "Messages", icon: MessageCircle },
  { href: "/employer/notifications", label: "Notifications", icon: Bell },
  { href: "/employer/profile", label: "Company profile", icon: Building2 },
];

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Scheduled";
}

export default function EmployerInterviewsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [companyName, setCompanyName] = useState("Your Company");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [shortlistedApplications, setShortlistedApplications] = useState<
    ShortlistedApplication[]
  >([]);
  const [form, setForm] = useState<InterviewForm>(emptyForm);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login?redirect=/employer/interviews");
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
          router.replace("/dashboard");
        } else if (profile.role === "professional") {
          router.replace("/professional/dashboard");
        } else if (profile.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/login");
        }
        return;
      }

      const { data: employerProfile } = await supabase
        .from("employer_profiles")
        .select("business_name")
        .eq("id", user.id)
        .maybeSingle();

      setCompanyName(employerProfile?.business_name || "Your Company");

      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("employer_id", user.id);

      if (jobsError) throw jobsError;

      const jobIds = (jobs || []).map((job) => job.id);
      const jobTitles = new Map(
        (jobs || []).map((job) => [job.id, job.title])
      );

      let applications: ShortlistedApplication[] = [];

      if (jobIds.length > 0) {
        const { data: applicationRows, error: applicationsError } =
          await supabase
            .from("job_applications")
            .select("id, applicant_id, job_id")
            .in("job_id", jobIds)
            .eq("status", "shortlisted")
            .order("created_at", { ascending: false });

        if (applicationsError) throw applicationsError;

        const applicantIds = [
          ...new Set((applicationRows || []).map((item) => item.applicant_id)),
        ];

        let applicantNames = new Map<string, string>();

        if (applicantIds.length > 0) {
          const { data: applicantProfiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", applicantIds);

          applicantNames = new Map(
            (applicantProfiles || []).map((item) => [
              item.id,
              item.full_name || "Applicant",
            ])
          );
        }

        applications = (applicationRows || []).map((application) => ({
          id: application.id,
          applicant_id: application.applicant_id,
          job_id: application.job_id,
          job_title: jobTitles.get(application.job_id) || "Job vacancy",
          applicant_name:
            applicantNames.get(application.applicant_id) || "Abi Job Applicant",
        }));
      }

      setShortlistedApplications(applications);

      const { data: interviewRows, error: interviewsError } = await supabase
        .from("interviews")
        .select(
          "id, application_id, employer_id, applicant_id, scheduled_at, duration_minutes, interview_type, meeting_link, location, notes, status, created_at"
        )
        .eq("employer_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (interviewsError) throw interviewsError;

      const interviewApplicantIds = [
        ...new Set((interviewRows || []).map((item) => item.applicant_id)),
      ];

      let interviewApplicantNames = new Map<string, string>();

      if (interviewApplicantIds.length > 0) {
        const { data: applicantProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", interviewApplicantIds);

        interviewApplicantNames = new Map(
          (applicantProfiles || []).map((item) => [
            item.id,
            item.full_name || "Applicant",
          ])
        );
      }

      const applicationTitles = new Map(
        applications.map((application) => [
          application.id,
          application.job_title,
        ])
      );

      const loadedInterviews: Interview[] = (interviewRows || []).map(
        (interview) => ({
          ...interview,
          status: interview.status as InterviewStatus,
          applicant_name:
            interviewApplicantNames.get(interview.applicant_id) ||
            "Abi Job Applicant",
          job_title:
            applicationTitles.get(interview.application_id) ||
            "Job application",
        })
      );

      setInterviews(loadedInterviews);
    } catch (err) {
      console.error("Error loading employer interviews:", err);
      setError(
        err instanceof Error
          ? err.message
          : "We could not load your interviews."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const filteredInterviews = interviews.filter((interview) => {
    if (activeFilter === "all") return true;
    return interview.status === activeFilter;
  });

  const upcomingCount = interviews.filter(
    (interview) =>
      interview.status === "scheduled" &&
      new Date(interview.scheduled_at).getTime() >= Date.now()
  ).length;

  const completedCount = interviews.filter(
    (interview) => interview.status === "completed"
  ).length;

  const cancelledCount = interviews.filter(
    (interview) => interview.status === "cancelled"
  ).length;

  function updateForm(field: keyof InterviewForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingInterviewId(null);
  }

  function editInterview(interview: Interview) {
    setEditingInterviewId(interview.id);
    setForm({
      applicationId: interview.application_id,
      scheduledAt: toLocalDateTime(interview.scheduled_at),
      duration: String(interview.duration_minutes),
      interviewType: interview.interview_type || "online",
      meetingLink: interview.meeting_link || "",
      location: interview.location || "",
      notes: interview.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.applicationId) {
      setError("Select a shortlisted applicant first.");
      return;
    }

    if (!form.scheduledAt) {
      setError("Choose an interview date and time.");
      return;
    }

    const scheduledDate = new Date(form.scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
      setError("The selected interview date is invalid.");
      return;
    }

    if (scheduledDate.getTime() < Date.now() && !editingInterviewId) {
      setError("Please choose a future date and time.");
      return;
    }

    if (
      form.interviewType === "online" &&
      form.meetingLink.trim() === ""
    ) {
      setError("Add the online meeting link.");
      return;
    }

    if (
      form.interviewType === "in_person" &&
      form.location.trim() === ""
    ) {
      setError("Add the interview location.");
      return;
    }

    const duration = Number(form.duration);

    if (!Number.isInteger(duration) || duration < 10 || duration > 480) {
      setError("Interview duration must be between 10 and 480 minutes.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const selectedApplication = shortlistedApplications.find(
        (application) => application.id === form.applicationId
      );

      if (!selectedApplication && !editingInterviewId) {
        throw new Error(
          "That shortlisted application could not be found. Refresh and try again."
        );
      }

      const interviewData = {
        application_id: form.applicationId,
        employer_id: user.id,
        applicant_id:
          selectedApplication?.applicant_id ||
          interviews.find((item) => item.id === editingInterviewId)
            ?.applicant_id,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: duration,
        interview_type: form.interviewType,
        meeting_link: form.meetingLink.trim() || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
        status: "scheduled",
      };

      if (!interviewData.applicant_id) {
        throw new Error("The applicant could not be identified.");
      }

      if (editingInterviewId) {
        const { error: updateError } = await supabase
          .from("interviews")
          .update({
            scheduled_at: interviewData.scheduled_at,
            duration_minutes: interviewData.duration_minutes,
            interview_type: interviewData.interview_type,
            meeting_link: interviewData.meeting_link,
            location: interviewData.location,
            notes: interviewData.notes,
            status: "scheduled",
          })
          .eq("id", editingInterviewId)
          .eq("employer_id", user.id);

        if (updateError) throw updateError;

        setSuccess("Interview rescheduled successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("interviews")
          .insert(interviewData);

        if (insertError) throw insertError;

        setSuccess("Interview scheduled successfully.");
      }

      resetForm();
      await loadInterviews();
    } catch (err) {
      console.error("Error saving interview:", err);
      setError(
        err instanceof Error
          ? err.message
          : "The interview could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateInterviewStatus(
    interview: Interview,
    status: InterviewStatus
  ) {
    const confirmation =
      status === "cancelled"
        ? "Are you sure you want to cancel this interview?"
        : status === "completed"
          ? "Mark this interview as completed?"
          : "Restore this interview to scheduled status?";

    if (!window.confirm(confirmation)) return;

    setUpdatingId(interview.id);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("interviews")
        .update({ status })
        .eq("id", interview.id)
        .eq("employer_id", interview.employer_id);

      if (updateError) throw updateError;

      setInterviews((current) =>
        current.map((item) =>
          item.id === interview.id ? { ...item, status } : item
        )
      );

      setSuccess(`Interview marked as ${getStatusLabel(status).toLowerCase()}.`);
    } catch (err) {
      console.error("Error updating interview:", err);
      setError(
        err instanceof Error
          ? err.message
          : "The interview status could not be updated."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="employer-interviews-page">
      <aside className="interviews-sidebar">
        <div className="interviews-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="interviews-company">
          <div className="interviews-company-icon">
            <Building2 size={21} />
          </div>
          <div>
            <strong>{companyName}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="interviews-nav-label">WORKSPACE</p>

        <nav className="interviews-nav">
          {employerLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.href === "/employer/interviews" ? "active" : ""
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="interviews-nav-label interviews-settings-label">
          PREFERENCES
        </p>

        <nav className="interviews-nav">
          <Link href="/employer/settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="interviews-sidebar-bottom">
          <div className="interviews-help-card">
            <div className="interviews-help-icon">
              <CalendarDays size={19} />
            </div>
            <strong>Recruit with confidence</strong>
            <p>
              Keep your candidate interviews organised in one place.
            </p>
            <Link href="/support">Visit help centre →</Link>
          </div>

          <Link href="/" className="interviews-back-link">
            <ArrowLeft size={16} />
            Back to Abi Job
          </Link>
        </div>
      </aside>

      <section className="interviews-main">
        <header className="interviews-topbar">
          <div>
            <span>EMPLOYER WORKSPACE</span>
            <p>Plan and manage candidate interviews</p>
          </div>

          <div className="interviews-topbar-account">
            <div className="interviews-account-icon">
              <Building2 size={18} />
            </div>
            <div>
              <strong>{companyName}</strong>
              <span>Employer</span>
            </div>
          </div>
        </header>

        <div className="interviews-content">
          <div className="interviews-heading">
            <div>
              <span className="interviews-eyebrow">RECRUITMENT</span>
              <h1>Interviews</h1>
              <p>
                Schedule meetings and keep track of every interview with your
                shortlisted applicants.
              </p>
            </div>

            <button
              type="button"
              className="interviews-refresh-button"
              onClick={loadInterviews}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="interviews-alert interviews-alert-error">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="interviews-alert interviews-alert-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="interviews-stats">
            <article className="interviews-stat-card">
              <div className="interviews-stat-icon">
                <CalendarDays size={20} />
              </div>
              <span>All interviews</span>
              <strong>{interviews.length}</strong>
            </article>

            <article className="interviews-stat-card">
              <div className="interviews-stat-icon upcoming">
                <Clock3 size={20} />
              </div>
              <span>Upcoming</span>
              <strong>{upcomingCount}</strong>
            </article>

            <article className="interviews-stat-card">
              <div className="interviews-stat-icon completed">
                <CheckCircle2 size={20} />
              </div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </article>

            <article className="interviews-stat-card">
              <div className="interviews-stat-icon cancelled">
                <XCircle size={20} />
              </div>
              <span>Cancelled</span>
              <strong>{cancelledCount}</strong>
            </article>
          </div>

          <div className="interviews-layout">
            <section className="interviews-list-panel">
              <div className="interviews-panel-heading">
                <div>
                  <h2>Interview schedule</h2>
                  <p>Your scheduled candidate meetings</p>
                </div>

                <select
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value)}
                  aria-label="Filter interviews"
                >
                  <option value="all">All interviews</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {loading ? (
                <div className="interviews-loading">
                  <LoaderCircle size={25} className="interviews-spinner" />
                  <span>Loading interviews...</span>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="interviews-empty">
                  <div className="interviews-empty-icon">
                    <CalendarDays size={27} />
                  </div>
                  <h3>No interviews found</h3>
                  <p>
                    {activeFilter === "all"
                      ? "When you schedule an interview with a shortlisted applicant, it will appear here."
                      : "There are no interviews in this category yet."}
                  </p>
                </div>
              ) : (
                <div className="interviews-list">
                  {filteredInterviews.map((interview) => (
                    <article className="interview-card" key={interview.id}>
                      <div className="interview-card-top">
                        <div className="interview-date-block">
                          <CalendarDays size={18} />
                          <div>
                            <strong>{formatDate(interview.scheduled_at)}</strong>
                            <span>{formatTime(interview.scheduled_at)}</span>
                          </div>
                        </div>

                        <span
                          className={`interview-status status-${interview.status}`}
                        >
                          {getStatusLabel(interview.status)}
                        </span>
                      </div>

                      <div className="interview-person">
                        <div className="interview-avatar">
                          {interview.applicant_name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <h3>{interview.applicant_name}</h3>
                          <p>{interview.job_title}</p>
                        </div>
                      </div>

                      <div className="interview-meta">
                        <span>
                          <Clock3 size={15} />
                          {interview.duration_minutes} minutes
                        </span>
                        <span>
                          {interview.interview_type === "online" ? (
                            <Video size={15} />
                          ) : interview.interview_type === "phone" ? (
                            <MessageCircle size={15} />
                          ) : (
                            <MapPin size={15} />
                          )}
                          {interview.interview_type.replace("_", " ")}
                        </span>
                      </div>

                      {interview.meeting_link && (
                        <a
                          className="interview-meeting-link"
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Video size={15} />
                          Open meeting link
                        </a>
                      )}

                      {interview.location && (
                        <p className="interview-location">
                          <MapPin size={15} />
                          {interview.location}
                        </p>
                      )}

                      {interview.notes && (
                        <p className="interview-notes">{interview.notes}</p>
                      )}

                      <div className="interview-actions">
                        <Link
                          href={`/employer/applicants/${interview.application_id}`}
                        >
                          View applicant
                        </Link>

                        <Link href="/employer/messages">
                          Message
                        </Link>

                        {interview.status !== "cancelled" &&
                          interview.status !== "completed" && (
                            <>
                              <button
                                type="button"
                                onClick={() => editInterview(interview)}
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                className="interview-complete-action"
                                disabled={updatingId === interview.id}
                                onClick={() =>
                                  updateInterviewStatus(interview, "completed")
                                }
                              >
                                {updatingId === interview.id
                                  ? "Saving..."
                                  : "Complete"}
                              </button>
                              <button
                                type="button"
                                className="interview-cancel-action"
                                disabled={updatingId === interview.id}
                                onClick={() =>
                                  updateInterviewStatus(interview, "cancelled")
                                }
                              >
                                Cancel
                              </button>
                            </>
                          )}

                        {interview.status === "cancelled" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateInterviewStatus(interview, "scheduled")
                            }
                            disabled={updatingId === interview.id}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="interviews-form-panel">
              <div className="interviews-form-heading">
                <div className="interviews-form-icon">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <h2>
                    {editingInterviewId ? "Reschedule interview" : "Schedule interview"}
                  </h2>
                  <p>
                    {editingInterviewId
                      ? "Update the interview details."
                      : "Create a meeting with a shortlisted applicant."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveInterview}>
                <label htmlFor="interview-applicant">Shortlisted applicant</label>
                <select
                  id="interview-applicant"
                  value={form.applicationId}
                  onChange={(event) =>
                    updateForm("applicationId", event.target.value)
                  }
                  required
                  disabled={Boolean(editingInterviewId)}
                >
                  <option value="">Select an applicant</option>
                  {shortlistedApplications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.applicant_name} — {application.job_title}
                    </option>
                  ))}
                  {editingInterviewId &&
                    !shortlistedApplications.some(
                      (application) =>
                        application.id === form.applicationId
                    ) && (
                      <option value={form.applicationId}>
                        Existing interview applicant
                      </option>
                    )}
                </select>

                {shortlistedApplications.length === 0 && !editingInterviewId && (
                  <p className="interviews-field-hint">
                    You need at least one shortlisted applicant before you can
                    schedule an interview.
                  </p>
                )}

                <label htmlFor="interview-date">Date and time</label>
                <input
                  id="interview-date"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) =>
                    updateForm("scheduledAt", event.target.value)
                  }
                  required
                />

                <label htmlFor="interview-duration">Duration</label>
                <select
                  id="interview-duration"
                  value={form.duration}
                  onChange={(event) =>
                    updateForm("duration", event.target.value)
                  }
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1 hour 30 minutes</option>
                  <option value="120">2 hours</option>
                </select>

                <label htmlFor="interview-type">Interview type</label>
                <select
                  id="interview-type"
                  value={form.interviewType}
                  onChange={(event) =>
                    updateForm("interviewType", event.target.value)
                  }
                >
                  <option value="online">Online interview</option>
                  <option value="in_person">In-person interview</option>
                  <option value="phone">Phone interview</option>
                </select>

                {form.interviewType === "online" && (
                  <>
                    <label htmlFor="interview-link">Meeting link</label>
                    <input
                      id="interview-link"
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={form.meetingLink}
                      onChange={(event) =>
                        updateForm("meetingLink", event.target.value)
                      }
                    />
                  </>
                )}

                {form.interviewType === "in_person" && (
                  <>
                    <label htmlFor="interview-location">Interview location</label>
                    <input
                      id="interview-location"
                      type="text"
                      placeholder="Enter office address or venue"
                      value={form.location}
                      onChange={(event) =>
                        updateForm("location", event.target.value)
                      }
                    />
                  </>
                )}

                <label htmlFor="interview-notes">Additional notes</label>
                <textarea
                  id="interview-notes"
                  rows={4}
                  placeholder="Instructions, documents to bring, or other details..."
                  value={form.notes}
                  onChange={(event) =>
                    updateForm("notes", event.target.value)
                  }
                />

                <div className="interviews-form-actions">
                  <button
                    type="submit"
                    className="interviews-submit-button"
                    disabled={
                      saving ||
                      (!editingInterviewId &&
                        shortlistedApplications.length === 0)
                    }
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={17} className="interviews-spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CalendarDays size={17} />
                        {editingInterviewId
                          ? "Save new schedule"
                          : "Schedule interview"}
                      </>
                    )}
                  </button>

                  {editingInterviewId && (
                    <button
                      type="button"
                      className="interviews-reset-button"
                      onClick={resetForm}
                    >
                      <X size={16} />
                      Stop editing
                    </button>
                  )}
                </div>
              </form>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}