
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Logo from "../../../components/Logo";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import "./users.css";

type UserStatus = "Active" | "Suspended" | "Pending";

type Member = {
  id: string;
  name: string;
  email: string;
  initials: string;
  type: "Job Seeker" | "Professional" | "Employer";
  location: string;
  joined: string;
  status: UserStatus;
  phone: string;
  profileCompletion: number;
};

const initialMembers: Member[] = [
  {
    id: "ABJ-USER-001",
    name: "Chinedu Okafor",
    email: "chinedu.okafor@example.com",
    initials: "CO",
    type: "Job Seeker",
    location: "Aba, Abia State",
    joined: "Oct 02, 2026",
    status: "Active",
    phone: "+234 803 000 0001",
    profileCompletion: 85,
  },
  {
    id: "ABJ-USER-002",
    name: "Amara Nwosu",
    email: "amara.nwosu@example.com",
    initials: "AN",
    type: "Professional",
    location: "Umuahia, Abia State",
    joined: "Oct 04, 2026",
    status: "Active",
    phone: "+234 803 000 0002",
    profileCompletion: 92,
  },
  {
    id: "ABJ-USER-003",
    name: "Bright Solutions Ltd",
    email: "hello@brightsolutions.ng",
    initials: "BS",
    type: "Employer",
    location: "Aba, Abia State",
    joined: "Oct 06, 2026",
    status: "Pending",
    phone: "+234 803 000 0003",
    profileCompletion: 65,
  },
  {
    id: "ABJ-USER-004",
    name: "Emeka Eze",
    email: "emeka.eze@example.com",
    initials: "EE",
    type: "Job Seeker",
    location: "Osisioma, Abia State",
    joined: "Oct 08, 2026",
    status: "Active",
    phone: "+234 803 000 0004",
    profileCompletion: 74,
  },
  {
    id: "ABJ-USER-005",
    name: "Made in Aba Studio",
    email: "admin@madeinaba.ng",
    initials: "MA",
    type: "Employer",
    location: "Ariaria, Aba",
    joined: "Oct 10, 2026",
    status: "Active",
    phone: "+234 803 000 0005",
    profileCompletion: 100,
  },
  {
    id: "ABJ-USER-006",
    name: "Blessing Kalu",
    email: "blessing.kalu@example.com",
    initials: "BK",
    type: "Professional",
    location: "Ohafia, Abia State",
    joined: "Oct 12, 2026",
    status: "Suspended",
    phone: "+234 803 000 0006",
    profileCompletion: 58,
  },
  {
    id: "ABJ-USER-007",
    name: "Ikenna Digital",
    email: "team@ikennadigital.ng",
    initials: "ID",
    type: "Employer",
    location: "Umuahia, Abia State",
    joined: "Oct 15, 2026",
    status: "Active",
    phone: "+234 803 000 0007",
    profileCompletion: 88,
  },
  {
    id: "ABJ-USER-008",
    name: "Ngozi Umeh",
    email: "ngozi.umeh@example.com",
    initials: "NU",
    type: "Job Seeker",
    location: "Obingwa, Abia State",
    joined: "Oct 18, 2026",
    status: "Pending",
    phone: "+234 803 000 0008",
    profileCompletion: 42,
  },
];

export default function AdminUsersPage() {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query) ||
        member.location.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "All" || member.type === typeFilter;

      const matchesStatus =
        statusFilter === "All" || member.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [members, search, typeFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / pageSize)
  );

  const displayedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCount = members.filter(
    (member) => member.status === "Active"
  ).length;

  const pendingCount = members.filter(
    (member) => member.status === "Pending"
  ).length;

  const employerCount = members.filter(
    (member) => member.type === "Employer"
  ).length;

  const updateMemberStatus = (id: string, status: UserStatus) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === id ? { ...member, status } : member
      )
    );

    setSelectedMember((current) =>
      current?.id === id ? { ...current, status } : current
    );
  };

  const exportMembers = () => {
    const headings = [
      "User ID",
      "Name",
      "Email",
      "Account Type",
      "Location",
      "Joined",
      "Status",
      "Phone",
    ];

    const rows = filteredMembers.map((member) => [
      member.id,
      member.name,
      member.email,
      member.type,
      member.location,
      member.joined,
      member.status,
      member.phone,
    ]);

    const csv = [headings, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const file = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "abijob-users.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <main className="admin-users-page">
      <aside className="admin-users-sidebar">
        <div className="admin-users-brand">
          <Logo href="/" size="medium" />
        </div>

        <div className="admin-users-admin">
          <div className="admin-users-admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>Platform management</span>
          </div>
        </div>

        <span className="admin-users-nav-label">MAIN MENU</span>

        <nav className="admin-users-nav">
          <Link href="/admin" className="admin-users-nav-link">
            <ShieldCheck size={19} />
            <span>Overview</span>
          </Link>

          <Link
            href="/admin/users"
            className="admin-users-nav-link active"
          >
            <Users size={19} />
            <span>Users</span>
          </Link>

          <Link href="/admin/jobs" className="admin-users-nav-link">
            <BriefcaseBusiness size={19} />
            <span>Job approvals</span>
          </Link>

          <Link
            href="/admin/subscriptions"
            className="admin-users-nav-link"
          >
            <Wallet size={19} />
            <span>Subscriptions</span>
          </Link>
        </nav>

        <div className="admin-users-sidebar-bottom">
          <Link href="/" className="admin-users-back">
            <ArrowLeft size={16} />
            Back to website
          </Link>
          <div className="admin-users-sidebar-note">
            <ShieldCheck size={17} />
            Abi Job Admin Portal
          </div>
        </div>
      </aside>

      <section className="admin-users-main">
        <header className="admin-users-topbar">
          <div>
            <span className="admin-users-breadcrumb">
              Admin <span>/</span> Users
            </span>
            <h1>User management</h1>
            <p>View and manage all registered Abi Job members.</p>
          </div>

          <button
            className="admin-users-export"
            onClick={exportMembers}
          >
            <Download size={17} />
            Export users
          </button>
        </header>

        <div className="admin-users-content">
          <section className="admin-users-stats">
            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Total users</span>
                <div className="admin-users-stat-icon green">
                  <Users size={20} />
                </div>
              </div>
              <strong>{members.length}</strong>
              <small>All registered accounts</small>
            </article>

            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Active accounts</span>
                <div className="admin-users-stat-icon blue">
                  <BadgeCheck size={20} />
                </div>
              </div>
              <strong>{activeCount}</strong>
              <small>Accounts currently active</small>
            </article>

            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Employers</span>
                <div className="admin-users-stat-icon orange">
                  <Building2 size={20} />
                </div>
              </div>
              <strong>{employerCount}</strong>
              <small>Registered business accounts</small>
            </article>

            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Pending accounts</span>
                <div className="admin-users-stat-icon purple">
                  <UserRound size={20} />
                </div>
              </div>
              <strong>{pendingCount}</strong>
              <small>Awaiting account review</small>
            </article>
          </section>

          <section className="admin-users-table-section">
            <div className="admin-users-section-heading">
              <div>
                <h2>Registered members</h2>
                <p>Search, filter and inspect member accounts.</p>
              </div>
              <span>{filteredMembers.length} members</span>
            </div>

            <div className="admin-users-toolbar">
              <div className="admin-users-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search name, email, ID or location..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="admin-users-filters">
                <label>
                  <Filter size={16} />
                  <select
                    value={typeFilter}
                    onChange={(event) => {
                      setTypeFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All account types</option>
                    <option value="Job Seeker">Job seekers</option>
                    <option value="Professional">Professionals</option>
                    <option value="Employer">Employers</option>
                  </select>
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter users by status"
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Account type</th>
                    <th>Location</th>
                    <th>Date joined</th>
                    <th>Status</th>
                    <th>Profile</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="admin-users-member">
                          <span className="admin-users-avatar">
                            {member.initials}
                          </span>
                          <span>
                            <strong>{member.name}</strong>
                            <small>{member.email}</small>
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-users-type ${member.type
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {member.type}
                        </span>
                      </td>

                      <td>{member.location}</td>
                      <td>{member.joined}</td>

                      <td>
                        <span
                          className={`admin-users-status ${member.status.toLowerCase()}`}
                        >
                          <span />
                          {member.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-users-progress">
                          <div>
                            <span
                              style={{
                                width: `${member.profileCompletion}%`,
                              }}
                            />
                          </div>
                          <small>{member.profileCompletion}%</small>
                        </div>
                      </td>

                      <td>
                        <button
                          className="admin-users-view"
                          onClick={() => setSelectedMember(member)}
                          aria-label={`View ${member.name}`}
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {displayedMembers.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-users-empty">
                          <Search size={25} />
                          <strong>No members found</strong>
                          <span>
                            Try another search term or change your filters.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-users-pagination">
              <span>
                Showing{" "}
                {filteredMembers.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
                –
                {Math.min(
                  currentPage * pageSize,
                  filteredMembers.length
                )}{" "}
                of {filteredMembers.length}
              </span>

              <div>
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>

          <div className="admin-users-notice">
            <ShieldCheck size={19} />
            <p>
              <strong>Account management preview:</strong> Member records and
              account status changes are currently sample data stored in
              this page. Live user management will be connected to Supabase.
            </p>
          </div>
        </div>
      </section>

      {selectedMember && (
        <div
          className="admin-users-modal-backdrop"
          onClick={() => setSelectedMember(null)}
        >
          <section
            className="admin-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-users-modal-title"
          >
            <div className="admin-users-modal-header">
              <div>
                <span>MEMBER PROFILE</span>
                <h2 id="admin-users-modal-title">
                  {selectedMember.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                aria-label="Close member details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-users-modal-profile">
              <span className="admin-users-avatar large">
                {selectedMember.initials}
              </span>
              <div>
                <strong>{selectedMember.email}</strong>
                <span>{selectedMember.type}</span>
              </div>
            </div>

            <div className="admin-users-detail-grid">
              <div>
                <span>User ID</span>
                <strong>{selectedMember.id}</strong>
              </div>
              <div>
                <span>Phone number</span>
                <strong>{selectedMember.phone}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{selectedMember.location}</strong>
              </div>
              <div>
                <span>Date joined</span>
                <strong>{selectedMember.joined}</strong>
              </div>
              <div>
                <span>Profile completion</span>
                <strong>{selectedMember.profileCompletion}%</strong>
              </div>
              <div>
                <span>Account status</span>
                <strong>{selectedMember.status}</strong>
              </div>
            </div>

            <div className="admin-users-modal-actions">
              <label htmlFor="member-status">Update demo account status</label>
              <select
                id="member-status"
                value={selectedMember.status}
                onChange={(event) =>
                  updateMemberStatus(
                    selectedMember.id,
                    event.target.value as UserStatus
                  )
                }
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <button
              className="admin-users-modal-close"
              onClick={() => setSelectedMember(null)}
            >
              Close profile
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
