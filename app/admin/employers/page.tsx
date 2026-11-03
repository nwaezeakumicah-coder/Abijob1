
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  FileCheck2,
  Filter,
  LayoutDashboard,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import "./employers.css";

type EmployerStatus = "Verified" | "Pending" | "Suspended";

type Employer = {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  category: string;
  joined: string;
  status: EmployerStatus;
  description: string;
};

const initialEmployers: Employer[] = [
  {
    id: 1,
    name: "BrightPath Technologies",
    contact: "Chinedu Okoro",
    email: "hello@brightpath.ng",
    phone: "+234 803 000 1122",
    location: "Aba, Abia State",
    category: "Technology",
    joined: "Nov 1, 2026",
    status: "Pending",
    description:
      "A technology company providing digital solutions, web development and business technology services to organisations across Abia State.",
  },
  {
    id: 2,
    name: "Made in Aba Studio",
    contact: "Amara Nwosu",
    email: "info@madeinaba.ng",
    phone: "+234 806 000 2233",
    location: "Ariaria, Aba",
    category: "Fashion & Design",
    joined: "Oct 30, 2026",
    status: "Verified",
    description:
      "A fashion and garment production business focused on locally made clothing, tailoring and fashion design.",
  },
  {
    id: 3,
    name: "Greenfield Ventures",
    contact: "Emeka Eze",
    email: "contact@greenfield.ng",
    phone: "+234 809 000 3344",
    location: "Umuahia",
    category: "Retail & Trading",
    joined: "Oct 28, 2026",
    status: "Verified",
    description:
      "A growing retail and trading business serving customers in Umuahia and surrounding communities.",
  },
  {
    id: 4,
    name: "Prime Retail Hub",
    contact: "Ngozi Umeh",
    email: "admin@primeretail.ng",
    phone: "+234 802 000 4455",
    location: "Osisioma, Aba",
    category: "Retail",
    joined: "Oct 25, 2026",
    status: "Pending",
    description:
      "A retail business seeking to expand its team and connect with qualified job seekers in Abia State.",
  },
  {
    id: 5,
    name: "Fresh Cuts Studio",
    contact: "David Onyekachi",
    email: "freshcuts@example.com",
    phone: "+234 807 000 5566",
    location: "Umuahia",
    category: "Beauty & Lifestyle",
    joined: "Oct 20, 2026",
    status: "Verified",
    description:
      "A grooming and lifestyle business offering professional barbering and personal care services.",
  },
  {
    id: 6,
    name: "NextLevel Media",
    contact: "Precious Iheanacho",
    email: "team@nextlevel.ng",
    phone: "+234 805 000 6677",
    location: "Aba, Abia State",
    category: "Media & Marketing",
    joined: "Oct 18, 2026",
    status: "Suspended",
    description:
      "A digital media and marketing agency providing branding, content and promotional services.",
  },
];

const tabs = ["All employers", "Verified", "Pending", "Suspended"] as const;
type Tab = (typeof tabs)[number];

export default function AdminEmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>(initialEmployers);
  const [activeTab, setActiveTab] = useState<Tab>("All employers");
  const [search, setSearch] = useState("");
  const [selectedEmployer, setSelectedEmployer] =
    useState<Employer | null>(null);
  const [notice, setNotice] = useState("");

  const filteredEmployers = useMemo(() => {
    return employers.filter((employer) => {
      const matchesTab =
        activeTab === "All employers" ||
        employer.status.toLowerCase() === activeTab.toLowerCase();

      const searchText =
        `${employer.name} ${employer.contact} ${employer.location} ${employer.category}`.toLowerCase();

      return matchesTab && searchText.includes(search.toLowerCase());
    });
  }, [employers, activeTab, search]);

  const counts = {
    all: employers.length,
    verified: employers.filter((item) => item.status === "Verified").length,
    pending: employers.filter((item) => item.status === "Pending").length,
    suspended: employers.filter((item) => item.status === "Suspended").length,
  };

  function updateStatus(id: number, status: EmployerStatus) {
    setEmployers((current) =>
      current.map((employer) =>
        employer.id === id ? { ...employer, status } : employer
      )
    );

    setSelectedEmployer(null);
    setNotice(
      status === "Verified"
        ? "Employer marked as verified in this preview."
        : status === "Suspended"
          ? "Employer account suspended in this preview."
          : "Employer status updated in this preview."
    );

    window.setTimeout(() => setNotice(""), 3500);
  }

  return (
    <main className="admin-employers-page">
      <aside className="admin-employers-sidebar">
        <Link href="/" className="admin-employers-brand">
          <Image
            src="/images/abijob-logo-white.png"
            alt="Abi Job — Opportunity Starts Here"
            width={170}
            height={65}
            priority
          />
        </Link>

        <div className="admin-employers-sidebar-label">WORKSPACE</div>

        <nav className="admin-employers-nav">
          <Link href="/admin" className="admin-employers-nav-link">
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </Link>
          <Link href="/admin/jobs" className="admin-employers-nav-link">
            <Building2 size={19} />
            <span>Job management</span>
          </Link>
          <Link href="/admin/users" className="admin-employers-nav-link">
            <Users size={19} />
            <span>User management</span>
          </Link>
          <Link
            href="/admin/employers"
            className="admin-employers-nav-link active"
          >
            <Building2 size={19} />
            <span>Employers</span>
            {counts.pending > 0 && (
              <span className="admin-employers-nav-count">
                {counts.pending}
              </span>
            )}
          </Link>
          <Link href="/admin/verifications" className="admin-employers-nav-link">
            <FileCheck2 size={19} />
            <span>Verifications</span>
          </Link>
          <Link href="/admin/analytics" className="admin-employers-nav-link">
            <Activity size={19} />
            <span>Analytics</span>
          </Link>
        </nav>

        <div className="admin-employers-sidebar-label admin-employers-preferences">
          PREFERENCES
        </div>

        <nav className="admin-employers-nav">
          <Link href="/admin/settings" className="admin-employers-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="admin-employers-sidebar-bottom">
          <div className="admin-employers-security">
            <ShieldCheck size={21} />
            <strong>Platform security</strong>
            <p>Help keep Abi Job safe and trustworthy.</p>
            <Link href="/admin/settings">
              Review settings <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="admin-employers-admin-user">
            <div className="admin-employers-avatar">SA</div>
            <div>
              <strong>Super Admin</strong>
              <span>Platform administrator</span>
            </div>
            <MoreHorizontal size={19} />
          </div>
        </div>
      </aside>

      <section className="admin-employers-main">
        <header className="admin-employers-topbar">
          <div className="admin-employers-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>Employer management</strong>
          </div>

          <div className="admin-employers-top-actions">
            <label className="admin-employers-top-search">
              <Search size={17} />
              <input placeholder="Search anything..." />
            </label>
            <button
              type="button"
              className="admin-employers-notification"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>
            <div className="admin-employers-top-user">
              <div className="admin-employers-avatar">SA</div>
              <div>
                <strong>Super Admin</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-employers-content">
          <section className="admin-employers-heading">
            <div>
              <div className="admin-employers-eyebrow">
                <Building2 size={15} />
                BUSINESS ACCOUNT CONTROL
              </div>
              <h1>Employer management</h1>
              <p>
                Review business accounts, verify employers and manage access
                to the Abi Job platform.
              </p>
            </div>

            <div className="admin-employers-date">
              <CalendarDays size={17} />
              November 1, 2026
            </div>
          </section>

          {notice && (
            <div className="admin-employers-notice" role="status">
              <CheckCircle2 size={18} />
              {notice}
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <section className="admin-employers-stats">
            <article>
              <div className="admin-employers-stat-icon total">
                <Building2 size={20} />
              </div>
              <span>Total employers</span>
              <strong>{counts.all}</strong>
              <small>Registered business accounts</small>
            </article>
            <article>
              <div className="admin-employers-stat-icon verified">
                <CheckCircle2 size={20} />
              </div>
              <span>Verified employers</span>
              <strong>{counts.verified}</strong>
              <small>Approved business profiles</small>
            </article>
            <article>
              <div className="admin-employers-stat-icon pending">
                <Clock3 size={20} />
              </div>
              <span>Awaiting verification</span>
              <strong>{counts.pending}</strong>
              <small>Require admin review</small>
            </article>
            <article>
              <div className="admin-employers-stat-icon suspended">
                <XCircle size={20} />
              </div>
              <span>Suspended accounts</span>
              <strong>{counts.suspended}</strong>
              <small>Restricted employer accounts</small>
            </article>
          </section>

          <section className="admin-employers-panel">
            <div className="admin-employers-panel-heading">
              <div>
                <div className="admin-employers-section-label">
                  EMPLOYER DIRECTORY
                </div>
                <h2>Registered businesses</h2>
                <p>
                  View employer profiles and manage their platform status.
                </p>
              </div>
              <button
                type="button"
                className="admin-employers-reset"
                onClick={() => {
                  setSearch("");
                  setActiveTab("All employers");
                }}
              >
                <Filter size={16} />
                Reset filters
              </button>
            </div>

            <div className="admin-employers-toolbar">
              <div className="admin-employers-tabs">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    className={activeTab === tab ? "selected" : ""}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                    <span>
                      {tab === "All employers"
                        ? counts.all
                        : tab === "Verified"
                          ? counts.verified
                          : tab === "Pending"
                            ? counts.pending
                            : counts.suspended}
                    </span>
                  </button>
                ))}
              </div>

              <label className="admin-employers-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search business, contact or location..."
                />
              </label>
            </div>

            <div className="admin-employers-table-wrap">
              <table className="admin-employers-table">
                <thead>
                  <tr>
                    <th>BUSINESS</th>
                    <th>CONTACT PERSON</th>
                    <th>LOCATION</th>
                    <th>DATE JOINED</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployers.map((employer) => (
                    <tr key={employer.id}>
                      <td>
                        <div className="admin-employers-business">
                          <div className="admin-employers-business-icon">
                            <Building2 size={19} />
                          </div>
                          <div>
                            <strong>{employer.name}</strong>
                            <span>{employer.category}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-employers-contact">
                          <strong>{employer.contact}</strong>
                          <span>{employer.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-employers-location">
                          <MapPin size={13} />
                          {employer.location}
                        </span>
                      </td>
                      <td className="admin-employers-joined">
                        {employer.joined}
                      </td>
                      <td>
                        <span
                          className={`admin-employers-status ${employer.status.toLowerCase()}`}
                        >
                          <i />
                          {employer.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-employers-view"
                          onClick={() => setSelectedEmployer(employer)}
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredEmployers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-employers-empty">
                        <Search size={25} />
                        <strong>No employers found</strong>
                        <span>
                          Try another search term or change the status filter.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-employers-table-footer">
              <span>
                Showing <strong>{filteredEmployers.length}</strong> of{" "}
                <strong>{employers.length}</strong> employers
              </span>
              <span className="admin-employers-preview-label">
                Frontend preview
              </span>
            </div>
          </section>

          <footer className="admin-employers-footer">
            <span>© 2026 Abi Job. Opportunity starts here.</span>
            <span>Admin workspace · Employer management</span>
          </footer>
        </div>
      </section>

      {selectedEmployer && (
        <div
          className="admin-employers-modal-backdrop"
          onClick={() => setSelectedEmployer(null)}
        >
          <section
            className="admin-employers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employer-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-employers-modal-heading">
              <div className="admin-employers-modal-icon">
                <Building2 size={23} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployer(null)}
                aria-label="Close employer details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="admin-employers-modal-title">
              <span>EMPLOYER PROFILE</span>
              <h2 id="employer-modal-title">{selectedEmployer.name}</h2>
              <p>{selectedEmployer.category}</p>
            </div>

            <div className="admin-employers-modal-status">
              <span
                className={`admin-employers-status ${selectedEmployer.status.toLowerCase()}`}
              >
                <i />
                {selectedEmployer.status}
              </span>
              <span>Joined {selectedEmployer.joined}</span>
            </div>

            <div className="admin-employers-modal-details">
              <div>
                <span>Contact person</span>
                <strong>{selectedEmployer.contact}</strong>
              </div>
              <div>
                <span>Business location</span>
                <strong>
                  <MapPin size={14} /> {selectedEmployer.location}
                </strong>
              </div>
              <div>
                <span>Email address</span>
                <strong>
                  <Mail size={14} /> {selectedEmployer.email}
                </strong>
              </div>
              <div>
                <span>Phone number</span>
                <strong>
                  <Phone size={14} /> {selectedEmployer.phone}
                </strong>
              </div>
            </div>

            <div className="admin-employers-modal-description">
              <span>BUSINESS DESCRIPTION</span>
              <p>{selectedEmployer.description}</p>
            </div>

            <div className="admin-employers-modal-actions">
              {selectedEmployer.status !== "Verified" && (
                <button
                  type="button"
                  className="admin-employers-approve"
                  onClick={() =>
                    updateStatus(selectedEmployer.id, "Verified")
                  }
                >
                  <Check size={16} />
                  Verify employer
                </button>
              )}

              {selectedEmployer.status !== "Suspended" && (
                <button
                  type="button"
                  className="admin-employers-suspend"
                  onClick={() =>
                    updateStatus(selectedEmployer.id, "Suspended")
                  }
                >
                  <XCircle size={16} />
                  Suspend account
                </button>
              )}

              {selectedEmployer.status === "Suspended" && (
                <button
                  type="button"
                  className="admin-employers-approve"
                  onClick={() =>
                    updateStatus(selectedEmployer.id, "Verified")
                  }
                >
                  <Check size={16} />
                  Reactivate account
                </button>
              )}
            </div>

            <p className="admin-employers-modal-note">
              These actions update sample data in this browser session only.
              Permanent account controls will be connected to the admin
              backend later.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
