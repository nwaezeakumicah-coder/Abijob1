"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import Logo from "@/components/Logo";
import "./notifications.css";

type NotificationType =
  | "application"
  | "job"
  | "profile"
  | "message"
  | "system";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

type FilterType = "all" | "unread" | "read";
type AccountRole = "job-seeker" | "professional" | "employer";

const STORAGE_KEY = "abijob-notifications-job-seeker";
const LEGACY_STORAGE_KEY = "abijob-notifications";

const roleStorageKeys = [
  "abijob-user",
  "abijob-current-user",
  "abijob-auth-user",
  "abijob-profile",
  "abijob-account",
];

const initialNotifications: NotificationItem[] = [
  {
    id: "notification-1",
    type: "application",
    title: "Application received",
    message:
      "Your application for Frontend Developer at Digital Solutions has been recorded.",
    date: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    read: false,
  },
  {
    id: "notification-2",
    type: "job",
    title: "New opportunity available",
    message:
      "A new Graphic Designer opportunity has been posted in Aba. Check it out.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
  },
  {
    id: "notification-3",
    type: "application",
    title: "Application under review",
    message:
      "Your application for Customer Service Officer is now under review.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
  },
  {
    id: "notification-4",
    type: "profile",
    title: "Complete your profile",
    message:
      "Add your work experience and skills to help employers understand what you can do.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
  {
    id: "notification-5",
    type: "system",
    title: "Welcome to Abi Job",
    message:
      "Welcome aboard. Your next opportunity could be closer than you think.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    read: true,
  },
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
    default:
      return "Abi Job";
  }
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

function isValidNotification(value: unknown): value is NotificationItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.message === "string" &&
    typeof item.date === "string" &&
    typeof item.read === "boolean" &&
    ["application", "job", "profile", "message", "system"].includes(
      String(item.type)
    )
  );
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  // Keep this route exclusive to Job Seekers.
  useEffect(() => {
    const role = getStoredAccountRole();

    if (role === "professional") {
      router.replace("/professional/notifications");
      return;
    }

    if (role === "employer") {
      router.replace("/employer/notifications");
      return;
    }

    setAccessChecked(true);
  }, [router]);

  // Load only the Job Seeker's notification storage.
  // Migrate the previous shared key once, if necessary.
  useEffect(() => {
    if (!accessChecked) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setNotifications(parsed.filter(isValidNotification));
        }
      } else {
        const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);

        if (legacySaved) {
          const parsed: unknown = JSON.parse(legacySaved);

          if (Array.isArray(parsed)) {
            const validNotifications = parsed.filter(isValidNotification);
            setNotifications(validNotifications);
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(validNotifications)
            );
          }
        }
      }
    } catch {
      console.error("Could not load saved Job Seeker notifications.");
    } finally {
      setStorageReady(true);
    }
  }, [accessChecked]);

  // Save changes to the Job Seeker's own storage key.
  useEffect(() => {
    if (!storageReady || !accessChecked) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      console.error("Could not save Job Seeker notifications.");
    }
  }, [notifications, storageReady, accessChecked]);

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

  const unreadCount = notifications.filter((item) => !item.read).length;
  const readCount = notifications.filter((item) => item.read).length;

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

  function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );

    setSelectedNotification((current) =>
      current?.id === id ? { ...current, read: true } : current
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    );
  }

  function deleteNotification(id: string) {
    setNotifications((current) => current.filter((item) => item.id !== id));

    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  }

  function clearAllNotifications() {
    setNotifications([]);
    setShowClearConfirm(false);
    setSelectedNotification(null);
  }

  function openNotification(item: NotificationItem) {
    markAsRead(item.id);
    setSelectedNotification({ ...item, read: true });
  }

  if (!accessChecked || !storageReady) {
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

        <nav className="notifications-nav" aria-label="Job Seeker workspace">
          <p className="notifications-nav-label">WORKSPACE</p>

          <Link href="/dashboard" className="notifications-nav-link">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/jobs" className="notifications-nav-link">
            <Search size={19} />
            <span>Find jobs</span>
          </Link>

          <Link href="/applications" className="notifications-nav-link">
            <FileText size={19} />
            <span>My applications</span>
          </Link>

          <Link href="/profile" className="notifications-nav-link">
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
              <span className="notifications-nav-count">{unreadCount}</span>
            )}
          </Link>

          <Link href="/settings" className="notifications-nav-link">
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
            <span>Abi Job platform</span>
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
              <span className="notifications-eyebrow">YOUR ACTIVITY</span>
              <h1>Notifications</h1>
              <p>
                Stay updated on your applications, job opportunities and
                account activity.
              </p>
            </div>

            <div className="notifications-heading-actions">
              <button
                className="notifications-mark-all"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck size={17} />
                Mark all as read
              </button>
            </div>
          </div>

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
                disabled={notifications.length === 0}
              >
                <Trash2 size={16} />
                Clear all
              </button>
            </div>

            <div className="notifications-toolbar">
              <div className="notifications-filter-tabs" aria-label="Filter notifications">
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
                  onChange={(event) => setSearchQuery(event.target.value)}
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
                      onClick={() => openNotification(item)}
                      aria-label={`Open ${item.title}`}
                    >
                      {getNotificationIcon(item.type)}
                    </button>

                    <button
                      className="notification-item-content"
                      onClick={() => openNotification(item)}
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
                        <span>{getNotificationLabel(item.type)}</span>
                        <span className="notification-meta-dot">•</span>
                        <span>{formatNotificationDate(item.date)}</span>
                      </div>
                    </button>

                    <div className="notification-item-actions">
                      {!item.read && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          aria-label={`Mark ${item.title} as read`}
                          title="Mark as read"
                        >
                          <Check size={17} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(item.id)}
                        aria-label={`Delete ${item.title}`}
                        title="Delete notification"
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
                      : "When there is an update on your Abi Job account, it will appear here."}
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
                Updates are stored on this device
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
              {Number.isNaN(new Date(selectedNotification.date).getTime())
                ? "Recently"
                : new Date(selectedNotification.date).toLocaleString(
                    "en-NG",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
            </div>

            <button
              className="notification-modal-done"
              onClick={() => setSelectedNotification(null)}
            >
              Done
            </button>
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
              This will permanently remove all notifications saved on this
              device. This action cannot be undone.
            </p>
            <div className="notification-confirm-actions">
              <button onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button
                className="notification-confirm-delete"
                onClick={clearAllNotifications}
              >
                Clear all
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}