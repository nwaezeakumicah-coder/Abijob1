
"use client";

import { useCallback, useEffect, useState } from "react";
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
import { createClient } from "../../../lib/supabase/client";
import "./notifications.css";

type NotificationCategory =
  | "application"
  | "job"
  | "account"
  | "system";

type Notification = {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

type FilterType = "all" | "unread" | "read";

const categoryDetails = {
  application: {
    label: "Applications",
    icon: UserPlus,
    color: "application",
    fallbackHref: "/employer/applicants",
  },
  job: {
    label: "Job updates",
    icon: BriefcaseBusiness,
    color: "job",
    fallbackHref: "/employer/jobs",
  },
  account: {
    label: "Account",
    icon: ShieldCheck,
    color: "account",
    fallbackHref: "/employer/profile",
  },
  system: {
    label: "System",
    icon: Bell,
    color: "system",
    fallbackHref: "/employer/dashboard",
  },
};

function normalizeRole(value: unknown): string | null {
  if (typeof value !== "string") return null;

  return value.toLowerCase().trim().replace(/[\s_]+/g, "-");
}

function getNotificationHref(notification: Notification): string {
  const allowedFallback =
    categoryDetails[notification.category]?.fallbackHref ??
    "/employer/dashboard";

  const href = notification.href?.trim();

  // Only allow safe internal links in the employer workspace.
  if (
    href &&
    href.startsWith("/") &&
    !href.startsWith("//") &&
    !href.includes("\\") &&
    (
      href === "/employer" ||
      href.startsWith("/employer/") ||
      href === "/support"
    )
  ) {
    return href;
  }

  return allowedFallback;
}

function formatNotificationTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(seconds);

  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (absoluteSeconds < 60) {
    return formatter.format(Math.round(seconds), "second");
  }

  if (absoluteSeconds < 3600) {
    return formatter.format(Math.round(seconds / 60), "minute");
  }

  if (absoluteSeconds < 86400) {
    return formatter.format(Math.round(seconds / 3600), "hour");
  }

  if (absoluteSeconds < 604800) {
    return formatter.format(Math.round(seconds / 86400), "day");
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EmployerNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = useCallback(async (currentUserId: string) => {
    const supabase = createClient();

    const { data, error: queryError } = await supabase
      .from("notifications")
      .select(
        "id, title, description, category, href, is_read, created_at"
      )
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Notification loading error:", queryError);
      setError("We couldn't load your notifications. Please try again.");
      return;
    }

    const validCategories: NotificationCategory[] = [
      "application",
      "job",
      "account",
      "system",
    ];

    const rows = (data ?? []).map((item) => ({
      ...item,
      category: validCategories.includes(
        item.category as NotificationCategory
      )
        ? (item.category as NotificationCategory)
        : "system",
    })) as Notification[];

    setNotifications(rows);
    setError("");
  }, []);

  useEffect(() => {
    let active = true;

    async function initializePage() {
      const supabase = createClient();

      try {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (authError || !data.user) {
          router.replace("/login?redirect=/employer/notifications");
          return;
        }

        const user = data.user;

        const roleCandidates = [
          user.app_metadata?.role,
          user.user_metadata?.role,
          user.user_metadata?.account_type,
          user.user_metadata?.accountType,
          user.user_metadata?.user_type,
        ];

        const roles = roleCandidates
          .map(normalizeRole)
          .filter(Boolean);

        const knownRole = roles.find((role) =>
          [
            "employer",
            "job-seeker",
            "jobseeker",
            "candidate",
            "professional",
            "artisan",
            "skilled-professional",
            "skilled-professionals-artisans",
          ].includes(role as string)
        );

        if (
          knownRole &&
          [
            "job-seeker",
            "jobseeker",
            "candidate",
            "professional",
            "artisan",
            "skilled-professional",
            "skilled-professionals-artisans",
          ].includes(knownRole)
        ) {
          router.replace(
            knownRole === "professional" ||
            knownRole === "artisan" ||
            knownRole === "skilled-professional" ||
            knownRole === "skilled-professionals-artisans"
              ? "/professional/dashboard"
              : "/dashboard"
          );
          return;
        }

        if (knownRole !== "employer") {
          const { data: employerProfile, error: profileError } =
            await supabase
              .from("employer_profiles")
              .select("user_id")
              .eq("user_id", user.id)
              .maybeSingle();

          if (profileError || !employerProfile) {
            router.replace("/dashboard");
            return;
          }
        }

        if (!active) return;

        setUserId(user.id);
        setAccessChecked(true);

        await loadNotifications(user.id);
      } catch (initializationError) {
        console.error(
          "Employer notifications initialization error:",
          initializationError
        );

        if (active) {
          setError(
            "Something went wrong while opening your notifications."
          );
          setAccessChecked(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializePage();

    return () => {
      active = false;
    };
  }, [router, loadNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = notifications.filter(
    (notification) => {
      if (activeFilter === "unread") return !notification.is_read;
      if (activeFilter === "read") return notification.is_read;
      return true;
    }
  );

  async function markAsRead(id: string) {
    if (!userId || actionLoading) return;

    setActionLoading(true);
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Mark notification as read error:", updateError);
      setError("We couldn't update this notification.");
      setActionLoading(false);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification
      )
    );

    setActionLoading(false);
  }

  async function markAllAsRead() {
    if (!userId || unreadCount === 0 || actionLoading) return;

    setActionLoading(true);
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (updateError) {
      console.error("Mark all notifications as read error:", updateError);
      setError("We couldn't update your notifications.");
      setActionLoading(false);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );

    setActionLoading(false);
  }

  async function deleteNotification(id: string) {
    if (!userId || actionLoading) return;

    setActionLoading(true);
    setError("");

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Delete notification error:", deleteError);
      setError("We couldn't delete this notification.");
      setActionLoading(false);
      return;
    }

    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );

    setActionLoading(false);
  }

  async function clearAllNotifications() {
    if (!userId || notifications.length === 0 || actionLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete all your notifications?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Clear notifications error:", deleteError);
      setError("We couldn't clear your notifications.");
      setActionLoading(false);
      return;
    }

    setNotifications([]);
    setActionLoading(false);
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

        <nav
          className="employer-notifications-nav"
          aria-label="Employer workspace"
        >
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

        <nav
          className="employer-notifications-nav"
          aria-label="Employer account"
        >
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
                Keep track of applications, job updates and important
                account activity.
              </p>
            </div>

            <div className="employer-notifications-heading-icon">
              <Bell size={28} />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "13px 16px",
                marginBottom: 20,
                border: "1px solid #f0c9c5",
                borderRadius: 9,
                background: "#fff4f2",
                color: "#a43d35",
                fontSize: 13,
              }}
            >
              {error}
              <button
                type="button"
                onClick={() => userId && loadNotifications(userId)}
                style={{
                  marginLeft: 12,
                  border: 0,
                  background: "transparent",
                  color: "#176b45",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}

          <div className="employer-notifications-stats">
            <div className="employer-notifications-stat-card">
              <span className="employer-notifications-stat-icon total">
                <Bell size={20} />
              </span>
              <div>
                <strong>{loading ? "—" : notifications.length}</strong>
                <span>Total notifications</span>
              </div>
            </div>

            <div className="employer-notifications-stat-card">
              <span className="employer-notifications-stat-icon unread">
                <FileText size={20} />
              </span>
              <div>
                <strong>{loading ? "—" : unreadCount}</strong>
                <span>Unread notifications</span>
              </div>
            </div>

            <div className="employer-notifications-stat-card">
              <span className="employer-notifications-stat-icon read">
                <CheckCheck size={20} />
              </span>
              <div>
                <strong>{loading ? "—" : readCount}</strong>
                <span>Read notifications</span>
              </div>
            </div>
          </div>

          <div className="employer-notifications-panel">
            <div className="employer-notifications-panel-header">
              <div>
                <h3>Recent activity</h3>
                <p>
                  {loading
                    ? "Loading your notifications..."
                    : unreadCount > 0
                    ? `You have ${unreadCount} unread notification${
                        unreadCount === 1 ? "" : "s"
                      }.`
                    : "You're all caught up."}
                </p>
              </div>

              <div className="employer-notifications-actions">
                <button
                  onClick={markAllAsRead}
                  disabled={
                    loading || unreadCount === 0 || actionLoading
                  }
                >
                  <CheckCheck size={16} />
                  Mark all as read
                </button>

                <button
                  className="clear-button"
                  onClick={clearAllNotifications}
                  disabled={
                    loading ||
                    notifications.length === 0 ||
                    actionLoading
                  }
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
                  className={
                    activeFilter === filter.id ? "active" : ""
                  }
                  onClick={() =>
                    setActiveFilter(filter.id as FilterType)
                  }
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
              {loading ? (
                <div className="employer-notifications-empty">
                  <span className="employer-notifications-spinner" />
                  <p>Loading notifications...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const details =
                    categoryDetails[notification.category];
                  const CategoryIcon = details.icon;

                  return (
                    <article
                      key={notification.id}
                      className={`employer-notification-item ${
                        !notification.is_read ? "unread" : ""
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
                          {!notification.is_read && (
                            <span className="employer-notification-new">
                              NEW
                            </span>
                          )}
                        </div>

                        <p>{notification.description}</p>

                        <div className="employer-notification-meta">
                          <span>
                            <Clock size={13} />
                            {formatNotificationTime(
                              notification.created_at
                            )}
                          </span>
                          <span className="employer-notification-category">
                            {details.label}
                          </span>
                        </div>

                        <div className="employer-notification-item-actions">
                          <Link
                            href={getNotificationHref(notification)}
                            onClick={() => {
                              if (!notification.is_read) {
                                void markAsRead(notification.id);
                              }
                            }}
                          >
                            View details <ArrowRight size={14} />
                          </Link>

                          {!notification.is_read && (
                            <button
                              onClick={() =>
                                markAsRead(notification.id)
                              }
                              disabled={actionLoading}
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
                        disabled={actionLoading}
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
              Your notifications are private to your employer account.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
