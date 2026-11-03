
"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../../../components/Logo";
import {
  Activity,
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CreditCard,
  Globe,
  LockKeyhole,
  Save,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import "./settings.css";

type SettingsTab =
  | "general"
  | "jobs"
  | "subscriptions"
  | "notifications"
  | "security";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    platformName: "Abi Job",
    supportEmail: "support@abijob.ng",
    website: "https://abijob.ng",
    location: "Abia State, Nigeria",
    autoApproveJobs: false,
    requireEmployerVerification: true,
    allowJobEditing: true,
    freeJobApplications: true,
    premiumSubscriptions: true,
    employerPayments: true,
    emailNotifications: true,
    newUserAlerts: true,
    newJobAlerts: true,
    paymentAlerts: true,
    twoFactor: true,
    adminLoginAlerts: true,
    sessionTimeout: "30",
  });

  const updateSetting = (
    key: keyof typeof settings,
    value: string | boolean
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setSaved(false);
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "jobs", label: "Job management", icon: BriefcaseBusiness },
    { id: "subscriptions", label: "Subscriptions", icon: Wallet },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: ShieldCheck },
  ] as const;

  const handleSave = () => {
    // Demo only: connect this action to Supabase when backend is ready.
    setSaved(true);
  };

  return (
    <main className="admin-settings">
      <aside className="admin-settings-sidebar">
        <div className="admin-settings-brand">
          <Logo href="/" size="medium" />
        </div>

        <div className="admin-settings-profile">
          <div className="admin-settings-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>Platform management</span>
          </div>
        </div>

        <span className="admin-settings-nav-title">MAIN MENU</span>

        <nav className="admin-settings-nav">
          <Link href="/admin">
            <Activity size={19} />
            <span>Overview</span>
          </Link>

          <Link href="/admin/users">
            <Users size={19} />
            <span>Users</span>
          </Link>

          <Link href="/admin/jobs">
            <BriefcaseBusiness size={19} />
            <span>Job approvals</span>
          </Link>

          <Link href="/admin/subscriptions">
            <Wallet size={19} />
            <span>Subscriptions</span>
          </Link>

          <Link href="/admin/analytics">
            <Activity size={19} />
            <span>Reports & Analytics</span>
          </Link>

          <Link href="/admin/settings" className="active">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="admin-settings-sidebar-bottom">
          <div>
            <ShieldCheck size={18} />
            <span>Abi Job Admin Portal</span>
          </div>

          <Link href="/">
            <ArrowLeft size={16} />
            Back to website
          </Link>
        </div>
      </aside>

      <section className="admin-settings-main">
        <header className="admin-settings-topbar">
          <div>
            <span className="admin-settings-breadcrumb">
              Admin / Settings
            </span>
            <h1>Platform settings</h1>
            <p>Configure and manage your Abi Job platform.</p>
          </div>

          <div className="admin-settings-top-avatar">A</div>
        </header>

        <div className="admin-settings-content">
          <section className="admin-settings-intro">
            <div className="admin-settings-intro-icon">
              <Settings size={27} />
            </div>
            <div>
              <h2>System configuration</h2>
              <p>
                Manage your platform information, job approval preferences,
                subscriptions, notifications and administrator security.
              </p>
            </div>
          </section>

          <div className="admin-settings-layout">
            <aside className="admin-settings-tabs">
              <span>SETTINGS MENU</span>

              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={
                      activeTab === tab.id
                        ? "admin-settings-tab active"
                        : "admin-settings-tab"
                    }
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSaved(false);
                    }}
                  >
                    <Icon size={19} />
                    <span>{tab.label}</span>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </aside>

            <section className="admin-settings-panel">
              {activeTab === "general" && (
                <div className="admin-settings-section">
                  <div className="admin-settings-section-heading">
                    <div className="admin-settings-heading-icon">
                      <Globe size={21} />
                    </div>
                    <div>
                      <h2>General settings</h2>
                      <p>Basic information about your platform.</p>
                    </div>
                  </div>

                  <div className="admin-settings-form">
                    <label>
                      Platform name
                      <input
                        value={settings.platformName}
                        onChange={(event) =>
                          updateSetting("platformName", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Support email
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(event) =>
                          updateSetting("supportEmail", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Website URL
                      <input
                        value={settings.website}
                        onChange={(event) =>
                          updateSetting("website", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Platform location
                      <input
                        value={settings.location}
                        onChange={(event) =>
                          updateSetting("location", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "jobs" && (
                <div className="admin-settings-section">
                  <div className="admin-settings-section-heading">
                    <div className="admin-settings-heading-icon">
                      <BriefcaseBusiness size={21} />
                    </div>
                    <div>
                      <h2>Job management</h2>
                      <p>Control how job listings are reviewed and published.</p>
                    </div>
                  </div>

                  <div className="admin-settings-options">
                    <SettingToggle
                      title="Automatic job approval"
                      description="Publish submitted jobs without manual administrator review."
                      checked={settings.autoApproveJobs}
                      onChange={(value) =>
                        updateSetting("autoApproveJobs", value)
                      }
                    />

                    <SettingToggle
                      title="Employer verification"
                      description="Require employers to complete verification before publishing jobs."
                      checked={settings.requireEmployerVerification}
                      onChange={(value) =>
                        updateSetting("requireEmployerVerification", value)
                      }
                    />

                    <SettingToggle
                      title="Allow job editing"
                      description="Allow employers to edit their job listings after submission."
                      checked={settings.allowJobEditing}
                      onChange={(value) =>
                        updateSetting("allowJobEditing", value)
                      }
                    />
                  </div>

                  <div className="admin-settings-notice">
                    <ShieldCheck size={19} />
                    <p>
                      <strong>Recommended:</strong> Keep automatic job approval
                      disabled so administrators can review listings before
                      publication.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "subscriptions" && (
                <div className="admin-settings-section">
                  <div className="admin-settings-section-heading">
                    <div className="admin-settings-heading-icon">
                      <CreditCard size={21} />
                    </div>
                    <div>
                      <h2>Subscription settings</h2>
                      <p>Manage subscription availability and payment options.</p>
                    </div>
                  </div>

                  <div className="admin-settings-options">
                    <SettingToggle
                      title="Free job applications"
                      description="Keep basic job applications free for job seekers."
                      checked={settings.freeJobApplications}
                      onChange={(value) =>
                        updateSetting("freeJobApplications", value)
                      }
                    />

                    <SettingToggle
                      title="Premium subscriptions"
                      description="Allow users to subscribe to premium career and professional plans."
                      checked={settings.premiumSubscriptions}
                      onChange={(value) =>
                        updateSetting("premiumSubscriptions", value)
                      }
                    />

                    <SettingToggle
                      title="Employer payments"
                      description="Allow employers to purchase recruitment plans."
                      checked={settings.employerPayments}
                      onChange={(value) =>
                        updateSetting("employerPayments", value)
                      }
                    />
                  </div>

                  <div className="admin-settings-notice">
                    <Wallet size={19} />
                    <p>
                      Payment processing must be verified through the payment
                      provider and backend before a subscription is activated.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="admin-settings-section">
                  <div className="admin-settings-section-heading">
                    <div className="admin-settings-heading-icon">
                      <Bell size={21} />
                    </div>
                    <div>
                      <h2>Notification preferences</h2>
                      <p>Choose which platform events administrators should receive.</p>
                    </div>
                  </div>

                  <div className="admin-settings-options">
                    <SettingToggle
                      title="Email notifications"
                      description="Enable email notifications for administrator accounts."
                      checked={settings.emailNotifications}
                      onChange={(value) =>
                        updateSetting("emailNotifications", value)
                      }
                    />

                    <SettingToggle
                      title="New user registrations"
                      description="Receive alerts when new members create accounts."
                      checked={settings.newUserAlerts}
                      onChange={(value) =>
                        updateSetting("newUserAlerts", value)
                      }
                    />

                    <SettingToggle
                      title="New job submissions"
                      description="Receive alerts when employers submit new jobs for review."
                      checked={settings.newJobAlerts}
                      onChange={(value) =>
                        updateSetting("newJobAlerts", value)
                      }
                    />

                    <SettingToggle
                      title="Payment notifications"
                      description="Receive alerts about subscription payments and payment failures."
                      checked={settings.paymentAlerts}
                      onChange={(value) =>
                        updateSetting("paymentAlerts", value)
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="admin-settings-section">
                  <div className="admin-settings-section-heading">
                    <div className="admin-settings-heading-icon">
                      <LockKeyhole size={21} />
                    </div>
                    <div>
                      <h2>Security settings</h2>
                      <p>Protect administrator accounts and platform access.</p>
                    </div>
                  </div>

                  <div className="admin-settings-options">
                    <SettingToggle
                      title="Two-factor authentication"
                      description="Require an additional verification step for administrator access."
                      checked={settings.twoFactor}
                      onChange={(value) =>
                        updateSetting("twoFactor", value)
                      }
                    />

                    <SettingToggle
                      title="Administrator login alerts"
                      description="Send notifications when an administrator signs in."
                      checked={settings.adminLoginAlerts}
                      onChange={(value) =>
                        updateSetting("adminLoginAlerts", value)
                      }
                    />
                  </div>

                  <div className="admin-settings-form admin-settings-security-form">
                    <label>
                      Admin session timeout
                      <select
                        value={settings.sessionTimeout}
                        onChange={(event) =>
                          updateSetting("sessionTimeout", event.target.value)
                        }
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </label>
                  </div>

                  <div className="admin-settings-notice">
                    <ShieldCheck size={19} />
                    <p>
                      Security preferences shown here are interface settings.
                      Actual authentication enforcement must be implemented
                      through Supabase and server-side security rules.
                    </p>
                  </div>
                </div>
              )}

              <div className="admin-settings-save-area">
                {saved && (
                  <span className="admin-settings-saved">
                    <Check size={16} />
                    Changes saved in this preview
                  </span>
                )}

                <button
                  type="button"
                  className="admin-settings-save"
                  onClick={handleSave}
                >
                  <Save size={17} />
                  Save changes
                </button>
              </div>
            </section>
          </div>

          <div className="admin-settings-footer-note">
            <ShieldCheck size={17} />
            <span>
              Some settings are demonstration controls and are not yet connected
              to the live database.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="admin-settings-option">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`admin-settings-switch ${checked ? "active" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}
