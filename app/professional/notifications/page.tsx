
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "../../../components/Logo";
import {
  Activity,
  ArrowRight,
  Bell,
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
  BellRing,
} from "lucide-react";
import "./notifications.css";

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  category: "Application" | "Opportunity" | "Message" | "Profile" | "System";
  read: boolean;
  href: string;
};

const STORAGE_KEY = "abijob-professional-notifications";

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Welcome to your professional workspace",
    message:
      "Your professional account is ready. Complete your profile to help employers discover your skills and experience.",
    time: "Just now",
    category: "System",
    read: false,
    href: "/professional/profile",
  },
  {
    id: 2,
    title: "New opportunities are waiting",
    message:
      "Explore available jobs, contracts and projects that could match your professional interests.",
    time: "Today",
    category: "Opportunity",
    read: false,
    href: "/professional/opportunities",
  },
  {
    id: 3,
    title: "Complete your professional profile",
    message:
      "Add your skills, work experience and professional information to improve your profile.",
    time: "Yesterday",
    category: "Profile",
    read: false,
    href: "/professional/profile",
  },
  {
    id: 4,
    title: "Your saved opportunities are ready",
    message:
      "Return to your saved opportunities whenever you are ready to review them.",
    time: "2 days ago",
    category: "Opportunity",
    read: true,
    href: "/professional/saved",
  },
  {
    id: 5,
    title: "Check your applications",
    message:
      "Keep track of opportunities you have applied for from your applications dashboard.",
    time: "3 days ago",
    category: "Application",
    read: true,
    href: "/professional/applications",
  },
  {
    id: 6,
    title: "Stay connected with employers",
    message:
      "Visit your messages inbox to keep track of conversations and professional enquiries.",
    time: "4 days ago",
    category: "Message",
    read: true,
    href: "/professional/messages",
  },
];

const filters = [
  "All",
  "Unread",
  "Application",
  "Opportunity",
  "Message",
  "Profile",
  "System",
];

export default function ProfessionalNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [confirmClear, setConfirmClear] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        } else {
          setNotifications(initialNotifications);
        }
      } else {
        setNotifications(initialNotifications);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(initialNotifications)
        );
      }
    } catch {
      setNotifications(initialNotifications);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  function persistNotifications(updated: Notification[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setNotifications(updated);
    } catch {
      alert("Unable to save your notification changes.");
    }
  }

  function markAsRead(id: number) {
    const updated = notifications.map((notification) =>
      notification.id === id
        ? { ...notification, read: true }
        : notification
    );

    persistNotifications(updated);
  }

  function markAllAsRead() {
    const updated = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));

    persistNotifications(updated);
  }

  function deleteNotification(id: number) {
    persistNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  }

  function clearAllNotifications() {
    persistNotifications([]);
    setConfirmClear(false);
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !notification.read;
    return notification.category === activeFilter;
  });

  function getIcon(category: Notification["category"]) {
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
              <div className="pn-avatar">MN</div>
              <div>
                <strong>Micah Nwaezeaku</strong>
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
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
              <button
                type="button"
                className="pn-clear-button"
                onClick={() => setConfirmClear(true)}
                disabled={notifications.length === 0}
              >
                <Trash2 size={16} />
                Clear all
              </button>
            </div>
          </section>

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
                <strong>{unreadCount}</strong>
                <span>Unread notifications</span>
              </div>
            </article>

            <article className="pn-summary-card">
              <div className="pn-summary-icon read">
                <CheckCircle2Icon />
              </div>
              <div>
                <strong>{notifications.length - unreadCount}</strong>
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
              <span>{filteredNotifications.length} notifications</span>
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
                        <Link
                          href={notification.href}
                          onClick={() => markAsRead(notification.id)}
                        >
                          View details <ArrowRight size={14} />
                        </Link>

                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
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
                      onClick={() => deleteNotification(notification.id)}
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
                    : "No notifications found"}
                </h3>
                <p>
                  {activeFilter === "Unread"
                    ? "You have no unread notifications at the moment."
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
          onClick={() => setConfirmClear(false)}
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
              This will remove all notifications from your list. This action
              cannot be undone.
            </p>
            <div className="pn-confirm-actions">
              <button
                type="button"
                className="pn-cancel"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pn-confirm-delete"
                onClick={clearAllNotifications}
              >
                Clear notifications
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function CheckCircle2Icon() {
  return <CheckCheck size={20} />;
}
