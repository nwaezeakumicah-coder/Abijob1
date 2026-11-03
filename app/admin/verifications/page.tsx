
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import "./verifications.css";

type VerificationStatus = "Pending" | "Approved" | "Rejected";

type Verification = {
  id: number;
  business: string;
  owner: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  submitted: string;
  registrationNumber: string;
  document: string;
  status: VerificationStatus;
  rejectionReason?: string;
};

const initialVerifications: Verification[] = [
  {
    id: 1,
    business: "BrightPath Technologies",
    owner: "Chinedu Okafor",
    email: "chinedu@brightpath.ng",
    phone: "+234 803 456 7890",
    category: "Technology",
    location: "Aba, Abia State",
    submitted: "Nov 1, 2026",
    registrationNumber: "RC-824610",
    document: "CAC Certificate.pdf",
    status: "Pending",
  },
  {
    id: 2,
    business: "Made in Aba Studio",
    owner: "Amara Nwosu",
    email: "amara@madeinaba.ng",
    phone: "+234 806 123 4567",
    category: "Fashion & Design",
    location: "Ariaria, Aba",
    submitted: "Oct 31, 2026",
    registrationNumber: "BN-519284",
    document: "Business Registration.pdf",
    status: "Pending",
  },
  {
    id: 3,
    business: "Greenfield Ventures",
    owner: "Emeka Eze",
    email: "emeka@greenfield.ng",
    phone: "+234 809 222 1188",
    category: "Retail & Trading",
    location: "Umuahia",
    submitted: "Oct 30, 2026",
    registrationNumber: "RC-102938",
    document: "CAC Registration.pdf",
    status: "Approved",
  },
  {
    id: 4,
    business: "FreshBite Foods",
    owner: "Ifeoma Kalu",
    email: "ifeoma@freshbite.ng",
    phone: "+234 802 333 4455",
    category: "Food & Hospitality",
    location: "Osisioma, Aba",
    submitted: "Oct 29, 2026",
    registrationNumber: "BN-667190",
    document: "Business Certificate.pdf",
    status: "Rejected",
    rejectionReason: "The submitted registration document requires correction.",
  },
  {
    id: 5,
    business: "Apex Construction Services",
    owner: "David Uche",
    email: "david@apexconstruction.ng",
    phone: "+234 805 444 9911",
    category: "Construction",
    location: "Ohafia, Abia State",
    submitted: "Oct 28, 2026",
    registrationNumber: "RC-441827",
    document: "CAC Certificate.pdf",
    status: "Pending",
  },
];

const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Job management", href: "/admin/jobs", icon: Building2 },
  { label: "User management", href: "/admin/users", icon: Users },
  { label: "Employers", href: "/admin/employers", icon: Building2 },
  { label: "Verifications", href: "/admin/verifications", icon: FileCheck2 },
  { label: "Reports & analytics", href: "/admin/reports", icon: Activity },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
];

export default function AdminVerificationsPage() {
  const [records, setRecords] = useState<Verification[]>(initialVerifications);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] =
    useState<Verification | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingCount = records.filter(
    (record) => record.status === "Pending"
  ).length;

  const approvedCount = records.filter(
    (record) => record.status === "Approved"
  ).length;

  const rejectedCount = records.filter(
    (record) => record.status === "Rejected"
  ).length;

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesFilter =
        activeFilter === "All" || record.status === activeFilter;

      const matchesSearch =
        !term ||
        record.business.toLowerCase().includes(term) ||
        record.owner.toLowerCase().includes(term) ||
        record.email.toLowerCase().includes(term) ||
        record.location.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [records, activeFilter, search]);

  function updateStatus(
    id: number,
    status: VerificationStatus,
    reason?: string
  ) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              status,
              rejectionReason: reason,
            }
          : record
      )
    );

    setSelectedRecord(null);
    setShowRejectModal(false);
    setRejectionReason("");
  }

  function openRejectModal(record: Verification) {
    setSelectedRecord(record);
    setShowRejectModal(true);
    setRejectionReason("");
  }

  function confirmRejection() {
    if (!selectedRecord || !rejectionReason.trim()) return;

    updateStatus(
      selectedRecord.id,
      "Rejected",
      rejectionReason.trim()
    );
  }

  function exportRecords() {
    const rows = [
      [
        "Business",
        "Owner",
        "Email",
        "Phone",
        "Category",
        "Location",
        "Registration Number",
        "Submitted",
        "Status",
      ],
      ...records.map((record) => [
        record.business,
        record.owner,
        record.email,
        record.phone,
        record.category,
        record.location,
        record.registrationNumber,
        record.submitted,
        record.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "abi-job-verifications.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="verification-page">
      <aside className="verification-sidebar">
        <Link href="/" className="verification-brand">
          <Image
            src="/images/abijob-logo-white.png"
            alt="Abi Job — Opportunity Starts Here"
            width={170}
            height={65}
            priority
          />
        </Link>

        <div className="verification-sidebar-label">WORKSPACE</div>

        <nav className="verification-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.href}
                className={`verification-nav-link ${
                  item.href === "/admin/verifications" ? "active" : ""
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.href === "/admin/verifications" && pendingCount > 0 && (
                  <span className="verification-nav-count">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="verification-sidebar-label verification-preferences">
          PREFERENCES
        </div>

        <nav className="verification-nav">
          <Link href="/admin/settings" className="verification-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="verification-sidebar-bottom">
          <div className="verification-security-card">
            <ShieldCheck size={23} />
            <strong>Trust & safety</strong>
            <p>
              Verify businesses to maintain a trusted job marketplace.
            </p>
            <Link href="/admin/settings">
              Security settings <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="verification-admin-user">
            <div className="verification-avatar">SA</div>
            <div>
              <strong>Super Admin</strong>
              <span>Platform administrator</span>
            </div>
            <MoreHorizontal size={20} />
          </div>
        </div>
      </aside>

      <section className="verification-main">
        <header className="verification-topbar">
          <div className="verification-breadcrumb">
            <Link href="/admin">Workspace</Link>
            <ChevronRight size={15} />
            <strong>Verifications</strong>
          </div>

          <div className="verification-topbar-right">
            <label className="verification-top-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search anything..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="verification-icon-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>

            <div className="verification-top-profile">
              <div className="verification-avatar">SA</div>
              <div>
                <strong>Super Admin</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="verification-content">
          <div className="verification-back">
            <Link href="/admin">
              <ArrowLeft size={16} />
              Back to overview
            </Link>
          </div>

          <section className="verification-heading">
            <div>
              <div className="verification-eyebrow">
                <ShieldCheck size={16} />
                TRUST & BUSINESS COMPLIANCE
              </div>

              <h1>Employer verifications</h1>

              <p>
                Review business information and registration documents before
                granting verified status to employers on Abi Job.
              </p>
            </div>

            <div className="verification-heading-actions">
              <button
                type="button"
                className="verification-export-button"
                onClick={exportRecords}
              >
                <ArrowDownToLine size={17} />
                Export records
              </button>
            </div>
          </section>

          <section className="verification-stats">
            <article className="verification-stat-card">
              <div className="verification-stat-icon total">
                <FileCheck2 size={21} />
              </div>
              <span>Total requests</span>
              <strong>{records.length.toString().padStart(2, "0")}</strong>
              <small>All submitted records</small>
            </article>

            <article className="verification-stat-card">
              <div className="verification-stat-icon pending">
                <Clock3 size={21} />
              </div>
              <span>Pending review</span>
              <strong>{pendingCount.toString().padStart(2, "0")}</strong>
              <small>Awaiting administrator action</small>
            </article>

            <article className="verification-stat-card">
              <div className="verification-stat-icon approved">
                <CheckCircle2 size={21} />
              </div>
              <span>Verified employers</span>
              <strong>{approvedCount.toString().padStart(2, "0")}</strong>
              <small>Successfully approved</small>
            </article>

            <article className="verification-stat-card">
              <div className="verification-stat-icon rejected">
                <XCircle size={21} />
              </div>
              <span>Rejected requests</span>
              <strong>{rejectedCount.toString().padStart(2, "0")}</strong>
              <small>Not approved</small>
            </article>
          </section>

          <section className="verification-information">
            <div className="verification-info-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>
                Verification protects the Abi Job community
              </strong>
              <p>
                Check submitted business details and supporting documents
                carefully. Only approve a business when its information has
                been properly reviewed.
              </p>
            </div>
          </section>

          <section className="verification-table-panel">
            <div className="verification-table-heading">
              <div>
                <div className="verification-section-label">
                  BUSINESS REVIEW CENTRE
                </div>
                <h2>Verification requests</h2>
                <p>
                  Manage employer identity and business documentation.
                </p>
              </div>

              <div className="verification-table-tools">
                <label className="verification-table-search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Search businesses..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="verification-filter-button"
                  onClick={() => {
                    setActiveFilter("All");
                    setSearch("");
                  }}
                >
                  <Filter size={16} />
                  Clear filters
                </button>
              </div>
            </div>

            <div className="verification-tabs">
              {["All", "Pending", "Approved", "Rejected"].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={activeFilter === filter ? "active" : ""}
                >
                  {filter}
                  <span>
                    {filter === "All"
                      ? records.length
                      : records.filter((record) => record.status === filter)
                          .length}
                  </span>
                </button>
              ))}
            </div>

            <div className="verification-table-wrap">
              <table className="verification-table">
                <thead>
                  <tr>
                    <th>BUSINESS</th>
                    <th>BUSINESS OWNER</th>
                    <th>LOCATION</th>
                    <th>SUBMITTED</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="verification-business-cell">
                          <div className="verification-business-icon">
                            <Building2 size={19} />
                          </div>
                          <div>
                            <strong>{record.business}</strong>
                            <span>{record.category}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="verification-owner-cell">
                          <strong>{record.owner}</strong>
                          <span>{record.email}</span>
                        </div>
                      </td>

                      <td>
                        <span className="verification-location">
                          <MapPin size={14} />
                          {record.location}
                        </span>
                      </td>

                      <td>
                        <span className="verification-submitted">
                          <CalendarDays size={14} />
                          {record.submitted}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`verification-status ${record.status.toLowerCase()}`}
                        >
                          <i />
                          {record.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="verification-review-button"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye size={15} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="verification-empty">
                          <FileCheck2 size={28} />
                          <strong>No verification requests found</strong>
                          <span>
                            Try another search term or select a different
                            status.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="verification-table-footer">
              <span>
                Showing {filteredRecords.length} of {records.length} requests
              </span>
              <span>Frontend preview</span>
            </div>
          </section>

          <footer className="verification-footer">
            <span>© 2026 Abi Job. Opportunity starts here.</span>
            <span>Admin workspace · Verifications</span>
          </footer>
        </div>
      </section>

      {selectedRecord && !showRejectModal && (
        <div
          className="verification-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <section
            className="verification-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="verification-modal-heading">
              <div>
                <span className="verification-section-label">
                  EMPLOYER VERIFICATION
                </span>
                <h2>Review business</h2>
              </div>

              <button
                type="button"
                className="verification-modal-close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="verification-detail-business">
              <div className="verification-detail-icon">
                <Building2 size={27} />
              </div>
              <div>
                <h3>{selectedRecord.business}</h3>
                <span>{selectedRecord.category}</span>
              </div>
            </div>

            <div className="verification-detail-grid">
              <div>
                <span>Business owner</span>
                <strong>{selectedRecord.owner}</strong>
              </div>
              <div>
                <span>Email address</span>
                <strong>{selectedRecord.email}</strong>
              </div>
              <div>
                <span>Phone number</span>
                <strong>{selectedRecord.phone}</strong>
              </div>
              <div>
                <span>Business location</span>
                <strong>{selectedRecord.location}</strong>
              </div>
              <div>
                <span>Registration number</span>
                <strong>{selectedRecord.registrationNumber}</strong>
              </div>
              <div>
                <span>Submission date</span>
                <strong>{selectedRecord.submitted}</strong>
              </div>
            </div>

            <div className="verification-document">
              <div className="verification-document-icon">
                <FileText size={23} />
              </div>
              <div>
                <strong>{selectedRecord.document}</strong>
                <span>Submitted business document</span>
              </div>
              <span className="verification-document-note">
                Preview unavailable
              </span>
            </div>

            {selectedRecord.rejectionReason && (
              <div className="verification-reason-display">
                <strong>Rejection reason</strong>
                <p>{selectedRecord.rejectionReason}</p>
              </div>
            )}

            <div className="verification-modal-status">
              <span>Current status</span>
              <span
                className={`verification-status ${selectedRecord.status.toLowerCase()}`}
              >
                <i />
                {selectedRecord.status}
              </span>
            </div>

            <div className="verification-modal-actions">
              <button
                type="button"
                className="verification-reject-button"
                onClick={() => openRejectModal(selectedRecord)}
                disabled={selectedRecord.status === "Rejected"}
              >
                <XCircle size={17} />
                Reject request
              </button>

              <button
                type="button"
                className="verification-approve-button"
                onClick={() =>
                  updateStatus(selectedRecord.id, "Approved")
                }
                disabled={selectedRecord.status === "Approved"}
              >
                <Check size={17} />
                Approve business
              </button>
            </div>
          </section>
        </div>
      )}

      {showRejectModal && selectedRecord && (
        <div
          className="verification-modal-overlay"
          onClick={() => setShowRejectModal(false)}
        >
          <section
            className="verification-reject-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="verification-reject-icon">
              <XCircle size={25} />
            </div>

            <button
              type="button"
              className="verification-modal-close"
              onClick={() => setShowRejectModal(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2>Reject verification request?</h2>

            <p>
              You are rejecting the business verification request for{" "}
              <strong>{selectedRecord.business}</strong>. Provide a reason
              that can guide the employer.
            </p>

            <label className="verification-reason-label">
              Reason for rejection
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain what needs to be corrected or resubmitted..."
                rows={4}
              />
            </label>

            <div className="verification-reject-actions">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="verification-cancel-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRejection}
                className="verification-confirm-reject"
                disabled={!rejectionReason.trim()}
              >
                Confirm rejection
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
