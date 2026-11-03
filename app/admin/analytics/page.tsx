
"use client";

import Link from "next/link";
import Logo from "../../../components/Logo";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  Download,
  FileBarChart,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import "./analytics.css";

const monthlyData = [
  { month: "May", users: 180, jobs: 65 },
  { month: "Jun", users: 230, jobs: 82 },
  { month: "Jul", users: 270, jobs: 95 },
  { month: "Aug", users: 310, jobs: 120 },
  { month: "Sep", users: 370, jobs: 145 },
  { month: "Oct", users: 440, jobs: 170 },
];

const accountTypes = [
  { label: "Job seekers", value: 64, count: "1,818", color: "#176b45" },
  { label: "Skilled professionals", value: 24, count: "682", color: "#e6a052" },
  { label: "Employers", value: 12, count: "340", color: "#6388d8" },
];

const locations = [
  { name: "Aba", users: 1120, percentage: 100 },
  { name: "Umuahia", users: 780, percentage: 70 },
  { name: "Osisioma", users: 420, percentage: 38 },
  { name: "Ohafia", users: 290, percentage: 26 },
  { name: "Other locations", users: 230, percentage: 21 },
];

const topCategories = [
  { name: "Technology", jobs: 86, percentage: 86 },
  { name: "Fashion & Design", jobs: 74, percentage: 74 },
  { name: "Sales & Marketing", jobs: 62, percentage: 62 },
  { name: "Hospitality", jobs: 51, percentage: 51 },
  { name: "Administration", jobs: 43, percentage: 43 },
];

export default function AdminAnalyticsPage() {
  function exportReport() {
    const rows = [
      ["Abi Job Platform Analytics"],
      ["Report period", "May - October 2026"],
      [],
      ["Metric", "Value"],
      ["Total users", "2840"],
      ["Total job listings", "486"],
      ["Employers", "318"],
      ["Illustrative subscription revenue", "485000"],
      [],
      ["Account type", "Members"],
      ["Job seekers", "1818"],
      ["Skilled professionals", "682"],
      ["Employers", "340"],
      [],
      ["Location", "Members"],
      ["Aba", "1120"],
      ["Umuahia", "780"],
      ["Osisioma", "420"],
      ["Ohafia", "290"],
      ["Other locations", "230"],
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "abijob-platform-analytics.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-analytics">
      <aside className="admin-analytics-sidebar">
        <div className="admin-analytics-brand">
          <Logo href="/" size="medium" />
        </div>

        <div className="admin-analytics-admin">
          <div className="admin-analytics-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>Super admin</span>
          </div>
        </div>

        <span className="admin-analytics-nav-label">MAIN MENU</span>

        <nav className="admin-analytics-nav">
          <Link href="/admin">
            <Activity size={18} />
            Dashboard
          </Link>
          <Link href="/admin/users">
            <Users size={18} />
            Users
          </Link>
          <Link href="/admin/jobs">
            <BriefcaseBusiness size={18} />
            Job listings
          </Link>
          <Link href="/admin/subscriptions">
            <ShieldCheck size={18} />
            Subscriptions
          </Link>
          <Link href="/admin/analytics" className="active">
            <FileBarChart size={18} />
            Reports & analytics
          </Link>
        </nav>

        <div className="admin-analytics-sidebar-bottom">
          <Link href="/">
            <ArrowUpRight size={17} />
            Back to website
          </Link>
        </div>
      </aside>

      <section className="admin-analytics-main">
        <header className="admin-analytics-topbar">
          <div>
            <span>ADMINISTRATION / REPORTS</span>
            <h1>Reports & analytics</h1>
          </div>

          <div className="admin-analytics-top-profile">
            <div className="admin-analytics-top-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Super admin</span>
            </div>
          </div>
        </header>

        <div className="admin-analytics-content">
          <div className="admin-analytics-heading">
            <div>
              <h2>Platform performance</h2>
              <p>
                Understand how Abi Job is growing and where opportunities are
                being created across Abia State.
              </p>
            </div>

            <div className="admin-analytics-actions">
              <button className="admin-analytics-period">
                <CalendarDays size={16} />
                May – October 2026
                <ChevronDown size={15} />
              </button>
              <button className="admin-analytics-export" onClick={exportReport}>
                <Download size={16} />
                Export report
              </button>
            </div>
          </div>

          <div className="admin-analytics-demo-note">
            <Activity size={17} />
            <span>
              These are sample analytics figures for the design preview, not
              live platform statistics.
            </span>
          </div>

          <section className="admin-analytics-metrics">
            <article>
              <div className="admin-analytics-metric-top">
                <div className="admin-analytics-metric-icon green">
                  <Users size={20} />
                </div>
                <span className="positive">
                  <ArrowUpRight size={14} /> 12.5%
                </span>
              </div>
              <span>Total registered users</span>
              <strong>2,840</strong>
              <small>Compared with previous period</small>
            </article>

            <article>
              <div className="admin-analytics-metric-top">
                <div className="admin-analytics-metric-icon orange">
                  <BriefcaseBusiness size={20} />
                </div>
                <span className="positive">
                  <ArrowUpRight size={14} /> 8.2%
                </span>
              </div>
              <span>Job opportunities</span>
              <strong>486</strong>
              <small>Total submitted listings</small>
            </article>

            <article>
              <div className="admin-analytics-metric-top">
                <div className="admin-analytics-metric-icon blue">
                  <Building2 size={20} />
                </div>
                <span className="positive">
                  <ArrowUpRight size={14} /> 6.4%
                </span>
              </div>
              <span>Registered employers</span>
              <strong>318</strong>
              <small>Business accounts</small>
            </article>

            <article>
              <div className="admin-analytics-metric-top">
                <div className="admin-analytics-metric-icon purple">
                  <Wallet size={20} />
                </div>
                <span className="negative">
                  <ArrowDownRight size={14} /> 2.1%
                </span>
              </div>
              <span>Subscription revenue</span>
              <strong>₦485,000</strong>
              <small>Illustrative monthly revenue</small>
            </article>
          </section>

          <section className="admin-analytics-chart-grid">
            <article className="admin-analytics-panel admin-analytics-growth">
              <div className="admin-analytics-panel-heading">
                <div>
                  <h3>Platform growth</h3>
                  <p>Monthly user and job listing activity</p>
                </div>
                <span className="admin-analytics-chart-period">
                  Last 6 months
                </span>
              </div>

              <div className="admin-analytics-legend">
                <span><i className="users-dot" /> New users</span>
                <span><i className="jobs-dot" /> Job listings</span>
              </div>

              <div className="admin-analytics-chart">
                <div className="admin-analytics-y-labels">
                  <span>500</span>
                  <span>400</span>
                  <span>300</span>
                  <span>200</span>
                  <span>100</span>
                  <span>0</span>
                </div>

                <div className="admin-analytics-chart-area">
                  <div className="admin-analytics-grid-lines">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <i key={index} />
                    ))}
                  </div>

                  <div className="admin-analytics-bars">
                    {monthlyData.map((item) => (
                      <div className="admin-analytics-bar-group" key={item.month}>
                        <div className="admin-analytics-bar-pair">
                          <div
                            className="admin-analytics-bar users-bar"
                            style={{ height: `${(item.users / 500) * 100}%` }}
                            title={`${item.users} new users`}
                          />
                          <div
                            className="admin-analytics-bar jobs-bar"
                            style={{ height: `${(item.jobs / 500) * 100}%` }}
                            title={`${item.jobs} job listings`}
                          />
                        </div>
                        <span>{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="admin-analytics-panel admin-analytics-account">
              <div className="admin-analytics-panel-heading">
                <div>
                  <h3>Account distribution</h3>
                  <p>Members by account type</p>
                </div>
              </div>

              <div className="admin-analytics-account-total">
                <strong>2,840</strong>
                <span>Total accounts</span>
              </div>

              <div className="admin-analytics-donut">
                <div className="admin-analytics-donut-inner">
                  <strong>100%</strong>
                  <span>Members</span>
                </div>
              </div>

              <div className="admin-analytics-account-legend">
                {accountTypes.map((item) => (
                  <div key={item.label}>
                    <span>
                      <i style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <strong>{item.count}</strong>
                    <small>{item.value}%</small>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-analytics-bottom-grid">
            <article className="admin-analytics-panel">
              <div className="admin-analytics-panel-heading">
                <div>
                  <h3>Top locations</h3>
                  <p>Member distribution by location</p>
                </div>
                <MapPin size={19} />
              </div>

              <div className="admin-analytics-location-list">
                {locations.map((item) => (
                  <div className="admin-analytics-location" key={item.name}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.users.toLocaleString()} members</span>
                    </div>
                    <div className="admin-analytics-progress">
                      <i style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-analytics-panel">
              <div className="admin-analytics-panel-heading">
                <div>
                  <h3>Popular job categories</h3>
                  <p>Categories with the most listings</p>
                </div>
                <BriefcaseBusiness size={19} />
              </div>

              <div className="admin-analytics-category-list">
                {topCategories.map((item, index) => (
                  <div className="admin-analytics-category" key={item.name}>
                    <div className="admin-analytics-category-top">
                      <span className="admin-analytics-category-rank">
                        0{index + 1}
                      </span>
                      <strong>{item.name}</strong>
                      <span>{item.jobs} jobs</span>
                    </div>
                    <div className="admin-analytics-progress">
                      <i style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <div className="admin-analytics-footer-note">
            <ShieldCheck size={19} />
            <p>
              Live analytics will be connected to verified Abi Job database
              records when the Supabase backend is implemented.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
