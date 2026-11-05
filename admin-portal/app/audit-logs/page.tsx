
import AdminShell from "../../components/AdminShell";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";
import "./audit-logs.css";

export const dynamic = "force-dynamic";

type AuditLog = {
  id: string;
  actor_admin_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

function formatLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionClass(action: string) {
  const value = action.toLowerCase();

  if (value.includes("approve") || value.includes("create")) {
    return "audit-action positive";
  }

  if (
    value.includes("reject") ||
    value.includes("delete") ||
    value.includes("suspend")
  ) {
    return "audit-action negative";
  }

  return "audit-action neutral";
}

function detailsText(details: unknown) {
  if (details === null || details === undefined) return "No additional details";

  if (typeof details === "string") return details;

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return "Details unavailable";
  }
}

export default async function AuditLogsPage() {
  const admin = await getActiveAdmin();

  if (!admin.permissions.includes("audit.view")) {
    return (
      <AdminShell>
        <main className="audit-page">
          <div className="audit-empty">
            <h2>Access restricted</h2>
            <p>You do not have permission to view administrator audit logs.</p>
          </div>
        </main>
      </AdminShell>
    );
  }

  const supabase = createAdminClient();

  const [logsResult, adminsResult] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),

    supabase.from("platform_admins").select("id,email"),
  ]);

  const logs = (logsResult.data ?? []) as AuditLog[];
  const admins = adminsResult.data ?? [];

  const adminEmails = new Map(
    admins.map((item) => [item.id, item.email])
  );

  const actionCounts = logs.reduce<Record<string, number>>((result, log) => {
    const key = log.action || "unknown";
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});

  const activeActors = new Set(
    logs.map((log) => log.actor_admin_id).filter(Boolean)
  );

  return (
    <AdminShell>
      <main className="audit-page">
        <header className="audit-header">
          <div>
            <span className="audit-eyebrow">SECURITY &amp; ACCOUNTABILITY</span>
            <h1>Audit Logs</h1>
            <p>
              Monitor administrator activity and review recorded actions
              across the Abi Job platform.
            </p>
          </div>

          <div className="audit-readonly">
            <span>●</span>
            Read-only records
          </div>
        </header>

        <section className="audit-stats">
          <article className="audit-stat-card">
            <span>Records retrieved</span>
            <strong>{logs.length}</strong>
            <small>Maximum 500 latest records</small>
          </article>

          <article className="audit-stat-card">
            <span>Administrators involved</span>
            <strong>{activeActors.size}</strong>
            <small>Unique recorded administrator IDs</small>
          </article>

          <article className="audit-stat-card">
            <span>Action types</span>
            <strong>{Object.keys(actionCounts).length}</strong>
            <small>Different recorded actions</small>
          </article>
        </section>

        <section className="audit-section">
          <div className="audit-section-heading">
            <div>
              <h2>Activity history</h2>
              <p>Most recent administrator actions appear first.</p>
            </div>

            <span className="audit-count">
              {logs.length} records
            </span>
          </div>

          {logsResult.error ? (
            <div className="audit-error">
              Unable to retrieve audit logs: {logsResult.error.message}
            </div>
          ) : logs.length === 0 ? (
            <div className="audit-empty">
              <div className="audit-empty-icon">◷</div>
              <h3>No audit records found</h3>
              <p>
                Administrator actions will appear here when they are recorded
                in the audit log table.
              </p>
            </div>
          ) : (
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Date and time</th>
                    <th>Administrator</th>
                    <th>Action</th>
                    <th>Record type</th>
                    <th>Record ID</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="audit-date">
                        {formatDate(log.created_at)}
                      </td>

                      <td>
                        <strong className="audit-actor">
                          {log.actor_admin_id
                            ? adminEmails.get(log.actor_admin_id) ??
                              "Administrator not found"
                            : "System / Unknown"}
                        </strong>
                      </td>

                      <td>
                        <span className={actionClass(log.action)}>
                          {formatLabel(log.action)}
                        </span>
                      </td>

                      <td>{formatLabel(log.entity_type)}</td>

                      <td>
                        <code className="audit-record-id">
                          {log.entity_id || "—"}
                        </code>
                      </td>

                      <td>
                        <details className="audit-details">
                          <summary>View details</summary>
                          <pre>{detailsText(log.details)}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="audit-section">
          <div className="audit-section-heading">
            <div>
              <h2>Recorded action summary</h2>
              <p>Distribution of action types in the retrieved records.</p>
            </div>
          </div>

          {Object.keys(actionCounts).length === 0 ? (
            <p className="audit-muted">No recorded actions to summarise.</p>
          ) : (
            <div className="audit-action-grid">
              {Object.entries(actionCounts).map(([action, count]) => (
                <article className="audit-action-card" key={action}>
                  <span>{formatLabel(action)}</span>
                  <strong>{count}</strong>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="audit-footer">
          Audit history is displayed from the database. This page does not
          modify or delete audit records.
        </footer>
      </main>
    </AdminShell>
  );
}
