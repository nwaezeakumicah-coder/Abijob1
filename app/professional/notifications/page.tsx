
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import { createClient } from "../../../lib/supabase/client";
import {
  Activity,
  ArrowRight,
  Bell,
  BellRing,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import "./notifications.css";

type NotificationCategory =
  | "Application"
  | "Opportunity"
  | "Message"
  | "Profile"
  | "System";

type Notification = {
  id: string | number;
  title: string;
  message: string;
  time: string;
  category: NotificationCategory;
  read: boolean;
  href: string;
  createdAt: string;
};

type NotificationRow = {
  id: string | number;
  title: string;
  description: string | null;
  category: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  role: string;
  full_name: string | null;
};

const filters = [
  "All",
  "Unread",
  "Application",
  "Opportunity",
  "Message",
  "Profile",
  "System",
];

function getCategory(value: string | null): NotificationCategory {
  switch ((value || "").toLowerCase()) {
    case "application":
      return "Application";
    case "job":
    case "opportunity":
      return "Opportunity";
    case "message":
      return "Message";
    case "profile":
      return "Profile";
    default:
      return "System";
  }
}

function getNotificationHref(
  href: string | null,
  category: NotificationCategory
) {
  // Only allow internal application routes from notification records.
  if (href && href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  switch (category) {
    case "Application":
      return "/professional/applications";
    case "Opportunity":
      return "/professional/opportunities";
    case "Message":
      return "/professional/messages";
    case "Profile":
      return "/professional/profile";
    default:
      return "/professional/dashboard";
  }
}

function getRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return "Date unavailable";

  const difference = timestamp - Date.now();
  const absoluteDifference = Math.abs(difference);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 365 * 24 * 60 * 60 * 1000],
    ["month", 30 * 24 * 60 * 60 * 1000],
    ["week", 7 * 24 * 60 * 60 * 1000],
    ["day", 24 * 60 * 60 * 1000],
    ["hour", 60 * 60 * 1000],
    ["minute", 60 * 1000],
  ];

  if (absoluteDifference < 60 * 1000) return "Just now";

  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  for (const [unit, milliseconds] of units) {
    if (absoluteDifference >= milliseconds) {
      return formatter.format(
        Math.round(difference / milliseconds),
        unit
      );
    }
  }

  return "Just now";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfessionalNotificationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [confirmClear, setConfirmClear] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [fullName, setFullName] = useState("Professional");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  const mapDatabaseNotification = useCallback(
    (row: NotificationRow): Notification => {
      const category = getCategory(row.category);

      return {
        id: row.id,
        title: row.title || "Notification",
        message: row.description || "",
        time: getRelativeTime(row.created_at),
        category,
        read: Boolean(row.is_read),
        href: getNotificationHref(row.href, category),
        createdAt: row.created_at,
      };
    },
    []
  );

  const loadNotifications = useCallback(
    async (accountId: string) => {
      const { data, error: queryError } = await supabase
        .from("notifications")
        .select(
          "id, title, description, category, href, is_read, created_at"
        )
        .eq("user_id", accountId)
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(
          "Your notifications could not be loaded. Please try again."
        );
      }

      const rows = (data || []) as NotificationRow[];
      setNotifications(rows.map(mapDatabaseNotification));
    },
    [mapDatabaseNotification, supabase]
  );

  const initializePage = useCallback(async () => {
    setIsLoaded(false);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error("We could not verify your account. Please try again.");
      }

      if (!profile) {
        router.replace("/login");
        return;
      }

      if (profile.role !== "professional") {
        const destination =
          profile.role === "job_seeker"
            ? "/dashboard"
            : profile.role === "employer"
              ? "/employer/dashboard"
              : profile.role === "admin"
                ? "/admin"
                : "/login";

        router.replace(destination);
        return;
      }

      setUserId(user.id);
      setFullName(profile.full_name?.trim() || "Professional");

      await loadNotifications(user.id);
    } catch (loadError) {
      console.error("Professional notifications loading error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Something went wrong while loading notifications."
      );
    } finally {
      setIsLoaded(true);
    }
  }, [loadNotifications, router, supabase]);

  useEffect(() => {
    void initializePage();
  }, [initializePage]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`professional-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadNotifications(userId).catch((loadError) => {
            console.error(
              "Professional notification refresh failed:",
              loadError
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, supabase, userId]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !notification.read;

    return notification.category === activeFilter;
  });

  const initials = getInitials(fullName);

  function getIcon(category: NotificationCategory) {
    switch (category) {
      case "Application":
        return <FileText size={19} />;
      case "Opportunity":
        return <BriefcaseBusiness size={19} />;
      case "Message":
        return <MessageCircle size={19} />;
      case "Profile":
        return <UserRound size={19} />;
      default:
        return <BellRing size={19} />;
    }
  }

  async function markAsRead(id: string | number) {
    if (!userId || isWorking) return;

    const notification = notifications.find((item) => item.id === id);
    if (!notification || notification.read) return;

    setIsWorking(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) {
        throw new Error("We could not update this notification.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read: true } : item
        )
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update notification."
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function markAllAsRead() {
    if (!userId || unreadCount === 0 || isWorking) return;

    setIsWorking(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (updateError) {
        throw new Error("We could not mark your notifications as read.");
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true }))
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update notifications."
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function deleteNotification(id: string | number) {
    if (!userId || isWorking) return;

    setIsWorking(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error("We could not delete this notification.");
      }

      setNotifications((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to delete notification."
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function clearAllNotifications() {
    if (!userId || notifications.length === 0 || isWorking) return;

    setIsWorking(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error("We could not clear your notifications.");
      }

      setNotifications([]);
      setConfirmClear(false);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to clear notifications."
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function openNotification(notification: Notification) {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    router.push(notification.href);
  }

  return (
    <main className="pn-page">
      <aside className="pn-sidebar">
        <div className="pn-brand">
          <Logo size="medium" light />
        </div>

        <p className="pn-sidebar-label">Professional workspace</p>

        <nav className="pn-nav">
          <Link href="/professional/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link href="/professional/opportunities">
            <BriefcaseBusiness size={18} />
            Opportunities
          </Link>

          <Link href="/professional/saved">
            <Bookmark size={18} />
            Saved opportunities
          </Link>

          <Link href="/professional/applications">
            <FileText size={18} />
            My applications
          </Link>

          <Link href="/professional/profile">
            <UserRound size={18} />
            My profile
          </Link>

          <Link href="/professional/experience">
            <Activity size={18} />
            Experience
          </Link>

          <Link href="/professional/messages">
            <MessageCircle size={18} />
            Messages
          </Link>

          <Link href="/professional/notifications" className="active">
            <Bell size={18} />
            Notifications
            {unreadCount > 0 && (
              <span className="pn-nav-count">{unreadCount}</span>
            )}
          </Link>

          <Link href="/professional/settings">
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        <div className="pn-sidebar-bottom">
          <div className="pn-help-card">
            <div className="pn-help-icon">
              <BellRing size={19} />
            </div>
            <h4>Stay informed</h4>
            <p>
              Keep an eye on important updates about your opportunities and
              professional activities.
            </p>
            <Link href="/professional/opportunities">
              Explore opportunities <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </aside>

      <section className="pn-main">
        <header className="pn-topbar">
          <div className="pn-breadcrumb">
            Professional workspace <span>/</span>
            <strong>Notifications</strong>
          </div>

          <div className="pn-topbar-right">
            <div className="pn-user">
              <div className="pn-avatar">{initials}</div>
              <div>
                <strong>{fullName}</strong>
                <span>Professional account</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pn-content">
          <section className="pn-heading">
            <div>
              <span className="pn-eyebrow">
                <Bell size={14} /> YOUR UPDATES
              </span>
              <h1>Notifications</h1>
              <p>
                Stay updated on your applications, opportunities and
                professional activities.
              </p>
            </div>

            <div className="pn-heading-actions">
              <button
                type="button"
                className="pn-mark-all"
                onClick={() => void markAllAsRead()}
                disabled={unreadCount === 0 || isWorking || !isLoaded}
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
              <button
                type="button"
                className="pn-clear-button"
                onClick={() => setConfirmClear(true)}
                disabled={notifications.length === 0 || isWorking || !isLoaded}
              >
                <Trash2 size={16} />
                Clear all
              </button>
            </div>
          </section>

          {error && (
            <div className="pn-empty" role="alert">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void initializePage()}
                disabled={isWorking}
              >
                Try again
              </button>
            </div>
          )}

          <section className="pn-summary">
            <article className="pn-summary-card">
              <div className="pn-summary-icon total">
                <Bell size={20} />
              </div>
              <div>
                <strong>{isLoaded ? notifications.length : "—"}</strong>
                <span>Total notifications</span>
              </div>
            </article>

            <article className="pn-summary-card">
              <div className="pn-summary-icon unread">
                <BellRing size={20} />
              </div>
              <div>
                <strong>{isLoaded ? unreadCount : "—"}</strong>
                <span>Unread notifications</span>
              </div>
            </article>

            <article className="pn-summary-card">
              <div className="pn-summary-icon read">
                <CheckCheck size={20} />
              </div>
              <div>
                <strong>
                  {isLoaded ? notifications.length - unreadCount : "—"}
                </strong>
                <span>Read notifications</span>
              </div>
            </article>
          </section>

          <section className="pn-notifications-section">
            <div className="pn-section-heading">
              <div>
                <h2>Your activity updates</h2>
                <p>Review your latest notifications.</p>
              </div>
              <span>
                {isLoaded ? `${filteredNotifications.length} notifications` : "Loading..."}
              </span>
            </div>

            <div className="pn-filters">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active" : ""}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                  {filter === "Unread" && unreadCount > 0 && (
                    <span>{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {!isLoaded ? (
              <div className="pn-empty">
                <Bell size={30} />
                <h3>Loading notifications...</h3>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="pn-list">
                {filteredNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`pn-notification ${
                      notification.read ? "read" : "unread"
                    }`}
                  >
                    <div
                      className={`pn-notification-icon ${notification.category.toLowerCase()}`}
                    >
                      {getIcon(notification.category)}
                    </div>

                    <div className="pn-notification-body">
                      <div className="pn-notification-title-row">
                        <h3>{notification.title}</h3>
                        {!notification.read && (
                          <span className="pn-unread-dot" />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <div className="pn-notification-meta">
                        <span>
                          <Clock3 size={13} />
                          {notification.time}
                        </span>
                        <span className="pn-category-label">
                          {notification.category}
                        </span>
                      </div>

                      <div className="pn-notification-actions">
                        <button
                          type="button"
                          onClick={() => void openNotification(notification)}
                          disabled={isWorking}
                        >
                          View details <ArrowRight size={14} />
                        </button>

                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => void markAsRead(notification.id)}
                            disabled={isWorking}
                          >
                            <Check size={14} />
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pn-delete"
                      aria-label="Delete notification"
                      title="Delete notification"
                      onClick={() => void deleteNotification(notification.id)}
                      disabled={isWorking}
                    >
                      <X size={17} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pn-empty">
                <div className="pn-empty-icon">
                  <Bell size={28} />
                </div>
                <h3>
                  {activeFilter === "Unread"
                    ? "You are all caught up"
                    : notifications.length === 0
                      ? "No notifications yet"
                      : "No notifications found"}
                </h3>
                <p>
                  {activeFilter === "Unread"
                    ? "You have no unread notifications at the moment."
                    : notifications.length === 0
                      ? "Platform updates about your applications and account will appear here."
                      : "There are no notifications in this category."}
                </p>

                {activeFilter !== "All" && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("All")}
                  >
                    View all notifications
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </section>

      {confirmClear && (
        <div
          className="pn-modal-overlay"
          onClick={() => {
            if (!isWorking) setConfirmClear(false);
          }}
        >
          <section
            className="pn-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pn-confirm-icon">
              <Trash2 size={23} />
            </div>
            <h3>Clear all notifications?</h3>
            <p>
              This will remove all notifications from your account. This action
              cannot be undone.
            </p>
            <div className="pn-confirm-actions">
              <button
                type="button"
                className="pn-cancel"
                onClick={() => setConfirmClear(false)}
                disabled={isWorking}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pn-confirm-delete"
                onClick={() => void clearAllNotifications()}
                disabled={isWorking}
              >
                {isWorking ? "Clearing..." : "Clear notifications"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
