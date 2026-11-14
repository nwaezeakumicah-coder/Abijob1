
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

  // Every administrator must complete TOTP MFA before protected pages
  // or server actions are allowed to continue.
  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();
  if (factorsError) {
    throw new Error("Unable to verify administrator security factors.");
  }

  const hasVerifiedTotp = (factors?.totp ?? []).some(
    (factor) => factor.status === "verified"
  );
  if (!hasVerifiedTotp) redirect("/mfa");

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) {
    throw new Error("Unable to verify administrator session assurance.");
  }
  if (assurance.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
    redirect("/mfa");
  }

  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    permissions: permissionKeys,
  };
}
