
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Logo from "../../../components/Logo";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  Filter,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import "./subscriptions.css";

type SubscriptionStatus = "Active" | "Expired" | "Cancelled" | "Pending";

type Subscription = {
  id: string;
  customer: string;
  email: string;
  initials: string;
  accountType: string;
  plan: string;
  amount: number;
  billing: string;
  status: SubscriptionStatus;
  startDate: string;
  nextPayment: string;
  reference: string;
};

const initialSubscriptions: Subscription[] = [
  {
    id: "SUB-1001",
    customer: "Chinedu Okafor",
    email: "chinedu.okafor@example.com",
    initials: "CO",
    accountType: "Job Seeker",
    plan: "Career Plus",
    amount: 1500,
    billing: "Monthly",
    status: "Active",
    startDate: "Oct 02, 2026",
    nextPayment: "Nov 02, 2026",
    reference: "ABJ-2026-001",
  },
  {
    id: "SUB-1002",
    customer: "Amara Nwosu",
    email: "amara.nwosu@example.com",
    initials: "AN",
    accountType: "Professional",
    plan: "Professional Plus",
    amount: 2000,
    billing: "Monthly",
    status: "Active",
    startDate: "Oct 05, 2026",
    nextPayment: "Nov 05, 2026",
    reference: "ABJ-2026-002",
  },
  {
    id: "SUB-1003",
    customer: "Bright Solutions Ltd",
    email: "hello@brightsolutions.ng",
    initials: "BS",
    accountType: "Employer",
    plan: "Growth",
    amount: 12000,
    billing: "Monthly",
    status: "Active",
    startDate: "Oct 08, 2026",
    nextPayment: "Nov 08, 2026",
    reference: "ABJ-2026-003",
  },
  {
    id: "SUB-1004",
    customer: "Emeka Eze",
    email: "emeka.eze@example.com",
    initials: "EE",
    accountType: "Job Seeker",
    plan: "Career Plus",
    amount: 1500,
    billing: "Monthly",
    status: "Expired",
    startDate: "Aug 12, 2026",
    nextPayment: "Sep 12, 2026",
    reference: "ABJ-2026-004",
  },
  {
    id: "SUB-1005",
    customer: "Made in Aba Studio",
    email: "admin@madeinaba.ng",
    initials: "MA",
    accountType: "Employer",
    plan: "Business",
    amount: 25000,
    billing: "Monthly",
    status: "Active",
    startDate: "Oct 15, 2026",
    nextPayment: "Nov 15, 2026",
    reference: "ABJ-2026-005",
  },
  {
    id: "SUB-1006",
    customer: "Blessing Kalu",
    email: "blessing.kalu@example.com",
    initials: "BK",
    accountType: "Professional",
    plan: "Professional Plus",
    amount: 2000,
    billing: "Monthly",
    status: "Cancelled",
    startDate: "Sep 01, 2026",
    nextPayment: "Cancelled",
    reference: "ABJ-2026-006",
  },
  {
    id: "SUB-1007",
    customer: "Ikenna Digital",
    email: "team@ikennadigital.ng",
    initials: "ID",
    accountType: "Employer",
    plan: "Starter",
    amount: 5000,
    billing: "Monthly",
    status: "Pending",
    startDate: "Oct 28, 2026",
    nextPayment: "Awaiting payment",
    reference: "ABJ-2026-007",
  },
];

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  const filteredSubscriptions = useMemo(() => {
    const query = search.toLowerCase().trim();

    return subscriptions.filter((subscription) => {
      const matchesSearch =
        !query ||
        subscription.customer.toLowerCase().includes(query) ||
        subscription.email.toLowerCase().includes(query) ||
        subscription.id.toLowerCase().includes(query) ||
        subscription.plan.toLowerCase().includes(query) ||
        subscription.reference.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || subscription.status === statusFilter;

      const matchesType =
        typeFilter === "All" || subscription.accountType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [subscriptions, search, statusFilter, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubscriptions.length / pageSize)
  );

  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCount = subscriptions.filter(
    (item) => item.status === "Active"
  ).length;

  const pendingCount = subscriptions.filter(
    (item) => item.status === "Pending"
  ).length;

  const monthlyRevenue = subscriptions
    .filter((item) => item.status === "Active")
    .reduce((total, item) => total + item.amount, 0);

  const handleExport = () => {
    const headings = [
      "Subscription ID",
      "Customer",
      "Email",
      "Account Type",
      "Plan",
      "Amount",
      "Billing",
      "Status",
      "Start Date",
      "Next Payment",
      "Reference",
    ];

    const rows = filteredSubscriptions.map((item) => [
      item.id,
      item.customer,
      item.email,
      item.accountType,
      item.plan,
      item.amount,
      item.billing,
      item.status,
      item.startDate,
      item.nextPayment,
      item.reference,
    ]);

    const csv = [headings, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const file = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "abijob-subscriptions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleStatusChange = (
    id: string,
    status: SubscriptionStatus
  ) => {
    setSubscriptions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );

    setSelectedSubscription((current) =>
      current?.id === id ? { ...current, status } : current
    );
  };

  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <main className="admin-sub-page">
      <aside className="admin-sub-sidebar">
        <div className="admin-sub-brand">
          <Logo href="/" size="medium" />
        </div>

        <div className="admin-sub-admin">
          <div className="admin-sub-admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>Platform management</span>
          </div>
        </div>

        <span className="admin-sub-nav-label">MAIN MENU</span>

        <nav className="admin-sub-nav">
          <Link href="/admin" className="admin-sub-nav-link">
            <ShieldCheck size={19} />
            <span>Overview</span>
          </Link>
          <Link href="/admin/users" className="admin-sub-nav-link">
            <Users size={19} />
            <span>Users</span>
          </Link>
          <Link href="/admin/jobs" className="admin-sub-nav-link">
            <BadgeCheck size={19} />
            <span>Job approvals</span>
          </Link>
          <Link
            href="/admin/subscriptions"
            className="admin-sub-nav-link active"
          >
            <Wallet size={19} />
            <span>Subscriptions</span>
          </Link>
        </nav>

        <div className="admin-sub-sidebar-bottom">
          <Link href="/" className="admin-sub-back-link">
            <ChevronLeft size={17} />
            Back to website
          </Link>
          <div className="admin-sub-sidebar-note">
            <ShieldCheck size={17} />
            <span>Abi Job Admin Portal</span>
          </div>
        </div>
      </aside>

      <section className="admin-sub-main">
        <header className="admin-sub-topbar">
          <div>
            <span className="admin-sub-breadcrumb">
              Admin <span>/</span> Subscriptions
            </span>
            <h1>Subscription management</h1>
            <p>Monitor plans, payments and subscriber activity.</p>
          </div>

          <button className="admin-sub-export" onClick={handleExport}>
            <Download size={17} />
            Export report
          </button>
        </header>

        <div className="admin-sub-content">
          <section className="admin-sub-stats">
            <article className="admin-sub-stat-card">
              <div className="admin-sub-stat-top">
                <span>Total subscribers</span>
                <div className="admin-sub-stat-icon green">
                  <Users size={20} />
                </div>
              </div>
              <strong>{subscriptions.length.toLocaleString()}</strong>
              <small>
                <ArrowUpRight size={14} />
                All registered subscriptions
              </small>
            </article>

            <article className="admin-sub-stat-card">
              <div className="admin-sub-stat-top">
                <span>Active subscriptions</span>
                <div className="admin-sub-stat-icon blue">
                  <BadgeCheck size={20} />
                </div>
              </div>
              <strong>{activeCount.toLocaleString()}</strong>
              <small>
                <ArrowUpRight size={14} />
                Currently active plans
              </small>
            </article>

            <article className="admin-sub-stat-card">
              <div className="admin-sub-stat-top">
                <span>Estimated monthly revenue</span>
                <div className="admin-sub-stat-icon orange">
                  <CircleDollarSign size={20} />
                </div>
              </div>
              <strong>{formatMoney(monthlyRevenue)}</strong>
              <small>
                <ArrowUpRight size={14} />
                From active demo subscriptions
              </small>
            </article>

            <article className="admin-sub-stat-card">
              <div className="admin-sub-stat-top">
                <span>Pending payments</span>
                <div className="admin-sub-stat-icon purple">
                  <CalendarDays size={20} />
                </div>
              </div>
              <strong>{pendingCount.toLocaleString()}</strong>
              <small>
                <ArrowDownRight size={14} />
                Awaiting payment confirmation
              </small>
            </article>
          </section>

          <section className="admin-sub-table-section">
            <div className="admin-sub-section-heading">
              <div>
                <h2>All subscriptions</h2>
                <p>Review subscriber plans and account status.</p>
              </div>
              <span className="admin-sub-record-count">
                {filteredSubscriptions.length} records
              </span>
            </div>

            <div className="admin-sub-toolbar">
              <div className="admin-sub-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search customer, plan or reference..."
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

              <div className="admin-sub-filters">
                <label>
                  <Filter size={16} />
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>

                <select
                  value={typeFilter}
                  onChange={(event) => {
                    setTypeFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by account type"
                >
                  <option value="All">All account types</option>
                  <option value="Job Seeker">Job seekers</option>
                  <option value="Professional">Professionals</option>
                  <option value="Employer">Employers</option>
                </select>
              </div>
            </div>

            <div className="admin-sub-table-wrap">
              <table className="admin-sub-table">
                <thead>
                  <tr>
                    <th>Subscriber</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Start date</th>
                    <th>Next payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSubscriptions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="admin-sub-customer">
                          <span className="admin-sub-avatar">
                            {item.initials}
                          </span>
                          <span>
                            <strong>{item.customer}</strong>
                            <small>{item.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-sub-plan">
                          <strong>{item.plan}</strong>
                          <small>{item.accountType}</small>
                        </div>
                      </td>
                      <td>
                        <strong className="admin-sub-amount">
                          {formatMoney(item.amount)}
                        </strong>
                        <small className="admin-sub-cell-muted">
                          / {item.billing.toLowerCase()}
                        </small>
                      </td>
                      <td>{item.startDate}</td>
                      <td>{item.nextPayment}</td>
                      <td>
                        <span
                          className={`admin-sub-status ${item.status.toLowerCase()}`}
                        >
                          <span />
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="admin-sub-view"
                          onClick={() => setSelectedSubscription(item)}
                          aria-label={`View ${item.customer} subscription`}
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedSubscriptions.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-sub-empty">
                          <Search size={25} />
                          <strong>No subscriptions found</strong>
                          <span>
                            Try changing your search or filter settings.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-sub-pagination">
              <span>
                Showing{" "}
                {filteredSubscriptions.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
                {"–"}
                {Math.min(currentPage * pageSize, filteredSubscriptions.length)}{" "}
                of {filteredSubscriptions.length}
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

          <div className="admin-sub-notice">
            <ShieldCheck size={19} />
            <p>
              <strong>Demo data:</strong> These subscriptions and revenue
              figures are sample records for the interface. Live payment
              records will be connected after Supabase and Paystack integration.
            </p>
          </div>
        </div>
      </section>

      {selectedSubscription && (
        <div
          className="admin-sub-modal-backdrop"
          onClick={() => setSelectedSubscription(null)}
        >
          <section
            className="admin-sub-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-sub-modal-title"
          >
            <div className="admin-sub-modal-header">
              <div>
                <span>SUBSCRIPTION DETAILS</span>
                <h2 id="admin-sub-modal-title">
                  {selectedSubscription.customer}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSubscription(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-sub-modal-profile">
              <span className="admin-sub-avatar large">
                {selectedSubscription.initials}
              </span>
              <div>
                <strong>{selectedSubscription.email}</strong>
                <span>{selectedSubscription.accountType}</span>
              </div>
            </div>

            <div className="admin-sub-detail-grid">
              <div>
                <span>Subscription ID</span>
                <strong>{selectedSubscription.id}</strong>
              </div>
              <div>
                <span>Plan</span>
                <strong>{selectedSubscription.plan}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{formatMoney(selectedSubscription.amount)}</strong>
              </div>
              <div>
                <span>Billing cycle</span>
                <strong>{selectedSubscription.billing}</strong>
              </div>
              <div>
                <span>Start date</span>
                <strong>{selectedSubscription.startDate}</strong>
              </div>
              <div>
                <span>Next payment</span>
                <strong>{selectedSubscription.nextPayment}</strong>
              </div>
              <div>
                <span>Payment reference</span>
                <strong>{selectedSubscription.reference}</strong>
              </div>
              <div>
                <span>Current status</span>
                <strong>{selectedSubscription.status}</strong>
              </div>
            </div>

            <div className="admin-sub-modal-actions">
              <label htmlFor="subscription-status">Update demo status</label>
              <select
                id="subscription-status"
                value={selectedSubscription.status}
                onChange={(event) =>
                  handleStatusChange(
                    selectedSubscription.id,
                    event.target.value as SubscriptionStatus
                  )
                }
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              className="admin-sub-modal-close"
              onClick={() => setSelectedSubscription(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
