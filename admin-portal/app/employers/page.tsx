
import {
  Building2,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  BriefcaseBusiness,
} from "lucide-react";

import { getActiveAdmin } from "../../lib/admin-auth";
import { getAdminEmployers } from "../../lib/admin-employers";
import AdminShell from "../../components/AdminShell";
import { approveEmployer, rejectEmployer } from "./actions";

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
  { value: "all", label: "All employers" },
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

function statusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}

export default async function EmployersPage({
  searchParams,
}: PageProps) {
  const admin = await getActiveAdmin();

  const canViewEmployers =
    admin.permissions.includes("employers.view") ||
    admin.permissions.includes("employers.manage");

  const canManageEmployers =
    admin.permissions.includes("employers.manage");

  if (!canViewEmployers) {
    return (
      <AdminShell>
        <div className="admin-access-denied">
          <ShieldCheck size={36} />
          <h1>Access restricted</h1>
          <p>
            You do not have permission to view employer accounts.
          </p>
        </div>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const selectedStatus = statuses.some(
    (item) => item.value === params.status
  )
    ? params.status!
    : "all";

  const result = await getAdminEmployers();

  const filteredEmployers = result.employers.filter((employer) => {
    const matchesStatus =
      selectedStatus === "all" ||
      employer.verificationStatus === selectedStatus;

    const searchText = [
      employer.email,
      employer.fullName,
      employer.businessName,
      employer.businessType,
      employer.address,
      employer.businessPhone,
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
      <div className="management-page employer-management-page">
        <div className="management-heading">
          <div>
            <span className="management-eyebrow">
              PLATFORM MANAGEMENT
            </span>
            <h1>Employer Management</h1>
            <p>
              Review registered businesses and manage employer verification.
            </p>
          </div>

          <div className="management-heading-icon">
            <Building2 size={25} />
          </div>
        </div>

        <div className="management-notice">
          <ShieldCheck size={20} />
          <div>
            <strong>Secure employer verification</strong>
            <p>
              Employer records are retrieved directly from Supabase.
              Only administrators with the required permissions can
              approve or reject business accounts.
            </p>
          </div>
        </div>

        <div className="employer-stats-grid">
          <div className="employer-stat-card">
            <span className="employer-stat-icon">
              <Building2 size={20} />
            </span>
            <span className="employer-stat-label">
              Total employers
            </span>
            <strong>{result.counts.total}</strong>
          </div>

          <div className="employer-stat-card">
            <span className="employer-stat-icon pending">
              <Clock3 size={20} />
            </span>
            <span className="employer-stat-label">
              Pending review
            </span>
            <strong>{result.counts.pending}</strong>
          </div>

          <div className="employer-stat-card">
            <span className="employer-stat-icon approved">
              <CheckCircle2 size={20} />
            </span>
            <span className="employer-stat-label">
              Approved
            </span>
            <strong>{result.counts.approved}</strong>
          </div>

          <div className="employer-stat-card">
            <span className="employer-stat-icon rejected">
              <XCircle size={20} />
            </span>
            <span className="employer-stat-label">
              Rejected
            </span>
            <strong>{result.counts.rejected}</strong>
          </div>
        </div>

        <section className="management-panel">
          <div className="management-panel-heading">
            <div>
              <h2>Registered businesses</h2>
              <p>
                Review employer information and verification status.
              </p>
            </div>

            <span className="management-page-count">
              {filteredEmployers.length} results
            </span>
          </div>

          <form
            method="get"
            action="/employers"
            className="employer-filter-form"
          >
            <div className="employer-search-field">
              <Search size={18} />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search business, email or phone..."
              />
            </div>

            <select
              name="status"
              defaultValue={selectedStatus}
              aria-label="Filter by verification status"
            >
              {statuses.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>

            <button type="submit">
              Search employers
            </button>
          </form>

          {params.success && (
            <div className="management-notice">
              <CheckCircle2 size={20} />
              <div>
                <strong>Success</strong>
                <p>{params.success}</p>
              </div>
            </div>
          )}

          {params.error && (
            <div className="management-notice">
              <XCircle size={20} />
              <div>
                <strong>Action unsuccessful</strong>
                <p>{params.error}</p>
              </div>
            </div>
          )}

          {params.warning && (
            <div className="management-notice">
              <ShieldCheck size={20} />
              <div>
                <strong>Warning</strong>
                <p>{params.warning}</p>
              </div>
            </div>
          )}

          {filteredEmployers.length === 0 ? (
            <div className="management-empty">
              <Building2 size={30} />
              <h3>No employers found</h3>
              <p>
                No employer accounts match your search.
                Try another search term or status.
              </p>
            </div>
          ) : (
            <div className="employer-list">
              {filteredEmployers.map((employer) => (
                <article
                  className="employer-card"
                  key={employer.userId}
                >
                  <div className="employer-card-top">
                    <div className="employer-business-heading">
                      <span className="employer-business-icon">
                        <Building2 size={23} />
                      </span>

                      <div>
                        <h3>{employer.businessName}</h3>
                        <p>{employer.businessType}</p>
                      </div>
                    </div>

                    <span
                      className={`employer-status employer-status-${employer.verificationStatus}`}
                    >
                      {employer.verificationStatus === "approved" ? (
                        <CheckCircle2 size={14} />
                      ) : employer.verificationStatus === "rejected" ? (
                        <XCircle size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}
                      {statusLabel(employer.verificationStatus)}
                    </span>
                  </div>

                  {employer.description && (
                    <p className="employer-description">
                      {employer.description}
                    </p>
                  )}

                  <div className="employer-details-grid">
                    <div>
                      <Mail size={15} />
                      <span>{employer.email}</span>
                    </div>

                    <div>
                      <Phone size={15} />
                      <span>
                        {employer.businessPhone ||
                          employer.accountPhone ||
                          "Phone not provided"}
                      </span>
                    </div>

                    <div>
                      <MapPin size={15} />
                      <span>
                        {employer.address ||
                          employer.accountLocation ||
                          "Address not provided"}
                      </span>
                    </div>

                    <div>
                      <BriefcaseBusiness size={15} />
                      <span>
                        Contact: {employer.fullName}
                      </span>
                    </div>

                    {employer.website && (
                      <div>
                        <Globe size={15} />
                        <a
                          href={employer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Business website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="employer-card-footer">
                    <span>
                      Registered {formatDate(employer.createdAt)}
                    </span>

                    {canManageEmployers &&
                      employer.verificationStatus === "pending" && (
                        <div className="employer-actions">
                          <form action={approveEmployer}>
                            <input
                              type="hidden"
                              name="employerId"
                              value={employer.userId}
                            />
                            <button
                              type="submit"
                              className="employer-approve-button"
                            >
                              <CheckCircle2 size={15} />
                              Approve
                            </button>
                          </form>

                          <form
                            action={rejectEmployer}
                            className="employer-reject-form"
                          >
                            <input
                              type="hidden"
                              name="employerId"
                              value={employer.userId}
                            />
                            <input
                              type="text"
                              name="reason"
                              placeholder="Reason for rejection"
                              minLength={10}
                              maxLength={1000}
                              required
                            />
                            <button
                              type="submit"
                              className="employer-reject-button"
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

          {!canManageEmployers && (
            <p className="user-management-note">
              Your administrator role allows you to view employer
              records but not approve or reject them.
            </p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
