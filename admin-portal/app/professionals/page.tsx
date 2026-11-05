
import Link from "next/link";
import {
  BriefcaseBusiness,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Users,
  Clock3,
} from "lucide-react";

import { getActiveAdmin } from "../../lib/admin-auth";
import { getAdminUsers } from "../../lib/admin-users";
import AdminShell from "../../components/AdminShell";

import "./professionals.css";

type SearchParams = Promise<{
  q?: string;
  page?: string;
  status?: string;
}>;

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = await getActiveAdmin();

  if (
    !admin.permissions.includes("users.view") &&
    !admin.permissions.includes("users.manage")
  ) {
    return (
      <AdminShell>
        <main className="management-page">
          <div className="management-notice">
            You do not have permission to view the professionals directory.
          </div>
        </main>
      </AdminShell>
    );
  }

  const params = await searchParams;

  const query = (params.q ?? "").trim();
  const statusFilter = params.status ?? "all";
  const pageNumber = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1
  );

  const result = await getAdminUsers(pageNumber);

  const professionals = result.users.filter(
    (user) => user.category === "professional"
  );

  const filteredProfessionals = professionals.filter((professional) => {
    const searchText = [
      professional.email,
      professional.phone ?? "",
      professional.profileLabel,
      professional.profileDetail,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query || searchText.includes(query.toLowerCase());

    let accountStatus = "active";

    if (professional.deletedAt) {
      accountStatus = "deleted";
    } else if (professional.bannedUntil) {
      accountStatus = "suspended";
    } else if (!professional.emailConfirmedAt) {
      accountStatus = "unverified";
    }

    const matchesStatus =
      statusFilter === "all" || accountStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalOnPage = professionals.length;
  const activeCount = professionals.filter(
    (user) => !user.deletedAt && !user.bannedUntil
  ).length;
  const unverifiedCount = professionals.filter(
    (user) => !user.emailConfirmedAt
  ).length;
  const suspendedCount = professionals.filter(
    (user) => Boolean(user.bannedUntil)
  ).length;

  const createPageUrl = (page: number) => {
    const search = new URLSearchParams();

    if (query) search.set("q", query);
    if (statusFilter !== "all") {
      search.set("status", statusFilter);
    }
    search.set("page", String(page));

    return `/professionals?${search.toString()}`;
  };

  return (
    <AdminShell>
      <main className="management-page">
        <div className="management-heading">
          <div>
            <p className="management-eyebrow">USER MANAGEMENT</p>
            <h1>Skilled Professionals & Artisans</h1>
            <p>
              View and monitor professionals registered on the Abi Job
              platform.
            </p>
          </div>

          <div className="management-heading-icon">
            <BriefcaseBusiness size={28} />
          </div>
        </div>

        <div className="management-notice">
          <ShieldCheck size={18} />
          <span>
            This directory currently provides read-only account information.
            Verification and account-management actions will be added after
            their database workflows are confirmed.
          </span>
        </div>

        <section className="management-stats">
          <article className="management-stat-card">
            <div className="management-stat-icon">
              <Users size={21} />
            </div>
            <div>
              <span>Professionals on this page</span>
              <strong>{totalOnPage}</strong>
            </div>
          </article>

          <article className="management-stat-card">
            <div className="management-stat-icon">
              <ShieldCheck size={21} />
            </div>
            <div>
              <span>Active accounts</span>
              <strong>{activeCount}</strong>
            </div>
          </article>

          <article className="management-stat-card">
            <div className="management-stat-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Unverified email</span>
              <strong>{unverifiedCount}</strong>
            </div>
          </article>

          <article className="management-stat-card">
            <div className="management-stat-icon">
              <Users size={21} />
            </div>
            <div>
              <span>Suspended accounts</span>
              <strong>{suspendedCount}</strong>
            </div>
          </article>
        </section>

        <section className="management-panel">
          <div className="management-panel-heading">
            <div>
              <h2>Professionals directory</h2>
              <p>
                Search and filter professional accounts on the current
                account page.
              </p>
            </div>
          </div>

          <form method="GET" className="professional-filter-form">
            <div className="professional-search-field">
              <Search size={18} />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search name, category, email or location..."
              />
            </div>

            <select
              name="status"
              defaultValue={statusFilter}
              aria-label="Filter by account status"
            >
              <option value="all">All account statuses</option>
              <option value="active">Active</option>
              <option value="unverified">Email unverified</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>

            <button type="submit">Apply filters</button>
          </form>

          <div className="professional-table-wrap">
            <table className="professional-table">
              <thead>
                <tr>
                  <th>PROFESSIONAL</th>
                  <th>CATEGORY</th>
                  <th>SERVICE AREA</th>
                  <th>CONTACT</th>
                  <th>ACCOUNT STATUS</th>
                </tr>
              </thead>

              <tbody>
                {filteredProfessionals.length > 0 ? (
                  filteredProfessionals.map((professional) => {
                    let accountStatus = "Active";

                    if (professional.deletedAt) {
                      accountStatus = "Deleted";
                    } else if (professional.bannedUntil) {
                      accountStatus = "Suspended";
                    } else if (!professional.emailConfirmedAt) {
                      accountStatus = "Unverified";
                    }

                    return (
                      <tr key={professional.id}>
                        <td>
                          <div className="professional-account-cell">
                            <div className="professional-avatar">
                              {professional.profileLabel
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {professional.profileLabel}
                              </strong>
                              <span>
                                ID: {professional.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="professional-category">
                            {professional.profileLabel}
                          </span>
                        </td>

                        <td>
                          <span className="professional-service-area">
                            <MapPin size={14} />
                            {professional.profileDetail}
                          </span>
                        </td>

                        <td>
                          <div className="professional-contact">
                            <span>
                              <Mail size={14} />
                              {professional.email}
                            </span>

                            {professional.phone && (
                              <span>
                                <Phone size={14} />
                                {professional.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`professional-status professional-status-${accountStatus.toLowerCase()}`}
                          >
                            {accountStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="professional-empty">
                        <BriefcaseBusiness size={34} />
                        <h3>No professionals found</h3>
                        <p>
                          No professional accounts match your current search
                          or filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="professional-pagination">
            <span>
              Page {result.page}
              {result.hasNextPage ? " — more accounts available" : " — last account page"}
            </span>

            <div>
              {result.page > 1 && (
                <Link href={createPageUrl(result.page - 1)}>
                  <ChevronLeft size={17} />
                  Previous
                </Link>
              )}

              {result.hasNextPage && (
                <Link href={createPageUrl(result.page + 1)}>
                  Next
                  <ChevronRight size={17} />
                </Link>
              )}
            </div>
          </div>
        </section>

        <p className="professional-management-note">
          <ShieldCheck size={15} />
          Account information is retrieved from the platform authentication
          and professional profile records. The statistics above cover the
          current account page, not the entire platform.
        </p>
      </main>
    </AdminShell>
  );
}
