
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  Wallet,
  BarChart3,
  ShieldCheck,
  Settings,
  ClipboardCheck,
  ScrollText,
  Headset,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";

type AdminSidebarProps = {
  permissions: string[];
  role: string;
  email: string;
  logoutAction: () => void;
};

const navigation = [
  {
    heading: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        permissions: ["dashboard.view"],
        icon: LayoutDashboard,
      },
    ],
  },
  {
    heading: "MANAGEMENT",
    items: [
      {
        label: "User Management",
        href: "/users",
        permissions: ["users.view", "users.manage"],
        icon: Users,
      },
      {
        label: "Job Management",
        href: "/jobs",
        permissions: ["jobs.view", "jobs.review", "jobs.manage"],
        icon: BriefcaseBusiness,
      },
      {
        label: "Employers",
        href: "/employers",
        permissions: ["employers.view", "employers.manage"],
        icon: Building2,
      },
      {
        label: "Verifications",
        href: "/verifications",
        permissions: ["verifications.review", "verifications.manage"],
        icon: ClipboardCheck,
      },
    ],
  },
  {
    heading: "FINANCE",
    items: [
      {
        label: "Payments",
        href: "/payments",
        permissions: ["payments.view", "payments.manage"],
        icon: CreditCard,
      },
      {
        label: "Subscriptions",
        href: "/subscriptions",
        permissions: ["subscriptions.view", "subscriptions.manage"],
        icon: Wallet,
      },
    ],
  },
  {
    heading: "INSIGHTS",
    items: [
      {
        label: "Reports & Analytics",
        href: "/reports",
        permissions: ["reports.view", "reports.manage"],
        icon: BarChart3,
      },
    ],
  },
  {
    heading: "ADMINISTRATION",
    items: [
      {
        label: "Administrator Accounts",
        href: "/administrators",
        permissions: ["admins.manage"],
        icon: ShieldCheck,
      },
      {
        label: "Platform Settings",
        href: "/settings",
        permissions: ["settings.manage"],
        icon: Settings,
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        permissions: ["audit.view"],
        icon: ScrollText,
      },
      {
        label: "Support",
        href: "/support",
        permissions: ["support.manage"],
        icon: Headset,
      },
    ],
  },
];

export default function AdminSidebar({
  permissions,
  role,
  email,
  logoutAction,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.permissions.some((permission) =>
          permissions.includes(permission)
        )
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <button
        type="button"
        className="admin-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link
          href="/dashboard"
          className="admin-brand"
          onClick={() => setMobileOpen(false)}
          aria-label="Abi Job Administration Dashboard"
        >
          <Image
            src="/images/abijob-logo-white.png"
            alt="Abi Job — Opportunity Starts Here"
            width={210}
            height={80}
            priority
            className="admin-brand-logo"
            style={{
              display: "block",
              width: "180px",
              height: "auto",
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        </Link>

        <div className="admin-sidebar-divider" />

        <div className="admin-nav">
          {visibleGroups.map((group) => (
            <div className="admin-nav-group" key={group.heading}>
              <p className="admin-nav-heading">{group.heading}</p>

              {group.items.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`admin-nav-link ${
                      active ? "active" : ""
                    }`}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {active && <ChevronRight size={16} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-security-note">
            <ShieldCheck size={19} />
            <div>
              <strong>Secure workspace</strong>
              <span>Administrator access</span>
            </div>
          </div>

          <div className="admin-account">
            <div className="admin-account-avatar">
              {email.charAt(0).toUpperCase()}
            </div>

            <div className="admin-account-details">
              <strong>{role.replaceAll("_", " ")}</strong>
              <span>{email}</span>
            </div>
          </div>

          <form action={logoutAction}>
            <button type="submit" className="admin-logout">
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
