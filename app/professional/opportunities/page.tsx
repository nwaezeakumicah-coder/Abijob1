
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "../../../components/Logo";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Wallet,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  Settings,
  FileText,
  GraduationCap,
  X,
  Send,
} from "lucide-react";
import "./opportunities.css";

type Opportunity = {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  salary: string;
  posted: string;
  deadline: string;
  description: string;
  skills: string[];
  featured: boolean;
  match: number;
};

type Application = {
  id: number;
  jobId: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  appliedAt: string;
  status: string;
};

const SAVED_JOBS_KEY = "abijob-professional-saved-jobs";
const APPLICATIONS_KEY = "abijob-professional-applications";

const opportunities: Opportunity[] = [
  {
    id: 1,
    title: "Graphic Designer",
    company: "Creative House Media",
    location: "Aba, Abia State",
    type: "Full-time",
    category: "Design & Creative",
    salary: "₦120,000 – ₦180,000",
    posted: "2 days ago",
    deadline: "Nov 15, 2026",
    description:
      "We are looking for a creative graphic designer to produce marketing materials, brand identities and engaging visual content.",
    skills: ["CorelDRAW", "Photoshop", "Branding"],
    featured: true,
    match: 96,
  },
  {
    id: 2,
    title: "Junior Frontend Developer",
    company: "Digital Solutions NG",
    location: "Umuahia, Abia State",
    type: "Full-time",
    category: "Technology",
    salary: "₦150,000 – ₦220,000",
    posted: "3 days ago",
    deadline: "Nov 20, 2026",
    description:
      "Join our development team to build responsive websites and modern digital products for local businesses.",
    skills: ["HTML", "CSS", "JavaScript"],
    featured: false,
    match: 91,
  },
  {
    id: 3,
    title: "Brand Identity Designer",
    company: "Made in Aba Studio",
    location: "Ariaria, Aba",
    type: "Contract",
    category: "Design & Creative",
    salary: "₦80,000 – ₦150,000",
    posted: "4 days ago",
    deadline: "Nov 12, 2026",
    description:
      "Create brand identities, logo systems and marketing designs for growing fashion and retail businesses.",
    skills: ["Logo Design", "CorelDRAW", "Typography"],
    featured: true,
    match: 94,
  },
  {
    id: 4,
    title: "Social Media Designer",
    company: "GrowthPoint Agency",
    location: "Remote",
    type: "Remote",
    category: "Design & Creative",
    salary: "₦70,000 – ₦110,000",
    posted: "5 days ago",
    deadline: "Nov 18, 2026",
    description:
      "Design social media graphics and campaign materials for brands across different industries.",
    skills: ["Social Media", "Canva", "Graphic Design"],
    featured: false,
    match: 88,
  },
  {
    id: 5,
    title: "Website Design Assistant",
    company: "Abia Business Hub",
    location: "Aba, Abia State",
    type: "Part-time",
    category: "Technology",
    salary: "₦60,000 – ₦90,000",
    posted: "1 week ago",
    deadline: "Nov 25, 2026",
    description:
      "Assist with website layouts, content updates and basic website maintenance for small businesses.",
    skills: ["HTML", "CSS", "Figma"],
    featured: false,
    match: 85,
  },
];

const categories = [
  "All categories",
  "Design & Creative",
  "Technology",
  "Business & Administration",
  "Marketing",
  "Skilled Trades",
];

export default function ProfessionalOpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [jobType, setJobType] = useState("All types");
  const [sort, setSort] = useState("Best match");
  const [savedJobs, setSavedJobs] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Opportunity | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const storedSavedJobs = localStorage.getItem(SAVED_JOBS_KEY);
      const storedApplications = localStorage.getItem(APPLICATIONS_KEY);

      if (storedSavedJobs) {
        setSavedJobs(JSON.parse(storedSavedJobs));
      }

      if (storedApplications) {
        setApplications(JSON.parse(storedApplications));
      }
    } catch {
      console.error("Unable to load saved opportunities or applications.");
    }
  }, []);

  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter((job) => {
      const term = search.toLowerCase().trim();

      const matchesSearch =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.skills.some((skill) => skill.toLowerCase().includes(term));

      const matchesCategory =
        category === "All categories" || job.category === category;

      const matchesType =
        jobType === "All types" || job.type === jobType;

      return matchesSearch && matchesCategory && matchesType;
    });

    if (sort === "Best match") {
      result = [...result].sort((a, b) => b.match - a.match);
    } else if (sort === "Newest first") {
      result = [...result].sort((a, b) => a.id - b.id);
    }

    return result;
  }, [search, category, jobType, sort]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function toggleSaved(job: Opportunity) {
    const alreadySaved = savedJobs.some((savedJob) => savedJob.id === job.id);

    const updatedJobs = alreadySaved
      ? savedJobs.filter((savedJob) => savedJob.id !== job.id)
      : [...savedJobs, job];

    try {
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updatedJobs));
      setSavedJobs(updatedJobs);

      showNotice(
        alreadySaved
          ? "Opportunity removed from your saved list."
          : "Opportunity saved successfully."
      );
    } catch {
      showNotice("Unable to update saved opportunities.");
    }
  }

  function applyForJob(job: Opportunity) {
    const alreadyApplied = applications.some(
      (application) => application.jobId === job.id
    );

    if (alreadyApplied) {
      showNotice("You have already applied for this opportunity.");
      return;
    }

    const newApplication: Application = {
      id: Date.now(),
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary,
      appliedAt: new Date().toISOString(),
      status: "Under review",
    };

    const updatedApplications = [...applications, newApplication];

    try {
      localStorage.setItem(
        APPLICATIONS_KEY,
        JSON.stringify(updatedApplications)
      );

      setApplications(updatedApplications);
      setSelectedJob(null);

      showNotice("Your application has been submitted successfully.");
    } catch {
      showNotice("Unable to submit your application. Please try again.");
    }
  }

  function clearFilters() {
    setSearch("");
    setCategory("All categories");
    setJobType("All types");
  }

  return (
    <div className="po-page">
      <aside className="po-sidebar">
        <div className="po-brand">
          <Logo size="medium" light />
        </div>

        <p className="po-sidebar-label">Professional workspace</p>

        <nav className="po-nav">
          <Link href="/professional/dashboard">
            <LayoutDashboard size={18} /> Dashboard
          </Link>

          <Link href="/professional/opportunities" className="active">
            <BriefcaseBusiness size={18} /> Opportunities
          </Link>

          <Link href="/professional/saved">
            <Bookmark size={18} /> Saved opportunities
          </Link>

          <Link href="/professional/applications">
            <FileText size={18} /> My applications
          </Link>

          <Link href="/professional/profile">
            <UserRound size={18} /> My profile
          </Link>

          <Link href="/professional/experience">
            <GraduationCap size={18} /> Experience
          </Link>

          <Link href="/professional/messages">
            <Activity size={18} /> Messages
          </Link>

          <Link href="/professional/notifications">
            <Bell size={18} /> Notifications
          </Link>

          <Link href="/professional/settings">
            <Settings size={18} /> Settings
          </Link>
        </nav>

        <div className="po-sidebar-bottom">
          <div className="po-help-card">
            <div className="po-help-icon">
              <Sparkles size={18} />
            </div>
            <h4>Grow your career</h4>
            <p>
              Keep your profile updated to improve your opportunity matches.
            </p>
            <Link href="/professional/profile">
              Complete profile <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </aside>

      <main className="po-main">
        <header className="po-topbar">
          <div className="po-breadcrumb">
            Professional workspace <ChevronRight size={13} />
            <strong>Opportunities</strong>
          </div>

          <div className="po-topbar-right">
            <Link
              href="/professional/notifications"
              className="po-icon-button"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </Link>

            <div className="po-user">
              <div className="po-user-avatar">MN</div>
              <div className="po-user-info">
                <strong>Micah Nwaezeaku</strong>
                <span>Professional account</span>
              </div>
            </div>
          </div>
        </header>

        <div className="po-content">
          <section className="po-heading">
            <div>
              <span className="po-eyebrow">
                <Sparkles size={14} /> YOUR NEXT OPPORTUNITY STARTS HERE
              </span>
              <h1>Find your next opportunity</h1>
              <p>
                Discover jobs, contracts and projects that match your skills
                and professional interests.
              </p>
            </div>
          </section>

          {notice && (
            <div
              role="status"
              style={{
                padding: "13px 16px",
                marginBottom: "18px",
                borderRadius: "10px",
                background: "#e7f2e9",
                color: "#176b45",
                display: "flex",
                alignItems: "center",
                gap: "9px",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}

          <section className="po-search-panel">
            <div className="po-search-field">
              <Search size={19} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job title, company or skill..."
              />
            </div>

            <div className="po-search-divider" />

            <div className="po-category-field">
              <BriefcaseBusiness size={17} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>

            <button
              className="po-search-button"
              type="button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Search size={16} /> Find opportunities
            </button>
          </section>

          {showFilters && (
            <section className="po-extra-filters">
              <div>
                <label htmlFor="po-job-type">Opportunity type</label>
                <select
                  id="po-job-type"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                >
                  <option>All types</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Remote</option>
                </select>
              </div>

              <button
                className="po-clear-filter"
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </section>
          )}

          <section className="po-stats">
            <div className="po-stat-card">
              <div className="po-stat-icon green">
                <BriefcaseBusiness size={19} />
              </div>
              <div>
                <strong>{opportunities.length}</strong>
                <span>Available in this preview</span>
              </div>
            </div>

            <div className="po-stat-card">
              <div className="po-stat-icon orange">
                <Bookmark size={19} />
              </div>
              <div>
                <strong>{savedJobs.length}</strong>
                <span>Saved opportunities</span>
              </div>
            </div>

            <div className="po-stat-card">
              <div className="po-stat-icon purple">
                <Activity size={19} />
              </div>
              <div>
                <strong>{applications.length}</strong>
                <span>Applications submitted</span>
              </div>
            </div>
          </section>

          <section className="po-results-section">
            <div className="po-results-heading">
              <div>
                <h2>Recommended opportunities</h2>
                <p>
                  Opportunities selected based on your professional profile.
                </p>
              </div>

              <div className="po-sort">
                <SlidersHorizontal size={15} />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option>Best match</option>
                  <option>Newest first</option>
                </select>
              </div>
            </div>

            <div className="po-results-layout">
              <div className="po-job-list">
                {filteredOpportunities.length === 0 ? (
                  <div className="po-empty">
                    <Search size={28} />
                    <h3>No opportunities found</h3>
                    <p>Try changing your search or filters.</p>
                    <button type="button" onClick={clearFilters}>
                      Clear search
                    </button>
                  </div>
                ) : (
                  filteredOpportunities.map((job) => {
                    const isSaved = savedJobs.some(
                      (savedJob) => savedJob.id === job.id
                    );

                    const hasApplied = applications.some(
                      (application) => application.jobId === job.id
                    );

                    return (
                      <article className="po-job-card" key={job.id}>
                        <div className="po-job-top">
                          <div className="po-company-logo">
                            <Building2 size={23} />
                          </div>

                          <div className="po-job-heading">
                            <div className="po-job-title-row">
                              <h3>{job.title}</h3>
                              {job.featured && (
                                <span className="po-featured">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p>{job.company}</p>
                          </div>

                          <button
                            className={`po-bookmark ${
                              isSaved ? "saved" : ""
                            }`}
                            type="button"
                            onClick={() => toggleSaved(job)}
                            aria-label={
                              isSaved
                                ? "Remove saved opportunity"
                                : "Save opportunity"
                            }
                          >
                            {isSaved ? (
                              <BookmarkCheck size={19} />
                            ) : (
                              <Bookmark size={19} />
                            )}
                          </button>
                        </div>

                        <div className="po-job-meta">
                          <span>
                            <MapPin size={14} /> {job.location}
                          </span>
                          <span>
                            <Clock3 size={14} /> {job.type}
                          </span>
                          <span>
                            <Wallet size={14} /> {job.salary}
                          </span>
                        </div>

                        <p className="po-job-description">
                          {job.description}
                        </p>

                        <div className="po-job-skills">
                          {job.skills.map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>

                        <div className="po-job-footer">
                          <div className="po-job-posted">
                            <span>Posted {job.posted}</span>
                            <span>
                              <CalendarDays size={13} /> Deadline:{" "}
                              {job.deadline}
                            </span>
                          </div>

                          <div className="po-job-actions">
                            <span className="po-match">
                              <CheckCircle2 size={13} /> {job.match}% match
                            </span>

                            <button
                              className="po-apply-button"
                              type="button"
                              onClick={() => setSelectedJob(job)}
                            >
                              View opportunity <ArrowUpRight size={15} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <aside className="po-right-column">
                <div className="po-side-card po-match-card">
                  <div className="po-side-card-icon">
                    <Sparkles size={19} />
                  </div>
                  <h3>Your opportunity match</h3>
                  <p>
                    Your profile is matching well with available opportunities.
                  </p>
                  <div className="po-match-progress">
                    <div>
                      <span style={{ width: "86%" }} />
                    </div>
                    <strong>86%</strong>
                  </div>
                  <Link href="/professional/profile">
                    Improve your profile <ArrowUpRight size={14} />
                  </Link>
                </div>

                <div className="po-side-card">
                  <h3>Popular categories</h3>
                  <div className="po-category-list">
                    {[
                      ["Design & Creative", "18 opportunities"],
                      ["Technology", "14 opportunities"],
                      ["Marketing", "9 opportunities"],
                      ["Skilled Trades", "12 opportunities"],
                    ].map(([name, count]) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setCategory(name)}
                        className={category === name ? "selected" : ""}
                      >
                        <span>{name}</span>
                        <small>{count}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="po-side-card po-tip-card">
                  <div className="po-tip-icon">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3>Career tip</h3>
                  <p>
                    Add relevant skills and portfolio samples to your profile.
                    Employers are more likely to notice a detailed professional
                    profile.
                  </p>
                  <Link href="/professional/profile">
                    Update my profile <ChevronRight size={14} />
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>

      {selectedJob && (
        <div
          role="presentation"
          onClick={() => setSelectedJob(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10, 25, 17, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="po-detail-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "18px",
              padding: "28px",
              color: "#17251d",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "15px",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#176b45",
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  Opportunity details
                </span>
                <h2
                  id="po-detail-title"
                  style={{ margin: "8px 0", fontSize: "25px" }}
                >
                  {selectedJob.title}
                </h2>
                <p style={{ margin: 0, color: "#68756c" }}>
                  {selectedJob.company}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                aria-label="Close opportunity details"
                style={{
                  border: 0,
                  background: "#f1f4f1",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "15px",
                margin: "22px 0",
                color: "#536258",
                fontSize: "14px",
              }}
            >
              <span><MapPin size={15} /> {selectedJob.location}</span>
              <span><Clock3 size={15} /> {selectedJob.type}</span>
              <span><Wallet size={15} /> {selectedJob.salary}</span>
            </div>

            <div style={{ borderTop: "1px solid #e5eae4", paddingTop: "20px" }}>
              <h3>About this opportunity</h3>
              <p style={{ lineHeight: 1.7, color: "#536258" }}>
                {selectedJob.description}
              </p>

              <h3 style={{ marginTop: "22px" }}>Required skills</h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {selectedJob.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: "#e7f2e9",
                      color: "#176b45",
                      padding: "7px 11px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div
                style={{
                  background: "#f7f8f3",
                  borderRadius: "12px",
                  padding: "16px",
                  marginTop: "22px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div>
                  <small style={{ color: "#68756c" }}>Application deadline</small>
                  <strong style={{ display: "block", marginTop: "5px" }}>
                    {selectedJob.deadline}
                  </strong>
                </div>
                <div>
                  <small style={{ color: "#68756c" }}>Your match</small>
                  <strong style={{ display: "block", marginTop: "5px" }}>
                    {selectedJob.match}%
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                className="po-apply-button"
                onClick={() => applyForJob(selectedJob)}
                disabled={applications.some(
                  (application) => application.jobId === selectedJob.id
                )}
                style={{
                  opacity: applications.some(
                    (application) => application.jobId === selectedJob.id
                  )
                    ? 0.6
                    : 1,
                  cursor: applications.some(
                    (application) => application.jobId === selectedJob.id
                  )
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {applications.some(
                  (application) => application.jobId === selectedJob.id
                ) ? (
                  <>
                    <CheckCircle2 size={16} /> Already applied
                  </>
                ) : (
                  <>
                    <Send size={16} /> Apply for this opportunity
                  </>
                )}
              </button>

              <button
                type="button"
                className="po-clear-filter"
                onClick={() => toggleSaved(selectedJob)}
              >
                {savedJobs.some(
                  (job) => job.id === selectedJob.id
                ) ? (
                  <>
                    <BookmarkCheck size={16} /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark size={16} /> Save opportunity
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
