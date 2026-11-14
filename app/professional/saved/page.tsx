
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

type SavedJob = {
  id: string;
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
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const jobTypes = ["All", "Full-time", "Part-time", "Remote", "Contract"];

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function loadSavedJobs() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          window.location.replace("/login?next=/professional/saved");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile?.role !== "professional") {
          window.location.replace(
            profile?.role === "job_seeker"
              ? "/dashboard"
              : profile?.role === "employer"
                ? "/employer/dashboard"
                : "/login"
          );
          return;
        }

        const { data: access, error: accessError } = await supabase.rpc(
          "has_platform_access"
        );
        if (accessError) throw accessError;

        if (access !== true) {
          window.location.replace("/professional/subscription");
          return;
        }

        const { data: savedRows, error: savedError } = await supabase
          .from("saved_jobs")
          .select("job_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (savedError) throw savedError;

        const jobIds = (savedRows ?? []).map((row) => row.job_id);
        if (jobIds.length === 0) {
          if (active) setSavedJobs([]);
          return;
        }

        const { data: jobs, error: jobsError } = await supabase
          .from("jobs")
          .select(
            "id, employer_id, title, category, location, employment_type, salary_min, salary_max, salary_currency, description, skills_required, application_deadline, created_at"
          )
          .in("id", jobIds)
          .eq("status", "approved");

        if (jobsError) throw jobsError;

        const employerIds = [...new Set((jobs ?? []).map((job) => job.employer_id))];
        const { data: employers, error: employersError } = employerIds.length
          ? await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", employerIds)
          : { data: [], error: null };

        if (employersError) throw employersError;

        const employerNames = Object.fromEntries(
          (employers ?? []).map((employer) => [
            employer.id,
            employer.full_name || "Abijob employer",
          ])
        );

        const jobOrder = new Map(jobIds.map((id, index) => [id, index]));
        const formattedJobs: SavedJob[] = (jobs ?? [])
          .sort((left, right) => (jobOrder.get(left.id) ?? 0) - (jobOrder.get(right.id) ?? 0))
          .map((job) => {
            const company = employerNames[job.employer_id] || "Abijob employer";
            const amount = (value: number) =>
              job.salary_currency === "NGN" || !job.salary_currency
                ? `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`
                : `${job.salary_currency} ${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;
            const salary =
              job.salary_min !== null && job.salary_max !== null
                ? `${amount(job.salary_min)} – ${amount(job.salary_max)}`
                : job.salary_min !== null
                  ? `From ${amount(job.salary_min)}`
                  : job.salary_max !== null
                    ? `Up to ${amount(job.salary_max)}`
                    : "Salary not specified";
            const created = new Date(job.created_at);
            const posted = Number.isNaN(created.getTime())
              ? "Recently posted"
              : created.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

            return {
              id: job.id,
              title: job.title,
              company,
              location: job.location || "Location not specified",
              type: (job.employment_type || "Not specified").replace(/_/g, " ").replace(/\\b\\w/g, (character: string) => character.toUpperCase()),
              salary,
              category: job.category || "General",
              posted,
              description: job.description || "",
              initials: company.split(" ").map((word: string) => word[0]).join("").slice(0, 2).toUpperCase(),
              skills: job.skills_required || [],
              deadline: job.application_deadline || undefined,
            };
          });

        if (active) setSavedJobs(formattedJobs);
      } catch (error) {
        console.error("Unable to load saved opportunities:", error);
      } finally {
        if (active) setIsLoaded(true);
      }
    }

    void loadSavedJobs();
    return () => {
      active = false;
    };
  }, [supabase]);

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

  const removeSavedJob = async (id: string) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert("Please sign in again to manage your saved opportunities.");
      return;
    }

    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", id);

    if (error) {
      console.error("Unable to remove saved opportunity:", error);
      alert("Unable to remove this opportunity. Please try again.");
      return;
    }

    setSavedJobs((current) => current.filter((job) => job.id !== id));
    setConfirmRemove(null);

    if (selectedJob?.id === id) {
      setSelectedJob(null);
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
