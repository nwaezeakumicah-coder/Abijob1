
"use server";

import { revalidatePath } from "next/cache";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

export type InviteAdminResult = {
  success: boolean;
  message: string;
};

export type ManageAdminResult = {
  success: boolean;
  message: string;
};

const ALLOWED_ROLES = [
  "admin",
  "moderator",
  "support_staff",
] as const;

const ALLOWED_ACTIONS = [
  "change_role",
  "suspend",
  "reactivate",
  "revoke",
] as const;

export type AdminManagementAction =
  (typeof ALLOWED_ACTIONS)[number];

type AuthCleanupResult = {
  success: boolean;
  deleted: boolean;
  message: string;
};

/**
 * Delete only an Auth account that has never been accepted or used.
 * Confirmed accounts and accounts with sign-in history are preserved.
 */
async function deleteUnacceptedAuthUser(
  supabase: ReturnType<typeof createAdminClient>,
  authUserId: string,
  expectedEmail: string
): Promise<AuthCleanupResult> {
  const { data, error } =
    await supabase.auth.admin.getUserById(authUserId);

  if (error || !data.user) {
    console.error(
      "Unable to inspect administrator Auth account:",
      error
    );

    return {
      success: false,
      deleted: false,
      message:
        "Unable to verify the existing Auth account. No account was deleted.",
    };
  }

  const authUser = data.user;

  if (
    authUser.email?.trim().toLowerCase() !==
    expectedEmail.trim().toLowerCase()
  ) {
    return {
      success: false,
      deleted: false,
      message:
        "The linked Auth account does not match the administrator email. Manual review is required.",
    };
  }

  if (
    authUser.email_confirmed_at ||
    authUser.last_sign_in_at
  ) {
    return {
      success: true,
      deleted: false,
      message:
        "This Auth account has already been confirmed or used. It was preserved.",
    };
  }

  const { error: deleteError } =
    await supabase.auth.admin.deleteUser(authUserId);

  if (deleteError) {
    console.error(
      "Unable to delete unaccepted administrator invitation:",
      deleteError
    );

    return {
      success: false,
      deleted: false,
      message:
        "The unaccepted Auth invitation could not be removed. Please try again.",
    };
  }

  return {
    success: true,
    deleted: true,
    message: "The unaccepted Auth invitation was removed.",
  };
}

function getInvitationRedirectUrl(): string | null {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);

    const isLocalhost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1";

    if (
      (url.protocol !== "https:" && !isLocalhost) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== "/" && url.pathname !== "")
    ) {
      return null;
    }

    return `${url.origin}/auth/callback`;
  } catch {
    return null;
  }
}

export async function inviteAdministrator(
  formData: FormData
): Promise<InviteAdminResult> {
  const currentAdmin = await getActiveAdmin();

  if (
    currentAdmin.role !== "super_admin" ||
    !currentAdmin.permissions.includes("admins.manage")
  ) {
    return {
      success: false,
      message:
        "Only the Super Admin can invite administrators.",
    };
  }

  const emailValue = formData.get("email");
  const roleValue = formData.get("role");

  const email =
    typeof emailValue === "string"
      ? emailValue.trim().toLowerCase()
      : "";

  const role =
    typeof roleValue === "string"
      ? roleValue.trim()
      : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      message: "Enter a valid email address.",
    };
  }

  if (
    !ALLOWED_ROLES.includes(
      role as (typeof ALLOWED_ROLES)[number]
    )
  ) {
    return {
      success: false,
      message: "Select a valid administrator role.",
    };
  }

  const redirectTo = getInvitationRedirectUrl();

  if (!redirectTo) {
    return {
      success: false,
      message:
        "The Admin Portal URL is not configured correctly. Contact the deployment administrator.",
    };
  }

  try {
    const supabase = createAdminClient();

    // Check whether an administrator record already exists.
    // Escape SQL LIKE wildcards in the email filter.
    const emailPattern = email.replace(
      /[\\%_]/g,
      "\\$&"
    );

    const { data: existingAdmin, error: lookupError } =
      await supabase
        .from("platform_admins")
        .select("id, email, role, status, auth_user_id")
        .ilike("email", emailPattern)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "Administrator invitation lookup failed:",
        lookupError
      );

      return {
        success: false,
        message:
          "Unable to check the administrator directory. Please try again.",
      };
    }

    if (existingAdmin) {
      if (existingAdmin.status !== "revoked") {
        return {
          success: false,
          message:
            "An administrator account or invitation already exists for this email. Revoke the existing invitation before inviting again.",
        };
      }

      // A revoked record can retain its old Auth ID if a previous
      // cleanup attempt failed. Retry cleanup before sending a new invite.
      if (existingAdmin.auth_user_id) {
        const cleanup = await deleteUnacceptedAuthUser(
          supabase,
          existingAdmin.auth_user_id,
          email
        );

        if (!cleanup.success) {
          return {
            success: false,
            message: cleanup.message,
          };
        }

        if (!cleanup.deleted) {
          return {
            success: false,
            message:
              "This revoked administrator has a confirmed or previously used Auth account. Do not create a duplicate invitation. The existing account requires recovery or manual review.",
          };
        }
      }
    }

    // Send the Supabase Auth invitation.
    const { data: invitation, error: invitationError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });

    if (invitationError || !invitation?.user) {
      console.error(
        "Administrator Auth invitation failed:",
        invitationError
      );

      return {
        success: false,
        message:
          "Unable to send the invitation. The email may already be registered or the email service may be unavailable.",
      };
    }

    // Create a new administrator record or reuse a revoked record.
    const { data: newAdminId, error: databaseError } =
      await supabase.rpc(
        "create_platform_admin_invitation",
        {
          p_auth_user_id: invitation.user.id,
          p_email: email,
          p_role: role,
          p_actor_admin_id: currentAdmin.id,
        }
      );

    if (databaseError || !newAdminId) {
      console.error(
        "Administrator database invitation failed:",
        databaseError
      );

      // The database operation failed. Attempt to remove the new,
      // unaccepted Auth account to avoid leaving an orphan.
      const cleanup = await deleteUnacceptedAuthUser(
        supabase,
        invitation.user.id,
        email
      );

      if (!cleanup.success) {
        console.error(
          "Invitation rollback requires manual review:",
          cleanup.message
        );

        return {
          success: false,
          message:
            "The administrator record could not be created, and the temporary Auth account could not be cleaned up. Manual review is required before retrying.",
        };
      }

      return {
        success: false,
        message:
          "The administrator record could not be created. The temporary Auth invitation was cleaned up. Please try again.",
      };
    }

    revalidatePath("/administrators");
    revalidatePath("/audit-logs");

    return {
      success: true,
      message:
        `Invitation successfully sent to ${email}. The account will activate after the recipient accepts the invitation and completes verification.`,
    };
  } catch (error) {
    console.error("Administrator invitation failed:", error);

    return {
      success: false,
      message:
        "An unexpected error occurred while sending the administrator invitation.",
    };
  }
}

export async function manageAdministrator(
  targetAdminId: string,
  action: AdminManagementAction,
  newRole?: string
): Promise<ManageAdminResult> {
  const currentAdmin = await getActiveAdmin();

  if (
    currentAdmin.role !== "super_admin" ||
    !currentAdmin.permissions.includes("admins.manage")
  ) {
    return {
      success: false,
      message:
        "Only the Super Admin can manage administrator accounts.",
    };
  }

  const validUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!validUuid.test(targetAdminId)) {
    return {
      success: false,
      message: "Invalid administrator account.",
    };
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    return {
      success: false,
      message:
        "Invalid administrator management action.",
    };
  }

  if (
    action === "change_role" &&
    (typeof newRole !== "string" ||
      !ALLOWED_ROLES.includes(
        newRole as (typeof ALLOWED_ROLES)[number]
      ))
  ) {
    return {
      success: false,
      message: "Select a valid administrator role.",
    };
  }

  if (action !== "change_role" && newRole !== undefined) {
    return {
      success: false,
      message: "Unexpected role value supplied.",
    };
  }

  try {
    const supabase = createAdminClient();

    let pendingAuthAccount:
      | {
          authUserId: string;
          email: string;
        }
      | null = null;

    // Inspect the target before revocation. Do not delete anything yet.
    if (action === "revoke") {
      const { data: target, error: targetError } =
        await supabase
          .from("platform_admins")
          .select("id, email, role, status, auth_user_id")
          .eq("id", targetAdminId)
          .maybeSingle();

      if (targetError || !target) {
        console.error(
          "Administrator revocation lookup failed:",
          targetError
        );

        return {
          success: false,
          message:
            "Unable to find the administrator account.",
        };
      }

      // Only pending invitations are eligible for Auth cleanup.
      // Active or previously used administrator accounts are preserved.
      if (
        (target.status === "invited" ||
          target.status === "pending_approval") &&
        target.auth_user_id
      ) {
        pendingAuthAccount = {
          authUserId: target.auth_user_id,
          email: target.email,
        };
      }
    }

    // Revoke or update the database record FIRST.
    const { data: managed, error } = await supabase.rpc(
      "manage_platform_admin",
      {
        p_target_admin_id: targetAdminId,
        p_actor_admin_id: currentAdmin.id,
        p_action: action,
        p_new_role:
          action === "change_role" ? newRole : null,
      }
    );

    if (error || managed !== true) {
      console.error(
        "Administrator management failed:",
        error || "Database function did not confirm the operation."
      );

      const message = error?.message || "";

      return {
        success: false,
        message:
          message.includes("Cannot") ||
          message.includes("Only") ||
          message.includes("already") ||
          message.includes("Invalid") ||
          message.includes("not found") ||
          message.includes("Unauthorized")
            ? message
            : "The administrator account could not be updated. Please check the account and try again.",
      };
    }

    revalidatePath("/administrators");
    revalidatePath("/audit-logs");

    // Only after successful database revocation do we attempt
    // to delete an unaccepted invitation.
    if (action === "revoke" && pendingAuthAccount) {
      const cleanup = await deleteUnacceptedAuthUser(
        supabase,
        pendingAuthAccount.authUserId,
        pendingAuthAccount.email
      );

      if (!cleanup.success) {
        return {
          success: true,
          message:
            "Administrator access was revoked, but the old Auth invitation could not be removed. You can retry cleanup when reinviting this address.",
        };
      }

      if (!cleanup.deleted) {
        return {
          success: true,
          message:
            "Administrator access was revoked. The existing confirmed or previously used Auth account was preserved.",
        };
      }

      return {
        success: true,
        message:
          "Administrator access was revoked and the unaccepted Auth invitation was removed.",
      };
    }

    return {
      success: true,
      message:
        action === "revoke"
          ? "Administrator access revoked successfully."
          : "Administrator account updated successfully.",
    };
  } catch (error) {
    console.error(
      "Administrator management error:",
      error
    );

    return {
      success: false,
      message:
        "An unexpected error occurred while updating the administrator account.",
    };
  }
}
