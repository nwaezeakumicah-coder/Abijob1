
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import "./saved-jobs.css";

type SavedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
};

const initialSavedJobs: SavedJob[] = [
  {
    id: "frontend-developer-aba",
    title: "Frontend Developer",
    company: "Digital Solutions",
    location: "Aba, Abia State",
    category: "Technology",
    type: "Full-time",
    salary: "₦150,000 – ₦250,000 / month",
    posted: "2 days ago",
    description:
      "Build and maintain responsive web interfaces while working with a growing digital team.",
  },
  {
    id: "fashion-designer-aba",
    title: "Fashion Designer",
    company: "Made in Aba Studio",
    location: "Ariaria, Aba",
    category: "Fashion & Creative",
    type: "Full-time",
    salary: "₦80,000 – ₦150,000 / month",
    posted: "3 days ago",
    description:
      "Create quality fashion pieces, develop designs and support daily studio production.",
  },
  {
    id: "customer-service-umuahia",
    title: "Customer Service Officer",
    company: "Business Hub",
    location: "Umuahia, Abia State",
    category: "Administration",
    type: "Full-time",
    salary: "₦90,000 – ₦130,000 / month",
    posted: "5 days ago",
    description:
      "Support customers, respond to enquiries and maintain a positive customer experience.",
  },
];

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState(initialSavedJobs);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [notice, setNotice] = useState("");

  const categories = [
    "All categories",
    ...Array.from(new Set(initialSavedJobs.map((job) => job.category))),
  ];

  const filteredJobs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return savedJobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);

      const matchesCategory =
        category === "All categories" || job.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [savedJobs, search, category]);

  const removeJob = (id: string) => {
    setSavedJobs((current) => current.filter((job) => job.id !== id));
    setNotice("Job removed from your saved list.");
    window.setTimeout(() => setNotice(""), 3000);
  };

  return (
    <>
      <Header />

      <main className="saved-jobs-page">
        <div className="saved-jobs-container">
          <section className="saved-jobs-hero">
            <div className="saved-jobs-hero-content">
              <span className="saved-jobs-eyebrow">
                YOUR CAREER SHORTLIST
              </span>

              <h1>
                Opportunities worth <span>remembering.</span>
              </h1>

              <p>
                Keep track of jobs that caught your attention. Come back,
                compare opportunities and take the next step when you're ready.
              </p>

              <div className="saved-jobs-hero-stats">
                <div>
                  <strong>{savedJobs.length}</strong>
                  <span>Saved opportunities</span>
                </div>
                <div className="saved-stat-divider" />
                <div>
                  <strong>Abia</strong>
                  <span>Your opportunity starts here</span>
                </div>
              </div>
            </div>

            <div className="saved-hero-visual" aria-hidden="true">
              <div className="saved-visual-circle saved-circle-one" />
              <div className="saved-visual-circle saved-circle-two" />
              <div className="saved-visual-card">
                <div className="saved-visual-icon">
                  <Bookmark size={30} />
                </div>
                <span className="saved-visual-small">YOUR SHORTLIST</span>
                <strong>Keep good opportunities close.</strong>
                <div className="saved-visual-lines">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="saved-visual-bottom">
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </section>

          <section className="saved-jobs-content">
            <div className="saved-jobs-section-heading">
              <div>
                <span className="saved-section-label">BOOKMARKED JOBS</span>
                <h2>Your saved opportunities</h2>
                <p>
                  {savedJobs.length}{" "}
                  {savedJobs.length === 1 ? "job" : "jobs"} in your shortlist
                </p>
              </div>

              <Link href="/jobs" className="browse-jobs-link">
                Explore more jobs
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="saved-jobs-toolbar">
              <div className="saved-search-box">
                <Search size={19} />
                <input
                  type="search"
                  placeholder="Search saved jobs, companies or locations..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search saved jobs"
                />
              </div>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter by category"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {notice && <div className="saved-jobs-notice">{notice}</div>}

            {filteredJobs.length > 0 ? (
              <div className="saved-jobs-list">
                {filteredJobs.map((job) => (
                  <article className="saved-job-card" key={job.id}>
                    <div className="saved-job-main">
                      <div className="saved-job-company-icon">
                        <Building2 size={24} />
                      </div>

                      <div className="saved-job-information">
                        <div className="saved-job-topline">
                          <span className="saved-job-category">
                            {job.category}
                          </span>
                          <span className="saved-job-posted">
                            <Clock3 size={13} />
                            {job.posted}
                          </span>
                        </div>

                        <h3>
                          <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                        </h3>

                        <p className="saved-job-company">{job.company}</p>

                        <p className="saved-job-description">
                          {job.description}
                        </p>

                        <div className="saved-job-meta">
                          <span>
                            <MapPin size={15} />
                            {job.location}
                          </span>
                          <span>
                            <BriefcaseBusiness size={15} />
                            {job.type}
                          </span>
                          <span>
                            <CalendarDays size={15} />
                            {job.salary}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="saved-job-actions">
                      <button
                        type="button"
                        className="remove-saved-job"
                        onClick={() => removeJob(job.id)}
                        aria-label={`Remove ${job.title} from saved jobs`}
                        title="Remove saved job"
                      >
                        <Trash2 size={17} />
                      </button>

                      <Link
                        href={`/jobs/${job.id}`}
                        className="saved-job-details-btn"
                      >
                        View opportunity
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="saved-jobs-empty">
                <div className="saved-empty-icon">
                  <Bookmark size={30} />
                </div>

                <h3>
                  {savedJobs.length === 0
                    ? "Your shortlist is empty"
                    : "No matching jobs found"}
                </h3>

                <p>
                  {savedJobs.length === 0
                    ? "When you save an opportunity, it will appear here so you can easily find it again."
                    : "Try another search term or choose a different category."}
                </p>

                <Link href="/jobs" className="saved-empty-btn">
                  Discover opportunities
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </section>

          <section className="saved-jobs-tip">
            <div className="saved-tip-icon">
              <Bookmark size={21} />
            </div>
            <div>
              <h3>A little reminder</h3>
              <p>
                Saving a job helps you keep track of it, but it doesn't submit
                an application. Open the opportunity when you're ready to apply.
              </p>
            </div>
            <Link href="/jobs">Find opportunities</Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
