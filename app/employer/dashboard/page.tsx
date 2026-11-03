
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  UserRoundCheck,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./dashboard.css";

type EmployerJob = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  status: string;
  created_at: string;
};

type ApplicationRecord = {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
};

type ApplicantProfile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
};

type DashboardApplicant = {
  id: string;
  name: string;
  initials: string;
  role: string;
  date: string;
  status: string;
  tone: string;
};

type DashboardData = {
  businessName: string;
  fullName: string;
  activeJobs: number;
  totalApplications: number;
  pendingJobs: number;
  shortlisted: number;
  totalJobs: number;
  profileCompletion: number;
  jobs: EmployerJob[];
  applicants: DashboardApplicant[];
  applicationCounts: Record<string, number>;
};

const employerMobileLinks = [
  { href: "/employer/dashboard", label: "Dashboard", icon: Activity },
  { href: "/employer/jobs", label: "Vacancies", icon: BriefcaseBusiness },
  { href: "/employer/applicants", label: "Applicants", icon: Users },
  { href: "/employer/messages", label: "Messages", icon: MessageCircle },
  { href: "/professionals", label: "Find professionals", icon: Search },
  { href: "/employer/notifications", label: "Notifications", icon: Bell },
  { href: "/employer/profile", label: "Company profile", icon: Building2 },
  { href: "/employer/settings", label: "Settings", icon: Settings },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${date.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return formatDate(value);
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "AP"
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getApplicationStatus(status: string) {
  switch (status) {
    case "submitted":
      return { label: "New application", tone: "new" };
    case "under_review":
      return { label: "Under review", tone: "review" };
    case "shortlisted":
      return { label: "Shortlisted", tone: "shortlisted" };
    case "hired":
      return { label: "Hired", tone: "shortlisted" };
    case "rejected":
      return { label: "Rejected", tone: "review" };
    case "withdrawn":
      return { label: "Withdrawn", tone: "review" };
    default:
      return { label: "Submitted", tone: "new" };
  }
}

function getJobStatus(status: string) {
  switch (status) {
    case "approved":
      return { label: "Published", tone: "published" };
    case "pending":
      return { label: "Under review", tone: "review" };
    case "rejected":
      return { label: "Rejected", tone: "draft" };
    case "closed":
      return { label: "Closed", tone: "draft" };
    default:
      return { label: status, tone: "draft" };
  }
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?redirect=%2Femployer%2Fdashboard");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name")
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

        const [
          { data: employerProfile, error: employerError },
          { data: jobRecords, error: jobsError },
        ] = await Promise.all([
          supabase
            .from("employer_profiles")
            .select("business_name, business_type, address, phone")
            .eq("user_id", user.id)
            .maybeSingle(),

          supabase
            .from("jobs")
            .select("id, title, category, location, status, created_at")
            .eq("employer_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (employerError) throw employerError;
        if (jobsError) throw jobsError;

        const jobs = (jobRecords || []) as EmployerJob[];
        const jobIds = jobs.map((job) => job.id);

        let applications: ApplicationRecord[] = [];
        let applicantProfiles: ApplicantProfile[] = [];

        if (jobIds.length > 0) {
          const { data: applicationRecords, error: applicationsError } =
            await supabase
              .from("job_applications")
              .select("id, job_id, applicant_id, status, created_at")
              .in("job_id", jobIds)
              .order("created_at", { ascending: false });

          if (applicationsError) throw applicationsError;

          applications = (applicationRecords || []) as ApplicationRecord[];

          const applicantIds = [
            ...new Set(
              applications.map((application) => application.applicant_id)
            ),
          ];

          if (applicantIds.length > 0) {
            const { data: profiles, error: applicantProfilesError } =
              await supabase
                .from("profiles")
                .select("id, full_name, headline, location")
                .in("id", applicantIds);

            if (applicantProfilesError) {
              throw applicantProfilesError;
            }

            applicantProfiles = (profiles || []) as ApplicantProfile[];
          }
        }

        const profileMap = new Map(
          applicantProfiles.map((item) => [item.id, item])
        );

        const jobMap = new Map(jobs.map((job) => [job.id, job]));

        const applicationCounts: Record<string, number> = {};

        applications.forEach((application) => {
          applicationCounts[application.job_id] =
            (applicationCounts[application.job_id] || 0) + 1;
        });

        const recentApplicants: DashboardApplicant[] = applications
          .slice(0, 5)
          .map((application) => {
            const applicantProfile = profileMap.get(
              application.applicant_id
            );
            const applicantName =
              applicantProfile?.full_name || "Applicant";

            const applicationStatus = getApplicationStatus(
              application.status
            );
            const relatedJob = jobMap.get(application.job_id);

            return {
              id: application.id,
              name: applicantName,
              initials: getInitials(applicantName),
              role: relatedJob?.title || "Job application",
              date: formatRelativeDate(application.created_at),
              status: applicationStatus.label,
              tone: applicationStatus.tone,
            };
          });

        const businessName =
          employerProfile?.business_name?.trim() || "Your Business";

        const completedProfileFields = [
          employerProfile?.business_name,
          employerProfile?.business_type,
          employerProfile?.address,
          employerProfile?.phone,
        ].filter((value) =>
          Boolean(value && String(value).trim())
        ).length;

        const profileCompletion = Math.round(
          (completedProfileFields / 4) * 100
        );

        setDashboard({
          businessName,
          fullName: profile.full_name || "Business Admin",
          activeJobs: jobs.filter((job) => job.status === "approved").length,
          totalApplications: applications.length,
          pendingJobs: jobs.filter((job) => job.status === "pending").length,
          shortlisted: applications.filter(
            (application) => application.status === "shortlisted"
          ).length,
          totalJobs: jobs.length,
          profileCompletion,
          jobs: jobs.slice(0, 5),
          applicants: recentApplicants,
          applicationCounts,
        });
      } catch (err) {
        console.error("Employer dashboard error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your employer dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <main className="employer-dashboard">
        <div className="employer-dashboard-loading">
          <LoaderCircle size={34} className="animate-spin" />
          <p>Loading your employer dashboard...</p>
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="employer-dashboard">
        <div className="employer-dashboard-error">
          <ShieldCheck size={35} />
          <h2>We couldn't load your dashboard.</h2>
          <p>{error || "Please try again."}</p>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="employer-create-button"
          >
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const stats = [
    {
      label: "Active vacancies",
      value: dashboard.activeJobs,
      note: "Currently published",
      icon: BriefcaseBusiness,
      tone: "green",
    },
    {
      label: "Total applications",
      value: dashboard.totalApplications,
      note: "Across all vacancies",
      icon: FileText,
      tone: "blue",
    },
    {
      label: "Pending review",
      value: dashboard.pendingJobs,
      note: "Awaiting admin approval",
      icon: Clock3,
      tone: "orange",
    },
    {
      label: "Shortlisted talent",
      value: dashboard.shortlisted,
      note: "Candidates shortlisted",
      icon: UserRoundCheck,
      tone: "purple",
    },
  ];

  return (
    <main className="employer-dashboard">
      <aside className="employer-sidebar">
        <div className="employer-brand">
          <Logo href="/" size="medium" light />
        </div>

        <nav
          className="employer-mobile-nav"
          aria-label="Employer workspace navigation"
        >
          {employerMobileLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.href}
                className={
                  item.href === "/employer/dashboard" ? "active" : ""
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="employer-company-card">
          <div className="employer-company-icon">
            <Building2 size={22} />
          </div>
          <div>
            <strong>{dashboard.businessName}</strong>
            <span>Employer account</span>
          </div>
          <ArrowDownRight size={16} />
        </div>

        <div className="employer-nav-label">WORKSPACE</div>
        <nav className="employer-nav">
          <Link href="/employer/dashboard" className="active">
            <Activity size={19} />
            Dashboard
          </Link>
          <Link href="/employer/jobs">
            <BriefcaseBusiness size={19} />
            My vacancies
          </Link>
          <Link href="/employer/applicants">
            <Users size={19} />
            Applicants
            <span className="employer-nav-count">
              {dashboard.totalApplications}
            </span>
          </Link>
          <Link href="/employer/messages">
            <MessageCircle size={19} />
            Messages
          </Link>
          <Link href="/professionals">
            <Search size={19} />
            Find professionals
          </Link>
        </nav>

        <div className="employer-nav-label employer-nav-label-spaced">
          ACCOUNT
        </div>
        <nav className="employer-nav">
          <Link href="/employer/profile">
            <Building2 size={19} />
            Company profile
          </Link>
          <Link href="/employer/settings">
            <Settings size={19} />
            Settings
          </Link>
          <Link href="/employer/notifications">
            <Bell size={19} />
            Notifications
          </Link>
        </nav>

        <div className="employer-sidebar-bottom">
          <div className="employer-help-card">
            <ShieldCheck size={21} />
            <strong>Hiring with confidence</strong>
            <p>Every job listing is reviewed before publication.</p>
            <Link href="/about">
              Learn about Abi Job <ArrowUpRight size={14} />
            </Link>
          </div>

          <Link href="/employer/profile" className="employer-user">
            <span className="employer-user-avatar">
              {getInitials(dashboard.fullName)}
            </span>
            <span>
              <strong>{dashboard.fullName}</strong>
              <small>Account administrator</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </aside>

      <section className="employer-main">
        <header className="employer-topbar">
          <div className="employer-breadcrumb">
            <span>Employer workspace</span>
            <span>/</span>
            <strong>Dashboard</strong>
          </div>

          <div className="employer-topbar-actions">
            <Link
              href="/employer/messages"
              className="employer-notification-button"
              aria-label="Messages"
            >
              <MessageCircle size={20} />
            </Link>

            <Link
              href="/employer/notifications"
              className="employer-notification-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </Link>

            <Link href="/employer/profile" className="employer-topbar-profile">
              <span className="employer-user-avatar">
                {getInitials(dashboard.businessName)}
              </span>
              <span>
                <strong>{dashboard.businessName}</strong>
                <small>Employer account</small>
              </span>
            </Link>
          </div>
        </header>

        <div className="employer-dashboard-content">
          <section className="employer-welcome">
            <div>
              <span className="employer-overline">
                {new Date()
                  .toLocaleDateString("en-NG", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                  .toUpperCase()}
              </span>
              <h1>
                {getGreeting()}, {dashboard.fullName.split(" ")[0]}.
              </h1>
              <p>
                Here's what's happening with your recruitment activities.
                Let's find the right people for your business.
              </p>
            </div>
            <div className="employer-welcome-actions">
              <button
                type="button"
                className="employer-refresh-button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                aria-label="Refresh dashboard"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
              <Link
                href="/employer/jobs/new"
                className="employer-create-button"
              >
                <Plus size={19} />
                Post a vacancy
              </Link>
            </div>
          </section>

          <section className="employer-profile-notice">
            <div className="employer-notice-icon">
              <Building2 size={22} />
            </div>
            <div className="employer-notice-copy">
              <strong>Complete your company profile</strong>
              <p>
                Add your business details and contact information to build
                trust with potential applicants.
              </p>
              <div className="employer-progress-track">
                <span
                  style={{ width: `${dashboard.profileCompletion}%` }}
                />
              </div>
              <small>
                Profile completion · {dashboard.profileCompletion}%
              </small>
            </div>
            <Link href="/employer/profile">
              Complete profile <ArrowRight size={16} />
            </Link>
          </section>

          <section className="employer-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article className="employer-stat-card" key={stat.label}>
                  <div className={`employer-stat-icon ${stat.tone}`}>
                    <Icon size={21} />
                  </div>
                  <span className="employer-stat-label">{stat.label}</span>
                  <strong className="employer-stat-value">
                    {stat.value.toString().padStart(2, "0")}
                  </strong>
                  <span className="employer-stat-note">{stat.note}</span>
                </article>
              );
            })}
          </section>

          <section className="employer-dashboard-grid">
            <div className="employer-panel employer-vacancies-panel">
              <div className="employer-panel-heading">
                <div>
                  <span className="employer-panel-overline">
                    RECRUITMENT
                  </span>
                  <h2>Your vacancies</h2>
                  <p>
                    Keep track of your job listings and their progress.
                  </p>
                </div>
                <Link href="/employer/jobs">
                  View all <ArrowUpRight size={16} />
                </Link>
              </div>

              <div className="employer-table-wrap">
                <table className="employer-vacancies-table">
                  <thead>
                    <tr>
                      <th>POSITION</th>
                      <th>LOCATION</th>
                      <th>APPLICATIONS</th>
                      <th>STATUS</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.jobs.map((job) => {
                      const jobApplications =
                        dashboard.applicationCounts[job.id] || 0;
                      const status = getJobStatus(job.status);

                      return (
                        <tr key={job.id}>
                          <td>
                            <strong>{job.title}</strong>
                            <span>{job.category || "General"}</span>
                          </td>
                          <td>{job.location || "Not specified"}</td>
                          <td>
                            <span className="employer-application-count">
                              {jobApplications}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`employer-status ${status.tone}`}
                            >
                              <i />
                              {status.label}
                            </span>
                          </td>
                          <td>
                            <Link
                              href="/employer/jobs"
                              className="employer-row-link"
                              aria-label={`Manage ${job.title}`}
                              title={`Manage ${job.title}`}
                            >
                              <ArrowUpRight size={17} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}

                    {dashboard.jobs.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="employer-dashboard-empty">
                            <BriefcaseBusiness size={25} />
                            <strong>No vacancies yet</strong>
                            <span>
                              Create your first vacancy to start receiving
                              applications.
                            </span>
                            <Link href="/employer/jobs/new">
                              Post your first vacancy
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Link
                href="/employer/jobs"
                className="employer-mobile-view-all"
              >
                View all vacancies <ArrowRight size={16} />
              </Link>
            </div>

            <div className="employer-panel employer-activity-panel">
              <div className="employer-panel-heading">
                <div>
                  <span className="employer-panel-overline">
                    LATEST UPDATES
                  </span>
                  <h2>Recent applicants</h2>
                  <p>
                    People who recently applied to your vacancies.
                  </p>
                </div>
                <Link
                  href="/employer/applicants"
                  aria-label="View applicants"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              <div className="employer-applicant-list">
                {dashboard.applicants.map((applicant) => (
                  <article
                    className="employer-applicant"
                    key={applicant.id}
                  >
                    <span className="employer-applicant-avatar">
                      {applicant.initials}
                    </span>
                    <div className="employer-applicant-info">
                      <strong>{applicant.name}</strong>
                      <span>{applicant.role}</span>
                      <small>{applicant.date}</small>
                    </div>
                    <span
                      className={`employer-applicant-status ${applicant.tone}`}
                    >
                      {applicant.status}
                    </span>
                  </article>
                ))}

                {dashboard.applicants.length === 0 && (
                  <div className="employer-dashboard-empty">
                    <Users size={25} />
                    <strong>No applications yet</strong>
                    <span>
                      Applications will appear here when people apply to
                      your vacancies.
                    </span>
                  </div>
                )}
              </div>

              <Link
                href="/employer/applicants"
                className="employer-panel-bottom-link"
              >
                Manage applicants <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section className="employer-bottom-grid">
            <div className="employer-approval-card">
              <div className="employer-approval-icon">
                <Clock3 size={22} />
              </div>
              <div>
                <span>ADMIN REVIEW</span>
                <h3>Keep your hiring moving.</h3>
                <p>
                  New vacancies go through an approval process before they
                  become visible to job seekers.
                </p>
                <Link href="/employer/jobs">
                  Check vacancy status <ArrowRight size={16} />
                </Link>
              </div>
              <div className="employer-approval-watermark">
                <ShieldCheck size={100} />
              </div>
            </div>

            <div className="employer-quick-actions">
              <span className="employer-panel-overline">
                QUICK ACTIONS
              </span>
              <h2>What would you like to do?</h2>
              <div className="employer-quick-links">
                <Link href="/employer/jobs/new">
                  <span>
                    <Plus size={18} />
                  </span>
                  Post a new vacancy
                  <ArrowUpRight size={16} />
                </Link>
                <Link href="/professionals">
                  <span>
                    <Search size={18} />
                  </span>
                  Find skilled professionals
                  <ArrowUpRight size={16} />
                </Link>
                <Link href="/employer/profile">
                  <span>
                    <Building2 size={18} />
                  </span>
                  Update company profile
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          <footer className="employer-dashboard-footer">
            <span>© 2026 Abi Job. Opportunity starts here.</span>
            <span>
              <CheckCircle2 size={14} /> Your workspace is ready
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}
