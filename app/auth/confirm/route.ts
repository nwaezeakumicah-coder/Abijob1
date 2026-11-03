
import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

const dashboardRoutes: Record<string, string> = {
  job_seeker: "/dashboard",
  professional: "/professional/dashboard",
  employer: "/employer/dashboard",
  admin: "/admin",
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  const supabase = await createClient();

  // Handle Supabase PKCE confirmation links.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Email confirmation error:", error);

      return NextResponse.redirect(
        new URL("/login?error=email_confirmation_failed", origin)
      );
    }
  } else if (tokenHash && (type === "signup" || type === "email")) {
    // Handle token-hash confirmation links.
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error("Email verification error:", error);

      return NextResponse.redirect(
        new URL("/login?error=email_confirmation_failed", origin)
      );
    }
  } else {
    return NextResponse.redirect(
      new URL("/login?error=invalid_confirmation_link", origin)
    );
  }

  // Confirm that Supabase established the authenticated session.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Confirmation session error:", userError);

    return NextResponse.redirect(
      new URL("/login?error=confirmation_session_failed", origin)
    );
  }

  // Find the profile belonging to this authenticated user.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Confirmation profile lookup failed:", {
      userId: user.id,
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
    });

    return NextResponse.redirect(
      new URL("/login?error=profile_lookup_failed", origin)
    );
  }

  if (!profile) {
    console.error("Confirmation profile not found:", {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.redirect(
      new URL("/login?error=profile_not_found", origin)
    );
  }

  const destination = dashboardRoutes[profile.role];

  if (!destination) {
    console.error("Confirmation invalid account role:", profile.role);

    return NextResponse.redirect(
      new URL("/login?error=invalid_account_role", origin)
    );
  }

  return NextResponse.redirect(new URL(destination, origin));
}
