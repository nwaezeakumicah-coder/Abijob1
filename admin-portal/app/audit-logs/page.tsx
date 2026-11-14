
import AdminShell from "../../components/AdminShell";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";
import "./audit-logs.css";

export const dynamic = "force-dynamic";

type AuditDetails = {
  actor_user_id?: string | null;
  source?: string | null;
  [key: string]: unknown;
};

type AuditLog = {
  id: string;
  actor_admin_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

type Actor = {
  name: string;
  type: "Administrator" | "User" | "System" | "Unknown";
  id: string | null;
};

function formatLabel(value?: string | null) {
  if (!value) return "Not available";

  return value
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

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

  if (
    value.includes("approve") ||
    value.includes("create") ||
    value.includes("activate") ||
    value.includes("success")
  ) {
    return "audit-action positive";
  }

  if (
    value.includes("reject") ||
    value.includes("delete") ||
    value.includes("suspend") ||
    value.includes("fail")
  ) {
    return "audit-action negative";
  }

  return "audit-action neutral";
}

function parseDetails(details: unknown): AuditDetails {
  if (!details) return {};

  if (typeof details === "string") {
    try {
      const parsed: unknown = JSON.parse(details);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as AuditDetails;
      }
    } catch {
      return {};
    }

    return {};
  }

  if (typeof details === "object" && !Array.isArray(details)) {
    return details as AuditDetails;
  }

  return {};
}

function detailsText(details: unknown) {
  if (details === null || details === undefined) {
    return "No additional details";
  }

  if (typeof details === "string") return details;

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return "Details unavailable";
  }
}

function identifyActor(
  log: AuditLog,
  adminEmails: Map<string, string>
): Actor {
  if (log.actor_admin_id) {
    return {
      name:
        adminEmails.get(log.actor_admin_id) ??
        "Administrator identity unavailable",
      type: "Administrator",
      id: log.actor_admin_id,
    };
  }

  const details = parseDetails(log.details);

  if (details.actor_user_id) {
    return {
      name: "User account",
      type: "User",
      id: details.actor_user_id,
    };
  }

  if (details.source === "database_trigger") {
    return {
      name: "Database system",
      type: "System",
      id: "database",
    };
  }

  return {
    name: "System / Unknown",
    type: "Unknown",
    id: null,
  };
}

export default async function AuditLogsPage() {
  const admin = await getActiveAdmin();

  if (!admin.permissions.includes("audit.view")) {
    return (
      <AdminShell>
        <main className="audit-page">
          <div className="audit-empty">
            <h2>Access restricted</h2>
            <p>
              You do not have permission to view administrator audit logs.
            </p>
          </div>
        </main>
      </AdminShell>
    );
  }

  const supabase = createAdminClient();

  const [logsResult, adminsResult] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select(
        "id, actor_admin_id, action, entity_type, entity_id, details, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(500),

    supabase.from("platform_admins").select("id, email"),
  ]);

  const logs = (logsResult.data ?? []) as AuditLog[];
  const admins = adminsResult.data ?? [];

  const adminEmails = new Map(
    admins.map((item) => [item.id, item.email])
  );

  const actionCounts = logs.reduce<Record<string, number>>(
    (result, log) => {
      const key = log.action || "unknown";
      result[key] = (result[key] ?? 0) + 1;
      return result;
    },
    {}
  );

  const actorTypes = logs.map((log) =>
    identifyActor(log, adminEmails)
  );

  const adminActors = new Set(
    actorTypes
      .filter((actor) => actor.type === "Administrator")
      .map((actor) => actor.id)
  );

  const userActors = new Set(
    actorTypes
      .filter((actor) => actor.type === "User")
      .map((actor) => actor.id)
  );

  const systemEvents = actorTypes.filter(
    (actor) => actor.type === "System"
  ).length;

  return (
    <AdminShell>
      <main className="audit-page">
        <header className="audit-header">
          <div>
            <span className="audit-eyebrow">
              SECURITY &amp; ACCOUNTABILITY
            </span>
            <h1>Audit Logs</h1>
            <p>
              Monitor administrator activity, user actions and automated
              database events across Abijob.
            </p>
          </div>

          <div className="audit-readonly">
            <span>READ ONLY</span>
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
            <strong>{adminActors.size}</strong>
            <small>Unique identified administrators</small>
          </article>

          <article className="audit-stat-card">
            <span>Users involved</span>
            <strong>{userActors.size}</strong>
            <small>Unique identified users</small>
          </article>

          <article className="audit-stat-card">
            <span>System events</span>
            <strong>{systemEvents}</strong>
            <small>Database-triggered records</small>
          </article>
        </section>

        <section className="audit-section">
          <div className="audit-section-heading">
            <div>
              <h2>Activity history</h2>
              <p>
                Administrator, user and system events appear in chronological
                order, newest first.
              </p>
            </div>

            <span className="audit-count">
              {logs.length} records
            </span>
          </div>

          {logsResult.error ? (
            <div className="audit-error">
              Unable to retrieve audit logs: {logsResult.error.message}
            </div>
          ) : (
            <>
              {adminsResult.error && (
                <div className="audit-error">
                  Audit records were retrieved, but administrator identities
                  could not be resolved. Actor names may be incomplete.
                </div>
              )}

              {logs.length === 0 ? (
                <div className="audit-empty">
                  <div className="audit-empty-icon">NO ACTIVITY</div>
                  <h3>No audit records found</h3>
                  <p>
                    Recorded activities will appear here when they are written
                    to the audit log table.
                  </p>
                </div>
              ) : (
                <div className="audit-table-wrap">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Date and time</th>
                        <th>Actor</th>
                        <th>Actor type</th>
                        <th>Action</th>
                        <th>Record type</th>
                        <th>Source</th>
                        <th>Record ID</th>
                        <th>Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {logs.map((log) => {
                        const actor = identifyActor(log, adminEmails);
                        const details = parseDetails(log.details);

                        return (
                          <tr key={log.id}>
                            <td className="audit-date">
                              {formatDate(log.created_at)}
                            </td>

                            <td>
                              <strong className="audit-actor">
                                {actor.name}
                              </strong>
                            </td>

                            <td>{actor.type}</td>

                            <td>
                              <span className={actionClass(log.action)}>
                                {formatLabel(log.action)}
                              </span>
                            </td>

                            <td>{formatLabel(log.entity_type)}</td>

                            <td>
                              {details.source
                                ? formatLabel(String(details.source))
                                : "Not available"}
                            </td>

                            <td>
                              <code className="audit-record-id">
                                {log.entity_id || "Not available"}
                              </code>
                            </td>

                            <td>
                              <details className="audit-details">
                                <summary>View details</summary>
                                <pre>{detailsText(log.details)}</pre>
                              </details>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        <section className="audit-section">
          <div className="audit-section-heading">
            <div>
              <h2>Recorded action summary</h2>
              <p>
                Distribution of action types in the retrieved records.
              </p>
            </div>
          </div>

          {Object.keys(actionCounts).length === 0 ? (
            <p className="audit-muted">
              No recorded actions to summarise.
            </p>
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
