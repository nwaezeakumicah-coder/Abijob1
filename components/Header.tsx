
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function Header() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<AccountRole>(null);
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
          setAuthLoading(false);
        }

        return;
      }

      if (mounted) {
        setIsAuthenticated(true);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted || currentRequest !== requestVersion) {
        return;
      }

      if (error) {
        console.error("Could not load account role:", error);
        setRole(null);
      } else {
        const accountRole = data?.role;

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
              className="header-nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Account Actions */}
        <div className="header-actions">
          {!authLoading && (
            <>
              {isAuthenticated ? (
                <>
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
              className="mobile-nav-link"
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-navigation-actions">
            {!authLoading && (
              <>
                {isAuthenticated ? (
                  <>
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
