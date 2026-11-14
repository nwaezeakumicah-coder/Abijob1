
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  Mail,
  Phone,
  MapPin,
  Globe,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";

import { getActiveAdmin } from "../../lib/admin-auth";
import { getAdminEmployers } from "../../lib/admin-employers";
import AdminShell from "../../components/AdminShell";
import { approveEmployer, rejectEmployer } from "../employers/actions";

import "./verifications.css";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    success?: string;
    error?: string;
    warning?: string;
  }>;
};

const statuses = [
  { value: "all", label: "All applications" },
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}

export default async function VerificationsPage({
  searchParams,
}: PageProps) {
  const admin = await getActiveAdmin();

  const canView =
    admin.permissions.includes("verifications.review") ||
    admin.permissions.includes("verifications.manage") ||
    admin.permissions.includes("employers.view") ||
    admin.permissions.includes("employers.manage");

  const canManage = admin.permissions.includes("employers.manage");

  if (!canView) {
    return (
      <AdminShell>
        <main className="verification-page">
          <div className="verification-access-denied">
            <ShieldCheck size={36} />
            <h1>Access restricted</h1>
            <p>
              You do not have permission to access verification records.
            </p>
          </div>
        </main>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const selectedStatus = statuses.some(
    (item) => item.value === params.status
  )
    ? params.status!
    : "pending";

  const result = await getAdminEmployers();

  const filteredEmployers = result.employers.filter((employer) => {
    const matchesStatus =
      selectedStatus === "all" ||
      employer.verificationStatus === selectedStatus;

    const searchText = [
      employer.businessName,
      employer.businessType,
      employer.fullName,
      employer.email,
      employer.businessPhone,
      employer.address,
    ]
      .join(" ")
      .toLowerCase();

    return (
      matchesStatus &&
      searchText.includes(query.toLowerCase())
    );
  });

  return (
    <AdminShell>
      <main className="verification-page">
        <header className="verification-heading">
          <div>
            <span className="verification-eyebrow">
              TRUST AND SAFETY
            </span>
            <h1>Verifications</h1>
            <p>
              Review business verification applications and monitor
              employer verification activity on Abijob.
            </p>
          </div>

          <div className="verification-heading-icon">
            <ShieldCheck size={30} />
          </div>
        </header>

        <div className="verification-info">
          <ShieldCheck size={20} />
          <div>
            <strong>Verification review centre</strong>
            <p>
              Employer verification decisions are recorded in the
              administrator audit log. Only authorised administrators
              can approve or reject applications.
            </p>
          </div>
        </div>

        <section className="verification-stats">
          <article className="verification-stat-card">
            <span className="verification-stat-icon total">
              <Building2 size={21} />
            </span>
            <div>
              <span>Total employers</span>
              <strong>{result.counts.total}</strong>
            </div>
          </article>

          <article className="verification-stat-card">
            <span className="verification-stat-icon pending">
              <Clock3 size={21} />
            </span>
            <div>
              <span>Pending review</span>
              <strong>{result.counts.pending}</strong>
            </div>
          </article>

          <article className="verification-stat-card">
            <span className="verification-stat-icon approved">
              <CheckCircle2 size={21} />
            </span>
            <div>
              <span>Approved</span>
              <strong>{result.counts.approved}</strong>
            </div>
          </article>

          <article className="verification-stat-card">
            <span className="verification-stat-icon rejected">
              <XCircle size={21} />
            </span>
            <div>
              <span>Rejected</span>
              <strong>{result.counts.rejected}</strong>
            </div>
          </article>
        </section>

        <section className="verification-panel">
          <div className="verification-panel-heading">
            <div>
              <h2>Employer verification applications</h2>
              <p>
                Review submitted business information and make
                verification decisions.
              </p>
            </div>

            <span className="verification-result-count">
              {filteredEmployers.length} results
            </span>
          </div>

          <form
            method="GET"
            action="/verifications"
            className="verification-filter"
          >
            <div className="verification-search">
              <Search size={18} />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search business, contact or email..."
              />
            </div>

            <select
              name="status"
              defaultValue={selectedStatus}
              aria-label="Filter verification applications"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <button type="submit">Apply filters</button>
          </form>

          {params.success && (
            <div className="verification-message success">
              <CheckCircle2 size={19} />
              <span>{params.success}</span>
            </div>
          )}

          {params.error && (
            <div className="verification-message error">
              <XCircle size={19} />
              <span>{params.error}</span>
            </div>
          )}

          {params.warning && (
            <div className="verification-message warning">
              <ShieldCheck size={19} />
              <span>{params.warning}</span>
            </div>
          )}

          {filteredEmployers.length === 0 ? (
            <div className="verification-empty">
              <ShieldCheck size={40} />
              <h3>No verification applications found</h3>
              <p>
                There are no applications matching the selected
                status or search term.
              </p>
            </div>
          ) : (
            <div className="verification-list">
              {filteredEmployers.map((employer) => (
                <article
                  className="verification-card"
                  key={employer.userId}
                >
                  <div className="verification-card-header">
                    <div className="verification-business">
                      <span className="verification-business-icon">
                        <Building2 size={24} />
                      </span>

                      <div>
                        <h3>{employer.businessName}</h3>
                        <p>{employer.businessType}</p>
                      </div>
                    </div>

                    <span
                      className={`verification-status verification-status-${employer.verificationStatus}`}
                    >
                      {employer.verificationStatus === "approved" ? (
                        <CheckCircle2 size={14} />
                      ) : employer.verificationStatus === "rejected" ? (
                        <XCircle size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}
                      {getStatusLabel(employer.verificationStatus)}
                    </span>
                  </div>

                  {employer.description && (
                    <p className="verification-description">
                      {employer.description}
                    </p>
                  )}

                  <div className="verification-details">
                    <div>
                      <Mail size={16} />
                      <span>{employer.email}</span>
                    </div>

                    <div>
                      <Phone size={16} />
                      <span>
                        {employer.businessPhone ||
                          employer.accountPhone ||
                          "Phone not provided"}
                      </span>
                    </div>

                    <div>
                      <MapPin size={16} />
                      <span>
                        {employer.address ||
                          employer.accountLocation ||
                          "Address not provided"}
                      </span>
                    </div>

                    <div>
                      <BriefcaseBusiness size={16} />
                      <span>Contact: {employer.fullName}</span>
                    </div>

                    {employer.website && (
                      <div>
                        <Globe size={16} />
                        <a
                          href={employer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit business website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="verification-card-footer">
                    <span>
                      Submitted {formatDate(employer.createdAt)}
                    </span>

                    {canManage &&
                      employer.verificationStatus === "pending" && (
                        <div className="verification-actions">
                          <form action={approveEmployer}>
                            <input
                              type="hidden"
                              name="employerId"
                              value={employer.userId}
                            />
                            <button
                              type="submit"
                              className="verification-approve"
                            >
                              <CheckCircle2 size={15} />
                              Approve
                            </button>
                          </form>

                          <form action={rejectEmployer}>
                            <input
                              type="hidden"
                              name="employerId"
                              value={employer.userId}
                            />
                            <input
                              type="text"
                              name="reason"
                              placeholder="Rejection reason (min. 10 characters)"
                              minLength={10}
                              maxLength={1000}
                              required
                            />
                            <button
                              type="submit"
                              className="verification-reject"
                            >
                              <XCircle size={15} />
                              Reject
                            </button>
                          </form>
                        </div>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="verification-next-step">
          <div>
            <h3>Professional verification</h3>
            <p>
              Skilled Professionals & Artisans verification will be
              connected after confirming the existing professional
              verification fields and document-storage workflow.
            </p>
          </div>

          <Link href="/professionals">
            View professionals
            <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </AdminShell>
  );
}
