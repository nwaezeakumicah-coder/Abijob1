
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

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

  function redirectWithCookies(destination: string) {
    const redirectResponse = NextResponse.redirect(
      new URL(destination, request.url)
    );

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  // Protect private pages from logged-out visitors.
  if (userError || !user) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`
    );

    return redirectWithCookies(
      `${loginUrl.pathname}${loginUrl.search}`
    );
  }

  // Get the authenticated user's actual database role.
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
    return redirectWithCookies("/login?error=profile_missing");
  }

  const role = profile.role as AccountRole;

  // Job Seeker settings.
  // Other account types have their own settings routes.
  if (isSettingsRoute) {
    if (role !== "job_seeker") {
      return redirectWithCookies(
        role === "professional"
          ? "/professional/settings"
          : role === "employer"
            ? "/employer/settings"
            : "/admin"
      );
    }

    return response;
  }

  // Subscription pages are available to all authenticated roles.
  if (isSubscriptionRoute) return response;

  // CV Builder is shared by Job Seekers and Professionals.
  if (isCvBuilderRoute) {
    if (role === "job_seeker" || role === "professional") {
      return response;
    }

    return redirectWithCookies(dashboardRoutes[role]);
  }

  // Interview Practice is shared by Job Seekers and Professionals.
  if (isInterviewPracticeRoute) {
    if (role === "job_seeker" || role === "professional") {
      return response;
    }

    return redirectWithCookies(dashboardRoutes[role]);
  }

  // Protect all other role-specific pages.
  if (requiredRole && role !== requiredRole) {
    return redirectWithCookies(dashboardRoutes[role]);
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
