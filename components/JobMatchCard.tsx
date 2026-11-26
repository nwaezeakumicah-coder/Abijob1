"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Sparkles, Target, TrendingUp } from "lucide-react";
import "./JobMatchCard.css";

type MatchResult = {
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  strengths: string[];
  improvementAreas: string[];
  poweredBy: "rules" | "gemini";
  aiDataNotice: string;
  disclaimer: string;
};

export default function JobMatchCard({ jobId }: { jobId: string }) {
  const [aiConsent, setAiConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState("");

  async function checkMatch() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/ai/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, aiConsent }),
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "We couldn't calculate your match. Please try again."
        );
      }

      setResult(payload as MatchResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="job-match-card" aria-labelledby="job-match-title">
      <div className="job-match-heading">
        <span className="job-match-icon"><Sparkles size={20} /></span>
        <div>
          <span className="job-match-eyebrow">PERSONALISED CAREER INSIGHT</span>
          <h2 id="job-match-title">See how well you match this job</h2>
          <p>Compare the skills and experience on your Abijob profile with this opportunity.</p>
        </div>
      </div>

      <div className="job-match-consent">
        <label className="job-match-consent-label">
          <input
            type="checkbox"
            checked={aiConsent}
            onChange={(event) => setAiConsent(event.target.checked)}
            disabled={loading}
          />
          <span>
            <strong>Use Google Gemini for a deeper match analysis (optional)</strong>
            <small>
              If selected, Abijob sends your skills, years of experience and professional category,
              plus the job title, category and required skills, to Google Gemini. Your name,
              contact details, biography, education and precise location are not sent.
            </small>
          </span>
        </label>
        <p className="job-match-privacy-note">
          {aiConsent
            ? "You have chosen the optional Gemini analysis. You can untick this at any time."
            : "Leave this unticked to calculate your match on Abijob only. No profile data is sent to Gemini."}
        </p>
      </div>

      <button className="job-match-button" type="button" onClick={checkMatch} disabled={loading}>
        {loading ? <LoaderCircle className="job-match-spin" size={18} /> : <Target size={18} />}
        {loading ? "Checking your match..." : aiConsent ? "Analyse my match with Gemini" : "Check my match"}
      </button>

      {error && (
        <div className="job-match-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="job-match-result" aria-live="polite">
          <div className="job-match-score-row">
            <div className="job-match-score">
              <strong>{result.score}%</strong>
              <span>Match estimate</span>
            </div>
            <div className="job-match-score-copy">
              <span className="job-match-source">
                {result.poweredBy === "gemini" ? <Sparkles size={14} /> : <Target size={14} />}
                {result.poweredBy === "gemini" ? "Gemini-assisted analysis" : "Abijob skills analysis"}
              </span>
              <p>{result.explanation}</p>
            </div>
          </div>

          <div className="job-match-skill-grid">
            <div>
              <h3><CheckCircle2 size={16} /> Matching skills</h3>
              {result.matchedSkills.length ? (
                <ul>{result.matchedSkills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
              ) : <p className="job-match-empty">No direct skill matches identified yet.</p>}
            </div>
            <div>
              <h3><Target size={16} /> Skills to develop</h3>
              {result.missingSkills.length ? (
                <ul>{result.missingSkills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
              ) : <p className="job-match-empty">No missing required skills identified.</p>}
            </div>
          </div>

          <div className="job-match-insights">
            <div>
              <h3><TrendingUp size={16} /> Your strengths</h3>
              {result.strengths.length ? (
                <ul>{result.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul>
              ) : <p className="job-match-empty">Add more details to your profile to identify strengths.</p>}
            </div>
            <div>
              <h3><Sparkles size={16} /> Suggested improvements</h3>
              {result.improvementAreas.length ? (
                <ul>{result.improvementAreas.map((item, index) => <li key={index}>{item}</li>)}</ul>
              ) : <p className="job-match-empty">Your profile has no immediate improvement suggestions.</p>}
            </div>
          </div>

          <p className="job-match-data-notice">{result.aiDataNotice}</p>
          <p className="job-match-disclaimer">{result.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
