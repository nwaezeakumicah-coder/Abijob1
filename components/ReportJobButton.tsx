"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Flag, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = { jobId: string };

const reasons = [
  ["fraud", "Fake or fraudulent vacancy"],
  ["payment_request", "Requests payment to apply or get hired"],
  ["misleading", "Misleading job description or salary"],
  ["duplicate", "Duplicate vacancy"],
  ["expired", "Expired or unavailable vacancy"],
  ["other", "Other concern"],
];

export default function ReportJobButton({ jobId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("fraud");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (details.trim().length < 20) {
      setMessage("Please provide at least 20 characters so our team can investigate.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        setMessage("Please sign in before reporting a vacancy.");
        return;
      }

      const { error } = await (supabase as any).rpc("submit_job_report", {
        p_job_id: jobId,
        p_reason: reason,
        p_details: details.trim(),
      });
      if (error) throw error;

      setSuccess(true);
      setMessage("Thank you. Your report has been sent securely to the Abijob safety team.");
      setDetails("");
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      setMessage(
        text.includes("already have an open report")
          ? "You already submitted an open report for this vacancy."
          : text.includes("sign in")
            ? "Please sign in before reporting a vacancy."
            : "We couldn't submit your report. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="job-safety-report" aria-label="Report suspicious vacancy">
      <div className="job-safety-report-copy">
        <AlertTriangle size={19} />
        <span>Think this vacancy is suspicious?</span>
      </div>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        <Flag size={16} /> {open ? "Close report form" : "Report this job"}
      </button>
      {open && (
        <form className="job-safety-report-form" onSubmit={submitReport}>
          <h3>Report a concern</h3>
          <p>Reports are confidential and reviewed by the Abijob safety team. Never share passwords or banking PINs.</p>
          <label>
            Reason for reporting
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            What happened?
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              minLength={20}
              maxLength={2000}
              rows={4}
              required
              placeholder="Describe what made this vacancy suspicious (20–2,000 characters)."
            />
          </label>
          {message && (
            <div className={success ? "job-report-message success" : "job-report-message error"} role="status">
              {success && <CheckCircle2 size={17} />}
              <span>{message}</span>
              {!success && message.includes("sign in") && <Link href="/login">Log in</Link>}
            </div>
          )}
          <button type="submit" disabled={busy || details.trim().length < 20}>
            {busy ? <><LoaderCircle size={16} className="job-report-spin" /> Sending…</> : "Submit confidential report"}
          </button>
        </form>
      )}
      <style jsx>{`
        .job-safety-report{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:17px 19px;border:1px solid #e5eae4;border-radius:12px;background:#fff;color:#405047}
        .job-safety-report-copy{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:600}
        .job-safety-report-copy :global(svg){color:#b45309}
        .job-safety-report>button,.job-safety-report-form>button{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:8px;padding:10px 14px;background:#176b45;color:#fff;font-weight:700;cursor:pointer}
        .job-safety-report-form{flex-basis:100%;display:grid;gap:13px;padding-top:17px;border-top:1px solid #edf0eb}
        .job-safety-report-form h3{margin:0;color:#17251d;font-size:18px}
        .job-safety-report-form p{margin:0;color:#68766c;font-size:13px;line-height:1.6}
        .job-safety-report-form label{display:grid;gap:7px;color:#34463a;font-size:13px;font-weight:700}
        .job-safety-report-form select,.job-safety-report-form textarea{width:100%;border:1px solid #dce4dc;border-radius:8px;padding:11px;background:#fff;color:#17251d;font:inherit;font-weight:400}
        .job-safety-report-form textarea{resize:vertical}
        .job-safety-report-form>button{justify-self:start}
        .job-safety-report-form>button:disabled{opacity:.55;cursor:not-allowed}
        .job-report-message{display:flex;align-items:center;gap:8px;padding:11px;border-radius:8px;font-size:13px;line-height:1.5}
        .job-report-message.success{background:#edf7ef;color:#176b45}
        .job-report-message.error{background:#fff4ed;color:#9a3412}
        .job-report-message a{color:inherit;font-weight:800}
        .job-report-spin{animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </section>
  );
}
