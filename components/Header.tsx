
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "./Logo";
import "./Header.css";

type AccountRole =
  | "job_seeker"
  | "professional"
  | "employer"
  | "admin"
  | null;

const publicNavigation = [
  { label: "Find Professionals", href: "/professionals" },
  { label: "Opportunity Map", href: "/opportunities/map" },
  { label: "Job Alerts", href: "/settings/job-alerts" },
  { label: "For Employers", href: "/employers" },
  { label: "Abi Hub", href: "/hub" },
  { label: "About Us", href: "/about" },
];

const roleNavigation: Record<
  Exclude<AccountRole, null>,
  { label: string; href: string; dashboard: string }
> = {
  job_seeker: {
    label: "My Opportunities",
    href: "/jobs/feed",
    dashboard: "/dashboard",
  },
  professional: {
    label: "My Opportunities",
    href: "/professional/opportunities",
    dashboard: "/professional/dashboard",
  },
  employer: {
    label: "Manage Jobs",
    href: "/employer/jobs",
    dashboard: "/employer/dashboard",
  },
  admin: {
    label: "Manage Jobs",
    href: "/admin/jobs",
    dashboard: "/admin",
  },
};

function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [role, setRole] = useState<AccountRole>(null);
  const [accountName, setAccountName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;
    let requestVersion = 0;

    const loadAccount = async (userId: string | null) => {
      const currentRequest = ++requestVersion;

      if (!userId) {
        if (mounted && currentRequest === requestVersion) {
          setIsAuthenticated(false);
          setRole(null);
          setAccountName("");
          setAvatarUrl("");
          setAuthLoading(false);
        }

        return;
      }

      if (mounted) {
        setIsAuthenticated(true);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted || currentRequest !== requestVersion) {
        return;
      }

      if (error) {
        console.error("Could not load account role:", error);
        setRole(null);
        setAccountName("");
        setAvatarUrl("");
      } else {
        const accountRole = data?.role;
        setAccountName(data?.full_name || "Account");

        let nextAvatarUrl = "";
        const avatarPath = data?.avatar_url || "";
        if (avatarPath.startsWith("avatars/")) {
          nextAvatarUrl = supabase.storage
            .from("abi-job-public-images")
            .getPublicUrl(avatarPath).data.publicUrl;
        } else if (avatarPath) {
          const { data: signedAvatar } = await supabase.storage
            .from("abi-job-profile-files")
            .createSignedUrl(avatarPath, 60 * 60);
          nextAvatarUrl = signedAvatar?.signedUrl || "";
        }

        if (accountRole === "professional") {
          // Professional photos are stored in profile_data.photo_path;
          // profiles.avatar_url is also maintained as the shared fallback.
          const { data: professional } = await supabase
            .from("professional_profiles")
            .select("profile_data")
            .eq("user_id", userId)
            .maybeSingle();
          const profileData = (professional?.profile_data || {}) as {
            photo_path?: string;
          };
          const professionalPhoto = profileData.photo_path || avatarPath;
          if (professionalPhoto.startsWith("http://") || professionalPhoto.startsWith("https://")) {
            nextAvatarUrl = professionalPhoto;
          } else if (professionalPhoto.startsWith("avatars/")) {
            nextAvatarUrl = supabase.storage
              .from("abi-job-public-images")
              .getPublicUrl(professionalPhoto).data.publicUrl;
          } else if (professionalPhoto) {
            const { data: signedPhoto } = await supabase.storage
              .from("abi-job-profile-files")
              .createSignedUrl(professionalPhoto, 60 * 60);
            nextAvatarUrl = signedPhoto?.signedUrl || nextAvatarUrl;
          }
        }

        if (accountRole === "employer") {
          const { data: employer } = await supabase
            .from("employer_profiles")
            .select("logo_url")
            .eq("user_id", userId)
            .maybeSingle();
          const logo = employer?.logo_url || "";
          if (logo.startsWith("http://") || logo.startsWith("https://")) {
            nextAvatarUrl = logo;
          } else if (logo.startsWith("employer-logos/") || logo.startsWith("avatars/")) {
            nextAvatarUrl = supabase.storage
              .from("abi-job-public-images")
              .getPublicUrl(logo).data.publicUrl;
          } else if (logo) {
            const { data: signedLogo } = await supabase.storage
              .from("abi-job-profile-files")
              .createSignedUrl(logo, 60 * 60);
            nextAvatarUrl = signedLogo?.signedUrl || nextAvatarUrl;
          }
        }
        if (!mounted || currentRequest !== requestVersion) return;
        setAvatarUrl(nextAvatarUrl);
        setAvatarFailed(false);

        if (
          accountRole === "job_seeker" ||
          accountRole === "professional" ||
          accountRole === "employer" ||
          accountRole === "admin"
        ) {
          setRole(accountRole);
        } else {
          setRole(null);
        }
      }

      setAuthLoading(false);
    };

    // Listen for login, logout and session changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAccount(session?.user?.id ?? null);
    });

    // Read the existing session without requiring a logged-in user.
    const checkInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            "Could not retrieve authentication session:",
            error
          );

          await loadAccount(null);
          return;
        }

        await loadAccount(session?.user?.id ?? null);
      } catch (error) {
        if (!mounted) return;

        console.error(
          "Unexpected authentication initialization error:",
          error
        );

        await loadAccount(null);
      }
    };

    void checkInitialSession();

    return () => {
      mounted = false;
      requestVersion++;
      subscription.unsubscribe();
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const accountNavigation = role ? roleNavigation[role] : null;

  const firstNavigationItem = accountNavigation
    ? {
        label: accountNavigation.label,
        href: accountNavigation.href,
      }
    : {
        label: "Find Jobs",
        href: "/jobs",
      };

  const navigation = [
    firstNavigationItem,
    ...publicNavigation,
  ];

  const dashboardHref = accountNavigation?.dashboard ?? "/login";

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout failed:", error);
        setLoggingOut(false);
        return;
      }

      setIsAuthenticated(false);
      setRole(null);
      setAccountName("");
      setAvatarUrl("");
      closeMenu();

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Unexpected logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="header-brand">
          <Logo size="medium" />
        </div>

        {/* Desktop Navigation */}
        <nav
          className="desktop-navigation"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`header-nav-link ${pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ? "is-active" : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Account Actions */}
        <div className="header-actions">
          {authLoading ? (
            <span className="header-auth-loading" role="status">Checking account…</span>
          ) : (
            <>
              {isAuthenticated ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="header-account-avatar"
                    aria-label={`${accountName} dashboard`}
                    title={accountName}
                  >
                    {avatarUrl && !avatarFailed ? <img src={avatarUrl} alt="" onError={() => setAvatarFailed(true)} /> : <span>{accountName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A"}</span>}
                  </Link>
                  <Link
                    href={dashboardHref}
                    className="header-login"
                  >
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    className="header-register"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? "Logging out..." : "Log out"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="header-login"
                  >
                    Log in
                  </Link>

                  <Link
                    href="/register"
                    className="header-register"
                  >
                    Get started
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          ref={menuButtonRef}
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-navigation"
        className={`mobile-navigation ${
          menuOpen ? "mobile-navigation--open" : ""
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ? "is-active" : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-navigation-actions">
            {authLoading ? (
              <span className="header-auth-loading" role="status">Checking account…</span>
            ) : (
              <>
                {isAuthenticated ? (
                  <>
                    <Link
                      href={dashboardHref}
                      className="mobile-account-avatar"
                      aria-label={`${accountName} dashboard`}
                      onClick={closeMenu}
                    >
                      {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{accountName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A"}</span>}
                    </Link>
                    <Link
                      href={dashboardHref}
                      className="mobile-login"
                      onClick={closeMenu}
                    >
                      Dashboard
                    </Link>

                    <button
                      type="button"
                      className="mobile-register"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      {loggingOut ? "Logging out..." : "Log out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="mobile-login"
                      onClick={closeMenu}
                    >
                      Log in
                    </Link>

                    <Link
                      href="/register"
                      className="mobile-register"
                      onClick={closeMenu}
                    >
                      Get started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}


export default function Header() {
  return (
    <Suspense fallback={<header className="site-header" aria-label="Loading site navigation"><div className="header-container"><div className="header-brand"><Logo size="medium" /></div></div></header>}>
      <HeaderContent />
    </Suspense>
  );
}
