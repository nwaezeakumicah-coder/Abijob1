
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  FileText,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import "./notifications.css";

type NotificationType =
  | "application"
  | "job"
  | "profile"
  | "message"
  | "service_request"
  | "system";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  href: string | null;
};

type FilterType = "all" | "unread" | "read";

const supabase = createClient();

function normalizeRole(value: unknown): string | null {
  if (typeof value !== "string") return null;

  return value.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function normalizeNotificationType(value: unknown): NotificationType {
  if (
    value === "application" ||
    value === "job" ||
    value === "profile" ||
    value === "message" ||
    value === "service_request" ||
    value === "system"
  ) {
    return value;
  }

  return "system";
}

function formatNotificationDate(date: string) {
  const notificationDate = new Date(date);
  const now = new Date();

  if (Number.isNaN(notificationDate.getTime())) {
    return "Recently";
  }

  const difference = Math.max(
    0,
    now.getTime() - notificationDate.getTime()
  );

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return notificationDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "application":
      return <FileText size={19} />;
    case "job":
      return <BriefcaseBusiness size={19} />;
    case "profile":
      return <UserRound size={19} />;
    case "message":
      return <MessageCircle size={19} />;
    default:
      return <Bell size={19} />;
  }
}

function getNotificationLabel(type: NotificationType) {
  switch (type) {
    case "application":
      return "Application";
    case "job":
      return "Job alert";
    case "profile":
      return "Profile";
    case "message":
      return "Message";
    case "service_request":
      return "Service request";
    default:
      return "Abijob";
  }
}

function mapDatabaseNotification(row: {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string | null;
  is_read: boolean;
  created_at: string;
}): NotificationItem {
  return {
    id: row.id,
    type: normalizeNotificationType(row.category),
    title: row.title,
    message: row.description,
    date: row.created_at,
    read: row.is_read,
    href: row.href,
  };
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, title, description, category, href, is_read, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load notifications:", error);
      setErrorMessage(
        "We couldn't load your notifications. Please try again."
      );
      return;
    }

    setNotifications((data ?? []).map(mapDatabaseNotification));
    setErrorMessage("");
  }, []);

  // Authenticate the user and verify their actual database role.
  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?next=/notifications");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile?.role) {
          console.error(
            "Could not verify account role:",
            profileError
          );
          router.replace("/login?error=profile_missing");
          return;
        }

        const role = normalizeRole(profile.role);

        if (!active) return;

        if (role === "professional") {
          router.replace("/professional/notifications");
          return;
        }

        if (role === "employer") {
          router.replace("/employer/notifications");
          return;
        }

        if (role === "admin") {
          router.replace("/admin");
          return;
        }

        if (role !== "job_seeker") {
          router.replace("/login");
          return;
        }

        setCurrentUserId(user.id);
        setAccessChecked(true);

        await loadNotifications(user.id);
      } catch (error) {
        console.error("Notification access check failed:", error);

        if (active) {
          setErrorMessage(
            "Something went wrong while loading your notifications."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkAccess();

    return () => {
      active = false;
    };
  }, [router, loadNotifications]);

  // Listen for new notifications and changes to existing notifications.
  useEffect(() => {
    if (!currentUserId || !accessChecked) return;

    const channel = supabase
      .channel(`job-seeker-notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          void loadNotifications(currentUserId);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Notifications Realtime subscription failed."
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, accessChecked, loadNotifications]);

  // Allow notification dialogs to close with Escape.
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedNotification(null);
        setShowClearConfirm(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const readCount = notifications.filter(
    (item) => item.read
  ).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && !item.read) ||
        (activeFilter === "read" && item.read);

      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        getNotificationLabel(item.type).toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [notifications, activeFilter, searchQuery]);

  async function markAsRead(id: string) {
    if (!currentUserId) return;

    const existing = notifications.find((item) => item.id === id);

    if (!existing || existing.read) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", currentUserId);

    if (error) {
      console.error(
        "Could not mark notification as read:",
        error
      );
      setErrorMessage(
        "We couldn't update that notification. Please try again."
      );
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );

    setSelectedNotification((current) =>
      current?.id === id ? { ...current, read: true } : current
    );

    setErrorMessage("");
  }

  async function markAllAsRead() {
    if (!currentUserId || unreadCount === 0 || actionLoading) return;

    setActionLoading(true);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);

    if (error) {
      console.error(
        "Could not mark all notifications as read:",
        error
      );
      setErrorMessage(
        "We couldn't update your notifications. Please try again."
      );
      setActionLoading(false);
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    );

    setSelectedNotification((current) =>
      current ? { ...current, read: true } : current
    );

    setErrorMessage("");
    setActionLoading(false);
  }

  async function deleteNotification(id: string) {
    if (!currentUserId || actionLoading) return;

    setActionLoading(true);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Could not delete notification:", error);
      setErrorMessage(
        "We couldn't delete that notification. Please try again."
      );
      setActionLoading(false);
      return;
    }

    setNotifications((current) =>
      current.filter((item) => item.id !== id)
    );

    setSelectedNotification((current) =>
      current?.id === id ? null : current
    );

    setErrorMessage("");
    setActionLoading(false);
  }

  async function clearAllNotifications() {
    if (!currentUserId || actionLoading) return;

    setActionLoading(true);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Could not clear notifications:", error);
      setErrorMessage(
        "We couldn't clear your notifications. Please try again."
      );
      setActionLoading(false);
      return;
    }

    setNotifications([]);
    setShowClearConfirm(false);
    setSelectedNotification(null);
    setErrorMessage("");
    setActionLoading(false);
  }

  async function openNotification(item: NotificationItem) {
    if (!item.read) {
      await markAsRead(item.id);
    }

    setSelectedNotification({ ...item, read: true });
  }

  if (!accessChecked || loading) {
    return (
      <main className="notifications-page notifications-loading">
        <div className="notifications-loading-card">
          <span className="notifications-loading-spinner" />
          <p>Loading your notifications...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="notifications-page">
      {mobileMenuOpen && (
        <button
          className="notifications-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`notifications-sidebar ${
          mobileMenuOpen ? "notifications-sidebar-open" : ""
        }`}
      >
        <div className="notifications-sidebar-top">
          <Logo href="/" size="medium" />

          <button
            className="notifications-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="notifications-user-card">
          <div className="notifications-avatar">JS</div>
          <div>
            <strong>Job Seeker</strong>
            <span>Personal account</span>
          </div>
        </div>

        <nav
          className="notifications-nav"
          aria-label="Job Seeker workspace"
        >
          <p className="notifications-nav-label">WORKSPACE</p>

          <Link
            href="/dashboard"
            className="notifications-nav-link"
          >
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/jobs" className="notifications-nav-link">
            <Search size={19} />
            <span>Find jobs</span>
          </Link>

          <Link
            href="/applications"
            className="notifications-nav-link"
          >
            <FileText size={19} />
            <span>My applications</span>
          </Link>

          <Link
            href="/profile"
            className="notifications-nav-link"
          >
            <UserRound size={19} />
            <span>My profile</span>
          </Link>

          <p className="notifications-nav-label notifications-nav-spaced">
            ACCOUNT
          </p>

          <Link
            href="/notifications"
            className="notifications-nav-link active"
            aria-current="page"
          >
            <Bell size={19} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="notifications-nav-count">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/settings"
            className="notifications-nav-link"
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="notifications-sidebar-bottom">
          <div className="notifications-help-card">
            <div className="notifications-help-icon">
              <MessageCircle size={19} />
            </div>
            <strong>Need some help?</strong>
            <p>We are here to help you move forward.</p>
            <Link href="/hub">
              Visit Abi Hub <ChevronRight size={15} />
            </Link>
          </div>

          <div className="notifications-sidebar-footer">
            <span className="notifications-footer-dot" />
            <span>Abijob platform</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      <section className="notifications-main">
        <header className="notifications-topbar">
          <button
            className="notifications-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={23} />
          </button>

          <div className="notifications-breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <ChevronRight size={15} />
            <span>Notifications</span>
          </div>

          <div className="notifications-topbar-right">
            <span className="notifications-topbar-status">
              <span /> Job Seeker workspace
            </span>
            <div className="notifications-topbar-avatar">JS</div>
          </div>
        </header>

        <div className="notifications-content">
          <div className="notifications-heading">
            <div>
              <span className="notifications-eyebrow">
                YOUR ACTIVITY
              </span>
              <h1>Notifications</h1>
              <p>
                Stay updated on your applications, job opportunities and
                account activity.
              </p>
            </div>

            <div className="notifications-heading-actions">
              <button
                className="notifications-mark-all"
                onClick={() => void markAllAsRead()}
                disabled={unreadCount === 0 || actionLoading}
              >
                <CheckCheck size={17} />
                Mark all as read
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                marginBottom: "16px",
                borderRadius: "8px",
                background: "#fff0f0",
                color: "#a32020",
              }}
            >
              {errorMessage}
              <button
                onClick={() => {
                  if (currentUserId) {
                    void loadNotifications(currentUserId);
                  }
                }}
                style={{
                  marginLeft: "12px",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="notifications-summary">
            <div className="notifications-summary-card">
              <div className="notifications-summary-icon total">
                <Bell size={20} />
              </div>
              <div>
                <span>Total notifications</span>
                <strong>{notifications.length}</strong>
              </div>
            </div>

            <div className="notifications-summary-card">
              <div className="notifications-summary-icon unread">
                <Clock3 size={20} />
              </div>
              <div>
                <span>Unread</span>
                <strong>{unreadCount}</strong>
              </div>
            </div>

            <div className="notifications-summary-card">
              <div className="notifications-summary-icon read">
                <Check size={20} />
              </div>
              <div>
                <span>Read</span>
                <strong>{readCount}</strong>
              </div>
            </div>
          </div>

          <section className="notifications-panel">
            <div className="notifications-panel-heading">
              <div>
                <h2>All updates</h2>
                <p>Manage your recent notifications.</p>
              </div>

              <button
                className="notifications-clear-button"
                onClick={() => setShowClearConfirm(true)}
                disabled={notifications.length === 0 || actionLoading}
              >
                <Trash2 size={16} />
                Clear all
              </button>
            </div>

            <div className="notifications-toolbar">
              <div
                className="notifications-filter-tabs"
                aria-label="Filter notifications"
              >
                <button
                  className={activeFilter === "all" ? "selected" : ""}
                  onClick={() => setActiveFilter("all")}
                  aria-pressed={activeFilter === "all"}
                >
                  All <span>{notifications.length}</span>
                </button>

                <button
                  className={activeFilter === "unread" ? "selected" : ""}
                  onClick={() => setActiveFilter("unread")}
                  aria-pressed={activeFilter === "unread"}
                >
                  Unread <span>{unreadCount}</span>
                </button>

                <button
                  className={activeFilter === "read" ? "selected" : ""}
                  onClick={() => setActiveFilter("read")}
                  aria-pressed={activeFilter === "read"}
                >
                  Read <span>{readCount}</span>
                </button>
              </div>

              <div className="notifications-search">
                <Search size={17} />
                <input
                  type="search"
                  aria-label="Search notifications"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="notifications-list">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <article
                    className={`notification-item ${
                      !item.read ? "notification-unread" : ""
                    }`}
                    key={item.id}
                  >
                    <button
                      className={`notification-type-icon type-${item.type}`}
                      onClick={() => void openNotification(item)}
                      aria-label={`Open ${item.title}`}
                    >
                      {getNotificationIcon(item.type)}
                    </button>

                    <button
                      className="notification-item-content"
                      onClick={() => void openNotification(item)}
                    >
                      <div className="notification-item-title-row">
                        <h3>{item.title}</h3>
                        {!item.read && (
                          <span className="notification-unread-label">
                            New
                          </span>
                        )}
                      </div>

                      <p>{item.message}</p>

                      <div className="notification-item-meta">
                        <span>
                          {getNotificationLabel(item.type)}
                        </span>
                        <span className="notification-meta-dot">
                          •
                        </span>
                        <span>
                          {formatNotificationDate(item.date)}
                        </span>
                      </div>
                    </button>

                    <div className="notification-item-actions">
                      {!item.read && (
                        <button
                          onClick={() => void markAsRead(item.id)}
                          aria-label={`Mark ${item.title} as read`}
                          title="Mark as read"
                          disabled={actionLoading}
                        >
                          <Check size={17} />
                        </button>
                      )}

                      <button
                        onClick={() => void deleteNotification(item.id)}
                        aria-label={`Delete ${item.title}`}
                        title="Delete notification"
                        disabled={actionLoading}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="notifications-empty">
                  <div className="notifications-empty-icon">
                    {searchQuery ? (
                      <Search size={27} />
                    ) : (
                      <Bell size={27} />
                    )}
                  </div>

                  <h3>
                    {searchQuery
                      ? "No matching notifications"
                      : activeFilter === "unread"
                      ? "You're all caught up"
                      : activeFilter === "read"
                      ? "No read notifications"
                      : "No notifications yet"}
                  </h3>

                  <p>
                    {searchQuery
                      ? "Try another search term."
                      : "When there is an update on your Abijob account, it will appear here."}
                  </p>

                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")}>
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="notifications-panel-footer">
              <span>
                Showing {filteredNotifications.length} of{" "}
                {notifications.length} notifications
              </span>

              <span>
                <span className="notifications-footer-dot" />
                Synced with your Abijob account
              </span>
            </div>
          </section>
        </div>
      </section>

      {selectedNotification && (
        <div
          className="notifications-modal-backdrop"
          onClick={() => setSelectedNotification(null)}
        >
          <section
            className="notification-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notification-modal-header">
              <div
                className={`notification-type-icon type-${selectedNotification.type}`}
              >
                {getNotificationIcon(selectedNotification.type)}
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                aria-label="Close notification"
              >
                <X size={21} />
              </button>
            </div>

            <span className="notification-modal-category">
              {getNotificationLabel(selectedNotification.type)}
            </span>

            <h2 id="notification-detail-title">
              {selectedNotification.title}
            </h2>

            <p>{selectedNotification.message}</p>

            <div className="notification-modal-date">
              <Clock3 size={16} />
              {Number.isNaN(
                new Date(selectedNotification.date).getTime()
              )
                ? "Recently"
                : new Date(
                    selectedNotification.date
                  ).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {selectedNotification.href && (
                <button
                  className="notification-modal-done"
                  onClick={() => {
                    const href = selectedNotification.href;

                    if (
                      typeof href === "string" &&
                      href.startsWith("/") &&
                      !href.startsWith("//") &&
                      !href.includes("\\")
                    ) {
                      router.push(href);
                    }
                  }}
                >
                  View update
                </button>
              )}

              <button
                className="notification-modal-done"
                onClick={() => setSelectedNotification(null)}
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}

      {showClearConfirm && (
        <div
          className="notifications-modal-backdrop"
          onClick={() => setShowClearConfirm(false)}
        >
          <section
            className="notification-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-clear-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notification-confirm-icon">
              <XCircle size={25} />
            </div>

            <h2 id="notification-clear-title">
              Clear all notifications?
            </h2>

            <p>
              This will permanently remove all notifications from your Abi
              Job account. This action cannot be undone.
            </p>

            <div className="notification-confirm-actions">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="notification-confirm-delete"
                onClick={() => void clearAllNotifications()}
                disabled={actionLoading}
              >
                {actionLoading ? "Clearing..." : "Clear all"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
