"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  manageAdministrator,
  type AdminManagementAction,
} from "./actions";

type Props = {
  adminId: string;
  role: string;
  status: string;
  disabled?: boolean;
};

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "moderator", label: "Moderator" },
  { value: "support_staff", label: "Support Staff" },
];

export default function AdminAccountActions({
  adminId,
  role,
  status,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [newRole, setNewRole] = useState(role);
  const [messageSuccess, setMessageSuccess] = useState(false);

  const normalizedStatus = status.toLowerCase();

  const isProtected =
    disabled ||
    role === "super_admin" ||
    normalizedStatus === "revoked";

  function runAction(
    action: AdminManagementAction,
    selectedRole?: string
  ) {
    if (isPending || isProtected) return;

    const prompts: Record<AdminManagementAction, string> = {
      change_role: `Change this administrator's role to ${selectedRole}?`,
      suspend: "Suspend this administrator's access?",
      reactivate: "Reactivate this suspended administrator?",
      revoke:
        "Permanently revoke this administrator's access? This action cannot be undone through this page.",
    };

    if (!window.confirm(prompts[action])) return;

    setMessage("");

    startTransition(async () => {
      const result = await manageAdministrator(
        adminId,
        action,
        selectedRole
      );

      setMessageSuccess(result.success);
      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="admin-account-actions">
      {isProtected ? (
        <span className="admin-account-protected">
          {role === "super_admin"
            ? "Protected account"
            : normalizedStatus === "revoked"
              ? "Access revoked"
              : "Your account"}
        </span>
      ) : (
        <>
          <div className="admin-account-action-role">
            <select
              aria-label="Change administrator role"
              value={newRole}
              onChange={(event) => setNewRole(event.target.value)}
              disabled={isPending}
            >
              {ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="admin-action-button"
              disabled={isPending || newRole === role}
              onClick={() => runAction("change_role", newRole)}
            >
              Change role
            </button>
          </div>

          <div className="admin-account-action-buttons">
            {normalizedStatus === "active" && (
              <button
                type="button"
                className="admin-action-button warning"
                disabled={isPending}
                onClick={() => runAction("suspend")}
              >
                Suspend
              </button>
            )}

            {normalizedStatus === "suspended" && (
              <button
                type="button"
                className="admin-action-button success"
                disabled={isPending}
                onClick={() => runAction("reactivate")}
              >
                Reactivate
              </button>
            )}

            {[
              "active",
              "suspended",
              "invited",
              "pending_approval",
            ].includes(normalizedStatus) && (
              <button
                type="button"
                className="admin-action-button danger"
                disabled={isPending}
                onClick={() => runAction("revoke")}
              >
                Revoke access
              </button>
            )}
          </div>
        </>
      )}

      {isPending && (
        <small className="admin-action-feedback">
          Updating administrator account...
        </small>
      )}

      {message && (
        <small
          className={`admin-action-feedback ${
            messageSuccess ? "success" : "error"
          }`}
          role="status"
        >
          {message}
        </small>
      )}
    </div>
  );
}