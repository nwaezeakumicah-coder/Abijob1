
import Link from "next/link";
import {
  Users,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  BriefcaseBusiness,
  UserRound,
  Building2,
} from "lucide-react";

import { getActiveAdmin } from "../../lib/admin-auth";
import { getAdminUsers, type UserCategory } from "../../lib/admin-users";
import AdminShell from "../../components/AdminShell";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
};

const categories: {
  value: UserCategory | "all";
  label: string;
}[] = [
  { value: "all", label: "All accounts" },
  { value: "job_seeker", label: "Job Seekers" },
  { value: "professional", label: "Skilled Professionals & Artisans" },
  { value: "employer", label: "Employers" },
  { value: "no_profile", label: "No profile" },
];

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAccountStatus(user: {
  deletedAt: string | null;
  bannedUntil: string | null;
  emailConfirmedAt: string | null;
}) {
  if (user.deletedAt) return "Deleted";
  if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
    return "Suspended";
  }
  if (!user.emailConfirmedAt) return "Unverified";
  return "Active";
}

function categoryLabel(category: UserCategory) {
  return categories.find((item) => item.value === category)?.label ?? "Other";
}

function categoryIcon(category: UserCategory) {
  if (category === "job_seeker") return UserRound;
  if (category === "professional") return BriefcaseBusiness;
  if (category === "employer") return Building2;
  return Users;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const admin = await getActiveAdmin();

  const canViewUsers =
    admin.permissions.includes("users.view") ||
    admin.permissions.includes("users.manage");

  if (!canViewUsers) {
    return (
      <AdminShell>
        <div className="admin-access-denied">
          <ShieldCheck size={36} />
          <h1>Access restricted</h1>
          <p>You do not have permission to view platform users.</p>
        </div>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const selectedCategory = categories.some(
    (item) => item.value === params.category
  )
    ? (params.category as UserCategory | "all")
    : "all";

  const pageNumber = Math.max(1, Number(params.page) || 1);
  const result = await getAdminUsers(pageNumber);

  const filteredUsers = result.users.filter((user) => {
    const matchesCategory =
      selectedCategory === "all" || user.category === selectedCategory;

    const searchText = [
      user.email,
      user.phone ?? "",
      user.profileLabel,
      user.profileDetail,
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && searchText.includes(query.toLowerCase());
  });

  const canManageUsers = admin.permissions.includes("users.manage");

  const queryString = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (selectedCategory !== "all") {
      search.set("category", selectedCategory);
    }
    search.set("page", String(nextPage));
    return `/users?${search.toString()}`;
  };

  return (
    <AdminShell>
      <div className="management-page">
        <div className="management-heading">
          <div>
            <span className="management-eyebrow">PLATFORM MANAGEMENT</span>
            <h1>User Management</h1>
            <p>
              View registered accounts and their available profile information.
            </p>
          </div>
          <div className="management-heading-icon">
            <Users size={25} />
          </div>
        </div>

        <div className="management-notice">
          <ShieldCheck size={20} />
          <div>
            <strong>Secure administrator access</strong>
            <p>
              Account information is retrieved securely from Supabase.
              Your administrator permissions control access to this directory.
            </p>
          </div>
        </div>

        <section className="management-panel">
          <div className="management-panel-heading">
            <div>
              <h2>Registered accounts</h2>
              <p>
                Showing accounts {result.users.length === 0 ? 0 : (pageNumber - 1) * 50 + 1}
                {"–"}
                {(pageNumber - 1) * 50 + result.users.length} on this page.
              </p>
            </div>
            <span className="management-page-count">
              Page {pageNumber}
            </span>
          </div>

          <form method="get" action="/users" className="user-filter-form">
            <div className="user-search-field">
              <Search size={18} />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search email, phone or profile..."
              />
            </div>

            <select
              name="category"
              defaultValue={selectedCategory}
              aria-label="Filter by account category"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <button type="submit">Search accounts</button>
          </form>

          {filteredUsers.length === 0 ? (
            <div className="management-empty">
              <Search size={28} />
              <h3>No matching accounts</h3>
              <p>
                There are no accounts matching these filters on this page.
                Try another search or category.
              </p>
            </div>
          ) : (
            <div className="user-table-wrap">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ACCOUNT</th>
                    <th>CATEGORY</th>
                    <th>PROFILE</th>
                    <th>STATUS</th>
                    <th>REGISTERED</th>
                    <th>LAST SIGN-IN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const Icon = categoryIcon(user.category);
                    const status = getAccountStatus(user);

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="user-account-cell">
                            <span className="user-avatar">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <strong>{user.email}</strong>
                              <span>
                                <Mail size={12} />
                                {user.phone ? (
                                  <>
                                    <Phone size={12} /> {user.phone}
                                  </>
                                ) : (
                                  "Email account"
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="user-category">
                            <Icon size={14} />
                            {categoryLabel(user.category)}
                          </span>
                        </td>
                        <td>
                          <strong className="user-profile-label">
                            {user.profileLabel}
                          </strong>
                          <span className="user-profile-detail">
                            {user.profileDetail}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`user-status user-status-${status.toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>{formatDate(user.lastSignInAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="user-pagination">
            <span>
              Page {pageNumber} · {result.users.length} accounts retrieved
            </span>
            <div>
              <Link
                href={queryString(pageNumber - 1)}
                aria-disabled={pageNumber <= 1}
                className={pageNumber <= 1 ? "is-disabled" : ""}
                tabIndex={pageNumber <= 1 ? -1 : 0}
              >
                <ChevronLeft size={16} /> Previous
              </Link>
              <Link
                href={queryString(pageNumber + 1)}
                aria-disabled={!result.hasNextPage}
                className={!result.hasNextPage ? "is-disabled" : ""}
                tabIndex={!result.hasNextPage ? -1 : 0}
              >
                Next <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {canManageUsers && (
            <p className="user-management-note">
              Your role permits user management. Account-changing actions
              will be added with separate server-side authorization and audit logging.
            </p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
