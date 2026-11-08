"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Video,
  MessageCircle,
  MapPin,
  Phone,
  RefreshCw,
  BriefcaseBusiness,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  CalendarClock,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InterviewStatus =
  | "scheduled"
  | "rescheduled"
  | "completed"
  | "cancelled";

type InterviewType = "online" | "live_chat" | "in_person" | "phone";

type InterviewRow = {
  id: string;
  application_id: string;
  employer_id: string;
  applicant_id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: InterviewType;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  status: InterviewStatus;
  created_at: string;
  updated_at: string;
};

type InterviewCard = InterviewRow & {
  jobTitle: string;
};

type ApplicationJobRow = {
  id: string;
  job_id: string;
};

type JobTitleRow = {
  id: string;
  title: string | null;
};

type ViewFilter = "upcoming" | "past" | "all";

function formatInterviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatInterviewTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function isValidMeetingUrl(value: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function getMethodLabel(type: InterviewType) {
  const labels: Record<InterviewType, string> = {
    online: "Google Meet",
    live_chat: "Abi Job Live Room",
    in_person: "In-person interview",
    phone: "Phone interview",
  };

  return labels[type] || "Interview";
}

function getStatusLabel(status: InterviewStatus) {
  const labels: Record<InterviewStatus, string> = {
    scheduled: "Scheduled",
    rescheduled: "Rescheduled",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] || "Unknown";
}

function getStatusClass(status: InterviewStatus) {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "rescheduled") return "rescheduled";
  return "scheduled";
}

function isUpcoming(interview: InterviewRow) {
  const scheduledTime = new Date(interview.scheduled_at).getTime();

  return (
    (interview.status === "scheduled" ||
      interview.status === "rescheduled") &&
    Number.isFinite(scheduledTime) &&
    scheduledTime >= Date.now()
  );
}

export default function ApplicantInterviewsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [interviews, setInterviews] = useState<InterviewCard[]>([]);
  const [filter, setFilter] = useState<ViewFilter>("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [applicantRole, setApplicantRole] = useState<
    "job_seeker" | "professional" | null
  >(null);

  const loadInterviews = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?redirect=%2Finterviews");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error(
            "We could not verify your account. Please sign in again."
          );
        }

        if (
          profile.role !== "job_seeker" &&
          profile.role !== "professional"
        ) {
          const destination =
            profile.role === "employer"
              ? "/employer/interviews"
              : profile.role === "admin"
                ? "/admin"
                : "/login";

          router.replace(destination);
          return;
        }

        setApplicantRole(profile.role);

        const { data: interviewRows, error: interviewError } =
          await supabase
            .from("interviews")
            .select(
              "id, application_id, employer_id, applicant_id, scheduled_at, duration_minutes, interview_type, meeting_link, location, notes, status, created_at, updated_at"
            )
            .eq("applicant_id", user.id)
            .order("scheduled_at", { ascending: true });

        if (interviewError) {
          throw new Error(
            "Your interview invitations could not be loaded. Please try again."
          );
        }

        const rows = (interviewRows || []) as InterviewRow[];

        if (rows.length === 0) {
          setInterviews([]);
          return;
        }

        const applicationIds = [
          ...new Set(
            rows
              .map((interview) => interview.application_id)
              .filter(Boolean)
          ),
        ];

        const { data: applicationRows, error: applicationError } =
          await supabase
            .from("job_applications")
            .select("id, job_id")
            .in("id", applicationIds);

        if (applicationError) {
          console.warn(
            "Interview job details could not be loaded:",
            applicationError.message
          );
        }

        const applications = (applicationRows ||
          []) as ApplicationJobRow[];

        const jobIds = [
          ...new Set(
            applications.map((application) => application.job_id).filter(Boolean)
          ),
        ];

        let jobMap = new Map<string, string>();

        if (jobIds.length > 0) {
          const { data: jobRows, error: jobsError } = await supabase
            .from("jobs")
            .select("id, title")
            .in("id", jobIds);

          if (jobsError) {
            console.warn(
              "Interview vacancy titles could not be loaded:",
              jobsError.message
            );
          } else {
            jobMap = new Map(
              ((jobRows || []) as JobTitleRow[]).map((job) => [
                job.id,
                job.title?.trim() || "Vacancy",
              ])
            );
          }
        }

        const applicationJobMap = new Map(
          applications.map((application) => [
            application.id,
            application.job_id,
          ])
        );

        const mapped: InterviewCard[] = rows.map((interview) => {
          const jobId = applicationJobMap.get(interview.application_id);

          return {
            ...interview,
            jobTitle: jobId
              ? jobMap.get(jobId) || "Vacancy details unavailable"
              : "Vacancy details unavailable",
          };
        });

        setInterviews(mapped);
      } catch (loadError) {
        console.error("Applicant interviews loading error:", loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Something went wrong while loading your interviews."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    void loadInterviews(true);
  }, [loadInterviews]);

  const upcomingCount = useMemo(
    () => interviews.filter(isUpcoming).length,
    [interviews]
  );

  const pastCount = useMemo(
    () => interviews.filter((interview) => !isUpcoming(interview)).length,
    [interviews]
  );

  const filteredInterviews = useMemo(() => {
    if (filter === "upcoming") {
      return interviews.filter(isUpcoming);
    }

    if (filter === "past") {
      return interviews.filter((interview) => !isUpcoming(interview));
    }

    return interviews;
  }, [filter, interviews]);

  const dashboardPath =
    applicantRole === "professional"
      ? "/professional/dashboard"
      : "/dashboard";

  const applicationsPath =
    applicantRole === "professional"
      ? "/professional/applications"
      : "/applications";

  return (
    <main className="applicant-interviews-page">
      <style jsx global>{`
        .applicant-interviews-page {
          min-height: 100vh;
          background: #f4f7f3;
          color: #17251d;
          padding: 36px clamp(18px, 5vw, 76px) 64px;
        }
        .applicant-interviews-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }
        .applicant-interviews-back {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #456252;
          text-decoration: none;
          font-size: 14px;
          font-weight: 650;
          margin-bottom: 30px;
        }
        .applicant-interviews-back:hover {
          color: #176b45;
        }
        .applicant-interviews-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 30px;
        }
        .applicant-interviews-eyebrow {
          color: #43805e;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }
        .applicant-interviews-heading h1 {
          margin: 9px 0 8px;
          font-size: clamp(30px, 4vw, 43px);
          line-height: 1.12;
          letter-spacing: -1.5px;
        }
        .applicant-interviews-heading p {
          color: #647469;
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
          max-width: 620px;
        }
        .applicant-interviews-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid #d5e0d7;
          border-radius: 10px;
          background: #fff;
          color: #234c35;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .applicant-interviews-refresh:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
        .applicant-interviews-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 34px;
        }
        .applicant-interviews-stat {
          background: #fff;
          border: 1px solid #e2e9e2;
          border-radius: 14px;
          padding: 21px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .applicant-interviews-stat-icon {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eaf4ec;
          color: #176b45;
        }
        .applicant-interviews-stat span {
          display: block;
          color: #6c7b70;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .applicant-interviews-stat strong {
          display: block;
          font-size: 25px;
          line-height: 1;
        }
        .applicant-interviews-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 17px;
        }
        .applicant-interviews-list-header h2 {
          margin: 0 0 5px;
          font-size: 21px;
        }
        .applicant-interviews-list-header p {
          margin: 0;
          color: #748177;
          font-size: 13px;
        }
        .applicant-interviews-tabs {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .applicant-interviews-tabs button {
          border: 1px solid #dce5dc;
          background: #fff;
          color: #596b5e;
          border-radius: 9px;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .applicant-interviews-tabs button.active {
          background: #176b45;
          border-color: #176b45;
          color: #fff;
        }
        .applicant-interviews-card {
          background: #fff;
          border: 1px solid #e0e8e0;
          border-radius: 15px;
          padding: 23px;
          margin-bottom: 14px;
          box-shadow: 0 5px 20px rgba(23, 55, 35, .035);
        }
        .applicant-interviews-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 17px;
        }
        .applicant-interviews-card h3 {
          margin: 0 0 6px;
          font-size: 18px;
          line-height: 1.4;
        }
        .applicant-interviews-method {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #53705d;
          font-size: 13px;
          font-weight: 650;
        }
        .applicant-interviews-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 30px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          background: #eaf4ec;
          color: #176b45;
        }
        .applicant-interviews-status.rescheduled {
          background: #fff4df;
          color: #936015;
        }
        .applicant-interviews-status.completed {
          background: #eaf0ff;
          color: #385b9a;
        }
        .applicant-interviews-status.cancelled {
          background: #fcebea;
          color: #a33e38;
        }
        .applicant-interviews-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          padding: 16px 0;
          border-top: 1px solid #edf1ed;
          border-bottom: 1px solid #edf1ed;
        }
        .applicant-interviews-meta-item {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #176b45;
        }
        .applicant-interviews-meta-item span {
          display: block;
          color: #718076;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .applicant-interviews-meta-item strong {
          display: block;
          color: #263a2d;
          font-size: 13px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .applicant-interviews-notes {
          margin-top: 16px;
          padding: 14px 16px;
          background: #f6f8f5;
          border-radius: 10px;
        }
        .applicant-interviews-notes strong {
          display: block;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .applicant-interviews-notes p {
          margin: 0;
          color: #5f6f64;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .applicant-interviews-card-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }
        .applicant-interviews-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 15px;
          border-radius: 9px;
          background: #176b45;
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 750;
        }
        .applicant-interviews-action.secondary {
          color: #176b45;
          background: #edf5ef;
        }
        .applicant-interviews-empty,
        .applicant-interviews-error,
        .applicant-interviews-loading {
          padding: 54px 22px;
          background: #fff;
          border: 1px solid #e0e8e0;
          border-radius: 15px;
          text-align: center;
        }
        .applicant-interviews-empty-icon {
          width: 54px;
          height: 54px;
          margin: 0 auto 15px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #eaf4ec;
          color: #176b45;
        }
        .applicant-interviews-empty h3 {
          margin: 0 0 8px;
          font-size: 18px;
        }
        .applicant-interviews-empty p,
        .applicant-interviews-error p {
          max-width: 490px;
          margin: 0 auto 17px;
          color: #718076;
          font-size: 14px;
          line-height: 1.65;
        }
        .applicant-interviews-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #a33e38;
          margin-bottom: 18px;
        }
        .applicant-interviews-error p {
          margin: 0;
          color: inherit;
        }
        .applicant-interviews-loading {
          color: #176b45;
        }
        .applicant-interviews-empty-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 15px;
          border-radius: 9px;
          background: #176b45;
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 750;
        }
        .applicant-interviews-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 26px;
          color: #78867c;
          font-size: 12px;
        }
        .applicant-interviews-footer a {
          color: #176b45;
          text-decoration: none;
          font-weight: 700;
        }
        @media (max-width: 760px) {
          .applicant-interviews-page {
            padding: 24px 15px 42px;
          }
          .applicant-interviews-heading {
            align-items: flex-start;
            flex-direction: column;
          }
          .applicant-interviews-stats {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .applicant-interviews-meta {
            grid-template-columns: 1fr;
          }
          .applicant-interviews-card {
            padding: 17px;
          }
          .applicant-interviews-card-top {
            flex-direction: column;
          }
          .applicant-interviews-list-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .applicant-interviews-card-actions {
            justify-content: stretch;
          }
          .applicant-interviews-action {
            flex: 1 1 100%;
          }
          .applicant-interviews-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="applicant-interviews-shell">
        <Link href={dashboardPath} className="applicant-interviews-back">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="applicant-interviews-heading">
          <div>
            <span className="applicant-interviews-eyebrow">
              YOUR RECRUITMENT SCHEDULE
            </span>
            <h1>My interviews</h1>
            <p>
              View interview invitations, prepare for your conversations
              and join your scheduled interviews from one place.
            </p>
          </div>

          <button
            type="button"
            className="applicant-interviews-refresh"
            onClick={() => void loadInterviews(false)}
            disabled={loading || refreshing}
          >
            {refreshing ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {refreshing ? "Refreshing..." : "Refresh interviews"}
          </button>
        </header>

        <section className="applicant-interviews-stats">
          <article className="applicant-interviews-stat">
            <div className="applicant-interviews-stat-icon">
              <CalendarDays size={21} />
            </div>
            <div>
              <span>Total invitations</span>
              <strong>{loading ? "—" : interviews.length}</strong>
            </div>
          </article>

          <article className="applicant-interviews-stat">
            <div className="applicant-interviews-stat-icon">
              <CalendarClock size={21} />
            </div>
            <div>
              <span>Upcoming interviews</span>
              <strong>{loading ? "—" : upcomingCount}</strong>
            </div>
          </article>

          <article className="applicant-interviews-stat">
            <div className="applicant-interviews-stat-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Past or closed</span>
              <strong>{loading ? "—" : pastCount}</strong>
            </div>
          </article>
        </section>

        {error && (
          <div className="applicant-interviews-error" role="alert">
            <AlertCircle size={19} />
            <p>{error}</p>
          </div>
        )}

        <section>
          <div className="applicant-interviews-list-header">
            <div>
              <h2>Your interview invitations</h2>
              <p>
                Interview details are provided by the employer who invited you.
              </p>
            </div>
          </div>

          <div className="applicant-interviews-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "upcoming"}
              className={filter === "upcoming" ? "active" : ""}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "past"}
              className={filter === "past" ? "active" : ""}
              onClick={() => setFilter("past")}
            >
              Past ({pastCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All ({interviews.length})
            </button>
          </div>

          {loading ? (
            <div className="applicant-interviews-loading">
              <LoaderCircle
                size={30}
                className="animate-spin"
                style={{ margin: "0 auto 12px" }}
              />
              <strong>Loading your interview invitations...</strong>
            </div>
          ) : filteredInterviews.length > 0 ? (
            filteredInterviews.map((interview) => {
              const validMeetingUrl = isValidMeetingUrl(
                interview.meeting_link
              );

              const isLiveRoom =
                interview.interview_type === "live_chat";

              const canJoin =
                isUpcoming(interview) &&
                (isLiveRoom || validMeetingUrl);

              return (
                <article
                  className="applicant-interviews-card"
                  key={interview.id}
                >
                  <div className="applicant-interviews-card-top">
                    <div>
                      <h3>{interview.jobTitle}</h3>
                      <span className="applicant-interviews-method">
                        {interview.interview_type === "online" ? (
                          <Video size={15} />
                        ) : interview.interview_type === "live_chat" ? (
                          <MessageCircle size={15} />
                        ) : interview.interview_type === "in_person" ? (
                          <MapPin size={15} />
                        ) : (
                          <Phone size={15} />
                        )}
                        {getMethodLabel(interview.interview_type)}
                      </span>
                    </div>

                    <span
                      className={`applicant-interviews-status ${getStatusClass(
                        interview.status
                      )}`}
                    >
                      {interview.status === "cancelled" ? (
                        <XCircle size={13} />
                      ) : interview.status === "completed" ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <CalendarDays size={13} />
                      )}
                      {getStatusLabel(interview.status)}
                    </span>
                  </div>

                  <div className="applicant-interviews-meta">
                    <div className="applicant-interviews-meta-item">
                      <CalendarDays size={17} />
                      <div>
                        <span>Date</span>
                        <strong>
                          {formatInterviewDate(interview.scheduled_at)}
                        </strong>
                      </div>
                    </div>

                    <div className="applicant-interviews-meta-item">
                      <Clock3 size={17} />
                      <div>
                        <span>Time and duration</span>
                        <strong>
                          {formatInterviewTime(interview.scheduled_at)} ·{" "}
                          {interview.duration_minutes} minutes
                        </strong>
                      </div>
                    </div>

                    <div className="applicant-interviews-meta-item">
                      {interview.interview_type === "in_person" ? (
                        <MapPin size={17} />
                      ) : interview.interview_type === "phone" ? (
                        <Phone size={17} />
                      ) : interview.interview_type === "live_chat" ? (
                        <MessageCircle size={17} />
                      ) : (
                        <Video size={17} />
                      )}
                      <div>
                        <span>Interview arrangement</span>
                        <strong>
                          {interview.interview_type === "in_person"
                            ? interview.location || "Location not provided"
                            : interview.interview_type === "phone"
                              ? "The employer will contact you by phone"
                              : interview.interview_type === "live_chat"
                                ? "Private Abi Job interview room"
                                : validMeetingUrl
                                  ? "Google Meet link provided"
                                  : "Meeting link unavailable"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {interview.notes?.trim() && (
                    <div className="applicant-interviews-notes">
                      <strong>Employer instructions</strong>
                      <p>{interview.notes}</p>
                    </div>
                  )}

                  <div className="applicant-interviews-card-actions">
                    {canJoin && isLiveRoom && (
                      <Link
                        href={`/interviews/${encodeURIComponent(interview.id)}`}
                        className="applicant-interviews-action"
                      >
                        <MessageCircle size={16} />
                        Join live interview
                        <ArrowRight size={15} />
                      </Link>
                    )}

                    {canJoin && !isLiveRoom && validMeetingUrl && (
                      <a
                        href={interview.meeting_link || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="applicant-interviews-action"
                      >
                        <Video size={16} />
                        Join Google Meet
                        <ExternalLink size={14} />
                      </a>
                    )}

                    {!canJoin &&
                      interview.interview_type === "live_chat" &&
                      interview.status !== "cancelled" && (
                        <Link
                          href={`/interviews/${encodeURIComponent(interview.id)}`}
                          className="applicant-interviews-action secondary"
                        >
                          <MessageCircle size={16} />
                          View interview room
                          <ArrowRight size={15} />
                        </Link>
                      )}

                    {interview.interview_type === "in_person" &&
                      interview.location && (
                        <span className="applicant-interviews-action secondary">
                          <MapPin size={16} />
                          Location: {interview.location}
                        </span>
                      )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="applicant-interviews-empty">
              <div className="applicant-interviews-empty-icon">
                <CalendarDays size={25} />
              </div>
              <h3>
                {interviews.length === 0
                  ? "No interview invitations yet"
                  : filter === "upcoming"
                    ? "No upcoming interviews"
                    : "No past interviews"}
              </h3>
              <p>
                {interviews.length === 0
                  ? "When an employer schedules an interview for one of your applications, the invitation and joining details will appear here."
                  : "There are no interviews in this section right now. You can check another filter to see your interview history."}
              </p>
              {interviews.length === 0 && (
                <Link
                  href={applicationsPath}
                  className="applicant-interviews-empty-link"
                >
                  View my applications <ArrowRight size={15} />
                </Link>
              )}
            </div>
          )}
        </section>

        <footer className="applicant-interviews-footer">
          <span>Abi Job · Opportunity Starts Here</span>
          <Link href={applicationsPath}>Back to my applications</Link>
        </footer>
      </div>
    </main>
  );
}