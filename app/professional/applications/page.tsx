
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Logo from "../../../components/Logo";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import "./applications.css";

type ApplicationStatus =
  | "Under review"
  | "Shortlisted"
  | "Interview"
  | "Rejected";

type Application = {
  id: number;
  role: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  applied: string;
  status: ApplicationStatus;
  description: string;
};

const initialApplications: Application[] = [
  {
    id: 1,
    role: "Fashion Designer",
    company: "Made in Aba Studio",
    location: "Ariaria, Aba",
    type: "Full-time",
    salary: "₦80,000 – ₦120,000/month",
    applied: "Oct 28, 2026",
    status: "Shortlisted",
    description:
      "Looking for a creative fashion designer with strong garment construction, pattern making and finishing skills.",
  },
  {
    id: 2,
    role: "Graphic Designer",
    company: "Creative Edge Media",
    location: "Umuahia, Abia",
    type: "Full-time",
    salary: "₦70,000 – ₦100,000/month",
    applied: "Oct 25, 2026",
    status: "Under review",
    description:
      "Create visual designs for digital campaigns, print materials and brand identity projects.",
  },
  {
    id: 3,
    role: "Frontend Developer",
    company: "Digital Solutions NG",
    location: "Remote",
    type: "Remote",
    salary: "₦150,000 – ₦250,000/month",
    applied: "Oct 20, 2026",
    status: "Interview",
    description:
      "Build responsive web interfaces and work with a development team to deliver digital products.",
  },
  {
    id: 4,
    role: "Production Assistant",
    company: "Aba Fashion House",
    location: "Osisioma, Aba",
    type: "Contract",
    salary: "₦60,000/month",
    applied: "Oct 16, 2026",
    status: "Rejected",
    description:
      "Assist the production team with clothing preparation, quality checks and daily operations.",
  },
];

const filters = [
  "All",
  "Under review",
  "Shortlisted",
  "Interview",
  "Rejected",
] as const;

function StatusIcon({ status }: { status: ApplicationStatus }) {
  if (status === "Shortlisted") return <CheckCircle2 size={15} />;
  if (status === "Interview") return <CalendarDays size={15} />;
  if (status === "Rejected") return <XCircle size={15} />;
  return <Clock3 size={15} />;
}

export default function ProfessionalApplicationsPage() {
  const [applications] = useState(initialApplications);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const matchesFilter =
        activeFilter === "All" || application.status === activeFilter;

      const query = searchQuery.toLowerCase();

      const matchesSearch =
        application.role.toLowerCase().includes(query) ||
        application.company.toLowerCase().includes(query) ||
        application.location.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [applications, activeFilter, searchQuery]);

  const countStatus = (status: string) =>
    applications.filter((item) => item.status === status).length;

  return (
    <main className="professional-applications">
      <aside className="professional-applications-sidebar">
        <div className="professional-applications-brand">
          <Logo href="/" light />
        </div>

        <div className="professional-applications-sidebar-label">
          WORKSPACE
        </div>

        <nav className="professional-applications-nav">
          <Link href="/professional/dashboard">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/professional/opportunities">
            <Search size={19} />
            <span>Find opportunities</span>
          </Link>

          <Link href="/professional/applications" className="active">
            <FileText size={19} />
            <span>My applications</span>
            <span className="professional-applications-nav-count">
              {applications.length}
            </span>
          </Link>

          <Link href="/professional/experience">
            <CheckCircle2 size={19} />
            <span>Experience</span>
          </Link>

          <Link href="/professional/messages">
            <BriefcaseBusiness size={19} />
            <span>Messages</span>
            <span className="professional-applications-nav-count">2</span>
          </Link>

          <Link href="/professional/notifications">
            <Clock3 size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="professional-applications-sidebar-bottom">
          <div className="professional-applications-help">
            <div className="professional-applications-help-icon">
              <BriefcaseBusiness size={20} />
            </div>
            <strong>Grow your career</strong>
            <p>Discover opportunities that match your skills.</p>
            <Link href="/professional/opportunities">
              Explore jobs <ArrowRight size={15} />
            </Link>
          </div>

          <Link
            href="/professional/profile"
            className="professional-applications-profile-link"
          >
            <div className="professional-applications-avatar">SP</div>
            <div>
              <strong>My profile</strong>
              <span>Professional account</span>
            </div>
          </Link>
        </div>
      </aside>

      <section className="professional-applications-main">
        <header className="professional-applications-topbar">
          <div>
            <span className="professional-applications-topbar-label">
              PROFESSIONAL WORKSPACE
            </span>
            <h2>My applications</h2>
          </div>

          <div className="professional-applications-topbar-actions">
            <Link
              href="/professional/messages"
              className="professional-applications-top-icon"
              aria-label="Messages"
            >
              <BriefcaseBusiness size={19} />
            </Link>
            <Link
              href="/professional/notifications"
              className="professional-applications-top-icon"
              aria-label="Notifications"
            >
              <Clock3 size={19} />
            </Link>
            <Link
              href="/professional/profile"
              className="professional-applications-top-avatar"
            >
              SP
            </Link>
          </div>
        </header>

        <div className="professional-applications-content">
          <Link
            href="/professional/dashboard"
            className="professional-applications-back"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="professional-applications-heading">
            <div>
              <span className="professional-applications-eyebrow">
                YOUR CAREER ACTIVITY
              </span>
              <h1>Track your applications</h1>
              <p>
                Keep an eye on the opportunities you have applied for and
                follow every application update.
              </p>
            </div>

            <Link
              href="/professional/opportunities"
              className="professional-applications-find-button"
            >
              Find opportunities <ArrowRight size={17} />
            </Link>
          </div>

          <div className="professional-applications-stats">
            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon total">
                <FileText size={20} />
              </div>
              <div>
                <span>Total applications</span>
                <strong>{applications.length}</strong>
              </div>
            </div>

            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon review">
                <Clock3 size={20} />
              </div>
              <div>
                <span>Under review</span>
                <strong>{countStatus("Under review")}</strong>
              </div>
            </div>

            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon shortlisted">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span>Shortlisted</span>
                <strong>{countStatus("Shortlisted")}</strong>
              </div>
            </div>

            <div className="professional-applications-stat">
              <div className="professional-applications-stat-icon interview">
                <CalendarDays size={20} />
              </div>
              <div>
                <span>Interviews</span>
                <strong>{countStatus("Interview")}</strong>
              </div>
            </div>
          </div>

          <section className="professional-applications-list-section">
            <div className="professional-applications-list-heading">
              <div>
                <h2>Application history</h2>
                <p>Review and manage your submitted applications.</p>
              </div>
              <span className="professional-applications-results">
                {filteredApplications.length} results
              </span>
            </div>

            <div className="professional-applications-toolbar">
              <div className="professional-applications-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search job title, company or location..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="professional-applications-filter-label">
                <Filter size={17} />
                Filter:
              </div>

              <div className="professional-applications-filters">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={activeFilter === filter ? "active" : ""}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="professional-applications-list">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <article
                    className="professional-application-card"
                    key={application.id}
                  >
                    <div className="professional-application-company-icon">
                      {application.company.charAt(0)}
                    </div>

                    <div className="professional-application-details">
                      <div className="professional-application-title-row">
                        <div>
                          <h3>{application.role}</h3>
                          <span>{application.company}</span>
                        </div>

                        <div
                          className={`professional-application-status ${application.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          <StatusIcon status={application.status} />
                          {application.status}
                        </div>
                      </div>

                      <div className="professional-application-meta">
                        <span>
                          <MapPin size={15} />
                          {application.location}
                        </span>
                        <span>
                          <BriefcaseBusiness size={15} />
                          {application.type}
                        </span>
                        <span>
                          <CalendarDays size={15} />
                          Applied {application.applied}
                        </span>
                      </div>

                      <div className="professional-application-bottom">
                        <strong>{application.salary}</strong>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedApplication(application)
                          }
                        >
                          View details <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="professional-applications-empty">
                  <div>
                    <Search size={26} />
                  </div>
                  <h3>No applications found</h3>
                  <p>
                    Try changing your search or selecting another status.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("All");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {selectedApplication && (
        <div
          className="professional-application-modal-overlay"
          onClick={() => setSelectedApplication(null)}
        >
          <section
            className="professional-application-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="professional-application-modal-close"
              onClick={() => setSelectedApplication(null)}
              aria-label="Close details"
            >
              <XCircle size={22} />
            </button>

            <span className="professional-applications-eyebrow">
              APPLICATION DETAILS
            </span>
            <h2>{selectedApplication.role}</h2>
            <p className="professional-application-modal-company">
              {selectedApplication.company}
            </p>

            <div
              className={`professional-application-status ${selectedApplication.status
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              <StatusIcon status={selectedApplication.status} />
              {selectedApplication.status}
            </div>

            <div className="professional-application-modal-info">
              <div>
                <MapPin size={17} />
                <span>{selectedApplication.location}</span>
              </div>
              <div>
                <BriefcaseBusiness size={17} />
                <span>{selectedApplication.type}</span>
              </div>
              <div>
                <CalendarDays size={17} />
                <span>Applied {selectedApplication.applied}</span>
              </div>
            </div>

            <div className="professional-application-modal-description">
              <h3>Job description</h3>
              <p>{selectedApplication.description}</p>
            </div>

            <div className="professional-application-modal-salary">
              <span>Expected salary</span>
              <strong>{selectedApplication.salary}</strong>
            </div>

            <button
              type="button"
              className="professional-application-modal-done"
              onClick={() => setSelectedApplication(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
