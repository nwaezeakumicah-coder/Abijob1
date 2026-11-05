
"use server";

import { revalidatePath } from "next/cache";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

export type InviteAdminResult = {
  success: boolean;
  message: string;
};

const ALLOWED_ROLES = [
  "admin",
  "moderator",
  "support_staff",
];

export async function inviteAdministrator(
  formData: FormData
): Promise<InviteAdminResult> {
  try {
    const currentAdmin = await getActiveAdmin();

    if (
      currentAdmin.role !== "super_admin" ||
      !currentAdmin.permissions.includes("admins.manage")
    ) {
      return {
        success: false,
        message: "Only the Super Admin can invite administrators.",
      };
    }

    const emailValue = formData.get("email");
    const roleValue = formData.get("role");

    const email =
      typeof emailValue === "string"
        ? emailValue.trim().toLowerCase()
        : "";

    const role =
      typeof roleValue === "string" ? roleValue : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        message: "Enter a valid email address.",
      };
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return {
        success: false,
        message: "Select a valid administrator role.",
      };
    }

    const supabase = createAdminClient();

    const { data: existingAdmin, error: lookupError } =
      await supabase
        .from("platform_admins")
        .select("id,email")
        .ilike("email", email)
        .maybeSingle();

    if (lookupError) {
      console.error(lookupError);

      return {
        success: false,
        message: "Unable to check existing administrator accounts.",
      };
    }

    if (existingAdmin) {
      return {
        success: false,
        message: "An administrator record already exists for this email.",
      };
    }

    const { data: invitation, error: invitationError } =
      await supabase.auth.admin.inviteUserByEmail(email);

    if (invitationError || !invitation.user) {
      console.error(invitationError);

      return {
        success: false,
        message:
          invitationError?.message ||
          "Unable to send the invitation.",
      };
    }

    const { data: newAdmin, error: insertError } =
      await supabase
        .from("platform_admins")
        .insert({
          email,
          role,
          status: "invited",
          auth_user_id: invitation.user.id,
        })
        .select("id")
        .single();

    if (insertError || !newAdmin) {
      console.error(insertError);

      await supabase.auth.admin.deleteUser(invitation.user.id);

      return {
        success: false,
        message:
          insertError?.message ||
          "Unable to create the administrator record.",
      };
    }

    const { error: auditError } = await supabase
      .from("admin_audit_logs")
      .insert({
        actor_admin_id: currentAdmin.id,
        action: "administrator.invited",
        entity_type: "platform_admin",
        entity_id: newAdmin.id,
        details: {
          email,
          assigned_role: role,
        },
      });

    revalidatePath("/administrators");
    revalidatePath("/audit-logs");

    if (auditError) {
      console.error(auditError);

      return {
        success: true,
        message:
          `Invitation sent to ${email}, but the audit log could not be saved.`,
      };
    }

    return {
      success: true,
      message:
        `Invitation successfully sent to ${email}. Account status: invited.`,
    };
  } catch (error) {
    console.error("Administrator invitation failed:", error);

    return {
      success: false,
      message: "An unexpected error occurred while sending the invitation.",
    };
  }
}
