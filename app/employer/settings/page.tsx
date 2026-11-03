
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  Globe,
  Lock,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";

import "./settings.css";

type EmployerPreferences = {
  emailNotifications: boolean;
  applicationAlerts: boolean;
  jobUpdates: boolean;
  marketingEmails: boolean;
  profileVisibility: boolean;
  showContact: boolean;
  twoFactor: boolean;
};

const STORAGE_KEY = "abijob-employer-settings";

const defaultPreferences: EmployerPreferences = {
  emailNotifications: true,
  applicationAlerts: true,
  jobUpdates: true,
  marketingEmails: false,
  profileVisibility: true,
  showContact: true,
  twoFactor: false,
};

function normalizeRole(value: unknown): string {
  if (typeof value !== "string") return "";

  const role = value.toLowerCase().trim().replace(/[\s_]+/g, "-");

  if (
    role.includes("professional") ||
    role.includes("artisan") ||
    role === "skilled-worker"
  ) {
    return "professional";
  }

  if (
    role.includes("employer") ||
    role.includes("company") ||
    role.includes("business")
  ) {
    return "employer";
  }

  if (
    role.includes("job-seeker") ||
    role === "jobseeker" ||
    role === "seeker" ||
    role === "candidate"
  ) {
    return "job-seeker";
  }

  return "";
}

function getRoleFromStorage(): string {
  const storageKeys = [
    "abijob-user",
    "abijob-current-user",
    "abijob-auth-user",
    "abijob-profile",
    "abijob-account",
  ];

  for (const key of storageKeys) {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) continue;

    try {
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
          parsed.account?.accountType,
          parsed.user_metadata?.role,
        ];

        for (const candidate of candidates) {
          const role = normalizeRole(candidate);
          if (role) return role;
        }
      }
    } catch {
      const role = normalizeRole(storedValue);
      if (role) return role;
    }
  }

  return "";
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`employer-settings-toggle ${checked ? "enabled" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export default function EmployerSettingsPage() {
  const router = useRouter();

  const [preferences, setPreferences] =
    useState<EmployerPreferences>(defaultPreferences);

  const [accessChecked, setAccessChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const role = getRoleFromStorage();

    if (role === "job-seeker") {
      router.replace("/dashboard");
      return;
    }

    if (role === "professional") {
      router.replace("/professional/dashboard");
      return;
    }

    if (role !== "employer") {
      router.replace("/login");
      return;
    }

    try {
      const storedPreferences = localStorage.getItem(STORAGE_KEY);

      if (storedPreferences) {
        const parsed = JSON.parse(storedPreferences);

        setPreferences({
          ...defaultPreferences,
          ...parsed,
        });
      }
    } catch {
      setPreferences(defaultPreferences);
    }

    setAccessChecked(true);
  }, [router]);

  const updatePreference = useCallback(
    (key: keyof EmployerPreferences, value: boolean) => {
      setPreferences((current) => ({
        ...current,
        [key]: value,
      }));

      setSaveMessage("");
      setSaveError(false);
    },
    []
  );

  function handleSave() {
    setIsSaving(true);
    setSaveMessage("");
    setSaveError(false);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

      setSaveMessage(
        "Your employer preferences have been saved on this device."
      );
    } catch {
      setSaveError(true);
      setSaveMessage(
        "Your preferences could not be saved. Check your browser storage settings and try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!accessChecked) {
    return (
      <main className="employer-settings-loading">
        <div className="employer-settings-spinner" />
        <p>Checking your employer workspace...</p>
      </main>
    );
  }

  return (
    <main className="employer-settings-page">
      {/* SIDEBAR */}
      <aside className="employer-settings-sidebar">
        <Link href="/" className="employer-settings-brand">
          <Image
            src="/images/abijob-logo-white.png"
            alt="Abi Job - Opportunity Starts Here"
            width={170}
            height={65}
            priority
            className="employer-settings-logo"
          />
        </Link>

        <div className="employer-settings-company">
          <div className="employer-settings-company-icon">
            <Building2 size={21} />
          </div>

          <div>
            <strong>Your Company</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="employer-settings-nav-label">WORKSPACE</p>

        <nav
          className="employer-settings-nav"
          aria-label="Employer workspace navigation"
        >
          <Link href="/employer/dashboard">
            <BriefcaseBusiness size={18} />
            Overview
          </Link>

          <Link href="/employer/jobs">
            <BriefcaseBusiness size={18} />
            My job posts
          </Link>

          <Link href="/employer/applicants">
            <Users size={18} />
            Applicants
          </Link>

          <Link href="/employer/profile">
            <Building2 size={18} />
            Company profile
          </Link>
        </nav>

        <p className="employer-settings-nav-label employer-settings-preferences">
          PREFERENCES
        </p>

        <nav
          className="employer-settings-nav"
          aria-label="Employer preferences navigation"
        >
          <Link
            href="/employer/settings"
            className="active"
            aria-current="page"
          >
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        <div className="employer-settings-sidebar-bottom">
          <div className="employer-settings-help">
            <div className="employer-settings-help-icon">
              <ShieldCheck size={19} />
            </div>

            <strong>Your account matters</strong>

            <p>
              Keep your account information up to date and protect your
              business workspace.
            </p>

            <Link href="/support">Get help →</Link>
          </div>

          <Link
            href="/employer/dashboard"
            className="employer-settings-back"
          >
            <ArrowLeft size={16} />
            Back to overview
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="employer-settings-main">
        {/* TOPBAR */}
        <header className="employer-settings-topbar">
          <div>
            <span>EMPLOYER WORKSPACE</span>
            <p>Manage your account preferences</p>
          </div>

          <div className="employer-settings-account">
            <div className="employer-settings-account-icon">
              <Building2 size={18} />
            </div>

            <div>
              <strong>Your Company</strong>
              <small>Employer</small>
            </div>

            <ChevronDown size={16} />
          </div>
        </header>

        <div className="employer-settings-content">
          {/* HEADING */}
          <div className="employer-settings-heading">
            <div>
              <span className="employer-settings-kicker">
                ACCOUNT PREFERENCES
              </span>

              <h1>Settings</h1>

              <p>
                Manage your company account, notifications, privacy and
                security preferences.
              </p>
            </div>

            <button
              type="button"
              className="employer-settings-save-top"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={17} />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>

          {/* ACCOUNT SETTINGS */}
          <section className="employer-settings-card">
            <div className="employer-settings-section-heading">
              <div className="employer-settings-section-icon">
                <Building2 size={20} />
              </div>

              <div>
                <h2>Account information</h2>
                <p>Manage the basic details of your employer account.</p>
              </div>
            </div>

            <div className="employer-settings-info-grid">
              <div className="employer-settings-info-item">
                <span>Account type</span>
                <strong>Employer account</strong>
              </div>

              <div className="employer-settings-info-item">
                <span>Company profile</span>
                <strong>Manage your business details</strong>
                <Link href="/employer/profile">Edit profile →</Link>
              </div>

              <div className="employer-settings-info-item">
                <span>Account status</span>
                <strong className="employer-settings-status">
                  <CheckCircle2 size={15} />
                  Active workspace
                </strong>
              </div>

              <div className="employer-settings-info-item">
                <span>Platform</span>
                <strong>Abi Job · Abia State</strong>
              </div>
            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className="employer-settings-card">
            <div className="employer-settings-section-heading">
              <div className="employer-settings-section-icon">
                <Bell size={20} />
              </div>

              <div>
                <h2>Notification preferences</h2>
                <p>Choose which updates you want to receive.</p>
              </div>
            </div>

            <div className="employer-settings-options">
              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <Mail size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>Email notifications</strong>
                  <p>Receive important account updates by email.</p>
                </div>

                <Toggle
                  label="Email notifications"
                  checked={preferences.emailNotifications}
                  onChange={(value) =>
                    updatePreference("emailNotifications", value)
                  }
                />
              </div>

              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <Users size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>New application alerts</strong>
                  <p>Get notified when someone applies for your jobs.</p>
                </div>

                <Toggle
                  label="New application alerts"
                  checked={preferences.applicationAlerts}
                  onChange={(value) =>
                    updatePreference("applicationAlerts", value)
                  }
                />
              </div>

              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <BriefcaseBusiness size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>Job post updates</strong>
                  <p>Receive updates about your published job posts.</p>
                </div>

                <Toggle
                  label="Job post updates"
                  checked={preferences.jobUpdates}
                  onChange={(value) => updatePreference("jobUpdates", value)}
                />
              </div>

              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <Globe size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>News and promotional emails</strong>
                  <p>Receive Abi Job news, announcements and updates.</p>
                </div>

                <Toggle
                  label="News and promotional emails"
                  checked={preferences.marketingEmails}
                  onChange={(value) =>
                    updatePreference("marketingEmails", value)
                  }
                />
              </div>
            </div>
          </section>

          {/* PRIVACY */}
          <section className="employer-settings-card">
            <div className="employer-settings-section-heading">
              <div className="employer-settings-section-icon">
                <Eye size={20} />
              </div>

              <div>
                <h2>Privacy and visibility</h2>
                <p>Control how your business information appears.</p>
              </div>
            </div>

            <div className="employer-settings-options">
              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <Building2 size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>Public company profile</strong>
                  <p>
                    Allow job seekers to discover your company profile.
                  </p>
                </div>

                <Toggle
                  label="Public company profile"
                  checked={preferences.profileVisibility}
                  onChange={(value) =>
                    updatePreference("profileVisibility", value)
                  }
                />
              </div>

              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <Smartphone size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>Display business contact details</strong>
                  <p>
                    Allow visitors to see your published business contact
                    information.
                  </p>
                </div>

                <Toggle
                  label="Display business contact details"
                  checked={preferences.showContact}
                  onChange={(value) => updatePreference("showContact", value)}
                />
              </div>
            </div>
          </section>

          {/* SECURITY */}
          <section className="employer-settings-card">
            <div className="employer-settings-section-heading">
              <div className="employer-settings-section-icon">
                <Lock size={20} />
              </div>

              <div>
                <h2>Security</h2>
                <p>Protect your employer account and business information.</p>
              </div>
            </div>

            <div className="employer-settings-security-item">
              <div className="employer-settings-security-icon">
                <Lock size={19} />
              </div>

              <div>
                <strong>Password</strong>
                <p>Keep your account secure with a strong password.</p>
              </div>

              <Link href="/forgot-password">Change password</Link>
            </div>

            <div className="employer-settings-security-item">
              <div className="employer-settings-security-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>Two-factor authentication</strong>
                <p>
                  Add an extra layer of protection to your account. Full
                  authentication setup will be connected with the backend.
                </p>
              </div>

              <Toggle
                label="Two-factor authentication"
                checked={preferences.twoFactor}
                onChange={(value) => updatePreference("twoFactor", value)}
              />
            </div>
          </section>

          {/* DANGER ZONE */}
          <section className="employer-settings-danger-card">
            <div className="employer-settings-danger-heading">
              <div className="employer-settings-danger-icon">
                <Trash2 size={20} />
              </div>

              <div>
                <h2>Account actions</h2>
                <p>Manage important changes to your employer account.</p>
              </div>
            </div>

            <div className="employer-settings-danger-content">
              <div>
                <strong>Deactivate employer account</strong>
                <p>
                  Account deactivation will be available after account
                  management is connected to the backend.
                </p>
              </div>

              <button type="button" disabled>
                Deactivate account
              </button>
            </div>
          </section>

          {/* SAVE FOOTER */}
          <div className="employer-settings-bottom-actions">
            <span>
              <CheckCircle2 size={16} />
              Preferences are saved on this device when you choose Save.
            </span>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={17} />
              {isSaving ? "Saving..." : "Save preferences"}
            </button>
          </div>

          {saveMessage && (
            <div
              className={`employer-settings-save-message ${
                saveError ? "error" : ""
              }`}
              role="status"
              aria-live="polite"
            >
              {saveError ? (
                <ShieldCheck size={17} />
              ) : (
                <CheckCircle2 size={17} />
              )}
              {saveMessage}
            </div>
          )}

          <footer className="employer-settings-footer">
            Abi Job · Opportunity Starts Here
          </footer>
        </div>
      </section>
    </main>
  );
}
