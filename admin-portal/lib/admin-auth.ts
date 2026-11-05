
import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export async function getActiveAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const { data: admin, error: adminError } = await adminClient
    .from("platform_admins")
    .select("id, email, role, status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (adminError || !admin) {
    await supabase.auth.signOut();
    redirect("/login?error=not-authorized");
  }

  const { data: permissions, error: permissionError } =
    await adminClient
      .from("admin_permissions")
      .select("permission_key")
      .eq("role", admin.role);

  if (permissionError) {
    throw new Error(
      "Unable to verify administrator permissions. Please try again."
    );
  }

  const permissionKeys = (permissions ?? []).map(
    (permission) => permission.permission_key
  );

  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    permissions: permissionKeys,
  };
}
