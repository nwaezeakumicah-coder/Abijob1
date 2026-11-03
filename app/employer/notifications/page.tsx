"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  MessageSquare,
  UserRound,
  Settings,
  Bell,
  Menu,
  X,
  Check,
  CheckCheck,
  FileText,
  UserPlus,
  ShieldCheck,
  Clock,
  ArrowRight,
  Trash2,
} from "lucide-react";
import Logo from "../../../components/Logo";
import "./notifications.css";

type Notification = {
  id: number;
  title: string;
  description: string;
  time: string;
  category: "application" | "job" | "account" | "system";
  unread: boolean;
  href: string;
};

type AccountRole = "job-seeker" | "professional" | "employer";

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "New application received",
    description:
      "A candidate has submitted an application for your Frontend Developer vacancy.",
    time: "10 minutes ago",
    category: "application",
    unread: true,
    href: "/employer/applicants",
  },
  {
    id: 2,
    title: "Your job posting is under review",
    description:
      "Your recently submitted job vacancy is awaiting administrator approval.",
    time: "2 hours ago",
    category: "job",
    unread: true,
    href: "/employer/jobs",
  },
  {
    id: 3,
    title: "New candidate application",
    description:
      "You have received a new application for your Customer Service Officer vacancy.",
    time: "Yesterday",
    category: "application",
    unread: true,
    href: "/employer/applicants",
  },
  {
    id: 4,
    title: "Employer profile reminder",
    description:
      "Complete your company profile to help candidates learn more about your business.",
    time: "2 days ago",
    category: "account",
    unread: false,
    href: "/employer/profile",
  },
  {
    id: 5,
    title: "Welcome to Abi Job",
    description:
      "Your employer account has been created. You can now manage vacancies and applications.",
    time: "3 days ago",
    category: "system",
    unread: false,
    href: "/employer/dashboard",
  },
];

const categoryDetails = {
  application: {
    label: "Applications",
    icon: UserPlus,
    color: "application",
  },
  job: {
    label: "Job updates",
    icon: BriefcaseBusiness,
    color: "job",
  },
  account: {
    label: "Account",
    icon: ShieldCheck,
    color: "account",
  },
  system: {
    label: "System",
    icon: Bell,
    color: "system",
  },
};

const roleStorageKeys = [
  "abijob-user",
  "abijob-current-user",
  "abijob-auth-user",
  "abijob-profile",
  "abijob-account",
];

function normalizeRole(value: unknown): AccountRole | null {
  if (typeof value !== "string") return null;

  const role = value.toLowerCase().trim().replace(/[\s_]+/g, "-");

  if (
    ["employer", "company", "business", "business-owner"].includes(role)
  ) {
    return "employer";
  }

  if (
    [
      "professional",
      "skilled-professional",
      "artisan",
      "skilled-professional-artisan",
      "skilled-professionals-artisans",
    ].includes(role)
  ) {
    return "professional";
  }

  if (
    ["job-seeker", "jobseeker", "candidate", "seeker"].includes(role)
  ) {
    return "job-seeker";
  }

  return null;
}

function getStoredAccountRole(): AccountRole | null {
  if (typeof window === "undefined") return null;

  for (const key of roleStorageKeys) {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (!storedValue) continue;

      const parsed = JSON.parse(storedValue);

      if (typeof parsed === "string") {
        const role = normalizeRole(parsed);
        if (role) return role;
      }

      if (parsed && typeof parsed === "object") {
        const candidates = [
          parsed.role,
          parsed.accountType,
          parsed.account_type,
          parsed.userType,
          parsed.user_type,
          parsed.type,
          parsed.user?.role,
          parsed.user?.accountType,
          parsed.user?.account_type,
          parsed.profile?.role,
          parsed.profile?.accountType,
          parsed.profile?.account_type,
          parsed.account?.role,
          parsed.user_metadata?.role,
          parsed.user_metadata?.account_type,
        ];

        for (const candidate of candidates) {
          const role = normalizeRole(candidate);
          if (role) return role;
        }
      }
    } catch {
      const role = normalizeRole(window.localStorage.getItem(key));
      if (role) return role;
    }
  }

  return null;
}

export default function EmployerNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    const role = getStoredAccountRole();

    if (role === "job-seeker") {
      router.replace("/dashboard");
      return;
    }

    if (role === "professional") {
      router.replace("/professional/dashboard");
      return;
    }

    setAccessChecked(true);
  }, [router]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "unread") return notification.unread;
    if (activeFilter === "read") return !notification.unread;
    return true;
  });

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  }

  function deleteNotification(id: number) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }

  function clearAllNotifications() {
    setNotifications([]);
  }

  if (!accessChecked) {
    return (
      <main className="employer-notifications-page employer-notifications-loading">
        <div className="employer-notifications-loading-card">
          <span className="employer-notifications-spinner" />
          <p>Checking your workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="employer-notifications-page">
      {mobileMenuOpen && (
        <button
          className="employer-notifications-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`employer-notifications-sidebar ${
          mobileMenuOpen ? "open" : ""
        }`}
      >
        <div className="employer-notifications-brand">
          <Logo href="/" size="medium" light />
          <button
            className="employer-notifications-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="employer-notifications-workspace">
          <span className="employer-notifications-workspace-icon">
            <BriefcaseBusiness size={17} />
          </span>
          <div>
            <strong>Employer workspace</strong>
            <span>Manage your business</span>
          </div>
        </div>

        <span className="employer-notifications-nav-label">
          WORKSPACE
        </span>

        <nav className="employer-notifications-nav" aria-label="Employer workspace">
          <Link href="/employer/dashboard">
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>

          <Link href="/employer/jobs">
            <BriefcaseBusiness size={19} />
            <span>My job postings</span>
          </Link>

          <Link href="/employer/applicants">
            <Users size={19} />
            <span>Applicants</span>
          </Link>

          <Link href="/employer/messages">
            <MessageSquare size={19} />
            <span>Messages</span>
          </Link>

          <Link href="/professionals">
            <UserRound size={19} />
            <span>Find professionals</span>
          </Link>

          <Link href="/employer/notifications" className="active">
            <Bell size={19} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="employer-notifications-nav-count">
                {unreadCount}
              </span>
            )}
          </Link>
        </nav>

        <span className="employer-notifications-nav-label account-label">
          ACCOUNT
        </span>

        <nav className="employer-notifications-nav" aria-label="Employer account">
          <Link href="/employer/profile">
            <UserRound size={19} />
            <span>Company profile</span>
          </Link>

          <Link href="/employer/settings">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="employer-notifications-sidebar-bottom">
          <div className="employer-notifications-help-card">
            <div className="employer-notifications-help-icon">
              <ShieldCheck size={20} />
            </div>
            <strong>Need assistance?</strong>
            <p>Our support team is available to help your business.</p>
            <Link href="/support">
              Contact support <ArrowRight size={14} />
            </Link>
          </div>

          <Link
            href="/"
            className="employer-notifications-home-link"
          >
            Back to Abi Job
          </Link>
        </div>
      </aside>

      <section className="employer-notifications-main">
        <header className="employer-notifications-topbar">
          <div className="employer-notifications-topbar-left">
            <button
              className="employer-notifications-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <span className="employer-notifications-breadcrumb">
                Employer workspace / Notifications
              </span>
              <h2>Notifications</h2>
            </div>
          </div>

          <div className="employer-notifications-topbar-right">
            <Link
              href="/employer/messages"
              className="employer-notifications-top-icon"
              aria-label="Messages"
            >
              <MessageSquare size={19} />
            </Link>

            <Link
              href="/employer/notifications"
              className="employer-notifications-top-icon selected"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && <span />}
            </Link>

            <Link
              href="/employer/profile"
              className="employer-notifications-avatar"
              aria-label="Company profile"
            >
              E
            </Link>
          </div>
        </header>

        <div className="employer-notifications-content">
          <div className="employer-notifications-heading">
            <div>
              <span className="employer-notifications-eyebrow">
                STAY INFORMED
              </span>
              <h1>Your notifications</h1>
              <p>
                Keep track of applications, job updates and important account
                activity.
              </p>
            </div>

            <div className="employer-notifications-heading-icon">
              <Bell size={28} />
            </div>
          </div>

          <div className="employer-notifications-stats">
            <div className="employer-notifications-stat-card">
              <span className="employer-notifications-stat-icon total">
                <Bell size={20} />
              </span>
              <div>
                <strong>{notifications.length}</strong>
                <span>Total notifications</span>
              </div>
            </div>

            <div className="employer-notifications-stat-card">
              <span className="employer-notifications-stat-icon unread">
                <FileText size={20} />
              </span>
              <div>
                <strong>{unreadCount}</strong>
                <span>Unread notifications</span>
              </div>
            </div>

            <div className="employer-notifications-stat-card">
              <span className="employer-notifications-stat-icon read">
                <CheckCheck size={20} />
              </span>
              <div>
                <strong>{notifications.length - unreadCount}</strong>
                <span>Read notifications</span>
              </div>
            </div>
          </div>

          <div className="employer-notifications-panel">
            <div className="employer-notifications-panel-header">
              <div>
                <h3>Recent activity</h3>
                <p>
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${
                        unreadCount === 1 ? "" : "s"
                      }.`
                    : "You're all caught up."}
                </p>
              </div>

              <div className="employer-notifications-actions">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck size={16} />
                  Mark all as read
                </button>

                <button
                  className="clear-button"
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                >
                  <Trash2 size={16} />
                  Clear all
                </button>
              </div>
            </div>

            <div className="employer-notifications-filters">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "read", label: "Read" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  className={activeFilter === filter.id ? "active" : ""}
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={activeFilter === filter.id}
                >
                  {filter.label}
                  {filter.id === "unread" && unreadCount > 0 && (
                    <span>{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="employer-notifications-list">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const details = categoryDetails[notification.category];
                  const CategoryIcon = details.icon;

                  return (
                    <article
                      key={notification.id}
                      className={`employer-notification-item ${
                        notification.unread ? "unread" : ""
                      }`}
                    >
                      <div
                        className={`employer-notification-icon ${details.color}`}
                      >
                        <CategoryIcon size={21} />
                      </div>

                      <div className="employer-notification-details">
                        <div className="employer-notification-title-row">
                          <h4>{notification.title}</h4>
                          {notification.unread && (
                            <span className="employer-notification-new">
                              NEW
                            </span>
                          )}
                        </div>

                        <p>{notification.description}</p>

                        <div className="employer-notification-meta">
                          <span>
                            <Clock size={13} />
                            {notification.time}
                          </span>
                          <span className="employer-notification-category">
                            {details.label}
                          </span>
                        </div>

                        <div className="employer-notification-item-actions">
                          <Link
                            href={notification.href}
                            onClick={() => markAsRead(notification.id)}
                          >
                            View details <ArrowRight size={14} />
                          </Link>

                          {notification.unread && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check size={14} />
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        className="employer-notification-delete"
                        onClick={() =>
                          deleteNotification(notification.id)
                        }
                        aria-label={`Delete notification: ${notification.title}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="employer-notifications-empty">
                  <div>
                    <Bell size={28} />
                  </div>
                  <h3>No notifications here</h3>
                  <p>
                    {activeFilter === "unread"
                      ? "You have no unread notifications."
                      : activeFilter === "read"
                      ? "You have no read notifications."
                      : "Your notifications will appear here when there is new activity."}
                  </p>
                  {activeFilter !== "all" && (
                    <button onClick={() => setActiveFilter("all")}>
                      View all notifications
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="employer-notifications-footer-note">
            <ShieldCheck size={17} />
            <span>
              Important account and job activity updates will appear here.
            </span>
          </div>

          <div className="employer-notifications-demo-notice">
            <strong>Preview mode:</strong> These are sample notifications.
            Your real-time notifications will be connected when the Abi Job
            backend is implemented.
          </div>
        </div>
      </section>
    </main>
  );
}