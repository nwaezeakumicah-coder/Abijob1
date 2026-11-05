
import type { ReactNode } from "react";
import { getActiveAdmin } from "../lib/admin-auth";
import { adminLogout } from "../app/actions/auth";
import AdminSidebar from "./AdminSidebar";

export default async function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getActiveAdmin();

  return (
    <div className="admin-layout">
      <AdminSidebar
        permissions={admin.permissions}
        role={admin.role}
        email={admin.email}
        logoutAction={adminLogout}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              ABI JOB ADMINISTRATION
            </span>

            <span className="admin-topbar-status">
              <span className="admin-status-dot" />
              Secure administrator session
            </span>
          </div>

          <div className="admin-topbar-account">
            <span className="admin-topbar-role">
              {admin.role.replaceAll("_", " ")}
            </span>

            <span className="admin-topbar-initial">
              {admin.email.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
