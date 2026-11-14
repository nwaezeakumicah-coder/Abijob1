
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./opportunities.css";

type DatabaseJob = {
  id: string;
  employer_id: string;
  title: string;
  category: string;
  location: string;
  employment_type: string | null;
  workplace_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  skills_required: string[];
  application_deadline: string | null;
  status: string;
  created_at: string;
};

type Opportunity = DatabaseJob & {
  company: string;
};

type Profile = {
  id: string;
  role: string;
  full_name: string | null;
};

type ApplicationRecord = {
  job_id: string;
  status: string | null;
};

const SAVED_JOBS_KEY = "abijob-professional-saved-jobs";

const categories = ["All categories"];

function getLocalDateString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function isDeadlinePassed(deadline: string | null) {
  if (!deadline) return false;

  return deadline.slice(0, 10) < getLocalDateString();
}

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPostedDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "Date unavailable";

  const days = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
  );

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  return formatDate(value);
}

function formatSalary(job: DatabaseJob) {
  if (job.salary_min === null && job.salary_max === null) {
    return "Salary not specified";
  }

  const currency = (job.salary_currency || "NGN").toUpperCase();

  const amount = (value: number) => {
    const formatted = new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(value);

    return currency === "NGN"
      ? `₦${formatted}`
      : `${currency} ${formatted}`;
  };

  if (job.salary_min !== null && job.salary_max !== null) {
    return `${amount(job.salary_min)} – ${amount(job.salary_max)}`;
  }

  if (job.salary_min !== null) {
    return `From ${amount(job.salary_min)}`;
  }

  return `Up to ${amount(job.salary_max as number)}`;
}

function formatJobType(job: DatabaseJob) {
  const employment = job.employment_type
    ? job.employment_type.replace(/_/g, " ")
    : "Not specified";

  const workplace = job.workplace_type
    ? job.workplace_type.replace(/_/g, " ")
    : "";

  const formattedEmployment = employment.replace(/\b\w/g, (character) =>
    character.toUpperCase()
  );

  if (!workplace) return formattedEmployment;

  const formattedWorkplace = workplace.replace(/\b\w/g, (character) =>
    character.toUpperCase()
  );

  return `${formattedEmployment} · ${formattedWorkplace}`;
}

function readSavedJobIds(): string[] {
  try {
    const stored = localStorage.getItem(SAVED_JOBS_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    // Support the current string-ID format and older object-based entries.
    return parsed
      .map((item: unknown) => {
        if (typeof item === "string") return item;

        if (
          item &&
          typeof item === "object" &&
          "id" in item &&
          typeof item.id === "string"
        ) {
          return item.id;
        }

        return null;
      })
      .filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export default function ProfessionalOpportunitiesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [jobType, setJobType] = useState("All types");
  const [sort, setSort] = useState("Newest first");
  const [showFilters, setShowFilters] = useState(false);

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const showNotice = (message: string) => {
    setNotice(message);
  };

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace(
          `/login?next=${encodeURIComponent("/professional/opportunities")}`
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error(
          "Your account profile could not be loaded. Please try again."
        );
      }

      const typedProfile = profile as Profile;

      if (typedProfile.role !== "professional") {
        if (typedProfile.role === "job_seeker") {
          router.replace("/dashboard");
        } else if (typedProfile.role === "employer") {
          router.replace("/employer/dashboard");
        } else if (typedProfile.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/login");
        }

        return;
      }

      setFullName(
        typedProfile.full_name || user.email || "Professional"
      );

      const storedIds = readSavedJobIds();
      setSavedJobIds(storedIds);

      const [
        { data: jobRows, error: jobsError },
        { data: applicationRows, error: applicationsError },
      ] = await Promise.all([
        supabase
          .from("jobs")
          .select(
            `
              id,
              employer_id,
              title,
              category,
              location,
              employment_type,
              workplace_type,
              salary_min,
              salary_max,
              salary_currency,
              description,
              requirements,
              responsibilities,
              skills_required,
              application_deadline,
              status,
              created_at
            `
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false }),

        supabase
          .from("job_applications")
          .select("job_id, status")
          .eq("applicant_id", user.id),
      ]);

      if (jobsError) {
        throw new Error(
          `Unable to load approved vacancies: ${jobsError.message}`
        );
      }

      if (applicationsError) {
        throw new Error(
          `Unable to load your application history: ${applicationsError.message}`
        );
      }

      const activeJobs = ((jobRows || []) as DatabaseJob[]).filter(
        (job) => !isDeadlinePassed(job.application_deadline)
      );

      const employerIds = Array.from(
        new Set(activeJobs.map((job) => job.employer_id).filter(Boolean))
      );

      let employerNames: Record<string, string> = {};

      if (employerIds.length > 0) {
        const { data: employerProfiles, error: employerError } =
          await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", employerIds);

        if (employerError) {
          console.error(
            "Unable to load employer profile names:",
            employerError
          );
        } else {
          employerNames = Object.fromEntries(
            (employerProfiles || []).map((item) => [
              item.id,
              item.full_name || "Abijob Employer",
            ])
          );
        }
      }

      const mappedJobs: Opportunity[] = activeJobs.map((job) => ({
        ...job,
        company: employerNames[job.employer_id] || "Abijob Employer",
      }));

      setOpportunities(mappedJobs);

      // Withdrawn applications should not be counted as active applications.
      const activeApplications = (
        (applicationRows || []) as ApplicationRecord[]
      ).filter(
        (application) =>
          application.status?.toLowerCase() !== "withdrawn"
      );

      setAppliedJobIds(
        Array.from(
          new Set(activeApplications.map((application) => application.job_id))
        )
      );

      // Remove saved IDs for vacancies that are no longer available.
      const availableIds = new Set(mappedJobs.map((job) => job.id));
      const validSavedIds = storedIds.filter((id) => availableIds.has(id));

      setSavedJobIds(validSavedIds);

      try {
        localStorage.setItem(
          SAVED_JOBS_KEY,
          JSON.stringify(validSavedIds)
        );
      } catch {
        console.error("Unable to synchronize saved opportunities.");
      }
    } catch (err) {
      console.error("Professional opportunities loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load opportunities. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const availableCategories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        opportunities
          .map((job) => job.category)
          .filter((item): item is string => Boolean(item))
      )
    ).sort((a, b) => a.localeCompare(b));

    return [...categories, ...uniqueCategories];
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter((job) => {
      const term = search.trim().toLowerCase();

      const searchableText = [
        job.title,
        job.company,
        job.location,
        job.category,
        job.description,
        job.requirements || "",
        job.responsibilities || "",
        ...(job.skills_required || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);

      const matchesCategory =
        category === "All categories" || job.category === category;

      const normalizedEmployment = (job.employment_type || "")
        .replace(/_/g, " ")
        .toLowerCase();

      const normalizedWorkplace = (job.workplace_type || "")
        .replace(/_/g, " ")
        .toLowerCase();

      const selectedType = jobType
        .replace(/_/g, " ")
        .toLowerCase();

      const matchesType =
        jobType === "All types" ||
        normalizedEmployment === selectedType ||
        normalizedWorkplace === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });

    if (sort === "Newest first") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    } else if (sort === "Oldest first") {
      result = [...result].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
    }

    return result;
  }, [opportunities, search, category, jobType, sort]);

  function toggleSaved(jobId: string) {
    const alreadySaved = savedJobIds.includes(jobId);

    const updatedIds = alreadySaved
      ? savedJobIds.filter((id) => id !== jobId)
      : [...savedJobIds, jobId];

    try {
      localStorage.setItem(
        SAVED_JOBS_KEY,
        JSON.stringify(updatedIds)
      );

      setSavedJobIds(updatedIds);

      showNotice(
        alreadySaved
          ? "Opportunity removed from your saved list."
          : "Opportunity saved successfully."
      );
    } catch {
      showNotice("Unable to update saved opportunities.");
    }
  }

  function clearFilters() {
    setSearch("");
    setCategory("All categories");
    setJobType("All types");
  }

  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

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

          <Link
            href="/professional/opportunities"
            className="active"
            aria-current="page"
          >
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
              Keep your profile updated to help employers understand your
              skills and experience.
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
              <div className="po-user-avatar">
                {initials || <UserRound size={18} />}
              </div>

              <div className="po-user-info">
                <strong>{fullName || "Professional"}</strong>
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
                Discover approved vacancies that match your skills and
                professional interests.
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

          {error && (
            <div
              role="alert"
              style={{
                padding: "15px 17px",
                marginBottom: "18px",
                borderRadius: "10px",
                background: "#fff0ed",
                color: "#9d3022",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={loadOpportunities}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}

          <section className="po-search-panel">
            <div className="po-search-field">
              <Search size={19} />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Job title, company or skill..."
                aria-label="Search opportunities"
              />
            </div>

            <div className="po-search-divider" />

            <div className="po-category-field">
              <BriefcaseBusiness size={17} />

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter by category"
              >
                {availableCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown size={15} />
            </div>

            <button
              className="po-search-button"
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={16} />
              {showFilters ? "Hide filters" : "More filters"}
            </button>
          </section>

          {showFilters && (
            <section className="po-extra-filters">
              <div>
                <label htmlFor="po-job-type">Opportunity type</label>

                <select
                  id="po-job-type"
                  value={jobType}
                  onChange={(event) => setJobType(event.target.value)}
                >
                  <option value="All types">All types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
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
                <strong>{loading ? "—" : opportunities.length}</strong>
                <span>Available opportunities</span>
              </div>
            </div>

            <div className="po-stat-card">
              <div className="po-stat-icon orange">
                <Bookmark size={19} />
              </div>

              <div>
                <strong>{savedJobIds.length}</strong>
                <span>Saved opportunities</span>
              </div>
            </div>

            <div className="po-stat-card">
              <div className="po-stat-icon purple">
                <Activity size={19} />
              </div>

              <div>
                <strong>{loading ? "—" : appliedJobIds.length}</strong>
                <span>Jobs you've applied for</span>
              </div>
            </div>
          </section>

          <section className="po-results-section">
            <div className="po-results-heading">
              <div>
                <h2>Available opportunities</h2>

                <p>
                  Browse vacancies published by approved employers on Abijob.
                </p>
              </div>

              <div className="po-sort">
                <SlidersHorizontal size={15} />

                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  aria-label="Sort opportunities"
                >
                  <option value="Newest first">Newest first</option>
                  <option value="Oldest first">Oldest first</option>
                </select>
              </div>
            </div>

            <div className="po-results-layout">
              <div className="po-job-list">
                {loading ? (
                  <div className="po-empty">
                    <RefreshCw size={28} />
                    <h3>Loading opportunities</h3>
                    <p>Fetching approved vacancies from Abijob.</p>
                  </div>
                ) : error ? (
                  <div className="po-empty">
                    <RefreshCw size={28} />
                    <h3>Unable to load opportunities</h3>
                    <p>Check your connection and try again.</p>

                    <button
                      type="button"
                      onClick={loadOpportunities}
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredOpportunities.length === 0 ? (
                  <div className="po-empty">
                    <Search size={28} />

                    <h3>
                      {opportunities.length === 0
                        ? "No active vacancies available"
                        : "No opportunities found"}
                    </h3>

                    <p>
                      {opportunities.length === 0
                        ? "Approved vacancies will appear here when employers publish them."
                        : "Try changing your search or filters."}
                    </p>

                    {(search ||
                      category !== "All categories" ||
                      jobType !== "All types") && (
                      <button
                        type="button"
                        onClick={clearFilters}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredOpportunities.map((job) => {
                    const isSaved = savedJobIds.includes(job.id);
                    const hasApplied = appliedJobIds.includes(job.id);

                    return (
                      <article className="po-job-card" key={job.id}>
                        <div className="po-job-top">
                          <div className="po-company-logo">
                            <Building2 size={23} />
                          </div>

                          <div className="po-job-heading">
                            <div className="po-job-title-row">
                              <h3>{job.title}</h3>
                            </div>

                            <p>{job.company}</p>
                          </div>

                          <button
                            className={`po-bookmark ${
                              isSaved ? "saved" : ""
                            }`}
                            type="button"
                            onClick={() => toggleSaved(job.id)}
                            aria-label={
                              isSaved
                                ? "Remove saved opportunity"
                                : "Save opportunity"
                            }
                            aria-pressed={isSaved}
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
                            <MapPin size={14} />
                            {job.location}
                          </span>

                          <span>
                            <Clock3 size={14} />
                            {formatJobType(job)}
                          </span>

                          <span>
                            <Wallet size={14} />
                            {formatSalary(job)}
                          </span>
                        </div>

                        <p className="po-job-description">
                          {job.description}
                        </p>

                        {job.skills_required?.length > 0 && (
                          <div className="po-job-skills">
                            {job.skills_required.slice(0, 8).map((skill) => (
                              <span key={skill}>{skill}</span>
                            ))}
                          </div>
                        )}

                        <div className="po-job-footer">
                          <div className="po-job-posted">
                            <span>
                              Posted {formatPostedDate(job.created_at)}
                            </span>

                            <span>
                              <CalendarDays size={13} />
                              Deadline: {formatDate(job.application_deadline)}
                            </span>
                          </div>

                          <div className="po-job-actions">
                            {hasApplied && (
                              <span className="po-match">
                                <CheckCircle2 size={13} />
                                Applied
                              </span>
                            )}

                            <Link
                              href={
                                hasApplied
                                  ? "/professional/applications"
                                  : `/jobs/${job.id}/apply`
                              }
                              className="po-apply-button"
                            >
                              {hasApplied
                                ? "My applications"
                                : "View opportunity"}

                              <ArrowUpRight size={15} />
                            </Link>
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

                  <h3>Strengthen your profile</h3>

                  <p>
                    Keep your skills, experience and professional information
                    updated so employers can better understand what you offer.
                  </p>

                  <Link href="/professional/profile">
                    Update your profile <ArrowUpRight size={14} />
                  </Link>
                </div>

                <div className="po-side-card">
                  <h3>Opportunity categories</h3>

                  <div className="po-category-list">
                    {availableCategories
                      .filter((item) => item !== "All categories")
                      .map((name) => {
                        const count = opportunities.filter(
                          (job) => job.category === name
                        ).length;

                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setCategory(name)}
                            className={category === name ? "selected" : ""}
                          >
                            <span>{name}</span>

                            <small>
                              {count} {count === 1 ? "vacancy" : "vacancies"}
                            </small>
                          </button>
                        );
                      })}

                    {availableCategories.length <= 1 && (
                      <p>No vacancy categories available yet.</p>
                    )}
                  </div>
                </div>

                <div className="po-side-card po-tip-card">
                  <div className="po-tip-icon">
                    <CheckCircle2 size={18} />
                  </div>

                  <h3>Career tip</h3>

                  <p>
                    Add relevant skills and portfolio samples to your profile.
                    Employers need clear information about your abilities and
                    experience.
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
    </div>
  );
}
