
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  MapPin,
  Menu,
  Search,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import "./dashboard.css";

type JobSeekerProfile = {
  full_name: string | null;
  role: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  headline: string | null;
  about: string | null;
  skills: string[] | string | null;
  experience: string | null;
  education: string | null;
  cv_path: string | null;
};

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
}

export default function DashboardPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [userName, setUserName] = useState("Job seeker");
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace("/login?redirect=/dashboard");
          return;
        }

        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim()
            : "";

        const fallbackName =
          metadataName ||
          user.email?.split("@")[0] ||
          "Job seeker";

        if (active) setUserName(fallbackName);

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "full_name, role, phone, location, avatar_url, headline, about, skills, experience, education, cv_path"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!active) return;

        const profileData = data as JobSeekerProfile | null;

        if (profileData) {
          setProfile(profileData);

          if (profileData.full_name?.trim()) {
            setUserName(profileData.full_name.trim());
          }
        }
      } catch (error) {
        console.error("Job seeker dashboard loading error:", error);

        if (active) {
          setLoadError(
            "Some dashboard information could not be loaded. Please refresh the page and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const fields = [
      profile.full_name,
      profile.phone,
      profile.location,
      profile.avatar_url,
      profile.headline,
      profile.about,
      profile.skills,
      profile.experience,
      profile.education,
      profile.cv_path,
    ];

    const completed = fields.filter(hasValue).length;

    return Math.round((completed / fields.length) * 100);
  }, [profile]);

  const profileStatus =
    profileCompletion === 100
      ? "Complete"
      : profileCompletion >= 60
        ? "Almost there"
        : profileCompletion > 0
          ? "In progress"
          : "Not started";

  function toggleSavedJob(id: number) {
    setSavedJobs((current) =>
      current.includes(id)
        ? current.filter((jobId) => jobId !== id)
        : [...current, id]
    );
  }

  return (
    <main className="dashboard-page">
      {sidebarOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`dashboard-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="dashboard-brand">
          <Logo href="/" size="medium" />
          <button
            type="button"
            className="dashboard-close-menu"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="dashboard-sidebar-label">WORKSPACE</div>

        <nav className="dashboard-nav" aria-label="Main navigation">
          <Link
            href="/dashboard"
            className="dashboard-nav-link active"
            aria-current="page"
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>

          <Link
            href="/jobs"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <BriefcaseBusiness size={19} />
            <span>Find jobs</span>
          </Link>

          <Link
            href="/profile"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <UserRound size={19} />
            <span>My profile</span>
          </Link>

          <Link
            href="/notifications"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Bell size={19} />
            <span>Notifications</span>
          </Link>

          <Link
            href="/professionals"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={19} />
            <span>Professionals</span>
          </Link>
        </nav>

        <div className="dashboard-sidebar-label dashboard-sidebar-label-second">
          PERSONAL
        </div>

        <nav className="dashboard-nav" aria-label="Personal navigation">
          <Link
            href="/jobs"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Bookmark size={19} />
            <span>Saved opportunities</span>
          </Link>

          <Link
            href="/hub"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Building2 size={19} />
            <span>Abi Hub</span>
          </Link>

          <Link
            href="/dashboard/subscription"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <CreditCard size={19} />
            <span>Subscription & Billing</span>
          </Link>

          <Link
            href="/settings"
            className="dashboard-nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-support-card">
            <div className="dashboard-support-icon">
              <Activity size={19} />
            </div>

            <strong>Make your profile count</strong>

            <p>
              Complete your profile to help employers discover you.
            </p>

            <Link href="/profile" onClick={() => setSidebarOpen(false)}>
              Complete profile <ArrowRight size={15} />
            </Link>
          </div>

          <div className="dashboard-sidebar-user">
            <div className="dashboard-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{userName}</strong>
              <span>Job seeker</span>
            </div>

            <Link href="/settings" aria-label="Account settings">
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu size={23} />
          </button>

          <div className="dashboard-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>Overview</strong>
          </div>

          <div className="dashboard-topbar-actions">
            <Link
              href="/jobs"
              className="dashboard-topbar-search"
              aria-label="Search jobs"
            >
              <Search size={19} />
            </Link>

            <Link
              href="/notifications"
              className="dashboard-notification-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </Link>

            <Link href="/profile" className="dashboard-topbar-profile">
              <div className="dashboard-avatar dashboard-avatar-small">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span>My account</span>
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-date-label">
                YOUR CAREER WORKSPACE
              </span>

              <h1>
                Good day, {userName} <span>👋</span>
              </h1>

              <p>
                Here's what's happening with your opportunities today.
              </p>
            </div>

            <Link href="/jobs" className="dashboard-primary-button">
              Explore opportunities
              <ArrowUpRight size={18} />
            </Link>
          </section>

          {loadError && (
            <div className="dashboard-save-message" role="alert">
              {loadError}
            </div>
          )}

          <section className="dashboard-profile-progress">
            <div className="dashboard-progress-copy">
              <div className="dashboard-progress-icon">
                <UserRound size={21} />
              </div>

              <div>
                <span>YOUR PROFILE</span>
                <h2>
                  {loading
                    ? "Checking your profile..."
                    : profileCompletion === 100
                      ? "Your profile is complete!"
                      : "Make your profile stand out."}
                </h2>

                <p>
                  {loading
                    ? "Loading your profile information."
                    : "Add your details, skills and experience so employers can learn more about you."}
                </p>
              </div>
            </div>

            <div className="dashboard-progress-action">
              <div className="dashboard-progress-number">
                <strong>{loading ? "—" : `${profileCompletion}%`}</strong>
                <span>Completed</span>
              </div>

              <div
                className="dashboard-progress-track"
                role="progressbar"
                aria-label="Profile completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={loading ? 0 : profileCompletion}
              >
                <span
                  style={{
                    width: loading ? "0%" : `${profileCompletion}%`,
                  }}
                />
              </div>

              <Link href="/profile">
                {profileCompletion === 100
                  ? "Review your profile"
                  : "Complete your profile"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section className="dashboard-stat-grid">
            <article className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <span>Applications</span>
                <div className="dashboard-stat-icon green">
                  <BriefcaseBusiness size={20} />
                </div>
              </div>

              <strong>—</strong>
              <p>Application statistics will appear here.</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <span>Saved jobs</span>
                <div className="dashboard-stat-icon orange">
                  <Bookmark size={20} />
                </div>
              </div>

              <strong>{savedJobs.length}</strong>
              <p>Saved during this page session only.</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <span>Profile views</span>
                <div className="dashboard-stat-icon purple">
                  <Users size={20} />
                </div>
              </div>

              <strong>—</strong>
              <p>Employer view tracking is not connected yet.</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <span>Profile status</span>
                <div className="dashboard-stat-icon blue">
                  <CheckCircle2 size={20} />
                </div>
              </div>

              <strong className="dashboard-status-text">
                {loading ? "Loading..." : profileStatus}
              </strong>

              <p>Based on your saved profile information.</p>
            </article>
          </section>

          <div className="dashboard-main-grid">
            <section className="dashboard-jobs-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-eyebrow">
                    MADE FOR YOUR NEXT MOVE
                  </span>

                  <h2>Find your next opportunity</h2>

                  <p>
                    Explore available jobs and discover opportunities that
                    match your skills.
                  </p>
                </div>

                <Link href="/jobs" className="dashboard-view-all">
                  Browse jobs <ArrowRight size={16} />
                </Link>
              </div>

              <div className="dashboard-job-list">
                <article className="dashboard-job-card">
                  <div className="dashboard-company-logo green">
                    <BriefcaseBusiness size={24} />
                  </div>

                  <div className="dashboard-job-info">
                    <div className="dashboard-job-title-row">
                      <h3>Explore available jobs</h3>
                    </div>

                    <p className="dashboard-job-company">
                      Find opportunities across different industries.
                    </p>

                    <div className="dashboard-job-meta">
                      <span>
                        <MapPin size={14} />
                        Explore by location
                      </span>

                      <span>
                        <Clock3 size={14} />
                        View job types
                      </span>
                    </div>

                    <Link href="/jobs" className="dashboard-job-salary">
                      Find opportunities <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </article>

                <article className="dashboard-job-card">
                  <div className="dashboard-company-logo orange">
                    <Users size={24} />
                  </div>

                  <div className="dashboard-job-info">
                    <div className="dashboard-job-title-row">
                      <h3>Discover skilled professionals</h3>
                    </div>

                    <p className="dashboard-job-company">
                      Explore the professionals and services available on
                      Abi Job.
                    </p>

                    <div className="dashboard-job-meta">
                      <span>
                        <Building2 size={14} />
                        Professional directory
                      </span>
                    </div>

                    <Link
                      href="/professionals"
                      className="dashboard-job-salary"
                    >
                      Find professionals <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </article>
              </div>
            </section>

            <aside className="dashboard-activity-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-eyebrow">
                    STAY ON TRACK
                  </span>

                  <h2>Recommended next steps</h2>
                </div>
              </div>

              <div className="dashboard-activity-list">
                <div className="dashboard-activity-item">
                  <div className="dashboard-activity-icon">
                    <UserRound size={18} />
                  </div>

                  <div className="dashboard-activity-copy">
                    <strong>Complete your profile</strong>
                    <p>
                      Add your skills, qualifications and experience.
                    </p>

                    <Link href="/profile">
                      Update profile <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>

                <div className="dashboard-activity-item">
                  <div className="dashboard-activity-icon">
                    <BriefcaseBusiness size={18} />
                  </div>

                  <div className="dashboard-activity-copy">
                    <strong>Explore job opportunities</strong>
                    <p>
                      Search for vacancies that match your interests.
                    </p>

                    <Link href="/jobs">
                      Explore jobs <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>

                <div className="dashboard-activity-item">
                  <div className="dashboard-activity-icon">
                    <FileText size={18} />
                  </div>

                  <div className="dashboard-activity-copy">
                    <strong>Prepare your CV</strong>
                    <p>
                      Make your experience and qualifications easy to review.
                    </p>

                    <Link href="/profile">
                      Update profile <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/notifications"
                className="dashboard-activity-footer"
              >
                View notifications <ArrowRight size={16} />
              </Link>
            </aside>
          </div>

          <section className="dashboard-bottom-banner">
            <div className="dashboard-bottom-banner-icon">
              <FileText size={25} />
            </div>

            <div>
              <span>YOUR NEXT STEP</span>
              <h2>Let employers see what you can do.</h2>
              <p>
                Add your skills, experience and qualifications to your profile.
              </p>
            </div>

            <Link href="/profile">
              Update my profile <ArrowRight size={17} />
            </Link>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 Abi Job. Opportunity starts here.</span>
            <Link href="/about">About Abi Job</Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
