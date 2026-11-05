import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(
      new URL("/login?error=authentication-required", request.url)
    );
  }

  const adminClient = createAdminClient();

  const { data: admin, error: adminError } = await adminClient
    .from("platform_admins")
    .select("id, email, role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (
    adminError ||
    !admin ||
    admin.status !== "active"
  ) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL("/login?error=not-authorized", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard", request.url)
  );
}