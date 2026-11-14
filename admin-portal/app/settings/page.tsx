
import AdminShell from "../../components/AdminShell";
import AdminPasskeySettings from "../../components/AdminPasskeySettings";
import { getActiveAdmin } from "../../lib/admin-auth";
import "./settings.css";
import "./passkeys.css";

export const dynamic = "force-dynamic";

const permissionDescriptions: Record<string, string> = {
  "dashboard.view": "View the administrator dashboard.",
  "users.view": "View registered platform users.",
  "users.manage": "Manage platform user accounts.",
  "jobs.view": "View job listings.",
  "jobs.review": "Review and moderate job listings.",
  "jobs.manage": "Manage job listings.",
  "employers.view": "View employer accounts.",
  "employers.manage": "Manage employer accounts.",
  "payments.view": "View payment transactions.",
  "payments.manage": "Manage payment operations.",
  "subscriptions.view": "View subscriptions.",
  "subscriptions.manage": "Manage subscription operations.",
  "reports.view": "View platform reports.",
  "reports.manage": "Manage reporting access and operations.",
  "verifications.review": "Review verification requests.",
  "verifications.manage": "Manage verification operations.",
  "admins.manage": "Manage administrator accounts and access.",
  "audit.view": "View administrator activity logs.",
  "settings.manage": "Manage platform settings.",
  "support.manage": "Manage user support operations.",
  "content.review": "Review platform content.",
};

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Super Administrator",
    admin: "Administrator",
    moderator: "Moderator",
    support_staff: "Support Staff",
  };

  return labels[role] ?? role.replaceAll("_", " ");
}

export default async function SettingsPage() {
  const admin = await getActiveAdmin();

  const permissions = [...admin.permissions].sort();

  return (
    <AdminShell>
      <main className="admin-settings-page">
        <header className="admin-settings-header">
          <div>
            <span className="admin-settings-eyebrow">CONFIGURATION</span>
            <h1>Admin Settings</h1>
            <p>
              Review your administrator account, access level, and security
              information.
            </p>
          </div>
          <span className="admin-settings-status">
            <span />
            Account active
          </span>
        </header>

        <section className="admin-settings-profile">
          <div className="admin-settings-avatar">
            {(admin.email?.[0] ?? "A").toUpperCase()}
          </div>
          <div className="admin-settings-profile-info">
            <span className="admin-settings-label">SIGNED-IN ADMINISTRATOR</span>
            <h2>{admin.email}</h2>
            <p>{roleLabel(admin.role)}</p>
          </div>
          <span className="admin-settings-role">
            {admin.role.replaceAll("_", " ")}
          </span>
        </section>

        <section className="admin-settings-section">
          <div className="admin-settings-section-heading">
            <div>
              <h2>Account information</h2>
              <p>Your current authenticated administrator details.</p>
            </div>
          </div>

          <div className="admin-settings-info-grid">
            <div className="admin-settings-info-item">
              <span>Email address</span>
              <strong>{admin.email}</strong>
            </div>
            <div className="admin-settings-info-item">
              <span>Administrator role</span>
              <strong>{roleLabel(admin.role)}</strong>
            </div>
            <div className="admin-settings-info-item">
              <span>Account status</span>
              <strong className="admin-settings-active">Active</strong>
            </div>
            <div className="admin-settings-info-item">
              <span>Administrator ID</span>
              <strong className="admin-settings-id">{admin.id}</strong>
            </div>
          </div>
        </section>

        <section className="admin-settings-section">
          <div className="admin-settings-section-heading">
            <div>
              <h2>Access permissions</h2>
              <p>
                These permissions determine which administrator operations
                your account can access.
              </p>
            </div>
            <span className="admin-settings-permission-count">
              {permissions.length} permissions
            </span>
          </div>

          {permissions.length === 0 ? (
            <div className="admin-settings-empty">
              No permissions have been assigned to this role.
            </div>
          ) : (
            <div className="admin-settings-permissions">
              {permissions.map((permission) => (
                <div className="admin-settings-permission" key={permission}>
                  <div>
                    <strong>{permission}</strong>
                    <small>
                      {permissionDescriptions[permission] ??
                        "Authorised administrator operation."}
                    </small>
                  </div>
                  <span>Granted</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-settings-section">
          <div className="admin-settings-section-heading">
            <div>
              <h2>Security information</h2>
              <p>Important information about protecting administrator access.</p>
            </div>
          </div>

          <div className="admin-settings-security-list">
            <div className="admin-settings-security-item">
              <span className="admin-settings-security-icon">✓</span>
              <div>
                <strong>Authenticated session</strong>
                <p>Your administrator identity is verified through Supabase Auth.</p>
              </div>
            </div>

            <div className="admin-settings-security-item">
              <span className="admin-settings-security-icon">✓</span>
              <div>
                <strong>Active administrator record</strong>
                <p>
                  Your account has an active record in the platform
                  administrator directory.
                </p>
              </div>
            </div>

            <div className="admin-settings-security-item">
              <span className="admin-settings-security-icon">✓</span>
              <div>
                <strong>Permission verification</strong>
                <p>
                  Your role permissions are checked when protected
                  administrator pages are accessed.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-settings-warning">
            <strong>Keep your administrator account secure</strong>
            <p>
              Never share your password, verification codes, or administrator
              login details. Use a strong, unique password and sign out when
              using a shared computer.
            </p>
          </div>
        </section>

        <AdminPasskeySettings />

        <footer className="admin-settings-footer">
          Abi Job Admin Portal · Administrator settings
        </footer>
      </main>
    </AdminShell>
  );
}
