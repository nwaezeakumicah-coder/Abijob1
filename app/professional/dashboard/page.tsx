
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import { createClient } from "../../../lib/supabase/client";
import {
  Activity,
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import "./professional-dashboard.css";

type ProfileRow = {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  headline: string | null;
  about: string | null;
  skills: string[] | null;
};

type ProfessionalProfileRow = {
  category: string | null;
  skills: string[] | null;
  service_area: string | null;
  profile_data: {
    website?: string;
    experiences?: unknown[];
  } | null;
  is_public: boolean | null;
};

type JobRow = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  application_deadline: string | null;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  job_id: string;
  status: string | null;
  created_at: string;
};

type DashboardApplication = ApplicationRow & {
  jobTitle: string;
  jobLocation: string;
};

type DashboardData = {
  fullName: string;
  headline: string;
  location: string;
  profileCompleteness: number;
  completedProfileItems: number;
  totalProfileItems: number;
  opportunities: JobRow[];
  applications: DashboardApplication[];
  savedCount: number;
};

const SAVED_JOBS_KEY = "abijob-professional-saved-jobs";

const INITIAL_DATA: DashboardData = {
  fullName: "Professional",
  headline: "",
  location: "",
  profileCompleteness: 0,
  completedProfileItems: 0,
  totalProfileItems: 5,
  opportunities: [],
  applications: [],
  savedCount: 0,
};

function getLocalDateString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function isDeadlinePassed(deadline: string | null) {
  if (!deadline) return false;
  return deadline.slice(0, 10) < getLocalDateString();
}

function readSavedJobIds(): string[] {
  try {
    const stored = window.localStorage.getItem(SAVED_JOBS_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item: unknown) => {
        if (typeof item === "string") return item;

        if (
          item &&
          typeof item === "object" &&
          "id" in item &&
          typeof item.id === "string"
        ) {
          return item.id;
        }

        return null;
      })
      .filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
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

function formatRelativeDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "Date unavailable";

  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  const days = Math.floor(elapsed / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatDate(value);
}

function getStatusLabel(status: string | null) {
  switch (status?.toLowerCase()) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under review";
    case "shortlisted":
      return "Shortlisted";
    case "rejected":
      return "Rejected";
    case "hired":
      return "Hired";
    case "withdrawn":
      return "Withdrawn";
    default:
      return "Status unavailable";
  }
}

function getStatusClass(status: string | null) {
  switch (status?.toLowerCase()) {
    case "submitted":
      return "submitted";
    case "under_review":
      return "under-review";
    case "shortlisted":
      return "shortlisted";
    case "rejected":
      return "rejected";
    case "hired":
      return "hired";
    case "withdrawn":
      return "withdrawn";
    default:
      return "unknown";
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRoleDestination(role: string) {
  switch (role) {
    case "job_seeker":
      return "/dashboard";
    case "employer":
      return "/employer/dashboard";
    case "super_admin":
    case "admin":
    case "moderator":
    case "support_staff":
      return "/admin";
    default:
      return "/login";
  }
}

export default function ProfessionalDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error("We could not verify your session. Please sign in again.");
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, role, full_name, phone, location, avatar_url, headline, about, skills"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error("Your account profile could not be loaded. Please try again.");
      }

      if (!profile) {
        router.replace("/login");
        return;
      }

      const typedProfile = profile as ProfileRow;

      if (typedProfile.role !== "professional") {
        router.replace(getRoleDestination(typedProfile.role));
        return;
      }

      const [
        { data: professionalProfile, error: professionalError },
        { data: jobRows, error: jobsError },
        { data: applicationRows, error: applicationsError },
      ] = await Promise.all([
        supabase
          .from("professional_profiles")
          .select("category, skills, service_area, profile_data, is_public")
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
          .from("jobs")
          .select("id, title, category, location, application_deadline, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),

        supabase
          .from("job_applications")
          .select("id, job_id, status, created_at")
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (professionalError) {
        throw new Error("Your professional profile details could not be loaded.");
      }

      if (jobsError) {
        throw new Error("Approved vacancies could not be loaded. Please try again.");
      }

      if (applicationsError) {
        throw new Error("Your application history could not be loaded. Please try again.");
      }

      const professional = (professionalProfile || null) as ProfessionalProfileRow | null;
      const extra = professional?.profile_data || {};

      const skills = Array.isArray(professional?.skills)
        ? professional.skills
        : Array.isArray(typedProfile.skills)
          ? typedProfile.skills
          : [];

      const experiences = Array.isArray(extra.experiences)
        ? extra.experiences
        : [];

      const profileChecks = [
        Boolean(typedProfile.full_name?.trim() && typedProfile.phone?.trim() && typedProfile.location?.trim()),
        Boolean(typedProfile.about?.trim()),
        skills.length > 0,
        experiences.length > 0,
        Boolean(extra.website?.trim()),
      ];

      const completedProfileItems = profileChecks.filter(Boolean).length;
      const profileCompleteness = Math.round(
        (completedProfileItems / profileChecks.length) * 100
      );

      const availableJobs = ((jobRows || []) as JobRow[]).filter(
        (job) => !isDeadlinePassed(job.application_deadline)
      );

      const jobMap = new Map(availableJobs.map((job) => [job.id, job]));
      const applicationData = (applicationRows || []) as ApplicationRow[];

      const mappedApplications: DashboardApplication[] = applicationData.map(
        (application) => {
          const job = jobMap.get(application.job_id);

          return {
            ...application,
            jobTitle: job?.title || "Vacancy details unavailable",
            jobLocation: job?.location || "Location unavailable",
          };
        }
      );

      const savedIds = readSavedJobIds();
      const availableIds = new Set(availableJobs.map((job) => job.id));
      const validSavedIds = savedIds.filter((id) => availableIds.has(id));

      try {
        window.localStorage.setItem(
          SAVED_JOBS_KEY,
          JSON.stringify(validSavedIds)
        );
      } catch {
        // The dashboard can still work if browser storage is unavailable.
      }

      setData({
        fullName: typedProfile.full_name?.trim() || "Professional",
        headline:
          professional?.category?.trim() ||
          typedProfile.headline?.trim() ||
          "",
        location:
          typedProfile.location?.trim() ||
          professional?.service_area?.trim() ||
          "",
        profileCompleteness,
        completedProfileItems,
        totalProfileItems: profileChecks.length,
        opportunities: availableJobs,
        applications: mappedApplications,
        savedCount: validSavedIds.length,
      });
    } catch (loadError) {
      console.error("Professional dashboard loading error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Something went wrong while loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      console.error("Professional logout error:", logoutError);
      setError("We could not sign you out. Please try again.");
      setLoggingOut(false);
    }
  };

  const applicationCounts = useMemo(() => {
    const activeApplications = data.applications.filter(
      (application) => application.status?.toLowerCase() !== "withdrawn"
    );

    return {
      total: activeApplications.length,
      underReview: activeApplications.filter(
        (application) => application.status?.toLowerCase() === "under_review"
      ).length,
      shortlisted: activeApplications.filter(
        (application) => application.status?.toLowerCase() === "shortlisted"
      ).length,
    };
  }, [data.applications]);

  const recentApplications = data.applications.slice(0, 5);
  const recommendedOpportunities = data.opportunities.slice(0, 4);
  const initials = getInitials(data.fullName);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <main className="professional-dashboard">
      {mobileMenuOpen && (
        <button
          type="button"
          className="pd-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`pd-sidebar ${mobileMenuOpen ? "pd-sidebar-open" : ""}`}>
        <div className="pd-brand">
          <Logo href="/" light />
          <button
            type="button"
            className="pd-mobile-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          >
            <X size={21} />
          </button>
        </div>

        <div className="pd-sidebar-label">PROFESSIONAL WORKSPACE</div>

        <nav className="pd-nav" aria-label="Professional navigation">
          <Link
            href="/professional/dashboard"
            className="active"
            aria-current="page"
            onClick={closeMobileMenu}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/professional/opportunities" onClick={closeMobileMenu}>
            <Search size={19} />
            <span>Find opportunities</span>
          </Link>

          <Link href="/professional/saved" onClick={closeMobileMenu}>
            <Bookmark size={19} />
            <span>Saved opportunities</span>
            <span className="pd-nav-count">{data.savedCount}</span>
          </Link>

          <Link href="/professional/applications" onClick={closeMobileMenu}>
            <FileText size={19} />
            <span>My applications</span>
          </Link>

          <Link href="/professional/experience" onClick={closeMobileMenu}>
            <BriefcaseBusiness size={19} />
            <span>Experience</span>
          </Link>

          <Link href="/professional/profile" onClick={closeMobileMenu}>
            <UserRound size={19} />
            <span>My profile</span>
          </Link>

          <Link href="/professional/messages" onClick={closeMobileMenu}>
            <Activity size={19} />
            <span>Messages</span>
          </Link>

          <Link href="/professional/notifications" onClick={closeMobileMenu}>
            <Bell size={19} />
            <span>Notifications</span>
          </Link>

          <Link
            href="/professional/subscription"
            onClick={closeMobileMenu}
          >
            <CreditCard size={19} />
            <span>Subscription & Billing</span>
          </Link>

          <Link href="/professional/settings" onClick={closeMobileMenu}>
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="pd-sidebar-bottom">
          <div className="pd-help-card">
            <div className="pd-help-icon">
              <ShieldCheck size={19} />
            </div>
            <strong>Build a stronger profile</strong>
            <p>Keep your professional details and skills up to date.</p>
            <Link href="/professional/profile" onClick={closeMobileMenu}>
              Update profile <ArrowRight size={14} />
            </Link>
          </div>

          <button
            type="button"
            className="pd-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={18} />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <section className="pd-main">
        <header className="pd-topbar">
          <div className="pd-topbar-left">
            <button
              type="button"
              className="pd-mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={22} />
            </button>

            <div>
              <span className="pd-topbar-label">PROFESSIONAL WORKSPACE</span>
              <h2>Dashboard</h2>
            </div>
          </div>

          <div className="pd-topbar-actions">
            <Link
              href="/professional/notifications"
              className="pd-top-icon"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} />
            </Link>

            <Link
              href="/professional/profile"
              className="pd-user"
              aria-label="Open professional profile"
            >
              <span className="pd-avatar">{initials}</span>
              <span className="pd-user-copy">
                <strong>{data.fullName}</strong>
                <small>Professional account</small>
              </span>
            </Link>
          </div>
        </header>

        <div className="pd-content">
          {error && (
            <div className="pd-error" role="alert">
              <div>
                <strong>Dashboard could not be fully loaded</strong>
                <p>{error}</p>
              </div>
              <button type="button" onClick={() => void loadDashboard()}>
                Try again
              </button>
            </div>
          )}

          <section className="pd-welcome">
            <div className="pd-welcome-copy">
              <span className="pd-eyebrow">YOUR NEXT STEP STARTS HERE</span>
              <h1>Welcome back, {data.fullName.split(" ")[0] || "Professional"}.</h1>
              <p>
                Keep track of your applications, discover approved vacancies
                and make your professional profile stand out.
              </p>
              <div className="pd-welcome-actions">
                <Link href="/professional/opportunities" className="pd-primary-button">
                  Explore opportunities <ArrowRight size={17} />
                </Link>
                <Link href="/professional/profile" className="pd-secondary-button">
                  Update my profile
                </Link>
              </div>
            </div>

            <div className="pd-welcome-art" aria-hidden="true">
              <div className="pd-art-circle pd-art-circle-one" />
              <div className="pd-art-circle pd-art-circle-two" />
              <div className="pd-art-card">
                <BriefcaseBusiness size={30} />
                <span>Opportunity</span>
                <strong>Starts here</strong>
              </div>
            </div>
          </section>

          <section className="pd-section-heading">
            <div>
              <span className="pd-eyebrow">YOUR ACTIVITY</span>
              <h2>Workspace overview</h2>
              <p>These figures are based on your current account records.</p>
            </div>
            <button
              type="button"
              className="pd-refresh-button"
              onClick={() => void loadDashboard()}
              disabled={loading}
            >
              <Activity size={16} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </section>

          <section className="pd-stats-grid" aria-label="Account statistics">
            <article className="pd-stat-card">
              <div className="pd-stat-icon opportunities">
                <BriefcaseBusiness size={21} />
              </div>
              <div className="pd-stat-copy">
                <span>Available opportunities</span>
                <strong>{loading ? "—" : data.opportunities.length}</strong>
                <small>Approved vacancies with active deadlines</small>
              </div>
            </article>

            <article className="pd-stat-card">
              <div className="pd-stat-icon applications">
                <FileText size={21} />
              </div>
              <div className="pd-stat-copy">
                <span>Active applications</span>
                <strong>{loading ? "—" : applicationCounts.total}</strong>
                <small>Excludes withdrawn applications</small>
              </div>
            </article>

            <article className="pd-stat-card">
              <div className="pd-stat-icon shortlisted">
                <CheckCircle2 size={21} />
              </div>
              <div className="pd-stat-copy">
                <span>Shortlisted</span>
                <strong>{loading ? "—" : applicationCounts.shortlisted}</strong>
                <small>Applications marked as shortlisted</small>
              </div>
            </article>

            <article className="pd-stat-card">
              <div className="pd-stat-icon saved">
                <Bookmark size={21} />
              </div>
              <div className="pd-stat-copy">
                <span>Saved opportunities</span>
                <strong>{loading ? "—" : data.savedCount}</strong>
                <small>Saved in this browser</small>
              </div>
            </article>
          </section>

          <div className="pd-dashboard-grid">
            <div className="pd-primary-column">
              <section className="pd-panel">
                <div className="pd-panel-heading">
                  <div>
                    <h2>Recent applications</h2>
                    <p>Your latest submitted applications and their current statuses.</p>
                  </div>
                  <Link href="/professional/applications">
                    View all <ArrowRight size={15} />
                  </Link>
                </div>

                {loading ? (
                  <div className="pd-panel-state">
                    <Clock3 size={24} />
                    <strong>Loading application history</strong>
                    <span>Please wait while your records are retrieved.</span>
                  </div>
                ) : recentApplications.length > 0 ? (
                  <div className="pd-application-list">
                    {recentApplications.map((application) => (
                      <article className="pd-application-row" key={application.id}>
                        <div className="pd-application-icon">
                          <BriefcaseBusiness size={19} />
                        </div>
                        <div className="pd-application-copy">
                          <strong>{application.jobTitle}</strong>
                          <span>
                            {application.jobLocation} · Applied{" "}
                            {formatRelativeDate(application.created_at)}
                          </span>
                        </div>
                        <span
                          className={`pd-status ${getStatusClass(application.status)}`}
                        >
                          {getStatusLabel(application.status)}
                        </span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="pd-panel-state">
                    <FileText size={27} />
                    <strong>No applications yet</strong>
                    <span>
                      When you apply for an approved vacancy, your application
                      history will appear here.
                    </span>
                    <Link href="/professional/opportunities">
                      Find opportunities <ArrowRight size={15} />
                    </Link>
                  </div>
                )}
              </section>

              <section className="pd-panel">
                <div className="pd-panel-heading">
                  <div>
                    <h2>Approved opportunities</h2>
                    <p>Recently published vacancies currently accepting applications.</p>
                  </div>
                  <Link href="/professional/opportunities">
                    Browse all <ArrowRight size={15} />
                  </Link>
                </div>

                {loading ? (
                  <div className="pd-panel-state">
                    <Clock3 size={24} />
                    <strong>Loading vacancies</strong>
                    <span>Retrieving approved opportunities.</span>
                  </div>
                ) : recommendedOpportunities.length > 0 ? (
                  <div className="pd-opportunity-list">
                    {recommendedOpportunities.map((job) => (
                      <article className="pd-opportunity-row" key={job.id}>
                        <div className="pd-opportunity-icon">
                          <BriefcaseBusiness size={20} />
                        </div>
                        <div className="pd-opportunity-copy">
                          <strong>{job.title}</strong>
                          <span>
                            {job.category || "General"} · {job.location || "Location not specified"}
                          </span>
                          <small>
                            {job.application_deadline
                              ? `Deadline: ${formatDate(job.application_deadline)}`
                              : "No application deadline specified"}
                          </small>
                        </div>
                        <Link
                          href={`/jobs/${job.id}/apply`}
                          aria-label={`View ${job.title}`}
                          title={`View ${job.title}`}
                        >
                          <ArrowRight size={18} />
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="pd-panel-state">
                    <Search size={27} />
                    <strong>No active vacancies at the moment</strong>
                    <span>
                      Approved vacancies will appear here when employers publish them.
                    </span>
                    <Link href="/professional/opportunities">
                      Check opportunities <ArrowRight size={15} />
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <aside className="pd-side-column">
              <section className="pd-panel pd-profile-panel">
                <div className="pd-panel-heading">
                  <div>
                    <h2>Profile progress</h2>
                    <p>Build a clearer picture of your professional strengths.</p>
                  </div>
                </div>

                <div className="pd-progress-summary">
                  <div
                    className="pd-progress-ring"
                    style={{
                      background: `conic-gradient(#d7f078 ${data.profileCompleteness}%, #e7eee8 ${data.profileCompleteness}% 100%)`,
                    }}
                  >
                    <div>
                      <strong>{loading ? "—" : `${data.profileCompleteness}%`}</strong>
                    </div>
                  </div>
                  <div>
                    <strong>
                      {data.profileCompleteness === 100
                        ? "Profile complete"
                        : "Keep building your profile"}
                    </strong>
                    <span>
                      {loading
                        ? "Checking your profile..."
                        : `${data.completedProfileItems} of ${data.totalProfileItems} sections completed`}
                    </span>
                  </div>
                </div>

                <div className="pd-progress-track">
                  <span
                    style={{
                      width: `${loading ? 0 : data.profileCompleteness}%`,
                    }}
                  />
                </div>

                <Link href="/professional/profile" className="pd-panel-action">
                  Complete my profile <ArrowRight size={15} />
                </Link>
              </section>

              <section className="pd-panel pd-quick-panel">
                <div className="pd-panel-heading">
                  <div>
                    <h2>Quick actions</h2>
                    <p>Go straight to the tools you use most.</p>
                  </div>
                </div>

                <Link href="/professional/opportunities">
                  <span className="pd-quick-icon"><Search size={18} /></span>
                  <span><strong>Find opportunities</strong><small>Explore approved vacancies</small></span>
                  <ArrowRight size={16} />
                </Link>

                <Link href="/professional/applications">
                  <span className="pd-quick-icon"><FileText size={18} /></span>
                  <span><strong>Track applications</strong><small>Review application progress</small></span>
                  <ArrowRight size={16} />
                </Link>

                <Link href="/professional/profile">
                  <span className="pd-quick-icon"><UserRound size={18} /></span>
                  <span><strong>Edit professional profile</strong><small>Update skills and experience</small></span>
                  <ArrowRight size={16} />
                </Link>

                <Link href="/professional/subscription">
                  <span className="pd-quick-icon"><CreditCard size={18} /></span>
                  <span><strong>Subscription & Billing</strong><small>Manage plans and payment history</small></span>
                  <ArrowRight size={16} />
                </Link>

                <Link href="/professional/settings">
                  <span className="pd-quick-icon"><Settings size={18} /></span>
                  <span><strong>Account settings</strong><small>Manage your preferences</small></span>
                  <ArrowRight size={16} />
                </Link>
              </section>

              <section className="pd-tip-panel">
                <div className="pd-tip-icon"><ShieldCheck size={20} /></div>
                <div>
                  <strong>Make your skills count</strong>
                  <p>
                    Keep your professional title, skills and work experience
                    current so employers can understand what you offer.
                  </p>
                  <Link href="/professional/profile">
                    Review my profile <ArrowRight size={14} />
                  </Link>
                </div>
              </section>
            </aside>
          </div>

          <footer className="pd-footer">
            <span>Abi Job · Professional workspace</span>
            <span>Opportunity starts here.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
