
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRoute } from "./lib/admin/authorization";

type AccountRole =
  | "job_seeker"
  | "professional"
  | "employer"
  | "admin";

const dashboardRoutes: Record<AccountRole, string> = {
  job_seeker: "/dashboard",
  professional: "/professional/dashboard",
  employer: "/employer/dashboard",
  admin: "/admin",
};

function isWithinPath(pathname: string, basePath: string) {
  return (
    pathname === basePath ||
    pathname.startsWith(`${basePath}/`)
  );
}

function getRequiredRole(pathname: string): AccountRole | null {
  if (isWithinPath(pathname, "/dashboard")) return "job_seeker";
  if (isWithinPath(pathname, "/professional")) return "professional";
  if (isWithinPath(pathname, "/employer")) return "employer";
  if (isWithinPath(pathname, "/admin")) return "admin";

  const jobSeekerPaths = [
    "/applications",
    "/profile",
    "/notifications",
    "/messages",
    "/saved-jobs",
  ];

  if (jobSeekerPaths.some((path) => isWithinPath(pathname, path))) {
    return "job_seeker";
  }

  if (/^\/jobs\/[^/]+\/apply\/?$/.test(pathname)) {
    return "job_seeker";
  }

  return null;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  destination: string
) {
  const redirectResponse = NextResponse.redirect(
    new URL(destination, request.url)
  );

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return NextResponse.redirect(
      new URL("/login?error=auth_configuration", request.url)
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const requiredRole = getRequiredRole(pathname);

  const isAdminRoute = isWithinPath(pathname, "/admin");
  const isAdminMfaRoute = pathname === "/admin/mfa";
  const isSettingsRoute = isWithinPath(pathname, "/settings");
  const isSubscriptionRoute = isWithinPath(pathname, "/subscription");
  const isCvBuilderRoute = isWithinPath(pathname, "/cv-builder");
  const isInterviewPracticeRoute = isWithinPath(
    pathname,
    "/interview-practice"
  );

  const requiresAuthentication =
    requiredRole !== null ||
    isSettingsRoute ||
    isSubscriptionRoute ||
    isCvBuilderRoute ||
    isInterviewPracticeRoute;

  if (!requiresAuthentication) return response;

  if (userError || !user) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`
    );

    return redirectWithCookies(
      request,
      response,
      `${loginUrl.pathname}${loginUrl.search}`
    );
  }

  // Admin access requires an active platform_admins membership
  // and at least one permission assigned to the administrator's role.
  if (isAdminRoute) {
    const authorization = await authorizeAdminRoute(
      user.id,
      isAdminMfaRoute ? "/admin" : pathname
    );

    if (authorization.authorized && isAdminMfaRoute) {
      return response;
    }

    if (authorization.authorized) {
      const [
        { data: factors, error: factorsError },
        { data: assurance, error: assuranceError },
      ] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);

      if (factorsError || assuranceError) {
        return redirectWithCookies(
          request,
          response,
          "/login?error=admin_mfa_verification_unavailable"
        );
      }

      const hasVerifiedTotp = (factors?.totp ?? []).some(
        (factor) => factor.status === "verified"
      );

      if (
        !hasVerifiedTotp ||
        assurance.currentLevel !== "aal2"
      ) {
        const next = `${pathname}${request.nextUrl.search}`;
        return redirectWithCookies(
          request,
          response,
          `/admin/mfa?next=${encodeURIComponent(next)}`
        );
      }

      return response;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profile?.role &&
      Object.prototype.hasOwnProperty.call(
        dashboardRoutes,
        profile.role
      ) &&
      profile.role !== "admin"
    ) {
      return redirectWithCookies(
        request,
        response,
        dashboardRoutes[profile.role as AccountRole]
      );
    }

    const destination =
      authorization.status === 500
        ? "/login?error=admin_verification_unavailable"
        : "/login?error=admin_access_denied";

    return redirectWithCookies(
      request,
      response,
      destination
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile?.role ||
    !Object.prototype.hasOwnProperty.call(
      dashboardRoutes,
      profile.role
    )
  ) {
    return redirectWithCookies(
      request,
      response,
      "/login?error=profile_missing"
    );
  }

  const role = profile.role as AccountRole;

  if (isSettingsRoute) {
    if (role !== "job_seeker") {
      return redirectWithCookies(
        request,
        response,
        role === "professional"
          ? "/professional/settings"
          : role === "employer"
            ? "/employer/settings"
            : "/login?error=admin_access_denied"
      );
    }

    return response;
  }

  if (isSubscriptionRoute) return response;

  if (isCvBuilderRoute) {
    if (role === "job_seeker" || role === "professional") {
      return response;
    }

    return redirectWithCookies(
      request,
      response,
      dashboardRoutes[role]
    );
  }

  if (isInterviewPracticeRoute) {
    if (role === "job_seeker" || role === "professional") {
      return response;
    }

    return redirectWithCookies(
      request,
      response,
      dashboardRoutes[role]
    );
  }

  if (requiredRole && role !== requiredRole) {
    return redirectWithCookies(
      request,
      response,
      dashboardRoutes[role]
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/applications/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/messages/:path*",
    "/saved-jobs/:path*",
    "/cv-builder/:path*",
    "/interview-practice/:path*",
    "/professional/:path*",
    "/employer/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/subscription/:path*",
    "/jobs/:path*",
  ],
};
