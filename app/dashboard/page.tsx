"use client";

import Link from "next/link";
import { useState } from "react";
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
import "./dashboard.css";

const recommendedJobs = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "Digital Solutions",
    location: "Aba, Abia State",
    type: "Full-time",
    salary: "₦150k – ₦250k",
    initials: "DS",
    color: "green",
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Customer Service Officer",
    company: "Business Hub",
    location: "Umuahia, Abia State",
    type: "Full-time",
    salary: "₦80k – ₦120k",
    initials: "BH",
    color: "orange",
    posted: "1 day ago",
  },
  {
    id: 3,
    title: "Graphic Designer",
    company: "Creative Edge Studio",
    location: "Aba, Abia State",
    type: "Hybrid",
    salary: "₦100k – ₦180k",
    initials: "CE",
    color: "purple",
    posted: "3 days ago",
  },
];

const activities = [
  {
    title: "Your profile is waiting for completion",
    detail: "Add your skills and experience to improve your visibility.",
    time: "Get started",
    icon: UserRound,
  },
  {
    title: "New opportunities are available",
    detail: "Explore recently listed jobs across Abia State.",
    time: "Explore jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Build your professional profile",
    detail: "Add a CV or portfolio to stand out to employers.",
    time: "Update profile",
    icon: FileText,
  },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

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
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`dashboard-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="dashboard-brand">
          <Logo href="/" size="medium" />
          <button
            className="dashboard-close-menu"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="dashboard-sidebar-label">WORKSPACE</div>

        <nav className="dashboard-nav">
          <Link
            href="/dashboard"
            className="dashboard-nav-link active"
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
            <span className="dashboard-nav-count">3</span>
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

        <nav className="dashboard-nav">
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
            <p>Complete your profile to help employers discover you.</p>
            <Link href="/profile">
              Complete profile <ArrowRight size={15} />
            </Link>
          </div>

          <div className="dashboard-sidebar-user">
            <div className="dashboard-avatar">M</div>
            <div>
              <strong>Welcome, Micah</strong>
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
            className="dashboard-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
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
              <span />
            </Link>

            <Link href="/profile" className="dashboard-topbar-profile">
              <div className="dashboard-avatar dashboard-avatar-small">M</div>
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
              <h1>Good day, Micah <span>👋</span></h1>
              <p>
                Here's what's happening with your opportunities today.
              </p>
            </div>

            <Link href="/jobs" className="dashboard-primary-button">
              Explore opportunities
              <ArrowUpRight size={18} />
            </Link>
          </section>

          <section className="dashboard-profile-progress">
            <div className="dashboard-progress-copy">
              <div className="dashboard-progress-icon">
                <UserRound size={21} />
              </div>
              <div>
                <span>YOUR PROFILE</span>
                <h2>You're off to a good start!</h2>
                <p>
                  Complete your profile so employers can learn more about you.
                </p>
              </div>
            </div>

            <div className="dashboard-progress-action">
              <div className="dashboard-progress-number">
                <strong>40%</strong>
                <span>Completed</span>
              </div>
              <div className="dashboard-progress-track">
                <span />
              </div>
              <Link href="/profile">
                Complete your profile <ArrowRight size={16} />
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
              <strong>0</strong>
              <p>No applications submitted yet</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <span>Saved jobs</span>
                <div className="dashboard-stat-icon orange">
                  <Bookmark size={20} />
                </div>
              </div>
              <strong>{savedJobs.length}</strong>
              <p>Opportunities you've bookmarked</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <span>Profile views</span>
                <div className="dashboard-stat-icon purple">
                  <Users size={20} />
                </div>
              </div>
              <strong>0</strong>
              <p>Employer profile views</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <span>Profile status</span>
                <div className="dashboard-stat-icon blue">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <strong className="dashboard-status-text">In progress</strong>
              <p>Keep adding your information</p>
            </article>
          </section>

          <div className="dashboard-main-grid">
            <section className="dashboard-jobs-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-eyebrow">
                    MADE FOR YOUR NEXT MOVE
                  </span>
                  <h2>Recommended opportunities</h2>
                  <p>Explore roles you may be interested in.</p>
                </div>

                <Link href="/jobs" className="dashboard-view-all">
                  View all jobs <ArrowRight size={16} />
                </Link>
              </div>

              <div className="dashboard-job-list">
                {recommendedJobs.map((job) => (
                  <article className="dashboard-job-card" key={job.id}>
                    <div className={`dashboard-company-logo ${job.color}`}>
                      {job.initials}
                    </div>

                    <div className="dashboard-job-info">
                      <div className="dashboard-job-title-row">
                        <h3>{job.title}</h3>
                        <span className="dashboard-job-posted">
                          {job.posted}
                        </span>
                      </div>

                      <p className="dashboard-job-company">
                        {job.company}
                      </p>

                      <div className="dashboard-job-meta">
                        <span>
                          <MapPin size={14} />
                          {job.location}
                        </span>
                        <span>
                          <Clock3 size={14} />
                          {job.type}
                        </span>
                      </div>

                      <strong className="dashboard-job-salary">
                        {job.salary}
                      </strong>
                    </div>

                    <button
                      className={`dashboard-save-job ${
                        savedJobs.includes(job.id) ? "saved" : ""
                      }`}
                      onClick={() => toggleSavedJob(job.id)}
                      aria-label={
                        savedJobs.includes(job.id)
                          ? "Remove saved job"
                          : "Save job"
                      }
                      title={
                        savedJobs.includes(job.id)
                          ? "Remove saved job"
                          : "Save job"
                      }
                    >
                      <Bookmark
                        size={19}
                        fill={
                          savedJobs.includes(job.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="dashboard-activity-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-eyebrow">
                    STAY ON TRACK
                  </span>
                  <h2>Recent activity</h2>
                </div>
              </div>

              <div className="dashboard-activity-list">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;

                  return (
                    <div className="dashboard-activity-item" key={index}>
                      <div className="dashboard-activity-icon">
                        <Icon size={18} />
                      </div>

                      <div className="dashboard-activity-copy">
                        <strong>{activity.title}</strong>
                        <p>{activity.detail}</p>
                        <Link
                          href={
                            index === 1
                              ? "/jobs"
                              : "/profile"
                          }
                        >
                          {activity.time} <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href="/notifications" className="dashboard-activity-footer">
                View all activity <ArrowRight size={16} />
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
                Add your skills, experience, and qualifications to your profile.
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