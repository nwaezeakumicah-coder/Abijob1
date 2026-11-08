
import "server-only";

import { createAdminClient } from "../supabase/admin";

export const PLATFORM_ADMIN_ROLES = [
  "super_admin",
  "admin",
  "moderator",
  "support_staff",
] as const;

export type PlatformAdminRole =
  (typeof PLATFORM_ADMIN_ROLES)[number];

const PAGE_PERMISSIONS: Record<string, string[]> = {
  "/admin": ["dashboard.view"],
  "/admin/analytics": ["dashboard.view"],
  "/admin/jobs": ["jobs.view", "jobs.review", "jobs.manage"],
  "/admin/employers": ["employers.view", "employers.manage"],
  "/admin/users": ["users.view", "users.manage"],
  "/admin/subscriptions": [
    "subscriptions.view",
    "subscriptions.manage",
  ],
  "/admin/verifications": [
    "verifications.review",
    "verifications.manage",
  ],
  "/admin/reports": ["reports.view", "reports.manage"],
  "/admin/settings": ["settings.manage"],
};

export type AdminAuthorizationResult =
  | {
      authorized: true;
      adminId: string;
      role: PlatformAdminRole;
      permissions: string[];
    }
  | {
      authorized: false;
      status: 400 | 403 | 500;
      error: string;
    };

function getRequiredPermissions(pathname: string): string[] | null {
  if (
    !pathname.startsWith("/admin/") &&
    pathname !== "/admin"
  ) {
    return null;
  }

  const matchedPath = Object.keys(PAGE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find(
      (path) =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

  return matchedPath ? PAGE_PERMISSIONS[matchedPath] : null;
}

export async function authorizeAdminRoute(
  authUserId: string,
  pathname: string
): Promise<AdminAuthorizationResult> {
  if (!authUserId) {
    return {
      authorized: false,
      status: 403,
      error: "Administrator authentication is required.",
    };
  }

  const requiredPermissions = getRequiredPermissions(pathname);

  if (!requiredPermissions) {
    return {
      authorized: false,
      status: 400,
      error: "No permission rule exists for this administrator route.",
    };
  }

  try {
    const adminClient = createAdminClient();

    const { data: admin, error: adminError } = await adminClient
      .from("platform_admins")
      .select("id, role, status")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (adminError) {
      console.error("Admin membership lookup failed:", adminError);

      return {
        authorized: false,
        status: 500,
        error: "Unable to verify administrator membership.",
      };
    }

    if (!admin || admin.status !== "active") {
      return {
        authorized: false,
        status: 403,
        error: "This account is not an active administrator.",
      };
    }

    if (
      !PLATFORM_ADMIN_ROLES.includes(
        admin.role as PlatformAdminRole
      )
    ) {
      return {
        authorized: false,
        status: 403,
        error: "Invalid administrator role.",
      };
    }

    const role = admin.role as PlatformAdminRole;

    const { data: permissions, error: permissionError } =
      await adminClient
        .from("admin_permissions")
        .select("permission_key")
        .eq("role", role)
        .in("permission_key", requiredPermissions);

    if (permissionError) {
      console.error(
        "Admin permission lookup failed:",
        permissionError
      );

      return {
        authorized: false,
        status: 500,
        error: "Unable to verify administrator permissions.",
      };
    }

    const grantedPermissions = (permissions ?? []).map(
      (permission) => permission.permission_key
    );

    if (grantedPermissions.length === 0) {
      return {
        authorized: false,
        status: 403,
        error: "You do not have permission to access this page.",
      };
    }

    return {
      authorized: true,
      adminId: admin.id,
      role,
      permissions: grantedPermissions,
    };
  } catch (error) {
    console.error("Admin authorization error:", error);

    return {
      authorized: false,
      status: 500,
      error: "Unable to verify administrator access.",
    };
  }
}
