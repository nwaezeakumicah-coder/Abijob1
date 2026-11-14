
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
  LogOut,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";
import PasskeySettings from "../../../components/PasskeySettings";
import "./settings.css";

type EmployerPreferences = {
  emailNotifications: boolean;
  applicationAlerts: boolean;
  jobUpdates: boolean;
  marketingEmails: boolean;
};

const defaultPreferences: EmployerPreferences = {
  emailNotifications: true,
  applicationAlerts: true,
  jobUpdates: true,
  marketingEmails: false,
};

function normalizeRole(value: unknown): string {
  if (typeof value !== "string") return "";

  return value.toLowerCase().trim().replace(/[\s_]+/g, "-");
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
  const supabase = createClient();

  const [preferences, setPreferences] =
    useState<EmployerPreferences>(defaultPreferences);

  const [companyName, setCompanyName] = useState("Your Company");
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showContactDetails: true,
  });
  const [accountEmail, setAccountEmail] = useState("");

  const [accessChecked, setAccessChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?redirect=/employer/settings");
          return;
        }

        if (!isMounted) return;

        setAccountEmail(user.email ?? "");

        const metadataRole = normalizeRole(
          user.user_metadata?.role ??
            user.user_metadata?.account_type ??
            user.user_metadata?.accountType
        );

        const appRole = normalizeRole(
          user.app_metadata?.role ??
            user.app_metadata?.account_type
        );

        if (
          (metadataRole && metadataRole !== "employer") ||
          (appRole && appRole !== "employer")
        ) {
          if (metadataRole === "job-seeker" || appRole === "job-seeker") {
            router.replace("/dashboard");
          } else if (
            metadataRole === "professional" ||
            appRole === "professional"
          ) {
            router.replace("/professional/dashboard");
          } else {
            router.replace("/login");
          }

          return;
        }

        const { data: employerProfile, error: profileError } =
          await supabase
            .from("employer_profiles")
            .select("business_name, is_public, show_contact_details")
            .eq("user_id", user.id)
            .maybeSingle();

        if (profileError) {
          throw new Error(
            "We could not verify your employer profile. Please try again."
          );
        }

        if (
          !employerProfile &&
          metadataRole !== "employer" &&
          appRole !== "employer"
        ) {
          router.replace("/login");
          return;
        }

        if (!isMounted) return;

        if (employerProfile?.business_name) {
          setCompanyName(employerProfile.business_name);
        }

        if (employerProfile) {
          setPrivacy({
            publicProfile: employerProfile.is_public ?? true,
            showContactDetails: employerProfile.show_contact_details ?? true,
          });
        }

        const { data: savedPreferences, error: preferencesError } =
          await supabase
            .from("employer_preferences")
            .select(
              "email_notifications, application_alerts, job_updates, marketing_emails"
            )
            .eq("user_id", user.id)
            .maybeSingle();

        if (preferencesError) {
          throw new Error(
            "We could not load your preferences. Please refresh the page."
          );
        }

        if (savedPreferences && isMounted) {
          setPreferences({
            emailNotifications: savedPreferences.email_notifications,
            applicationAlerts: savedPreferences.application_alerts,
            jobUpdates: savedPreferences.job_updates,
            marketingEmails: savedPreferences.marketing_emails,
          });
        }

        if (isMounted) {
          setAccessChecked(true);
        }
      } catch (error) {
        if (!isMounted) return;

        setSaveError(true);
        setSaveMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading your settings."
        );

        setAccessChecked(true);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

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

  async function handleSave() {
    if (isSaving || isSigningOut) return;

    setIsSaving(true);
    setSaveMessage("");
    setSaveError(false);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: existingPreferences, error: lookupError } =
        await supabase
          .from("employer_preferences")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (lookupError) {
        throw new Error("Could not check your saved preferences.");
      }

      const preferenceData = {
        user_id: user.id,
        email_notifications: preferences.emailNotifications,
        application_alerts: preferences.applicationAlerts,
        job_updates: preferences.jobUpdates,
        marketing_emails: preferences.marketingEmails,
      };

      const { error: preferenceSaveError } = existingPreferences
        ? await supabase
            .from("employer_preferences")
            .update({
              email_notifications: preferenceData.email_notifications,
              application_alerts: preferenceData.application_alerts,
              job_updates: preferenceData.job_updates,
              marketing_emails: preferenceData.marketing_emails,
            })
            .eq("user_id", user.id)
        : await supabase
            .from("employer_preferences")
            .insert(preferenceData);

      if (preferenceSaveError) {
        throw new Error(preferenceSaveError.message);
      }

      const { error: privacySaveError } = await supabase
        .from("employer_profiles")
        .update({
          is_public: privacy.publicProfile,
          show_contact_details: privacy.showContactDetails,
        })
        .eq("user_id", user.id);

      if (privacySaveError) {
        throw new Error(privacySaveError.message);
      }

      setSaveMessage(
        "Your preferences have been saved to your Abi Job account."
      );
    } catch (error) {
      setSaveError(true);
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Your preferences could not be saved. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    if (isSigningOut || isSaving) return;

    setIsSigningOut(true);
    setSaveMessage("");
    setSaveError(false);

    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        throw new Error(
          "We could not sign you out. Please try again."
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setSaveError(true);
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Sign-out failed. Please try again."
      );

      setIsSigningOut(false);
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
            <strong>{companyName}</strong>
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

      <section className="employer-settings-main">
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
              <strong>{companyName}</strong>
              <small>Employer</small>
            </div>

            <ChevronDown size={16} />
          </div>
        </header>

        <div className="employer-settings-content">
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
              disabled={isSaving || isSigningOut}
            >
              <Save size={17} />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>

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
                <span>Account email</span>
                <strong>{accountEmail || "Not available"}</strong>
              </div>

              <div className="employer-settings-info-item">
                <span>Platform</span>
                <strong>Abi Job · Abia State</strong>
              </div>
            </div>
          </section>

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
                  onChange={(value) =>
                    updatePreference("jobUpdates", value)
                  }
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

          <section className="employer-settings-card">
            <div className="employer-settings-section-heading">
              <div className="employer-settings-section-icon">
                <Eye size={20} />
              </div>

              <div>
                <h2>Privacy and visibility</h2>
                <p>Choose how your business appears in the public employer directory.</p>
              </div>
            </div>

            <div className="employer-settings-options">
              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <Building2 size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>Public company profile</strong>
                  <p>Allow job seekers and visitors to discover your company in the employer directory.</p>
                </div>

                <Toggle
                  label="Public company profile"
                  checked={privacy.publicProfile}
                  onChange={(value) => {
                    setPrivacy((current) => ({ ...current, publicProfile: value }));
                    setSaveMessage("");
                    setSaveError(false);
                  }}
                />
              </div>

              <div className="employer-settings-option">
                <div className="employer-settings-option-icon">
                  <Smartphone size={18} />
                </div>

                <div className="employer-settings-option-text">
                  <strong>Business contact visibility</strong>
                  <p>Show your business address and website on your public employer profile.</p>
                </div>

                <Toggle
                  label="Business contact visibility"
                  checked={privacy.showContactDetails}
                  onChange={(value) => {
                    setPrivacy((current) => ({ ...current, showContactDetails: value }));
                    setSaveMessage("");
                    setSaveError(false);
                  }}
                />
              </div>
            </div>
          </section>

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
                <LogOut size={19} />
              </div>

              <div>
                <strong>Sign out</strong>
                <p>
                  Securely sign out of your Abi Job employer account on
                  this device.
                </p>
              </div>

              <button
                type="button"
                className="employer-settings-save-top"
                onClick={handleSignOut}
                disabled={isSigningOut || isSaving}
              >
                <LogOut size={16} />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>

          <PasskeySettings />

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
                  Account deactivation will become available after the
                  account-management process is implemented.
                </p>
              </div>

              <button type="button" disabled>
                Deactivate account
              </button>
            </div>
          </section>

          <div className="employer-settings-bottom-actions">
            <span>
              <CheckCircle2 size={16} />
              Preferences are saved to your Abi Job account.
            </span>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isSigningOut}
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
