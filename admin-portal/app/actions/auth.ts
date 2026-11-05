
"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";

export async function adminLogin(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/?error=Enter%20your%20email%20and%20password");
  }

  const supabase = await createClient();

  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError || !loginData.user) {
    console.error("[Admin login] Authentication failed:", {
      code: loginError?.code,
      message: loginError?.message,
    });

    redirect("/?error=Invalid%20email%20or%20password");
  }

  const adminClient = createAdminClient();

  const { data: adminRecord, error: adminError } = await adminClient
    .from("platform_admins")
    .select("id, email, role, status")
    .eq("auth_user_id", loginData.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (adminError || !adminRecord) {
    console.error("[Admin login] Administrator verification failed:", {
      code: adminError?.code,
      message: adminError?.message,
      details: adminError?.details,
      hint: adminError?.hint,
    });

    await supabase.auth.signOut();
    redirect("/?error=This%20account%20is%20not%20an%20active%20administrator");
  }

  const { data: permissions, error: permissionError } = await adminClient
    .from("admin_permissions")
    .select("permission_key")
    .eq("role", adminRecord.role);

  if (permissionError) {
    console.error("[Admin login] Permission lookup failed:", {
      code: permissionError.code,
      message: permissionError.message,
      details: permissionError.details,
      hint: permissionError.hint,
    });
  }

  const hasDashboardPermission =
    !permissionError &&
    permissions?.some(
      (permission) => permission.permission_key === "dashboard.view"
    );

  if (!hasDashboardPermission) {
    await supabase.auth.signOut();
    redirect("/?error=Your%20account%20does%20not%20have%20dashboard%20access");
  }

  const { error: updateError } = await adminClient
    .from("platform_admins")
    .update({
      last_login_at: new Date().toISOString(),
    })
    .eq("id", adminRecord.id);

  if (updateError) {
    console.error("[Admin login] Last login update failed:", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });

    await supabase.auth.signOut();
    redirect("/?error=Unable%20to%20complete%20administrator%20login");
  }

  const { error: auditError } = await adminClient
    .from("admin_audit_logs")
    .insert({
      actor_admin_id: adminRecord.id,
      target_admin_id: adminRecord.id,
      action: "admin.login",
      entity_type: "platform_admin",
      entity_id: adminRecord.id,
      details: {
        email: adminRecord.email,
        role: adminRecord.role,
      },
    });

  if (auditError) {
    console.error("[Admin login] Audit insert failed:", {
      code: auditError.code,
      message: auditError.message,
      details: auditError.details,
      hint: auditError.hint,
    });

    await supabase.auth.signOut();
    redirect("/?error=Unable%20to%20record%20administrator%20login");
  }

  redirect("/dashboard");
}

export async function adminLogout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/");
}
