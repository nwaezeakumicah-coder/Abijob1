
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import {
  Activity,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import "./settings.css";

type Preferences = {
  emailNotifications: boolean;
  applicationUpdates: boolean;
  opportunityAlerts: boolean;
  messageNotifications: boolean;
  profileVisibility: boolean;
  showAvailability: boolean;
  language: string;
  jobAlertFrequency: string;
};

type AccountRole = "job-seeker" | "professional" | "employer" | "";

const STORAGE_KEY = "abijob-professional-settings";

const defaultPreferences: Preferences = {
  emailNotifications: true,
  applicationUpdates: true,
  opportunityAlerts: true,
  messageNotifications: true,
  profileVisibility: true,
  showAvailability: true,
  language: "English",
  jobAlertFrequency: "Daily",
};

const AUTH_STORAGE_KEYS = [
  "abijob-user",
  "abijob-current-user",
  "abijob-auth-user",
  "abijob-profile",
  "abijob-account",
];

function normalizeRole(value: unknown): AccountRole {
  if (typeof value !== "string") return "";

  const role = value.toLowerCase().trim().replace(/_/g, "-");

  if (
    ["professional", "artisan", "skilled-worker", "skilled-professional",
      "skilled-professionals", "skilled-professionals-artisans"].includes(role)
  ) {
    return "professional";
  }

  if (
    ["employer", "company", "business"].includes(role)
  ) {
    return "employer";
  }

  if (
    ["job-seeker", "jobseeker", "seeker", "candidate"].includes(role)
  ) {
    return "job-seeker";
  }

  return "";
}

function getRoleFromStorage(): AccountRole {
  for (const key of AUTH_STORAGE_KEYS) {
    try {
      const stored = localStorage.getItem(key);

      if (!stored) continue;

      const parsed = JSON.parse(stored);

      if (!parsed || typeof parsed !== "object") continue;

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
        parsed.account?.accountType,
        parsed.user_metadata?.role,
      ];

      for (const candidate of candidates) {
        const role = normalizeRole(candidate);

        if (role) return role;
      }
    } catch {
      // Ignore invalid or unavailable local storage entries.
    }
  }

  return "";
}

export default function ProfessionalSettingsPage() {
  const router = useRouter();

  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);
  const [activeSection, setActiveSection] = useState("notifications");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    const role = getRoleFromStorage();

    if (role === "job-seeker") {
      router.replace("/settings");
      return;
    }

    if (role === "employer") {
      router.replace("/employer/settings");
      return;
    }

    if (role !== "professional") {
      router.replace("/login");
      return;
    }

    setAccessChecked(true);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch {
      setPreferences(defaultPreferences);
    } finally {
      setLoaded(true);
    }
  }, [router]);

  function updatePreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setSaved(true);
    } catch {
      alert("Unable to save your settings. Please try again.");
    }
  }

  const sections = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & visibility", icon: ShieldCheck },
    { id: "preferences", label: "Preferences", icon: Globe },
    { id: "security", label: "Security", icon: LockKeyhole },
  ];

  if (!accessChecked) {
    return (
      <main className="ps-page">
        <div className="ps-loading">
          Checking your account access...
        </div>
      </main>
    );
  }

  return (
    <main className="ps-page">
      <aside className="ps-sidebar">
        <div className="ps-brand">
          <Logo href="/" light />
        </div>

        <p className="ps-sidebar-label">Professional workspace</p>

        <nav className="ps-nav">
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

          <Link href="/professional/notifications">
            <Bell size={18} />
            Notifications
          </Link>

          <Link href="/professional/settings" className="active">
            <SettingsIcon size={18} />
            Settings
          </Link>
        </nav>

        <div className="ps-sidebar-bottom">
          <div className="ps-account-card">
            <div className="ps-account-avatar">MN</div>
            <div className="ps-account-info">
              <strong>Micah Nwaezeaku</strong>
              <span>Professional account</span>
            </div>
          </div>

          <Link href="/login" className="ps-logout">
            <LogOut size={17} />
            Log out
          </Link>
        </div>
      </aside>

      <section className="ps-main">
        <header className="ps-topbar">
          <div className="ps-breadcrumb">
            Professional workspace <span>/</span>
            <strong>Settings</strong>
          </div>

          <Link href="/professional/profile" className="ps-view-profile">
            <Eye size={16} />
            View profile
          </Link>
        </header>

        <div className="ps-content">
          <div className="ps-heading">
            <div>
              <span className="ps-eyebrow">
                <SettingsIcon size={14} />
                ACCOUNT CONTROL
              </span>
              <h1>Settings</h1>
              <p>
                Manage your account preferences, notifications and privacy
                settings.
              </p>
            </div>
          </div>

          <div className="ps-layout">
            <aside className="ps-settings-menu">
              <h3>Settings menu</h3>

              {sections.map((section) => {
                const Icon = section.icon;

                return (
                  <button
                    type="button"
                    key={section.id}
                    className={
                      activeSection === section.id ? "active" : ""
                    }
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon size={17} />
                    {section.label}
                    <ChevronRight size={15} />
                  </button>
                );
              })}

              <div className="ps-menu-help">
                <div className="ps-menu-help-icon">
                  <Mail size={18} />
                </div>
                <strong>Need assistance?</strong>
                <p>
                  Contact our support team if you need help with your account.
                </p>
                <Link href="/support">
                  Get support <ChevronRight size={13} />
                </Link>
              </div>
            </aside>

            <section className="ps-settings-panel">
              {!loaded ? (
                <div className="ps-loading">Loading your settings...</div>
              ) : (
                <>
                  {activeSection === "notifications" && (
                    <div className="ps-section-content">
                      <div className="ps-panel-heading">
                        <div className="ps-panel-icon">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h2>Notification settings</h2>
                          <p>
                            Choose which updates you want to receive from Abi
                            Job.
                          </p>
                        </div>
                      </div>

                      <div className="ps-setting-group">
                        <h3>Email notifications</h3>
                        <p>
                          Control the updates that may be sent to your email.
                        </p>

                        <SettingToggle
                          title="Email notifications"
                          description="Receive important account updates through email."
                          checked={preferences.emailNotifications}
                          onChange={(value) =>
                            updatePreference("emailNotifications", value)
                          }
                        />
                      </div>

                      <div className="ps-setting-group">
                        <h3>Activity notifications</h3>
                        <p>
                          Choose the activities you want to be notified about.
                        </p>

                        <SettingToggle
                          title="Application updates"
                          description="Receive updates when the status of your applications changes."
                          checked={preferences.applicationUpdates}
                          onChange={(value) =>
                            updatePreference("applicationUpdates", value)
                          }
                        />

                        <SettingToggle
                          title="Opportunity alerts"
                          description="Get notified about new opportunities and relevant job openings."
                          checked={preferences.opportunityAlerts}
                          onChange={(value) =>
                            updatePreference("opportunityAlerts", value)
                          }
                        />

                        <SettingToggle
                          title="New messages"
                          description="Receive notifications when someone sends you a message."
                          checked={preferences.messageNotifications}
                          onChange={(value) =>
                            updatePreference("messageNotifications", value)
                          }
                        />
                      </div>
                    </div>
                  )}

                  {activeSection === "privacy" && (
                    <div className="ps-section-content">
                      <div className="ps-panel-heading">
                        <div className="ps-panel-icon">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h2>Privacy & visibility</h2>
                          <p>
                            Control how employers and other users see your
                            professional information.
                          </p>
                        </div>
                      </div>

                      <div className="ps-setting-group">
                        <h3>Profile visibility</h3>
                        <p>Manage your professional profile visibility.</p>

                        <SettingToggle
                          title="Make my profile visible"
                          description="Allow employers to discover your professional profile."
                          checked={preferences.profileVisibility}
                          onChange={(value) =>
                            updatePreference("profileVisibility", value)
                          }
                        />

                        <SettingToggle
                          title="Show my availability"
                          description="Allow employers to see whether you are available for work."
                          checked={preferences.showAvailability}
                          onChange={(value) =>
                            updatePreference("showAvailability", value)
                          }
                        />
                      </div>

                      <div className="ps-info-note">
                        <ShieldCheck size={18} />
                        <p>
                          Your private account information should only be
                          shared through secure, authorized platform features.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === "preferences" && (
                    <div className="ps-section-content">
                      <div className="ps-panel-heading">
                        <div className="ps-panel-icon">
                          <Globe size={20} />
                        </div>
                        <div>
                          <h2>General preferences</h2>
                          <p>
                            Set your preferred language and opportunity alert
                            frequency.
                          </p>
                        </div>
                      </div>

                      <div className="ps-setting-group">
                        <div className="ps-form-field">
                          <label htmlFor="ps-language">
                            <Globe size={15} />
                            Preferred language
                          </label>
                          <select
                            id="ps-language"
                            value={preferences.language}
                            onChange={(event) =>
                              updatePreference("language", event.target.value)
                            }
                          >
                            <option value="English">English</option>
                          </select>
                          <span>
                            More language options may be added in a future
                            update.
                          </span>
                        </div>

                        <div className="ps-form-field">
                          <label htmlFor="ps-frequency">
                            <Bell size={15} />
                            Opportunity alert frequency
                          </label>
                          <select
                            id="ps-frequency"
                            value={preferences.jobAlertFrequency}
                            onChange={(event) =>
                              updatePreference(
                                "jobAlertFrequency",
                                event.target.value
                              )
                            }
                          >
                            <option value="Immediately">Immediately</option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Never">Never</option>
                          </select>
                          <span>
                            Choose how often you would like to receive
                            opportunity alerts.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "security" && (
                    <div className="ps-section-content">
                      <div className="ps-panel-heading">
                        <div className="ps-panel-icon">
                          <LockKeyhole size={20} />
                        </div>
                        <div>
                          <h2>Security settings</h2>
                          <p>
                            Information about protecting your Abi Job account.
                          </p>
                        </div>
                      </div>

                      <div className="ps-security-card">
                        <div className="ps-security-icon">
                          <LockKeyhole size={20} />
                        </div>
                        <div>
                          <h3>Password management</h3>
                          <p>
                            Use a strong, unique password to protect your
                            account.
                          </p>
                          <Link href="/forgot-password">
                            Reset your password <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>

                      <div className="ps-security-card">
                        <div className="ps-security-icon">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3>Account protection</h3>
                          <p>
                            Keep your login details private and sign out when
                            using a shared device.
                          </p>
                        </div>
                      </div>

                      <div className="ps-info-note">
                        <LockKeyhole size={18} />
                        <p>
                          Password changes and account security verification
                          will be connected to the authentication system when
                          backend integration is implemented.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="ps-save-row">
                    <div className="ps-save-status">
                      {saved && (
                        <span>
                          <Check size={15} />
                          Settings saved successfully
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="ps-save-button"
                      onClick={saveSettings}
                    >
                      <Save size={16} />
                      Save changes
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

type SettingToggleProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <div className="ps-toggle-row">
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`ps-switch ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}
