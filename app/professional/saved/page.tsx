
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Logo from "../../../components/Logo";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Trash2,
  X,
} from "lucide-react";
import "./saved.css";

const SAVED_JOBS_KEY = "abijob-professional-saved-jobs";

type SavedJob = {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  category: string;
  posted: string;
  description: string;
  initials: string;
  skills?: string[];
  deadline?: string;
};

export default function ProfessionalSavedPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const jobTypes = ["All", "Full-time", "Part-time", "Remote", "Contract"];

  useEffect(() => {
    try {
      const storedJobs = localStorage.getItem(SAVED_JOBS_KEY);

      if (storedJobs) {
        const parsedJobs = JSON.parse(storedJobs);

        if (Array.isArray(parsedJobs)) {
          setSavedJobs(
            parsedJobs.map((job) => ({
              ...job,
              initials:
                job.initials ||
                job.company
                  ?.split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ||
                "CO",
              category: job.category || "General",
              posted: job.posted || "Recently posted",
            }))
          );
        }
      }
    } catch {
      console.error("Unable to load saved opportunities.");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const filteredJobs = useMemo(() => {
    return savedJobs.filter((job) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query) ||
        job.skills?.some((skill) =>
          skill.toLowerCase().includes(query)
        );

      const matchesType =
        activeType === "All" || job.type === activeType;

      return matchesSearch && matchesType;
    });
  }, [savedJobs, searchQuery, activeType]);

  const removeSavedJob = (id: number) => {
    const updatedJobs = savedJobs.filter((job) => job.id !== id);

    try {
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updatedJobs));
      setSavedJobs(updatedJobs);
      setConfirmRemove(null);

      if (selectedJob?.id === id) {
        setSelectedJob(null);
      }
    } catch {
      alert("Unable to remove this opportunity. Please try again.");
    }
  };

  return (
    <main className="professional-saved">
      <aside className="professional-saved-sidebar">
        <div className="professional-saved-brand">
          <Logo href="/" light />
        </div>

        <div className="professional-saved-nav-label">WORKSPACE</div>

        <nav className="professional-saved-nav">
          <Link href="/professional/dashboard">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/professional/opportunities">
            <Search size={19} />
            <span>Find opportunities</span>
          </Link>

          <Link href="/professional/applications">
            <CalendarDays size={19} />
            <span>My applications</span>
          </Link>

          <Link href="/professional/saved" className="active">
            <Bookmark size={19} />
            <span>Saved opportunities</span>
            <span className="professional-saved-nav-count">
              {savedJobs.length}
            </span>
          </Link>

          <Link href="/professional/experience">
            <BriefcaseBusiness size={19} />
            <span>Experience</span>
          </Link>

          <Link href="/professional/messages">
            <BriefcaseBusiness size={19} />
            <span>Messages</span>
          </Link>

          <Link href="/professional/notifications">
            <Clock3 size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="professional-saved-sidebar-bottom">
          <div className="professional-saved-tip">
            <div className="professional-saved-tip-icon">
              <Bookmark size={20} />
            </div>
            <strong>Keep opportunities close</strong>
            <p>
              Save interesting jobs and come back when you are ready to apply.
            </p>
            <Link href="/professional/opportunities">
              Explore jobs <ArrowRight size={15} />
            </Link>
          </div>

          <Link
            href="/professional/profile"
            className="professional-saved-profile"
          >
            <div className="professional-saved-avatar">MN</div>
            <div>
              <strong>My profile</strong>
              <span>Professional account</span>
            </div>
          </Link>
        </div>
      </aside>

      <section className="professional-saved-main">
        <header className="professional-saved-topbar">
          <div>
            <span>PROFESSIONAL WORKSPACE</span>
            <h2>Saved opportunities</h2>
          </div>

          <div className="professional-saved-top-actions">
            <Link href="/professional/messages" aria-label="Messages">
              <BriefcaseBusiness size={19} />
            </Link>
            <Link
              href="/professional/notifications"
              aria-label="Notifications"
            >
              <Clock3 size={19} />
            </Link>
            <Link
              href="/professional/profile"
              className="professional-saved-top-avatar"
            >
              MN
            </Link>
          </div>
        </header>

        <div className="professional-saved-content">
          <div className="professional-saved-heading">
            <div>
              <span className="professional-saved-eyebrow">
                YOUR BOOKMARKS
              </span>
              <h1>Opportunities worth keeping.</h1>
              <p>
                All the jobs and professional opportunities you have saved,
                organised in one place.
              </p>
            </div>

            <Link
              href="/professional/opportunities"
              className="professional-saved-explore-button"
            >
              Find more opportunities <ArrowRight size={17} />
            </Link>
          </div>

          <div className="professional-saved-summary">
            <div className="professional-saved-summary-icon">
              <Bookmark size={23} />
            </div>
            <div>
              <span>Saved opportunities</span>
              <strong>{isLoaded ? savedJobs.length : "—"}</strong>
            </div>
            <p>
              {!isLoaded
                ? "Loading your saved opportunities..."
                : savedJobs.length === 1
                  ? "You have one opportunity saved."
                  : `You have ${savedJobs.length} opportunities saved for later.`}
            </p>
          </div>

          <section className="professional-saved-list-section">
            <div className="professional-saved-list-heading">
              <div>
                <h2>Your saved jobs</h2>
                <p>Find and revisit opportunities you are interested in.</p>
              </div>
              <span>{filteredJobs.length} results</span>
            </div>

            <div className="professional-saved-toolbar">
              <div className="professional-saved-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search title, company, location..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="professional-saved-type-filters">
                {jobTypes.map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={activeType === type ? "active" : ""}
                    onClick={() => setActiveType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {!isLoaded ? (
              <div className="professional-saved-empty">
                <div>
                  <Bookmark size={28} />
                </div>
                <h3>Loading saved opportunities</h3>
                <p>Please wait while we retrieve your saved list.</p>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="professional-saved-grid">
                {filteredJobs.map((job) => (
                  <article className="professional-saved-card" key={job.id}>
                    <div className="professional-saved-card-top">
                      <div className="professional-saved-company-icon">
                        {job.initials}
                      </div>

                      <button
                        type="button"
                        className="professional-saved-remove"
                        onClick={() => setConfirmRemove(job.id)}
                        aria-label={`Remove ${job.title} from saved jobs`}
                        title="Remove saved job"
                      >
                        <Bookmark size={18} fill="currentColor" />
                      </button>
                    </div>

                    <span className="professional-saved-category">
                      {job.category}
                    </span>

                    <h3>{job.title}</h3>
                    <p className="professional-saved-company">
                      {job.company}
                    </p>

                    <div className="professional-saved-job-meta">
                      <span>
                        <MapPin size={14} />
                        {job.location}
                      </span>
                      <span>
                        <BriefcaseBusiness size={14} />
                        {job.type}
                      </span>
                      <span>
                        <Clock3 size={14} />
                        {job.posted}
                      </span>
                    </div>

                    <div className="professional-saved-card-bottom">
                      <div>
                        <span>Salary</span>
                        <strong>{job.salary}</strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedJob(job)}
                      >
                        View details <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="professional-saved-empty">
                <div>
                  <Bookmark size={28} />
                </div>
                <h3>
                  {savedJobs.length === 0
                    ? "No saved opportunities yet"
                    : "No matching opportunities"}
                </h3>
                <p>
                  {savedJobs.length === 0
                    ? "When you find an interesting opportunity, save it to keep it here."
                    : "Try another search term or change your job type filter."}
                </p>
                <Link href="/professional/opportunities">
                  Explore opportunities <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </section>
        </div>
      </section>

      {selectedJob && (
        <div
          className="professional-saved-modal-overlay"
          onClick={() => setSelectedJob(null)}
        >
          <section
            className="professional-saved-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="professional-saved-modal-close"
              onClick={() => setSelectedJob(null)}
              aria-label="Close details"
            >
              <X size={21} />
            </button>

            <span className="professional-saved-eyebrow">
              SAVED OPPORTUNITY
            </span>
            <h2>{selectedJob.title}</h2>
            <p className="professional-saved-modal-company">
              {selectedJob.company}
            </p>

            <div className="professional-saved-modal-meta">
              <span>
                <MapPin size={16} />
                {selectedJob.location}
              </span>
              <span>
                <BriefcaseBusiness size={16} />
                {selectedJob.type}
              </span>
              <span>
                <Clock3 size={16} />
                Posted {selectedJob.posted}
              </span>
            </div>

            <div className="professional-saved-modal-description">
              <h3>About this opportunity</h3>
              <p>{selectedJob.description}</p>

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <>
                  <h3>Required skills</h3>
                  <p>{selectedJob.skills.join(", ")}</p>
                </>
              )}
            </div>

            <div className="professional-saved-modal-salary">
              <span>Salary range</span>
              <strong>{selectedJob.salary}</strong>
            </div>

            <Link
              href="/professional/opportunities"
              className="professional-saved-apply-button"
            >
              Find and apply for this job <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      )}

      {confirmRemove !== null && (
        <div
          className="professional-saved-confirm-overlay"
          onClick={() => setConfirmRemove(null)}
        >
          <section
            className="professional-saved-confirm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="professional-saved-confirm-icon">
              <Trash2 size={22} />
            </div>
            <h3>Remove saved opportunity?</h3>
            <p>
              This opportunity will be removed from your saved list. You can
              save it again if you find it later.
            </p>
            <div>
              <button
                type="button"
                className="professional-saved-cancel"
                onClick={() => setConfirmRemove(null)}
              >
                Keep saved
              </button>
              <button
                type="button"
                className="professional-saved-delete"
                onClick={() => removeSavedJob(confirmRemove)}
              >
                Remove
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
