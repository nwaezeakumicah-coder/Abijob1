"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, RefreshCw, Search, Sparkles, Users } from "lucide-react";
import ProfileImage from "@/components/ProfileImage";
import "./candidate-matches.css";

type JobOption = { id: string; title: string; status: string };
type Candidate = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  headline: string;
  avatarPath: string | null;
  status: string;
  appliedAt: string;
  experience: string;
  experienceYears: number;
  accountRole: string;
  professionalCategory: string | null;
  availability: boolean | null;
  education: string | null;
  location: string;
  skills: string[];
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvementAreas: string[];
  explanation: string;
};
type ResponseData = { jobs: JobOption[]; candidates: Candidate[]; totalApplications: number };

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function EmployerCandidateMatchesPage() {
  const [data, setData] = useState<ResponseData>({ jobs: [], candidates: [], totalApplications: 0 });
  const [selectedJob, setSelectedJob] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/candidate-matches", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Candidate matches could not be loaded.");
      setData(payload as ResponseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Candidate matches could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const candidates = useMemo(() => data.candidates.filter((candidate) => {
    const matchesJob = selectedJob === "all" || candidate.jobId === selectedJob;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [candidate.applicantName, candidate.headline, candidate.jobTitle, candidate.skills.join(" "), candidate.location].join(" ").toLowerCase().includes(query);
    return matchesJob && matchesSearch;
  }), [data.candidates, selectedJob, search]);

  if (loading) {
    return <main className="candidate-matches-page"><div className="candidate-matches-loading">Preparing your candidate matches…</div></main>;
  }

  return (
    <main className="candidate-matches-page">
      <header className="candidate-matches-header">
        <Link href="/employer/dashboard" className="candidate-back-link"><ArrowLeft size={17} /> Employer dashboard</Link>
        <div className="candidate-header-row">
          <div>
            <span className="candidate-eyebrow"><Sparkles size={15} /> SMART RECRUITMENT</span>
            <h1>Candidate matches</h1>
            <p>See which applicants best align with each vacancy's stated skills and experience requirements.</p>
          </div>
          <button type="button" className="candidate-refresh" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "candidate-spinning" : ""} /> Refresh
          </button>
        </div>
        <div className="candidate-controls">
          <label className="candidate-select-wrap">
            <span>Vacancy</span>
            <select value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)}>
              <option value="all">All vacancies</option>
              {data.jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </label>
          <label className="candidate-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search applicants, skills or location" />
          </label>
        </div>
      </header>

      {error && <div className="candidate-error" role="alert">{error} <button type="button" onClick={() => void load()}>Try again</button></div>}

      <section className="candidate-summary">
        <div><Users size={19} /><span><strong>{data.totalApplications}</strong> applications analysed</span></div>
        <div><BriefcaseBusiness size={19} /><span><strong>{data.jobs.length}</strong> vacancies</span></div>
        <p>Scores are guidance only. Review each application fairly and make hiring decisions yourself.</p>
      </section>

      {candidates.length === 0 ? (
        <section className="candidate-empty">
          <Users size={34} />
          <h2>{data.jobs.length === 0 ? "No vacancies found" : data.totalApplications === 0 ? "No applicants yet" : "No matching applicants"}</h2>
          <p>{data.jobs.length === 0 ? "Create a vacancy to start receiving applications." : data.totalApplications === 0 ? "Applicants will appear here after people apply to your vacancies." : "Try another vacancy or a different search term."}</p>
          <Link href="/employer/jobs">Manage vacancies <ArrowRight size={16} /></Link>
        </section>
      ) : (
        <section className="candidate-list" aria-label="Ranked applicants">
          {candidates.map((candidate, index) => (
            <article className="candidate-card" key={candidate.applicationId}>
              <div className="candidate-rank">{index + 1}</div>
              <div className="candidate-avatar"><ProfileImage name={candidate.applicantName} path={candidate.avatarPath} /></div>
              <div className="candidate-main">
                <div className="candidate-name-row">
                  <div><h2>{candidate.applicantName}</h2><p>{candidate.headline || "Applicant profile"}</p></div>
                  <div className="candidate-score"><strong>{candidate.score}%</strong><span>Match estimate</span></div>
                </div>
                <div className="candidate-meta">
                  <span>{candidate.jobTitle}</span>
                  {candidate.location && <span>{candidate.location}</span>}
                  <span>{candidate.experienceYears ? candidate.experienceYears + " years' experience" : "Experience not specified"}</span>
                  <span>{candidate.accountRole === "professional" ? candidate.professionalCategory || "Skilled professional" : "Job seeker"}</span>
                  {candidate.accountRole === "professional" && <span>{candidate.availability ? "Availability shared" : "Availability not shared"}</span>}
                  <span>{statusLabel(candidate.status)}</span>
                </div>
                <div className="candidate-skills">
                  <strong>Matched skills</strong>
                  {candidate.matchedSkills.length ? candidate.matchedSkills.map((skill) => <span className="candidate-skill matched" key={skill}>{skill}</span>) : <span className="candidate-muted">No required skills matched in the available profile</span>}
                </div>
                {candidate.missingSkills.length > 0 && <div className="candidate-skills"><strong>Skill gaps</strong>{candidate.missingSkills.map((skill) => <span className="candidate-skill missing" key={skill}>{skill}</span>)}</div>}
                <p className="candidate-disclaimer">{candidate.explanation}</p>
                <Link href="/employer/applicants" className="candidate-review-link">Review application <ArrowRight size={16} /></Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
