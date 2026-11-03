
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import { createClient } from "../../../lib/supabase/client";

import {
  LayoutDashboard,
  Search,
  BriefcaseBusiness,
  Bookmark,
  UserRound,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  Clock3,
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronRight,
  Plus,
  Eye,
  CalendarDays,
  MessageCircle,
} from "lucide-react";

import "./professional-dashboard.css";

const navigation = [
  { label: "Dashboard", href: "/professional/dashboard", icon: LayoutDashboard },
  { label: "Find Opportunities", href: "/professional/opportunities", icon: Search },
  { label: "My Applications", href: "/professional/applications", icon: BriefcaseBusiness },
  { label: "Saved Opportunities", href: "/professional/saved", icon: Bookmark },
  { label: "My Profile", href: "/professional/profile", icon: UserRound },
  { label: "AI CV Builder", href: "/cv-builder", icon: FileText },
  { label: "Messages", href: "/professional/messages", icon: MessageCircle },
  { label: "Notifications", href: "/professional/notifications", icon: Bell, count: 3 },
  { label: "Settings", href: "/professional/settings", icon: Settings },
];

const recommendedJobs = [
  {
    id: 1,
    title: "Graphics Designer",
    company: "Creative Media House",
    location: "Umuahia, Abia State",
    type: "Full-time",
    salary: "₦80,000 – ₦120,000",
    category: "Creative",
    posted: "2 days ago",
    initials: "CM",
    color: "orange",
  },
  {
    id: 2,
    title: "Fashion Designer",
    company: "Made in Aba Studio",
    location: "Ariaria, Aba",
    type: "Full-time",
    salary: "₦100,000 – ₦160,000",
    category: "Fashion",
    posted: "3 days ago",
    initials: "MA",
    color: "purple",
  },
  {
    id: 3,
    title: "Frontend Developer",
    company: "Digital Solutions Agency",
    location: "Aba, Abia State",
    type: "Full-time",
    salary: "₦150,000 – ₦200,000",
    category: "Technology",
    posted: "4 days ago",
    initials: "DS",
    color: "blue",
  },
];

const activities = [
  {
    title: "Application submitted",
    description: "Your application for Graphics Designer was submitted.",
    time: "Today · 10:30 AM",
    status: "Submitted",
  },
  {
    title: "Profile viewed",
    description: "An employer viewed your professional profile.",
    time: "Yesterday · 2:15 PM",
    status: "Profile activity",
  },
  {
    title: "New opportunity",
    description: "A new opportunity matching your skills is available.",
    time: "2 days ago",
    status: "New opportunity",
  },
];

export default function ProfessionalDashboard() {
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [professionalName, setProfessionalName] = useState("Professional");
  const [professionalInitials, setProfessionalInitials] = useState("SP");

  useEffect(() => {
    let active = true;

    async function verifyProfessionalAccount() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError || !profile) {
        router.replace("/login");
        return;
      }

      if (profile.role !== "professional") {
        if (profile.role === "job_seeker") {
          router.replace("/dashboard");
        } else if (profile.role === "employer") {
          router.replace("/employer/dashboard");
        } else if (profile.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/login");
        }
        return;
      }

      const name = profile.full_name?.trim() || "Professional";
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0].toUpperCase())
        .join("");

      setProfessionalName(name);
      setProfessionalInitials(initials || "SP");
      setAuthLoading(false);
    }

    verifyProfessionalAccount();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    if (logoutLoading) return;

    setLogoutLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Unable to sign out. Please try again.");
      setLogoutLoading(false);
      return;
    }

    router.replace("/login?logged_out=1");
    router.refresh();
  }

  if (authLoading) {
    return (
      <main className="professional-dashboard">
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f8f3",
            color: "#176b45",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          Verifying your professional account...
        </div>
      </main>
    );
  }

  return (
    <main className="professional-dashboard">
      <aside
        className={`professional-sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="professional-sidebar-top">
          <div className="professional-sidebar-logo">
            <Logo href="/professional/dashboard" size="medium" light />
          </div>

          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div className="sidebar-account">
          <div className="sidebar-avatar">{professionalInitials}</div>
          <div>
            <strong>{professionalName}</strong>
            <span>Skilled Professional</span>
          </div>
        </div>

        <p className="sidebar-section-label">PROFESSIONAL WORKSPACE</p>

        <nav className="professional-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.label === "Dashboard";

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`professional-nav-link ${
                  active ? "active" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>

                {item.count && (
                  <span className="nav-notification-count">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-help">
          <div className="sidebar-help-icon">
            <Sparkles size={20} />
          </div>

          <strong>Grow your career</strong>

          <p>
            Keep your profile updated to improve your chances of getting
            discovered by employers.
          </p>

          <Link
            href="/professional/profile"
            onClick={() => setMobileMenuOpen(false)}
          >
            Update profile <ArrowRight size={15} />
          </Link>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          disabled={logoutLoading}
        >
          <LogOut size={18} />
          <span>{logoutLoading ? "Signing out..." : "Log Out"}</span>
        </button>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <section className="professional-main">
        <div className="professional-topbar">
          <div className="professional-topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div>
              <span className="topbar-eyebrow">
                SKILLED PROFESSIONALS & ARTISANS
              </span>
              <h1>Dashboard</h1>
            </div>
          </div>

          <div className="professional-topbar-actions">
            <Link
              href="/professional/messages"
              className="topbar-notification"
              aria-label="Messages"
            >
              <MessageCircle size={20} />
            </Link>

            <Link
              href="/professional/notifications"
              className="topbar-notification"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span />
            </Link>

            <Link href="/professional/profile" className="topbar-profile">
              <div className="topbar-avatar">{professionalInitials}</div>
              <div className="topbar-profile-text">
                <strong>{professionalName}</strong>
                <span>Professional</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="professional-content">
          <section className="professional-welcome">
            <div className="welcome-copy">
              <span className="welcome-label">
                <Sparkles size={15} /> YOUR NEXT OPPORTUNITY STARTS HERE
              </span>

              <h2>
                Welcome back,
                <br />
                <span>{professionalName}!</span>
              </h2>

              <p>
                Discover opportunities, showcase your skills and connect
                with employers looking for your expertise.
              </p>

              <div className="welcome-actions">
                <Link
                  href="/professional/opportunities"
                  className="welcome-primary-button"
                >
                  Explore opportunities <ArrowUpRight size={17} />
                </Link>

                <Link
                  href="/professional/profile"
                  className="welcome-secondary-button"
                >
                  View my profile
                </Link>
              </div>
            </div>

            <div className="welcome-decoration" aria-hidden="true">
              <div className="welcome-ring ring-one" />
              <div className="welcome-ring ring-two" />
              <div className="welcome-ring ring-three" />
              <div className="welcome-decoration-center">
                <BriefcaseBusiness size={54} />
              </div>
            </div>
          </section>

          <section className="professional-stats">
            <article className="professional-stat-card">
              <div className="stat-card-top">
                <span className="stat-icon stat-green">
                  <BriefcaseBusiness size={21} />
                </span>
                <span className="stat-trend">
                  <TrendingUp size={14} /> Active
                </span>
              </div>
              <strong>24</strong>
              <span>Available opportunities</span>
              <Link href="/professional/opportunities">
                Explore opportunities <ArrowRight size={14} />
              </Link>
            </article>

            <article className="professional-stat-card">
              <div className="stat-card-top">
                <span className="stat-icon stat-blue">
                  <FileText size={21} />
                </span>
              </div>
              <strong>08</strong>
              <span>Applications submitted</span>
              <Link href="/professional/applications">
                View applications <ArrowRight size={14} />
              </Link>
            </article>

            <article className="professional-stat-card">
              <div className="stat-card-top">
                <span className="stat-icon stat-purple">
                  <CheckCircle2 size={21} />
                </span>
              </div>
              <strong>03</strong>
              <span>Shortlisted applications</span>
              <Link href="/professional/applications">
                Check status <ArrowRight size={14} />
              </Link>
            </article>

            <article className="professional-stat-card">
              <div className="stat-card-top">
                <span className="stat-icon stat-orange">
                  <Bell size={21} />
                </span>
                <span className="stat-unread">3 new</span>
              </div>
              <strong>05</strong>
              <span>Notifications</span>
              <Link href="/professional/notifications">
                View notifications <ArrowRight size={14} />
              </Link>
            </article>
          </section>

          <div className="professional-dashboard-grid">
            <div className="professional-dashboard-main-column">
              <section className="professional-panel">
                <div className="professional-panel-heading">
                  <div>
                    <span className="panel-eyebrow">HANDPICKED FOR YOU</span>
                    <h3>Recommended opportunities</h3>
                    <p>
                      Opportunities that may match your professional skills.
                    </p>
                  </div>

                  <Link
                    href="/professional/opportunities"
                    className="panel-view-all"
                  >
                    View all <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="recommended-job-list">
                  {recommendedJobs.map((job) => (
                    <article className="recommended-job" key={job.id}>
                      <div
                        className={`company-initials company-${job.color}`}
                      >
                        {job.initials}
                      </div>

                      <div className="recommended-job-details">
                        <div className="recommended-job-title-row">
                          <div>
                            <h4>{job.title}</h4>
                            <span>{job.company}</span>
                          </div>
                          <span className="job-category">
                            {job.category}
                          </span>
                        </div>

                        <div className="recommended-job-meta">
                          <span>
                            <MapPin size={14} /> {job.location}
                          </span>
                          <span>
                            <Clock3 size={14} /> {job.type}
                          </span>
                        </div>

                        <div className="recommended-job-bottom">
                          <strong>{job.salary}</strong>
                          <span>{job.posted}</span>
                        </div>
                      </div>

                      <Link
                        href="/professional/opportunities"
                        className="job-open-link"
                        aria-label={`View ${job.title}`}
                      >
                        <ArrowUpRight size={19} />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>

              <section className="professional-panel activity-panel">
                <div className="professional-panel-heading">
                  <div>
                    <span className="panel-eyebrow">YOUR RECENT UPDATES</span>
                    <h3>Recent activity</h3>
                  </div>
                  <Link
                    href="/professional/applications"
                    className="panel-view-all"
                  >
                    Applications <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="activity-list">
                  {activities.map((activity, index) => (
                    <div className="activity-item" key={activity.title}>
                      <div className={`activity-marker marker-${index}`}>
                        {index === 0 ? (
                          <CheckCircle2 size={17} />
                        ) : index === 1 ? (
                          <Eye size={17} />
                        ) : (
                          <Sparkles size={17} />
                        )}
                      </div>

                      <div className="activity-content">
                        <div className="activity-title-row">
                          <h4>{activity.title}</h4>
                          <span>{activity.status}</span>
                        </div>
                        <p>{activity.description}</p>
                        <small>
                          <CalendarDays size={13} /> {activity.time}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="professional-dashboard-side-column">
              <section className="professional-panel profile-progress-panel">
                <div className="professional-panel-heading">
                  <div>
                    <span className="panel-eyebrow">YOUR VISIBILITY</span>
                    <h3>Profile strength</h3>
                  </div>
                  <UserRound size={20} className="panel-heading-icon" />
                </div>

                <div className="profile-progress-content">
                  <div className="progress-ring">
                    <svg viewBox="0 0 120 120">
                      <circle
                        className="progress-ring-track"
                        cx="60"
                        cy="60"
                        r="49"
                      />
                      <circle
                        className="progress-ring-value"
                        cx="60"
                        cy="60"
                        r="49"
                      />
                    </svg>
                    <div className="progress-ring-label">
                      <strong>75%</strong>
                      <span>Complete</span>
                    </div>
                  </div>

                  <div className="progress-description">
                    <strong>Good progress!</strong>
                    <p>
                      Complete the remaining sections to make your profile
                      more attractive to employers.
                    </p>
                  </div>
                </div>

                <div className="profile-checklist">
                  <div className="checklist-item completed">
                    <CheckCircle2 size={17} />
                    <span>Personal information</span>
                  </div>
                  <div className="checklist-item completed">
                    <CheckCircle2 size={17} />
                    <span>Professional category</span>
                  </div>
                  <div className="checklist-item">
                    <Circle size={17} />
                    <span>Work experience</span>
                  </div>
                  <div className="checklist-item">
                    <Circle size={17} />
                    <span>Certificates and portfolio</span>
                  </div>
                </div>

                <Link
                  href="/professional/profile"
                  className="complete-profile-button"
                >
                  Complete my profile <ArrowRight size={16} />
                </Link>
              </section>

              <section className="professional-panel quick-actions-panel">
                <div className="professional-panel-heading">
                  <div>
                    <span className="panel-eyebrow">GET THINGS DONE</span>
                    <h3>Quick actions</h3>
                  </div>
                  <Plus size={20} className="panel-heading-icon" />
                </div>

                <Link
                  href="/professional/opportunities"
                  className="quick-action"
                >
                  <span className="quick-action-icon quick-green">
                    <Search size={18} />
                  </span>
                  <span>
                    <strong>Find opportunities</strong>
                    <small>Discover available opportunities</small>
                  </span>
                  <ChevronRight size={17} />
                </Link>

                <Link href="/professional/saved" className="quick-action">
                  <span className="quick-action-icon quick-orange">
                    <Bookmark size={18} />
                  </span>
                  <span>
                    <strong>Saved opportunities</strong>
                    <small>Return to saved opportunities</small>
                  </span>
                  <ChevronRight size={17} />
                </Link>

                <Link
                  href="/professional/profile"
                  className="quick-action"
                >
                  <span className="quick-action-icon quick-purple">
                    <UserRound size={18} />
                  </span>
                  <span>
                    <strong>Update profile</strong>
                    <small>Showcase your professional skills</small>
                  </span>
                  <ChevronRight size={17} />
                </Link>

                <Link
                  href="/professional/messages"
                  className="quick-action"
                >
                  <span className="quick-action-icon quick-blue">
                    <MessageCircle size={18} />
                  </span>
                  <span>
                    <strong>Messages</strong>
                    <small>Connect with employers</small>
                  </span>
                  <ChevronRight size={17} />
                </Link>

                <Link
                  href="/professional/notifications"
                  className="quick-action"
                >
                  <span className="quick-action-icon quick-blue">
                    <Bell size={18} />
                  </span>
                  <span>
                    <strong>Notifications</strong>
                    <small>Check your latest updates</small>
                  </span>
                  <ChevronRight size={17} />
                </Link>
              </section>

              <section className="career-tip-card">
                <div className="career-tip-icon">
                  <Sparkles size={21} />
                </div>
                <span>CAREER TIP</span>
                <h3>Let your skills speak for you.</h3>
                <p>
                  Add examples of your previous work to help employers
                  understand what you can deliver.
                </p>
                <Link href="/professional/profile">
                  Improve your profile <ArrowRight size={15} />
                </Link>
              </section>
            </aside>
          </div>

          <div className="professional-dashboard-footer-note">
            <span>
              <CheckCircle2 size={15} /> You are viewing your professional
              workspace.
            </span>
            <Link href="/professional/applications">
              Track your applications <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
