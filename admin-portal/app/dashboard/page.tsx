
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  BriefcaseBusiness,
  Settings,
  ArrowUpRight,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

import { getActiveAdmin } from "../../lib/admin-auth";
import AdminShell from "../../components/AdminShell";

const managementCards = [
  {
    title: "User Management",
    description: "Manage job seekers, skilled professionals and employers.",
    href: "/users",
    permission: "users.manage",
    icon: Users,
    number: "01",
  },
  {
    title: "Job Management",
    description: "Review, approve and manage job listings on Abi Job.",
    href: "/jobs",
    permission: "jobs.manage",
    icon: BriefcaseBusiness,
    number: "02",
  },
  {
    title: "Platform Settings",
    description: "Manage platform configuration and administration.",
    href: "/settings",
    permission: "settings.manage",
    icon: Settings,
    number: "03",
  },
];

export default async function DashboardPage() {
  const admin = await getActiveAdmin();

  // Security: only administrators with dashboard.view can access this page.
  if (!admin.permissions.includes("dashboard.view")) {
    redirect("/login?error=not-authorized");
  }

  const visibleCards = managementCards.filter((card) =>
    admin.permissions.includes(card.permission)
  );

  return (
    <AdminShell>
      <div className="dashboard-page">
        <div className="dashboard-heading">
          <div>
            <span className="dashboard-eyebrow">
              <LayoutDashboard size={15} />
              ADMINISTRATOR OVERVIEW
            </span>

            <h1>Dashboard</h1>

            <p>
              Welcome back. Manage and monitor the Abi Job platform
              from your administration workspace.
            </p>
          </div>

          <span className="dashboard-date">
            <ShieldCheck size={16} />
            Protected workspace
          </span>
        </div>

        <section className="dashboard-welcome">
          <div className="dashboard-welcome-content">
            <span>ABI JOB CONTROL CENTRE</span>
            <h2>Building opportunities across Abia State.</h2>
            <p>
              Your administration workspace gives you access to
              the tools permitted for your administrator account.
            </p>
          </div>

          <div className="dashboard-welcome-symbol">a.</div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span>WORKSPACE</span>
              <h2>Management areas</h2>
            </div>

            <p>Select an area to continue.</p>
          </div>

          <div className="dashboard-cards">
            {visibleCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  href={card.href}
                  key={card.href}
                  className="dashboard-card"
                >
                  <div className="dashboard-card-top">
                    <span className="dashboard-card-number">
                      {card.number}
                    </span>

                    <span className="dashboard-card-icon">
                      <Icon size={22} />
                    </span>
                  </div>

                  <h3>{card.title}</h3>
                  <p>{card.description}</p>

                  <span className="dashboard-card-link">
                    Open management area
                    <ArrowUpRight size={17} />
                  </span>
                </Link>
              );
            })}
          </div>

          {visibleCards.length === 0 && (
            <p className="dashboard-empty">
              No management areas are currently assigned to your account.
            </p>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>ABI JOB ADMINISTRATION</span>
          <span>Opportunity starts here.</span>
        </footer>
      </div>
    </AdminShell>
  );
}
