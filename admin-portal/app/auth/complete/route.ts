import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      loginUrl.searchParams.set(
        "error",
        "authentication-required"
      );

      return NextResponse.redirect(loginUrl);
    }

    const adminClient = createAdminClient();

    // Attempt to activate a verified invitation.
    // This database function also writes the acceptance audit log.
    const { data: activated, error: activationError } =
      await adminClient.rpc("activate_invited_platform_admin", {
        p_auth_user_id: user.id,
      });

    if (activationError) {
      console.error(
        "Administrator invitation activation failed:",
        activationError
      );

      await supabase.auth.signOut();

      loginUrl.searchParams.set(
        "error",
        "activation-failed"
      );

      return NextResponse.redirect(loginUrl);
    }

    // Whether newly activated or already active, verify the actual
    // administrator record before granting access.
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

      loginUrl.searchParams.set(
        "error",
        "not-authorized"
      );

      return NextResponse.redirect(loginUrl);
    }

    // A false activation result is acceptable only when the account
    // was already active. Suspended, revoked and pending accounts fail above.
    void activated;

    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  } catch (error) {
    console.error(
      "Administrator authentication completion failed:",
      error
    );

    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error(
        "Unable to sign out after administrator authentication failure:",
        signOutError
      );
    }

    loginUrl.searchParams.set(
      "error",
      "authentication-failed"
    );

    return NextResponse.redirect(loginUrl);
  }
}