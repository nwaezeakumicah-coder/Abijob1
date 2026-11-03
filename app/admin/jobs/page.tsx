
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Logo from "../../../components/Logo";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import "./jobs.css";

type JobStatus = "Pending" | "Published" | "Rejected" | "Closed";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  category: string;
  type: string;
  salary: string;
  date: string;
  status: JobStatus;
  applicants: number;
};

const initialJobs: Job[] = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "Digital Solutions Ltd",
    location: "Aba",
    category: "Technology",
    type: "Full-time",
    salary: "₦150,000 – ₦250,000",
    date: "31 Oct 2026",
    status: "Pending",
    applicants: 0,
  },
  {
    id: 2,
    title: "Fashion Designer",
    company: "Made in Aba Studio",
    location: "Ariaria, Aba",
    category: "Fashion",
    type: "Full-time",
    salary: "₦80,000 – ₦120,000",
    date: "30 Oct 2026",
    status: "Published",
    applicants: 24,
  },
  {
    id: 3,
    title: "Customer Service Officer",
    company: "Business Hub",
    location: "Umuahia",
    category: "Administration",
    type: "Full-time",
    salary: "₦90,000 – ₦130,000",
    date: "29 Oct 2026",
    status: "Pending",
    applicants: 0,
  },
  {
    id: 4,
    title: "Professional Barber",
    company: "Fresh Cut Lounge",
    location: "Osisioma",
    category: "Beauty & Personal Care",
    type: "Contract",
    salary: "Negotiable",
    date: "28 Oct 2026",
    status: "Rejected",
    applicants: 0,
  },
  {
    id: 5,
    title: "Accountant",
    company: "Prime Ventures",
    location: "Umuahia",
    category: "Finance",
    type: "Full-time",
    salary: "₦120,000 – ₦180,000",
    date: "27 Oct 2026",
    status: "Published",
    applicants: 18,
  },
  {
    id: 6,
    title: "Hotel Receptionist",
    company: "Golden Palm Hotel",
    location: "Aba",
    category: "Hospitality",
    type: "Full-time",
    salary: "₦70,000 – ₦100,000",
    date: "26 Oct 2026",
    status: "Closed",
    applicants: 12,
  },
];

const statusOptions = ["All", "Pending", "Published", "Rejected", "Closed"];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [notice, setNotice] = useState("");

  const counts = useMemo(
    () => ({
      total: jobs.length,
      pending: jobs.filter((job) => job.status === "Pending").length,
      published: jobs.filter((job) => job.status === "Published").length,
      rejected: jobs.filter((job) => job.status === "Rejected").length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const term = search.toLowerCase().trim();

    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "All" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  function updateStatus(id: number, status: JobStatus) {
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, status } : job))
    );
    setSelectedJob(null);
    setNotice(`Job listing ${status.toLowerCase()} successfully.`);
  }

  function exportJobs() {
    const headings = [
      "Job title",
      "Company",
      "Location",
      "Category",
      "Employment type",
      "Salary",
      "Status",
      "Applicants",
    ];

    const rows = filteredJobs.map((job) => [
      job.title,
      job.company,
      job.location,
      job.category,
      job.type,
      job.salary,
      job.status,
      String(job.applicants),
    ]);

    const csv = [headings, ...rows]
      .map((row) =>
        row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "abijob-job-listings.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-jobs">
      <aside className="admin-jobs-sidebar">
        <div className="admin-jobs-brand">
          <Logo href="/" size="medium" />
        </div>

        <div className="admin-jobs-admin">
          <div className="admin-jobs-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>Platform management</span>
          </div>
        </div>

        <span className="admin-jobs-nav-label">MAIN MENU</span>

        <nav className="admin-jobs-nav">
          <Link href="/admin">
            <BriefcaseBusiness size={18} />
            Dashboard
          </Link>
          <Link href="/admin/users">
            <Building2 size={18} />
            Users
          </Link>
          <Link href="/admin/jobs" className="active">
            <BriefcaseBusiness size={18} />
            Job listings
          </Link>
          <Link href="/admin/subscriptions">
            <ShieldCheck size={18} />
            Subscriptions
          </Link>
        </nav>

        <div className="admin-jobs-sidebar-bottom">
          <Link href="/">
            <ArrowRight size={17} />
            Back to website
          </Link>
        </div>
      </aside>

      <section className="admin-jobs-main">
        <header className="admin-jobs-topbar">
          <div>
            <span>ADMINISTRATION / JOBS</span>
            <h1>Job management</h1>
          </div>
          <div className="admin-jobs-top-profile">
            <div className="admin-jobs-top-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Super admin</span>
            </div>
          </div>
        </header>

        <div className="admin-jobs-content">
          <div className="admin-jobs-heading">
            <div>
              <h2>Manage job listings</h2>
              <p>
                Review employer submissions and manage published opportunities
                across Abi Job.
              </p>
            </div>
            <button className="admin-jobs-export" onClick={exportJobs}>
              <ArrowRight size={17} />
              Export listings
            </button>
          </div>

          {notice && (
            <div className="admin-jobs-notice">
              <CheckCircle2 size={18} />
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={17} />
              </button>
            </div>
          )}

          <div className="admin-jobs-stats">
            <article>
              <div className="admin-jobs-stat-icon green">
                <BriefcaseBusiness size={20} />
              </div>
              <span>Total listings</span>
              <strong>{counts.total}</strong>
              <small>All submitted listings</small>
            </article>
            <article>
              <div className="admin-jobs-stat-icon orange">
                <Clock3 size={20} />
              </div>
              <span>Awaiting review</span>
              <strong>{counts.pending}</strong>
              <small>Require admin attention</small>
            </article>
            <article>
              <div className="admin-jobs-stat-icon blue">
                <CheckCircle2 size={20} />
              </div>
              <span>Published jobs</span>
              <strong>{counts.published}</strong>
              <small>Visible to job seekers</small>
            </article>
            <article>
              <div className="admin-jobs-stat-icon red">
                <XCircle size={20} />
              </div>
              <span>Rejected listings</span>
              <strong>{counts.rejected}</strong>
              <small>Not approved for publication</small>
            </article>
          </div>

          <section className="admin-jobs-panel">
            <div className="admin-jobs-panel-heading">
              <div>
                <h3>All job submissions</h3>
                <p>Review and manage employer job postings.</p>
              </div>
              <span>{filteredJobs.length} listings</span>
            </div>

            <div className="admin-jobs-toolbar">
              <div className="admin-jobs-search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search job title, company or location..."
                />
                {search && (
                  <button onClick={() => setSearch("")} aria-label="Clear search">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="admin-jobs-filter">
                <Filter size={17} />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All statuses" : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-jobs-table-wrap">
              <table className="admin-jobs-table">
                <thead>
                  <tr>
                    <th>JOB DETAILS</th>
                    <th>LOCATION</th>
                    <th>EMPLOYMENT</th>
                    <th>SUBMITTED</th>
                    <th>APPLICANTS</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="admin-jobs-title-cell">
                          <strong>{job.title}</strong>
                          <span>{job.company}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-jobs-location">
                          <MapPin size={14} />
                          {job.location}
                        </span>
                      </td>
                      <td>
                        <span className="admin-jobs-type">{job.type}</span>
                      </td>
                      <td>{job.date}</td>
                      <td>{job.applicants}</td>
                      <td>
                        <span
                          className={`admin-jobs-status ${job.status.toLowerCase()}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="admin-jobs-view"
                          onClick={() => setSelectedJob(job)}
                          aria-label={`Review ${job.title}`}
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-jobs-empty">
                        No job listings match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-jobs-pagination">
              <span>Showing {filteredJobs.length} of {jobs.length} listings</span>
              <div>
                <button disabled aria-label="Previous page">
                  <ChevronLeft size={17} />
                </button>
                <button className="current">1</button>
                <button disabled aria-label="Next page">
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>

          <div className="admin-jobs-guideline">
            <ShieldCheck size={22} />
            <div>
              <strong>Publication approval policy</strong>
              <p>
                New job listings should be reviewed before publication. Check
                the employer, job description, location and application details
                before approving a submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {selectedJob && (
        <div
          className="admin-jobs-modal-backdrop"
          onClick={() => setSelectedJob(null)}
        >
          <section
            className="admin-jobs-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-job-modal-title"
          >
            <div className="admin-jobs-modal-heading">
              <div>
                <span>JOB SUBMISSION REVIEW</span>
                <h2 id="admin-job-modal-title">{selectedJob.title}</h2>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                aria-label="Close review"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-jobs-modal-company">
              <Building2 size={20} />
              <div>
                <strong>{selectedJob.company}</strong>
                <span>{selectedJob.category}</span>
              </div>
            </div>

            <div className="admin-jobs-modal-details">
              <div>
                <span>Location</span>
                <strong>{selectedJob.location}</strong>
              </div>
              <div>
                <span>Employment type</span>
                <strong>{selectedJob.type}</strong>
              </div>
              <div>
                <span>Salary range</span>
                <strong>{selectedJob.salary}</strong>
              </div>
              <div>
                <span>Submitted</span>
                <strong>{selectedJob.date}</strong>
              </div>
              <div>
                <span>Applicants</span>
                <strong>{selectedJob.applicants}</strong>
              </div>
              <div>
                <span>Current status</span>
                <strong>{selectedJob.status}</strong>
              </div>
            </div>

            <div className="admin-jobs-modal-note">
              <ShieldCheck size={18} />
              <p>
                This is demonstration information. A live review will include
                the employer's complete job description and verification
                details.
              </p>
            </div>

            <div className="admin-jobs-modal-actions">
              <button
                className="reject"
                onClick={() => updateStatus(selectedJob.id, "Rejected")}
              >
                <XCircle size={17} />
                Reject listing
              </button>
              <button
                className="approve"
                onClick={() => updateStatus(selectedJob.id, "Published")}
              >
                <Check size={17} />
                Approve & publish
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
