
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import PasskeySettings from "@/components/PasskeySettings";
import { createClient } from "@/lib/supabase/client";
import ProfileImage from "@/components/ProfileImage";
import {
  Activity,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronRight,
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

type SettingsSection =
  | "notifications"
  | "privacy"
  | "preferences"
  | "security";

const DEFAULT_PREFERENCES: Preferences = {
  emailNotifications: true,
  applicationUpdates: true,
  opportunityAlerts: true,
  messageNotifications: true,
  profileVisibility: true,
  showAvailability: true,
  language: "English",
  jobAlertFrequency: "Daily",
};


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

export default function ProfessionalSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("notifications");

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [accountName, setAccountName] = useState("Professional");
  const [accountAvatarPath, setAccountAvatarPath] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyProfessionalAccount() {
      setAccessChecked(false);
      setAccessError("");
      setLoaded(false);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError) {
          throw new Error(
            `Authentication verification failed: ${authError.message}`
          );
        }

        if (!user) {
          router.replace(
            `/login?next=${encodeURIComponent(
              "/professional/settings"
            )}`
          );
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("id, role, full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) return;

        if (profileError) {
          throw new Error(
            `Could not verify your database profile: ${profileError.message}`
          );
        }

        if (!profile) {
          throw new Error(
            "Your authenticated account has no matching profile record. Please contact support."
          );
        }

        if (profile.role !== "professional") {
          const destinations: Record<string, string> = {
            job_seeker: "/dashboard",
            employer: "/employer/dashboard",
            admin: "/admin",
            super_admin: "/admin",
            moderator: "/admin",
            support_staff: "/admin",
          };

          const destination = destinations[profile.role];

          if (destination) {
            router.replace(destination);
            return;
          }

          throw new Error(
            `Your account role (${profile.role || "unknown"}) is not recognised.`
          );
        }

        const displayName =
          profile.full_name?.trim() ||
          user.user_metadata?.full_name?.trim() ||
          user.email?.split("@")[0] ||
          "Professional";

        const [
          { data: savedPreferences, error: preferencesError },
          { data: professionalRecord, error: professionalError },
        ] = await Promise.all([
          supabase
            .from("account_preferences")
            .select("email_notifications, application_updates, job_alerts, message_notifications, profile_visibility, job_alert_frequency")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("professional_profiles")
            .select("profile_data, is_public, show_availability")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (preferencesError) throw preferencesError;
        if (professionalError) throw professionalError;
        if (!active) return;

        const loadedPreferences: Preferences = {
          emailNotifications: savedPreferences?.email_notifications ?? DEFAULT_PREFERENCES.emailNotifications,
          applicationUpdates: savedPreferences?.application_updates ?? DEFAULT_PREFERENCES.applicationUpdates,
          opportunityAlerts: savedPreferences?.job_alerts ?? DEFAULT_PREFERENCES.opportunityAlerts,
          messageNotifications: savedPreferences?.message_notifications ?? DEFAULT_PREFERENCES.messageNotifications,
          profileVisibility: savedPreferences?.profile_visibility ?? professionalRecord?.is_public ?? DEFAULT_PREFERENCES.profileVisibility,
          showAvailability: professionalRecord?.show_availability ?? DEFAULT_PREFERENCES.showAvailability,
          language: "English",
          jobAlertFrequency: (savedPreferences?.job_alert_frequency ?? "daily").replace(/^./, (letter: string) => letter.toUpperCase()),
        };

        const professionalPhotoPath = (
          (professionalRecord?.profile_data || {}) as { photo_path?: string }
        ).photo_path || null;

        setAccountName(displayName);
        setAccountAvatarPath(professionalPhotoPath || profile.avatar_url || null);
        setPreferences(loadedPreferences);
        setAccessChecked(true);
        setLoaded(true);
      } catch (error) {
        if (!active) return;

        setAccessError(
          error instanceof Error
            ? error.message
            : "We could not verify your account. Please try again."
        );
        setAccessChecked(true);
      }
    }

    void verifyProfessionalAccount();

    return () => {
      active = false;
    };
  }, [router, supabase, retryCount]);

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

  async function saveSettings() {
    if (!loaded || saving) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Your session has expired. Please sign in again.");

      const { error: preferencesError } = await supabase
        .from("account_preferences")
        .upsert({
          user_id: user.id,
          email_notifications: preferences.emailNotifications,
          application_updates: preferences.applicationUpdates,
          job_alerts: preferences.opportunityAlerts,
          message_notifications: preferences.messageNotifications,
          profile_visibility: preferences.profileVisibility,
          job_alert_frequency: preferences.jobAlertFrequency.toLowerCase(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (preferencesError) throw preferencesError;

      const { error: professionalError } = await supabase
        .from("professional_profiles")
        .upsert({
          user_id: user.id,
          is_public: preferences.profileVisibility,
          show_availability: preferences.showAvailability,
        }, { onConflict: "user_id" });
      if (professionalError) throw professionalError;

      setSaved(true);
    } catch (error) {
      setSaved(false);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Your preferences could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (logoutLoading) return;

    setLogoutLoading(true);
    setLogoutError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      router.replace("/login?logged_out=1");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "We could not sign you out. Please try again."
      );
      setLogoutLoading(false);
    }
  }

  const sections: {
    id: SettingsSection;
    label: string;
    icon: typeof Bell;
  }[] = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & visibility", icon: ShieldCheck },
    { id: "preferences", label: "Preferences", icon: Globe },
    { id: "security", label: "Security", icon: LockKeyhole },
  ];

  if (!accessChecked) {
    return (
      <main className="ps-page">
        <div className="ps-loading">
          Checking your professional account...
        </div>
      </main>
    );
  }

  if (accessError) {
    return (
      <main className="ps-page">
        <div className="ps-loading">
          <h2>Unable to open Professional Settings</h2>
          <p>{accessError}</p>

          <button
            type="button"
            className="ps-save-button"
            onClick={() => {
              setAccessError("");
              setRetryCount((count) => count + 1);
            }}
          >
            Try again
          </button>

          <p>
            <Link href="/professional/dashboard">
              Return to Professional Dashboard
            </Link>
          </p>
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
            <div className="ps-account-avatar">
              <ProfileImage name={accountName} path={accountAvatarPath} />
            </div>

            <div className="ps-account-info">
              <strong>{accountName}</strong>
              <span>Professional account</span>
            </div>
          </div>

          <button
            type="button"
            className="ps-logout"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            <LogOut size={17} />
            {logoutLoading ? "Signing out..." : "Log out"}
          </button>

          {logoutError && (
            <p role="alert" className="ps-logout-error">
              {logoutError}
            </p>
          )}
        </div>
      </aside>

      <section className="ps-main">
        <header className="ps-topbar">
          <div className="ps-breadcrumb">
            Professional workspace <span>/</span>
            <strong>Settings</strong>
          </div>

          <Link href="/professional/profile" className="ps-view-profile">
            <UserRound size={16} />
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
                <div className="ps-loading">
                  Loading your settings...
                </div>
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
                          These are currently saved preferences. They do not
                          yet enforce profile visibility or availability in
                          public employer searches.
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
                            Supabase manages your authenticated session.
                            Workspace access is checked against your database
                            account role.
                          </p>
                        </div>
                      </div>

                      <div className="ps-info-note">
                        <LockKeyhole size={18} />
                        <p>
                          Always keep your login details private and sign out
                          when using a shared device.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="ps-save-row">
                    <div className="ps-save-status" aria-live="polite">
                      {saved && (
                        <span>
                          <Check size={15} />
                          Settings saved successfully on this device
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="ps-save-button"
                      onClick={() => void saveSettings()}
                      disabled={saving}
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
                    </button>
                    {saveError && <p className="ps-logout-error" role="alert">{saveError}</p>}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </section>
            {activeSection === "security" && <PasskeySettings />}
</main>
  );
}
