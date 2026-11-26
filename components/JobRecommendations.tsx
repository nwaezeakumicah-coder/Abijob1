"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, MapPin, RefreshCw, Sparkles } from "lucide-react";
import "./JobRecommendations.css";

type Recommendation = {
  id: string;
  title: string;
  category: string;
  location: string;
  applicationDeadline: string | null;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
};

type RecommendationResponse = {
  recommendations?: Recommendation[];
  openApprovedJobsCount?: number;
  appliedOpenJobsCount?: number;
  error?: string;
};

function formatDeadline(value: string | null) {
  if (!value) return "No deadline specified";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Deadline not specified";
  return `Apply by ${new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(date)}`;
}

export default function JobRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedOpenJobsCount, setAppliedOpenJobsCount] = useState(0);
  const [openApprovedJobsCount, setOpenApprovedJobsCount] = useState(0);

  async function loadRecommendations() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/job-recommendations", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as RecommendationResponse;
      if (!response.ok) throw new Error(payload.error || "Recommendations could not be loaded.");
      setItems(Array.isArray(payload.recommendations) ? payload.recommendations : []);
      setAppliedOpenJobsCount(Number(payload.appliedOpenJobsCount) || 0);
      setOpenApprovedJobsCount(Number(payload.openApprovedJobsCount) || 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Recommendations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecommendations();
  }, []);

  return (
    <section className="job-recommendations" aria-labelledby="job-recommendations-title">
      <div className="jr-heading">
        <div>
          <span className="jr-eyebrow"><Sparkles size={14} /> SMART OPPORTUNITY MATCHING</span>
          <h2 id="job-recommendations-title">Recommended for you</h2>
          <p>Approved vacancies ranked using your skills, experience, category and location.</p>
        </div>
        <button type="button" onClick={() => void loadRecommendations()} disabled={loading} aria-label="Refresh job recommendations">
          <RefreshCw size={16} className={loading ? "jr-spin" : ""} />
          <span>{loading ? "Updating" : "Refresh"}</span>
        </button>
      </div>

      {loading ? (
        <div className="jr-state" role="status"><span className="jr-loader" /> Finding opportunities that fit your profile…</div>
      ) : error ? (
        <div className="jr-state jr-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadRecommendations()}>Try again</button>
        </div>
      ) : items.length ? (
        <div className="jr-list">
          {items.map((job) => (
            <article className="jr-card" key={job.id}>
              <div className="jr-score" aria-label={`${job.matchScore} percent profile match`}>
                <strong>{job.matchScore}%</strong>
                <span>match</span>
              </div>
              <div className="jr-copy">
                <div className="jr-title-row">
                  <div>
                    <span className="jr-category">{job.category}</span>
                    <h3><Link href={`/jobs/${job.id}`}>{job.title}</Link></h3>
                  </div>
                </div>
                <div className="jr-meta">
                  <span><MapPin size={14} />{job.location}</span>
                  <span><Clock3 size={14} />{formatDeadline(job.applicationDeadline)}</span>
                </div>
                <p>{job.explanation}</p>
                {job.matchedSkills.length > 0 && (
                  <div className="jr-skills">
                    {job.matchedSkills.map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                )}
              </div>
              <Link className="jr-open" href={`/jobs/${job.id}`} aria-label={`View ${job.title}`}>
                <ArrowRight size={18} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="jr-empty">
          <span><BriefcaseBusiness size={24} /></span>
          <strong>{openApprovedJobsCount > 0 && appliedOpenJobsCount === openApprovedJobsCount ? "You've applied to all current approved vacancies" : "No new recommendations yet"}</strong>
          <p>{openApprovedJobsCount > 0 && appliedOpenJobsCount === openApprovedJobsCount
            ? "You've already applied to every currently open, approved vacancy. We'll show new recommendations as soon as more opportunities are approved. Keep your profile updated to improve future matches."
            : "Complete your profile with relevant skills and experience, or check back when new approved vacancies are published."}</p>
          <Link href="/jobs">Browse all approved jobs <ArrowRight size={15} /></Link>
        </div>
      )}

      <div className="jr-footnote">Match scores are guidance, not a hiring decision. Recommendations update as your profile and approved vacancies change.</div>
    </section>
  );
}
