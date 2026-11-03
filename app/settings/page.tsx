
"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Eye,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

import "./settings.css";

type SettingsState = {
  emailNotifications: boolean;
  applicationUpdates: boolean;
  jobAlerts: boolean;
  profileVisibility: boolean;
  showOnlineStatus: boolean;
  weeklyDigest: boolean;
  language: string;
  location: string;
};

const DEFAULT_SETTINGS: SettingsState = {
  emailNotifications: true,
  applicationUpdates: true,
  jobAlerts: true,
  profileVisibility: true,
  showOnlineStatus: true,
  weeklyDigest: false,
  language: "English",
  location: "Abia State",
};

const STORAGE_KEY = "abijob-account-settings";

type SettingsTab =
  | "preferences"
  | "notifications"
  | "privacy"
  | "security";

export default function SettingsPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const [settings, setSettings] =
    useState<SettingsState>(DEFAULT_SETTINGS);

  const [activeTab, setActiveTab] =
    useState<SettingsTab>("preferences");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Verify the real Supabase account and database role.
  useEffect(() => {
    let active = true;

    async function checkAccountAccess() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError || !profile?.role) {
        router.replace("/login?error=profile_missing");
        return;
      }

      if (profile.role === "professional") {
        router.replace("/professional/settings");
        return;
      }

      if (profile.role === "employer") {
        router.replace("/employer/settings");
        return;
      }

      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      }

      if (profile.role !== "job_seeker") {
        router.replace("/login");
        return;
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved);

          if (active) {
            setSettings({
              ...DEFAULT_SETTINGS,
              ...parsed,
            });
          }
        }
      } catch {
        console.error("Could not load saved account settings.");
      } finally {
        if (active) {
          setStorageReady(true);
          setAccessChecked(true);
        }
      }
    }

    void checkAccountAccess();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    if (logoutLoading) return;

    setLogoutLoading(true);
    setLogoutError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError(
        error.message || "We could not sign you out. Please try again."
      );
      setLogoutLoading(false);
      return;
    }

    setShowLogoutConfirm(false);

    router.replace("/login?logged_out=1");
    router.refresh();
  }

  function updateSetting<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaveMessage("");
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaveMessage("Your settings have been saved on this device.");
    } catch {
      setSaveMessage("Could not save your settings. Please try again.");
    }
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );

      setSaveMessage("Settings have been restored to their defaults.");
    } catch {
      setSaveMessage("Could not reset settings. Please try again.");
    }
  }

  const tabs: {
    id: SettingsTab;
    label: string;
    description: string;
    icon: ReactNode;
  }[] = [
    {
      id: "preferences",
      label: "Preferences",
      description: "General account preferences",
      icon: <SettingsIcon size={18} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Choose what updates you receive",
      icon: <Bell size={18} />,
    },
    {
      id: "privacy",
      label: "Privacy",
      description: "Control your profile visibility",
      icon: <Eye size={18} />,
    },
    {
      id: "security",
      label: "Security",
      description: "Account protection and access",
      icon: <ShieldCheck size={18} />,
    },
  ];

  if (!accessChecked) {
    return (
      <main className="settings-page">
        <div className="settings-loading">
          <p>Checking your account access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="settings-page">
      {mobileMenuOpen && (
        <button
          className="settings-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`settings-sidebar ${
          mobileMenuOpen ? "settings-sidebar-open" : ""
        }`}
      >
        <div className="settings-sidebar-top">
          <Logo href="/" size="medium" />

          <button
            className="settings-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="settings-user-card">
          <div className="settings-avatar">JS</div>

          <div>
            <strong>Job Seeker</strong>
            <span>Personal account</span>
          </div>
        </div>

        <nav className="settings-nav">
          <p className="settings-nav-label">WORKSPACE</p>

          <Link href="/dashboard" className="settings-nav-link">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/jobs" className="settings-nav-link">
            <Search size={19} />
            <span>Find jobs</span>
          </Link>

          <Link href="/applications" className="settings-nav-link">
            <BriefcaseBusiness size={19} />
            <span>My applications</span>
          </Link>

          <Link href="/profile" className="settings-nav-link">
            <UserRound size={19} />
            <span>My profile</span>
          </Link>

          <p className="settings-nav-label settings-nav-spaced">
            ACCOUNT
          </p>

          <Link href="/notifications" className="settings-nav-link">
            <Bell size={19} />
            <span>Notifications</span>
          </Link>

          <Link href="/settings" className="settings-nav-link active">
            <SettingsIcon size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="settings-sidebar-bottom">
          <div className="settings-help-card">
            <div className="settings-help-icon">
              <MessageCircle size={19} />
            </div>

            <strong>Need some help?</strong>

            <p>Find useful information and career resources.</p>

            <Link href="/hub">
              Visit Abi Hub <ChevronRight size={15} />
            </Link>
          </div>

          <div className="settings-sidebar-footer">
            <span className="settings-status-dot" />
            Abi Job platform
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      <section className="settings-main">
        <header className="settings-topbar">
          <button
            className="settings-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={23} />
          </button>

          <div className="settings-breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <ChevronRight size={15} />
            <span>Settings</span>
          </div>

          <div className="settings-topbar-right">
            <span className="settings-account-status">
              <span /> Account workspace
            </span>

            <div className="settings-topbar-avatar">JS</div>
          </div>
        </header>

        <div className="settings-content">
          <div className="settings-heading">
            <div>
              <span className="settings-eyebrow">
                ACCOUNT MANAGEMENT
              </span>

              <h1>Settings</h1>

              <p>
                Manage your account preferences, privacy and notifications.
              </p>
            </div>
          </div>

          <div className="settings-layout">
            <aside className="settings-tab-sidebar">
              <div className="settings-tab-heading">
                ACCOUNT SETTINGS
              </div>

              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-tab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSaveMessage("");
                  }}
                >
                  <span className="settings-tab-icon">
                    {tab.icon}
                  </span>

                  <span className="settings-tab-text">
                    <strong>{tab.label}</strong>
                    <small>{tab.description}</small>
                  </span>

                  <ChevronRight size={16} />
                </button>
              ))}

              <div className="settings-tab-divider" />

              <button
                className="settings-tab settings-danger-tab"
                onClick={() => {
                  setLogoutError("");
                  setShowLogoutConfirm(true);
                }}
              >
                <span className="settings-tab-icon">
                  <LogOut size={18} />
                </span>

                <span className="settings-tab-text">
                  <strong>Log out</strong>
                  <small>Leave your account</small>
                </span>
              </button>
            </aside>

            <section className="settings-panel">
              {activeTab === "preferences" && (
                <>
                  <div className="settings-panel-heading">
                    <div>
                      <h2>General preferences</h2>
                      <p>
                        Set your preferred appearance, language and location.
                      </p>
                    </div>

                    <div className="settings-panel-heading-icon">
                      <SettingsIcon size={20} />
                    </div>
                  </div>

                  <div className="settings-section settings-appearance-section">
                    <h3>Website appearance</h3>

                    <p>
                      Choose how Abi Job looks across the entire website.
                    </p>

                    <div className="settings-theme-control">
                      <div className="settings-theme-description">
                        <strong>Display theme</strong>

                        <span>
                          Current preference:{" "}
                          {theme === "system"
                            ? "System default"
                            : theme === "dark"
                              ? "Dark mode"
                              : "Light mode"}
                        </span>
                      </div>

                      <ThemeSwitcher />
                    </div>

                    <small className="settings-field-note">
                      Your selection is saved automatically and applies
                      across the website.
                    </small>
                  </div>

                  <div className="settings-section">
                    <h3>Language</h3>

                    <p>
                      Choose the language used across your account.
                    </p>

                    <select
                      value={settings.language}
                      onChange={(event) =>
                        updateSetting("language", event.target.value)
                      }
                    >
                      <option value="English">English</option>
                    </select>

                    <small className="settings-field-note">
                      More languages may be added in future updates.
                    </small>
                  </div>

                  <div className="settings-section">
                    <h3>Preferred location</h3>

                    <p>
                      Choose the location you want to use when discovering
                      opportunities.
                    </p>

                    <select
                      value={settings.location}
                      onChange={(event) =>
                        updateSetting("location", event.target.value)
                      }
                    >
                      <option value="Abia State">Abia State</option>
                      <option value="Aba">Aba</option>
                      <option value="Umuahia">Umuahia</option>
                      <option value="Arochukwu">Arochukwu</option>
                      <option value="Bende">Bende</option>
                      <option value="Isiala Ngwa North">
                        Isiala Ngwa North
                      </option>
                      <option value="Isiala Ngwa South">
                        Isiala Ngwa South
                      </option>
                      <option value="Obingwa">Obingwa</option>
                      <option value="Osisioma Ngwa">Osisioma Ngwa</option>
                      <option value="Ukwa East">Ukwa East</option>
                      <option value="Ukwa West">Ukwa West</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="settings-info-note">
                    <div>
                      <Check size={17} />
                    </div>

                    <p>
                      Your preferences help Abi Job organise the
                      opportunities you see. They do not change your
                      registered profile details.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "notifications" && (
                <>
                  <div className="settings-panel-heading">
                    <div>
                      <h2>Notification preferences</h2>
                      <p>
                        Choose the updates you want to receive.
                      </p>
                    </div>

                    <div className="settings-panel-heading-icon">
                      <Bell size={20} />
                    </div>
                  </div>

                  {(
                    [
                      {
                        key: "emailNotifications",
                        title: "Email notifications",
                        description: "Receive account updates through email.",
                      },
                      {
                        key: "applicationUpdates",
                        title: "Application updates",
                        description:
                          "Updates about the status of your job applications.",
                      },
                      {
                        key: "jobAlerts",
                        title: "Job alerts",
                        description:
                          "Notifications about new matching opportunities.",
                      },
                      {
                        key: "weeklyDigest",
                        title: "Weekly career digest",
                        description:
                          "A weekly summary of opportunities and career updates.",
                      },
                    ] as const
                  ).map((item) => (
                    <div
                      className="settings-section settings-toggle-section"
                      key={item.key}
                    >
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>

                      <button
                        className={`settings-switch ${
                          settings[item.key] ? "on" : ""
                        }`}
                        onClick={() =>
                          updateSetting(
                            item.key,
                            !settings[item.key]
                          )
                        }
                        role="switch"
                        aria-checked={settings[item.key]}
                        aria-label={item.title}
                      >
                        <span />
                      </button>
                    </div>
                  ))}

                  <div className="settings-info-note">
                    <div>
                      <Bell size={17} />
                    </div>

                    <p>
                      These are saved preferences only. Actual email and
                      push notifications will work after backend integration.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "privacy" && (
                <>
                  <div className="settings-panel-heading">
                    <div>
                      <h2>Privacy settings</h2>
                      <p>
                        Choose how your profile appears to other users.
                      </p>
                    </div>

                    <div className="settings-panel-heading-icon">
                      <Eye size={20} />
                    </div>
                  </div>

                  <div className="settings-section settings-toggle-section">
                    <div>
                      <h3>Profile visibility</h3>
                      <p>
                        Allow employers to discover your profile in the
                        professionals and talent directory.
                      </p>
                    </div>

                    <button
                      className={`settings-switch ${
                        settings.profileVisibility ? "on" : ""
                      }`}
                      onClick={() =>
                        updateSetting(
                          "profileVisibility",
                          !settings.profileVisibility
                        )
                      }
                      role="switch"
                      aria-checked={settings.profileVisibility}
                      aria-label="Profile visibility"
                    >
                      <span />
                    </button>
                  </div>

                  <div className="settings-section settings-toggle-section">
                    <div>
                      <h3>Show online status</h3>
                      <p>
                        Allow other users to see when you are active.
                      </p>
                    </div>

                    <button
                      className={`settings-switch ${
                        settings.showOnlineStatus ? "on" : ""
                      }`}
                      onClick={() =>
                        updateSetting(
                          "showOnlineStatus",
                          !settings.showOnlineStatus
                        )
                      }
                      role="switch"
                      aria-checked={settings.showOnlineStatus}
                      aria-label="Online status"
                    >
                      <span />
                    </button>
                  </div>

                  <div className="settings-info-note">
                    <div>
                      <ShieldCheck size={17} />
                    </div>

                    <p>
                      These controls currently save preferences on this
                      device. They do not yet change what other people can
                      access on the platform.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "security" && (
                <>
                  <div className="settings-panel-heading">
                    <div>
                      <h2>Security and access</h2>
                      <p>
                        Manage your account protection settings.
                      </p>
                    </div>

                    <div className="settings-panel-heading-icon">
                      <LockKeyhole size={20} />
                    </div>
                  </div>

                  <div className="settings-security-card">
                    <div className="settings-security-icon">
                      <LockKeyhole size={21} />
                    </div>

                    <div>
                      <h3>Password management</h3>

                      <p>
                        Change your password using the account recovery
                        process.
                      </p>

                      <Link href="/forgot-password">
                        Go to password recovery <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>

                  <div className="settings-security-card">
                    <div className="settings-security-icon">
                      <ShieldCheck size={21} />
                    </div>

                    <div>
                      <h3>Account protection</h3>

                      <p>
                        Supabase manages your authenticated session.
                        Private workspace access is checked against your
                        database account role.
                      </p>

                      <span className="settings-coming-soon">
                        Supabase authentication active
                      </span>
                    </div>
                  </div>

                  <div className="settings-security-card">
                    <div className="settings-security-icon">
                      <LogOut size={21} />
                    </div>

                    <div>
                      <h3>Sign out</h3>

                      <p>
                        End your current Abi Job account session.
                      </p>

                      <button
                        className="settings-text-action"
                        onClick={() => {
                          setLogoutError("");
                          setShowLogoutConfirm(true);
                        }}
                      >
                        Sign out <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="settings-info-note">
                    <div>
                      <ShieldCheck size={17} />
                    </div>

                    <p>
                      Always sign out when using Abi Job on a shared
                      or public device.
                    </p>
                  </div>
                </>
              )}

              <div className="settings-save-area">
                <div
                  className="settings-save-message"
                  aria-live="polite"
                >
                  {saveMessage && (
                    <>
                      <Check size={16} />
                      {saveMessage}
                    </>
                  )}
                </div>

                <div className="settings-save-actions">
                  <button
                    className="settings-reset-button"
                    onClick={resetSettings}
                  >
                    Reset defaults
                  </button>

                  <button
                    className="settings-save-button"
                    onClick={saveSettings}
                    disabled={!storageReady}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </section>
          </div>

          <section className="settings-account-danger">
            <div className="settings-danger-icon">
              <Trash2 size={21} />
            </div>

            <div className="settings-danger-content">
              <h3>Account actions</h3>

              <p>
                Account deletion will be implemented with proper identity
                verification and data protection when the backend is ready.
                No account will be deleted from this frontend page.
              </p>
            </div>

            <button
              className="settings-danger-button"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete account
            </button>
          </section>
        </div>
      </section>

      {showLogoutConfirm && (
        <div
          className="settings-modal-backdrop"
          onClick={() => {
            if (!logoutLoading) {
              setShowLogoutConfirm(false);
              setLogoutError("");
            }
          }}
        >
          <section
            className="settings-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-confirm-icon">
              <LogOut size={24} />
            </div>

            <h2>Sign out of Abi Job?</h2>

            <p>
              You will be signed out of your account and returned to
              the login page.
            </p>

            {logoutError && (
              <p style={{ color: "#b42318" }} role="alert">
                {logoutError}
              </p>
            )}

            <div className="settings-save-actions">
              <button
                className="settings-reset-button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutError("");
                }}
                disabled={logoutLoading}
              >
                Cancel
              </button>

              <button
                className="settings-modal-primary"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <section
            className="settings-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-confirm-icon danger">
              <Trash2 size={24} />
            </div>

            <h2>Account deletion is not available yet</h2>

            <p>
              We will implement a secure account deletion process with
              identity verification and clear data removal information.
              Nothing will be deleted now.
            </p>

            <button
              className="settings-modal-primary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
