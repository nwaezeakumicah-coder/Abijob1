import AdminShell from "../../components/AdminShell";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";
import InviteAdminForm from "./InviteAdminForm";
import AdminAccountActions from "./AdminAccountActions";
import "./admins.css";

export const dynamic = "force-dynamic";

type AdminAccount = {
  id: string;
  email: string | null;
  role: string;
  status: string;
  auth_user_id: string | null;
};

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Administrator",
    moderator: "Moderator",
    support_staff: "Support Staff",
  };

  return labels[role] ?? role.replaceAll("_", " ");
}

function roleDescription(role: string) {
  const descriptions: Record<string, string> = {
    super_admin: "Full platform administration and administrator management.",
    admin: "Manages users, employers, payments, and platform operations.",
    moderator: "Reviews jobs and monitors platform content.",
    support_staff: "Handles user support and authorised support tasks.",
  };

  return descriptions[role] ?? "Custom administrator role.";
}

function statusClass(status: string) {
  const value = status.toLowerCase();

  if (value === "active") return "admin-account-status active";

  if (["suspended", "revoked", "inactive"].includes(value)) {
    return "admin-account-status suspended";
  }

  return "admin-account-status pending";
}

export default async function AdminAccountsPage() {
  const currentAdmin = await getActiveAdmin();
  const canManage = currentAdmin.permissions.includes("admins.manage");
  const isSuperAdmin = currentAdmin.role === "super_admin";

  if (!canManage || !isSuperAdmin) {
    return (
      <AdminShell>
        <main className="admin-accounts-page">
          <div className="admin-accounts-empty">
            <h2>Access restricted</h2>
            <p>
              Only the Super Admin can access administrator account management.
            </p>
          </div>
        </main>
      </AdminShell>
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("platform_admins")
    .select("id,email,role,status,auth_user_id")
    .order("email", { ascending: true });

  const accounts = (data ?? []) as AdminAccount[];

  const activeCount = accounts.filter(
    (account) => account.status?.toLowerCase() === "active"
  ).length;

  const suspendedCount = accounts.filter(
    (account) =>
      ["suspended", "inactive"].includes(account.status?.toLowerCase())
  ).length;

  const pendingCount = accounts.filter(
    (account) =>
      ["invited", "pending_approval"].includes(
        account.status?.toLowerCase()
      )
  ).length;

  const revokedCount = accounts.filter(
    (account) => account.status?.toLowerCase() === "revoked"
  ).length;

  const roleCounts = accounts.reduce<Record<string, number>>(
    (result, account) => {
      result[account.role] = (result[account.role] ?? 0) + 1;
      return result;
    },
    {}
  );

  return (
    <AdminShell>
      <main className="admin-accounts-page">
        <header className="admin-accounts-header">
          <div>
            <span className="admin-accounts-eyebrow">
              ACCESS &amp; SECURITY
            </span>

            <h1>Administrator Accounts</h1>

            <p>
              Manage administrator access, assigned responsibilities, and
              account status across Abi Job.
            </p>
          </div>

          <div className="admin-accounts-access-note">
            <span className="admin-accounts-lock">🔒</span>
            <div>
              <strong>Restricted area</strong>
              <small>Super Admin permission required</small>
            </div>
          </div>
        </header>

        <InviteAdminForm />

        <section className="admin-accounts-summary">
          <article className="admin-account-stat">
            <span>Total administrator accounts</span>
            <strong>{accounts.length}</strong>
            <small>Accounts registered in the admin directory</small>
          </article>

          <article className="admin-account-stat">
            <span>Active accounts</span>
            <strong>{activeCount}</strong>
            <small>Accounts currently marked active</small>
          </article>

          <article className="admin-account-stat">
            <span>Pending invitations</span>
            <strong>{pendingCount}</strong>
            <small>Invited or awaiting approval</small>
          </article>

          <article className="admin-account-stat">
            <span>Suspended accounts</span>
            <strong>{suspendedCount}</strong>
            <small>Accounts temporarily disabled</small>
          </article>

          <article className="admin-account-stat">
            <span>Revoked accounts</span>
            <strong>{revokedCount}</strong>
            <small>Accounts with permanently revoked access</small>
          </article>
        </section>

        <section className="admin-accounts-section">
          <div className="admin-accounts-section-heading">
            <div>
              <h2>Administrator directory</h2>
              <p>
                Change roles, suspend access, reactivate suspended accounts,
                or revoke access.
              </p>
            </div>

            <span className="admin-accounts-count">
              {accounts.length} accounts
            </span>
          </div>

          {error ? (
            <div className="admin-accounts-error">
              Unable to load administrator accounts: {error.message}
            </div>
          ) : accounts.length === 0 ? (
            <div className="admin-accounts-empty">
              <h3>No administrator accounts found</h3>
              <p>
                Administrator records will appear here after they are
                provisioned.
              </p>
            </div>
          ) : (
            <div className="admin-accounts-table-wrap">
              <table className="admin-accounts-table">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Assigned role</th>
                    <th>Account status</th>
                    <th>Authentication link</th>
                    <th>Account ID</th>
                    <th>Management actions</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map((account) => {
                    const isCurrentAdmin =
                      account.id === currentAdmin.id;

                    return (
                      <tr key={account.id}>
                        <td>
                          <div className="admin-account-identity">
                            <div className="admin-account-avatar">
                              {(account.email?.[0] ?? "A").toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {account.email || "No email recorded"}
                              </strong>

                              {isCurrentAdmin && (
                                <small className="admin-account-you">
                                  Your current account
                                </small>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="admin-account-role">
                            <strong>{roleLabel(account.role)}</strong>
                            <small>{roleDescription(account.role)}</small>
                          </div>
                        </td>

                        <td>
                          <span className={statusClass(account.status)}>
                            {account.status || "Unknown"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              account.auth_user_id
                                ? "admin-account-link linked"
                                : "admin-account-link missing"
                            }
                          >
                            {account.auth_user_id
                              ? "Linked to Auth"
                              : "Not linked"}
                          </span>
                        </td>

                        <td>
                          <code className="admin-account-id">
                            {account.id}
                          </code>
                        </td>

                        <td>
                          <AdminAccountActions
                            adminId={account.id}
                            role={account.role}
                            status={account.status}
                            disabled={isCurrentAdmin}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-accounts-section">
          <div className="admin-accounts-section-heading">
            <div>
              <h2>Role overview</h2>
              <p>
                A summary of the administrator roles currently represented
                in your database.
              </p>
            </div>
          </div>

          <div className="admin-role-grid">
            {[
              {
                role: "super_admin",
                title: "Super Admin",
                description:
                  "Full control, including administrator management, permissions, settings, and audit access.",
              },
              {
                role: "admin",
                title: "Administrator",
                description:
                  "Handles platform operations such as users, employers, payments, and subscriptions.",
              },
              {
                role: "moderator",
                title: "Moderator",
                description:
                  "Reviews jobs and monitors platform content and reports.",
              },
              {
                role: "support_staff",
                title: "Support Staff",
                description:
                  "Handles authorised user support responsibilities.",
              },
            ].map((item) => (
              <article className="admin-role-card" key={item.role}>
                <div className="admin-role-card-top">
                  <h3>{item.title}</h3>
                  <strong>{roleCounts[item.role] ?? 0}</strong>
                </div>

                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="admin-accounts-security-note">
          <strong>Security reminder</strong>
          <p>
            Administrator access should only be granted to trusted people.
            Assign each person the minimum role and permissions needed for
            their responsibilities. Never share administrator login details.
          </p>
        </div>
      </main>
    </AdminShell>
  );
}