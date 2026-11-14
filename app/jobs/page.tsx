
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Clock3,
  Bookmark,
  Building2,
  X,
  Share2,
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import "./jobs.css";

type DatabaseJob = {
  id: string;
  employer_id: string;
  title: string;
  category: string | null;
  location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  skills_required: string[] | null;
  application_deadline: string | null;
  created_at: string;
  status: string;
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  type: string;
  salary: string;
  posted: string;
  daysAgo: number;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  skills: string[];
  deadline: string | null;
};

type FeedTab = "For You" | "Latest" | "Saved";

const locations = [
  "All Abia",
  "Aba",
  "Umuahia",
  "Osisioma",
  "Arochukwu",
];

const categories = [
  "All categories",
  "Technology",
  "Fashion & Design",
  "Administration",
  "Beauty & Personal Care",
  "Media & Marketing",
  "Hospitality",
  "Creative & Design",
  "Sales",
];

const employmentTypes = [
  "All types",
  "Full-time",
  "Part-time",
  "Contract",
];

function formatEmploymentType(value: string | null) {
  if (!value) return "Not specified";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatSalary(
  minimum: number | null,
  maximum: number | null,
  currency: string | null
) {
  if (minimum === null && maximum === null) {
    return "Salary not specified";
  }

  const currencyCode = currency || "NGN";

  const formatter = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  });

  const formatAmount = (amount: number) => {
    if (currencyCode.toUpperCase() === "NGN") {
      return `₦${formatter.format(amount)}`;
    }

    return `${currencyCode} ${formatter.format(amount)}`;
  };

  if (minimum !== null && maximum !== null) {
    return `${formatAmount(minimum)} – ${formatAmount(maximum)}`;
  }

  if (minimum !== null) {
    return `From ${formatAmount(minimum)}`;
  }

  return `Up to ${formatAmount(maximum as number)}`;
}

function formatPostedDate(date: string) {
  const created = new Date(date);

  if (Number.isNaN(created.getTime())) {
    return "Recently posted";
  }

  const now = new Date();

  const difference = Math.max(
    0,
    Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  if (difference === 0) return "Today";
  if (difference === 1) return "1 day ago";
  if (difference < 7) return `${difference} days ago`;
  if (difference < 14) return "1 week ago";

  return created.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysAgo(date: string) {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return 0;

  return Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
    )
  );
}

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isDeadlineExpired(deadline: string | null) {
  if (!deadline) return false;

  // Database deadline is a date-only value.
  return deadline < getLocalDateString();
}

export default function JobsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Abia");
  const [category, setCategory] = useState("All categories");
  const [employmentType, setEmploymentType] = useState("All types");
  const [activeTab, setActiveTab] = useState<FeedTab>("For You");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [savingJobIds, setSavingJobIds] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSavedJobs() {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab?.toLowerCase() === "saved") setActiveTab("Saved");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setCurrentUserId(null);
        setSavedJobs([]);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error: savedJobsError } = await supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("user_id", user.id);

      if (!active) return;

      if (savedJobsError) {
        console.error("Saved jobs could not be loaded:", savedJobsError);
        setShareMessage("Your saved jobs could not be loaded. Please refresh.");
        return;
      }

      setSavedJobs((data ?? []).map((row) => row.job_id));
    }

    void loadSavedJobs();

    return () => {
      active = false;
    };
  }, [supabase]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Use the actual database column: salary_currency.
      const { data, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          id,
          employer_id,
          title,
          category,
          location,
          employment_type,
          salary_min,
          salary_max,
          salary_currency,
          description,
          requirements,
          responsibilities,
          benefits,
          skills_required,
          application_deadline,
          created_at,
          status
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (jobsError) {
        throw jobsError;
      }

      const databaseJobs = ((data || []) as DatabaseJob[]).filter(
        (job) => !isDeadlineExpired(job.application_deadline)
      );

      // jobs.employer_id references profiles.id.
      // Use the confirmed relationship rather than assuming an
      // unverified employer_profiles table structure.
      const employerIds = [
        ...new Set(databaseJobs.map((job) => job.employer_id)),
      ];

      let companyNames: Record<string, string> = {};

      if (employerIds.length > 0) {
        const { data: employerProfiles, error: employerError } =
          await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", employerIds);

        if (employerError) {
          console.warn(
            "Employer names could not be loaded:",
            employerError.message
          );
        } else if (employerProfiles) {
          companyNames = Object.fromEntries(
            employerProfiles.map((profile) => [
              profile.id,
              profile.full_name || "Abi Job Employer",
            ])
          );
        }
      }

      const formattedJobs: Job[] = databaseJobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: companyNames[job.employer_id] || "Abi Job Employer",
        location: job.location || "Location not specified",
        category: job.category || "General",
        type: formatEmploymentType(job.employment_type),
        salary: formatSalary(
          job.salary_min,
          job.salary_max,
          job.salary_currency
        ),
        posted: formatPostedDate(job.created_at),
        daysAgo: getDaysAgo(job.created_at),
        description: job.description || "No job description provided.",
        requirements: job.requirements || "",
        responsibilities: job.responsibilities || "",
        benefits: job.benefits || "",
        skills: job.skills_required || [],
        deadline: job.application_deadline,
      }));

      setJobs(formattedJobs);
    } catch (err) {
      console.error("Jobs loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "We could not load job opportunities. Please try again."
      );

      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.skills.some((skill) =>
          skill.toLowerCase().includes(query)
        );

      const matchesLocation =
        location === "All Abia" ||
        job.location.toLowerCase().includes(location.toLowerCase());

      const matchesCategory =
        category === "All categories" ||
        job.category === category;

      const matchesType =
        employmentType === "All types" ||
        job.type.toLowerCase() === employmentType.toLowerCase();

      const matchesSaved =
        activeTab !== "Saved" || savedJobs.includes(job.id);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesType &&
        matchesSaved
      );
    });

    if (activeTab === "Latest") {
      result = [...result].sort((a, b) => a.daysAgo - b.daysAgo);
    }

    return result;
  }, [
    jobs,
    search,
    location,
    category,
    employmentType,
    activeTab,
    savedJobs,
  ]);

  async function toggleSaved(id: string) {
    if (!currentUserId) {
      window.location.assign(
        `/login?redirect=${encodeURIComponent("/jobs")}`
      );
      return;
    }

    if (savingJobIds.includes(id)) return;

    const isSaved = savedJobs.includes(id);
    setSavingJobIds((current) => [...current, id]);

    try {
      const result = isSaved
        ? await supabase
            .from("saved_jobs")
            .delete()
            .eq("user_id", currentUserId)
            .eq("job_id", id)
        : await supabase
            .from("saved_jobs")
            .insert({ user_id: currentUserId, job_id: id });

      if (result.error) throw result.error;

      setSavedJobs((current) =>
        isSaved
          ? current.filter((jobId) => jobId !== id)
          : [...current, id]
      );
      setShareMessage(isSaved ? "Job removed from your saved list." : "Job saved to your account.");
      window.setTimeout(() => setShareMessage(""), 3000);
    } catch (saveError) {
      console.error("Saved job update failed:", saveError);
      setShareMessage(
        saveError instanceof Error
          ? saveError.message
          : "This job could not be saved. Please try again."
      );
      window.setTimeout(() => setShareMessage(""), 4000);
    } finally {
      setSavingJobIds((current) => current.filter((jobId) => jobId !== id));
    }
  }

  function clearFilters() {
    setSearch("");
    setLocation("All Abia");
    setCategory("All categories");
    setEmploymentType("All types");
  }

  async function shareJob(job: Job) {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/jobs/${job.id}`
        : "/jobs";

    const shareText = `${job.title} at ${job.company} - ${job.location}. Discover opportunities on Abi Job.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job.title} | Abi Job`,
          text: shareText,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${shareText} ${shareUrl}`
        );

        setShareMessage("Job information copied to clipboard.");
        window.setTimeout(() => setShareMessage(""), 3000);
      } else {
        setShareMessage("Sharing is not supported by this browser.");
        window.setTimeout(() => setShareMessage(""), 3000);
      }
    } catch (shareError) {
      if (
        shareError instanceof Error &&
        shareError.name !== "AbortError"
      ) {
        setShareMessage("Unable to share this opportunity.");
        window.setTimeout(() => setShareMessage(""), 3000);
      }
    }
  }

  function selectTab(tab: FeedTab) {
    setActiveTab(tab);

    if (tab === "Saved") {
      setSearch("");
    }
  }

  return (
    <>
      <Header />

      <main className="jobs-feed-page">
        <div className="jobs-feed-container">
          <section className="jobs-feed-intro">
            <div>
              <span className="jobs-feed-eyebrow">
                ABI JOB OPPORTUNITY FEED
              </span>

              <h1>
                Discover your
                <span> next opportunity.</span>
              </h1>

              <p>
                Explore jobs, discover employers and find opportunities
                that match your skills across Abia State.
              </p>
            </div>

            <Link
              href="/register/job-seeker"
              className="jobs-create-profile"
            >
              Create your profile
              <ArrowUpRight size={17} />
            </Link>
          </section>

          <section className="jobs-feed-controls">
            <div
              className="jobs-feed-tabs"
              role="tablist"
              aria-label="Opportunity feed"
            >
              {(["For You", "Latest", "Saved"] as FeedTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={activeTab === tab ? "active" : ""}
                    onClick={() => selectTab(tab)}
                  >
                    {tab === "Saved" && <Bookmark size={16} />}
                    {tab}

                    {tab === "Saved" && (
                      <span className="jobs-saved-count">
                        {savedJobs.length}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>

            <div className="jobs-feed-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Search jobs, skills or employers..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search opportunities"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="jobs-filter-toggle"
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={17} />
              Filters
            </button>
          </section>

          {showFilters && (
            <section className="jobs-feed-filter-panel">
              <div>
                <label htmlFor="feed-location">Location</label>
                <select
                  id="feed-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  {locations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="feed-category">Category</label>
                <select
                  id="feed-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="feed-type">Employment type</label>
                <select
                  id="feed-type"
                  value={employmentType}
                  onChange={(event) =>
                    setEmploymentType(event.target.value)
                  }
                >
                  {employmentTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="jobs-clear-filters"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </section>
          )}

          <section className="jobs-feed-content">
            <div className="jobs-feed-heading">
              <div>
                <span>OPPORTUNITIES FOR YOU</span>

                <h2>
                  {activeTab === "Saved"
                    ? "Your saved jobs"
                    : activeTab === "Latest"
                      ? "Recently posted"
                      : "Explore opportunities"}
                </h2>
              </div>

              <p>
                {loading
                  ? "Loading..."
                  : `${filteredJobs.length} opportunities`}
              </p>
            </div>

            {error && (
              <div className="jobs-feed-error" role="alert">
                <AlertCircle size={19} />
                <span>{error}</span>

                <button type="button" onClick={loadJobs}>
                  Try again
                </button>
              </div>
            )}

            {loading ? (
              <div className="jobs-feed-empty">
                <RefreshCw size={27} />
                <h3>Loading opportunities...</h3>
                <p>We're retrieving approved vacancies from Abi Job.</p>
              </div>
            ) : error ? (
              <div className="jobs-feed-empty">
                <AlertCircle size={27} />
                <h3>We couldn't load job opportunities</h3>
                <p>
                  Please try again. If the problem continues, the
                  database request needs to be checked.
                </p>
                <button type="button" onClick={loadJobs}>
                  Try again
                </button>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="jobs-feed-list">
                {filteredJobs.map((job) => {
                  const isSaved = savedJobs.includes(job.id);

                  return (
                    <article className="jobs-feed-post" key={job.id}>
                      <div className="jobs-post-main">
                        <div className="jobs-post-topline">
                          <div className="jobs-company-avatar">
                            <Building2 size={25} />
                          </div>

                          <div className="jobs-post-company">
                            <strong>{job.company}</strong>
                            <span>
                              {job.location} · {job.posted}
                            </span>
                          </div>
                        </div>

                        <div className="jobs-post-content">
                          <span className="jobs-post-category">
                            {job.category}
                          </span>

                          <h3>{job.title}</h3>

                          <p>{job.description}</p>

                          <div className="jobs-post-facts">
                            <span>
                              <MapPin size={16} />
                              {job.location}
                            </span>

                            <span>
                              <BriefcaseBusiness size={16} />
                              {job.type}
                            </span>

                            <span>
                              <Clock3 size={16} />
                              {job.posted}
                            </span>
                          </div>

                          <div className="jobs-post-salary">
                            <span>Salary range</span>
                            <strong>{job.salary}</strong>
                          </div>
                        </div>

                        <div className="jobs-post-actions">
                          <button
                            type="button"
                            className="jobs-post-apply"
                            onClick={() => setSelectedJob(job)}
                          >
                            View opportunity
                            <ArrowRight size={17} />
                          </button>

                          <button
                            type="button"
                            className="jobs-post-share"
                            onClick={() => shareJob(job)}
                          >
                            <Share2 size={17} />
                            Share
                          </button>
                        </div>
                      </div>

                      <aside className="jobs-post-action-rail">
                        <button
                          type="button"
                          className={isSaved ? "saved" : ""}
                          onClick={() => void toggleSaved(job.id)}
                          disabled={savingJobIds.includes(job.id)}
                          aria-label={
                            isSaved ? "Remove saved job" : "Save job"
                          }
                          title={isSaved ? "Remove saved job" : "Save job"}
                        >
                          <Bookmark size={21} />
                          <span>{isSaved ? "Saved" : "Save"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => shareJob(job)}
                          aria-label="Share opportunity"
                          title="Share opportunity"
                        >
                          <Share2 size={21} />
                          <span>Share</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          aria-label="View opportunity details"
                          title="View details"
                        >
                          <ArrowUpRight size={21} />
                          <span>Details</span>
                        </button>
                      </aside>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="jobs-feed-empty">
                <div>
                  <Search size={27} />
                </div>

                <h3>
                  {activeTab === "Saved"
                    ? "No saved opportunities yet"
                    : jobs.length === 0
                      ? "No approved vacancies yet"
                      : "No matching opportunities"}
                </h3>

                <p>
                  {activeTab === "Saved"
                    ? "Save jobs that interest you. You can find them here whenever you return."
                    : jobs.length === 0
                      ? "Approved vacancies from employers will appear here when they are published."
                      : "Try another search or adjust your filters to discover more opportunities."}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setActiveTab("For You");
                  }}
                >
                  Explore all opportunities
                </button>
              </div>
            )}
          </section>

          <p className="jobs-feed-demo-note">
            <Check size={15} />
            Showing approved job vacancies published on Abi Job.
          </p>
        </div>
      </main>

      {shareMessage && (
        <div className="jobs-feed-toast" role="status">
          {shareMessage}
        </div>
      )}

      {selectedJob && (
        <div
          className="jobs-details-backdrop"
          onClick={() => setSelectedJob(null)}
        >
          <section
            className="jobs-details-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="jobs-details-title"
          >
            <div className="jobs-details-header">
              <span>JOB OPPORTUNITY</span>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                aria-label="Close details"
              >
                <X size={21} />
              </button>
            </div>

            <div className="jobs-details-company">
              <div className="jobs-company-avatar">
                <Building2 size={26} />
              </div>

              <div>
                <strong>{selectedJob.company}</strong>
                <span>{selectedJob.location}</span>
              </div>
            </div>

            <h2 id="jobs-details-title">{selectedJob.title}</h2>

            <div className="jobs-details-facts">
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
                {selectedJob.posted}
              </span>
            </div>

            <div className="jobs-details-section">
              <h3>About this opportunity</h3>
              <p>{selectedJob.description}</p>
            </div>

            {selectedJob.responsibilities && (
              <div className="jobs-details-section">
                <h3>Responsibilities</h3>
                <p>{selectedJob.responsibilities}</p>
              </div>
            )}

            {selectedJob.requirements && (
              <div className="jobs-details-section">
                <h3>Requirements</h3>
                <p>{selectedJob.requirements}</p>
              </div>
            )}

            {selectedJob.skills.length > 0 && (
              <div className="jobs-details-section">
                <h3>Required skills</h3>
                <p>{selectedJob.skills.join(", ")}</p>
              </div>
            )}

            {selectedJob.benefits && (
              <div className="jobs-details-section">
                <h3>Benefits</h3>
                <p>{selectedJob.benefits}</p>
              </div>
            )}

            <div className="jobs-details-section">
              <h3>Salary range</h3>
              <strong className="jobs-details-salary">
                {selectedJob.salary}
              </strong>
            </div>

            <div className="jobs-details-section">
              <h3>Job category</h3>
              <p>{selectedJob.category}</p>
            </div>

            <div className="jobs-details-section">
              <h3>Employment type</h3>
              <p>{selectedJob.type}</p>
            </div>

            {selectedJob.deadline && (
              <div className="jobs-details-section">
                <h3>Application deadline</h3>
                <p>
                  {new Date(`${selectedJob.deadline}T00:00:00`).toLocaleDateString(
                    "en-NG",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            )}

            <Link
              href={`/jobs/${selectedJob.id}/apply`}
              className="jobs-details-apply"
            >
              Apply for this job
              <ArrowRight size={18} />
            </Link>

            <p className="jobs-details-note">
              You need an eligible Job Seeker or Skilled Professional
              account to submit an application.
            </p>
          </section>
        </div>
      )}

      <Footer />
    </>
  );
}
