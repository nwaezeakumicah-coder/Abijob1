
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileCheck2,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./admin.css";

const stats = [
  {
    label: "Total users",
    value: "2,840",
    change: "+12.8%",
    detail: "Compared with last month",
    icon: Users,
    tone: "green",
  },
  {
    label: "Active job listings",
    value: "186",
    change: "+8.2%",
    detail: "Across Abia State",
    icon: BriefcaseBusiness,
    tone: "orange",
  },
  {
    label: "Registered employers",
    value: "324",
    change: "+6.4%",
    detail: "Businesses on Abi Job",
    icon: Building2,
    tone: "purple",
  },
  {
    label: "Pending approvals",
    value: "24",
    change: "Needs attention",
    detail: "Jobs awaiting review",
    icon: Clock3,
    tone: "yellow",
  },
];

const pendingJobs = [
  {
    title: "Frontend Developer",
    company: "BrightPath Technologies",
    location: "Aba, Abia State",
    type: "Full-time",
    submitted: "Today, 9:24 AM",
  },
  {
    title: "Fashion Designer",
    company: "Made in Aba Studio",
    location: "Ariaria, Aba",
    type: "Contract",
    submitted: "Today, 8:10 AM",
  },
  {
    title: "Customer Service Officer",
    company: "Greenfield Ventures",
    location: "Umuahia",
    type: "Full-time",
    submitted: "Yesterday",
  },
];

const activities = [
  {
    title: "New employer registered",
    detail: "BrightPath Technologies joined Abi Job.",
    time: "12 minutes ago",
    icon: Building2,
  },
  {
    title: "New job submitted",
    detail: "Frontend Developer is awaiting approval.",
    time: "35 minutes ago",
    icon: BriefcaseBusiness,
  },
  {
    title: "New job seeker registered",
    detail: "A new account was created in Aba.",
    time: "1 hour ago",
    icon: Users,
  },
  {
    title: "Job approved",
    detail: "Sales Representative was approved.",
    time: "2 hours ago",
    icon: CheckCircle2,
  },
];

const quickLinks = [
  {
    title: "Review job listings",
    description: "Approve or reject submitted jobs",
    href: "/admin/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Manage users",
    description: "View and manage registered accounts",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Verify employers",
    description: "Review business verification requests",
    href: "/admin/verifications",
    icon: ShieldCheck,
  },
  {
    title: "Manage subscriptions",
    description: "Monitor plans and subscription records",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
];

const navigation = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Job management",
    href: "/admin/jobs",
    icon: BriefcaseBusiness,
    count: "24",
  },
  {
    label: "User management",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Employers",
    href: "/admin/employers",
    icon: Building2,
  },
  {
    label: "Verifications",
    href: "/admin/verifications",
    icon: FileCheck2,
  },
  {
    label: "Reports & analytics",
    href: "/admin/reports",
    icon: Activity,
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <Image
            src="/images/abijob-logo-white.png"
            alt="Abi Job — Opportunity Starts Here"
            width={170}
            height={65}
            priority
            className="admin-brand-logo"
          />
        </Link>

        <div className="admin-sidebar-label">WORKSPACE</div>

        <nav className="admin-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.href}
                className={`admin-nav-link ${
                  item.href === "/admin" ? "active" : ""
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.count && (
                  <span className="admin-nav-count">{item.count}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-label admin-tools-label">
          PREFERENCES
        </div>

        <nav className="admin-nav">
          <Link href="/admin/settings" className="admin-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-security-card">
            <div className="admin-security-icon">
              <ShieldCheck size={20} />
            </div>

            <strong>Platform security</strong>

            <p>Keep Abi Job safe and trustworthy for everyone.</p>

            <Link href="/admin/settings">
              Review settings <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">SA</div>

            <div className="admin-user-info">
              <strong>Super Admin</strong>
              <span>Platform administrator</span>
            </div>

            <MoreHorizontal size={20} />
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>Overview</strong>
          </div>

          <div className="admin-topbar-actions">
            <label className="admin-search">
              <Search size={17} />
              <input type="search" placeholder="Search anything..." />
              <span>⌘ K</span>
            </label>

            <button
              type="button"
              className="admin-icon-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>

            <div className="admin-topbar-profile">
              <div className="admin-avatar">SA</div>

              <div>
                <strong>Super Admin</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-welcome">
            <div>
              <div className="admin-eyebrow">
                <span className="admin-live-dot" />
                PLATFORM OVERVIEW
              </div>

              <h1>Good morning, Admin.</h1>

              <p>
                Here is what is happening across Abi Job. Manage opportunities,
                people and platform activity from one place.
              </p>
            </div>

            <div className="admin-date">
              <CalendarDays size={17} />
              <span>Sunday, November 1, 2026</span>
            </div>
          </section>

          <section className="admin-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article className="admin-stat-card" key={stat.label}>
                  <div className="admin-stat-top">
                    <div className={`admin-stat-icon ${stat.tone}`}>
                      <Icon size={21} />
                    </div>

                    <button
                      type="button"
                      className="admin-more-button"
                      aria-label={`More options for ${stat.label}`}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <p>{stat.label}</p>

                  <div className="admin-stat-value">{stat.value}</div>

                  <div className="admin-stat-bottom">
                    <span className="admin-stat-change">{stat.change}</span>
                    <span>{stat.detail}</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="admin-middle-grid">
            <article className="admin-panel admin-pending-panel">
              <div className="admin-panel-heading">
                <div>
                  <div className="admin-section-kicker">
                    REQUIRES ATTENTION
                  </div>

                  <h2>Jobs awaiting approval</h2>

                  <p>
                    Review new listings before they appear publicly.
                  </p>
                </div>

                <Link href="/admin/jobs" className="admin-text-link">
                  View all <ArrowUpRight size={16} />
                </Link>
              </div>

              <div className="admin-pending-list">
                {pendingJobs.map((job) => (
                  <div className="admin-pending-item" key={job.title}>
                    <div className="admin-job-icon">
                      <BriefcaseBusiness size={20} />
                    </div>

                    <div className="admin-pending-info">
                      <strong>{job.title}</strong>
                      <span>{job.company}</span>

                      <div className="admin-job-meta">
                        <span>
                          <MapPin size={13} />
                          {job.location}
                        </span>

                        <span>{job.type}</span>
                      </div>
                    </div>

                    <div className="admin-pending-actions">
                      <span>{job.submitted}</span>

                      <Link
                        href="/admin/jobs"
                        aria-label={`Review ${job.title}`}
                      >
                        Review <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/admin/jobs" className="admin-view-queue">
                Open approval queue <ArrowUpRight size={16} />
              </Link>
            </article>

            <article className="admin-panel admin-activity-panel">
              <div className="admin-panel-heading">
                <div>
                  <div className="admin-section-kicker">LIVE UPDATES</div>
                  <h2>Recent activity</h2>
                  <p>Latest actions across the platform.</p>
                </div>

                <button
                  type="button"
                  className="admin-more-button"
                  aria-label="More activity options"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="admin-activity-list">
                {activities.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      className="admin-activity-item"
                      key={activity.title}
                    >
                      <div className="admin-activity-icon">
                        <Icon size={17} />
                      </div>

                      <div className="admin-activity-copy">
                        <strong>{activity.title}</strong>
                        <p>{activity.detail}</p>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href="/admin/reports" className="admin-activity-link">
                View platform activity <ArrowUpRight size={15} />
              </Link>
            </article>
          </section>

          <section className="admin-bottom-grid">
            <article className="admin-panel admin-quick-panel">
              <div className="admin-panel-heading">
                <div>
                  <div className="admin-section-kicker">QUICK ACCESS</div>
                  <h2>Manage your platform</h2>
                  <p>
                    Go directly to the tasks that need your attention.
                  </p>
                </div>
              </div>

              <div className="admin-quick-links">
                {quickLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      href={item.href}
                      className="admin-quick-link"
                      key={item.title}
                    >
                      <div className="admin-quick-icon">
                        <Icon size={21} />
                      </div>

                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>

                      <ChevronRight size={19} />
                    </Link>
                  );
                })}
              </div>
            </article>

            <article className="admin-panel admin-health-panel">
              <div className="admin-section-kicker">PLATFORM STATUS</div>

              <h2>Abi Job is running</h2>

              <p>
                Your platform overview is ready. Continue monitoring
                registrations, job submissions and verification requests.
              </p>

              <div className="admin-health-status">
                <span className="admin-health-indicator" />
                <strong>All systems operational</strong>
              </div>

              <div className="admin-health-footer">
                <div>
                  <span>Platform</span>
                  <strong>Abi Job</strong>
                </div>

                <div>
                  <span>Environment</span>
                  <strong>Development preview</strong>
                </div>
              </div>
            </article>
          </section>

          <footer className="admin-footer">
            <span>© 2026 Abi Job. Opportunity starts here.</span>
            <span>Admin workspace · Frontend preview</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
