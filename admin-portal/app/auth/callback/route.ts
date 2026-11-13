
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      loginUrl.searchParams.set(
        "error",
        "authentication-required"
      );

      return NextResponse.redirect(loginUrl);
    }

    const adminClient = createAdminClient();

    const { data: administrator, error: administratorError } =
      await adminClient
        .from("platform_admins")
        .select("id, email, role, status")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (administratorError) {
      console.error(
        "Administrator completion lookup failed:",
        administratorError
      );

      await supabase.auth.signOut();

      loginUrl.searchParams.set(
        "error",
        "authentication-failed"
      );

      return NextResponse.redirect(loginUrl);
    }

    // This route only allows accounts that are already active.
    // It never activates invitations.
    if (
      !administrator ||
      administrator.status !== "active" ||
      administrator.email?.toLowerCase() !== user.email.toLowerCase()
    ) {
      await supabase.auth.signOut();

      loginUrl.searchParams.set(
        "error",
        "not-authorized"
      );

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  } catch (error) {
    console.error(
      "Administrator authentication completion failed:",
      error
    );

    loginUrl.searchParams.set(
      "error",
      "authentication-failed"
    );

    return NextResponse.redirect(loginUrl);
  }
}
