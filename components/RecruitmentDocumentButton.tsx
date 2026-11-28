"use client";

import { FileText, Printer } from "lucide-react";

type RecruitmentDocumentKind = "interview" | "offer" | "employment";

type Props = {
  kind: RecruitmentDocumentKind;
  recipient: string;
  organization?: string;
  position: string;
  reference: string;
  dateTime?: string;
  duration?: number;
  format?: string;
  location?: string | null;
  meetingLink?: string | null;
  salary?: number;
  currency?: string;
  employmentType?: string;
  startDate?: string;
  expiry?: string;
  terms?: string | null;
  notes?: string | null;
};

function safe(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readableDate(value?: string): string {
  if (!value) return "To be confirmed";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? safe(value)
    : new Intl.DateTimeFormat("en-NG", {
        dateStyle: "long",
        timeStyle: value.includes("T") ? "short" : undefined,
      }).format(parsed);
}

export default function RecruitmentDocumentButton(props: Props) {
  const isInterview = props.kind === "interview";
  const isOffer = props.kind === "offer";
  const title = isInterview
    ? "Interview invitation"
    : isOffer
      ? "Conditional employment offer"
      : "Employment confirmation";
  const buttonLabel = isInterview
    ? "Print interview letter"
    : isOffer
      ? "Print offer letter"
      : "Print employment letter";

  function printDocument() {
    const popup = window.open("", "_blank", "width=900,height=1000");
    if (!popup) {
      window.alert("Please allow pop-ups for Abijob to print this document.");
      return;
    }

    const organization = safe(props.organization || "Hiring organisation");
    const recipient = safe(props.recipient || "Candidate");
    const position = safe(props.position || "Position not specified");
    const reference = safe(props.reference);
    const location = safe(props.location || "To be confirmed");
    const terms = safe(props.terms || "The employer will communicate any additional agreed conditions in writing.");
    const notes = safe(props.notes || "");
    const salary = props.salary == null
      ? "As stated in the signed employment agreement"
      : safe(new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: props.currency || "NGN",
          maximumFractionDigits: 2,
        }).format(props.salary));
    const interviewDetails = isInterview
      ? `
        <section><h2>Interview details</h2><dl>
          <dt>Date and time</dt><dd>${readableDate(props.dateTime)}</dd>
          <dt>Duration</dt><dd>${safe(props.duration || 30)} minutes</dd>
          <dt>Format</dt><dd>${safe(props.format || "To be confirmed")}</dd>
          <dt>Venue / location</dt><dd>${location}</dd>
          ${props.meetingLink ? `<dt>Meeting link</dt><dd><a href="${safe(props.meetingLink)}">${safe(props.meetingLink)}</a></dd>` : ""}
        </dl></section>
        <p>Please arrive or join a few minutes early. Bring relevant portfolio materials and copies of requested credentials where applicable. Never send passwords, card PINs or one-time banking codes as part of recruitment.</p>
        ${notes ? `<section><h2>Additional instructions</h2><p>${notes}</p></section>` : ""}
      `
      : "";
    const offerDetails = !isInterview
      ? `
        <section><h2>Role and proposed terms</h2><dl>
          <dt>Position</dt><dd>${position}</dd>
          <dt>Employment type</dt><dd>${safe((props.employmentType || "To be agreed").replaceAll("_", " "))}</dd>
          <dt>Proposed remuneration</dt><dd>${salary}</dd>
          <dt>Work location</dt><dd>${location}</dd>
          <dt>Proposed start date</dt><dd>${readableDate(props.startDate)}</dd>
          ${isOffer ? `<dt>Offer response deadline</dt><dd>${readableDate(props.expiry)}</dd>` : ""}
        </dl></section>
        <section><h2>Terms and conditions</h2><p class="preserve">${terms}</p></section>
        <section><h2>Pre-onboarding checklist</h2><ul>
          <li>Review and accept the offer through your Abijob account.</li>
          <li>Confirm the start date, reporting location and supervisor with the employer.</li>
          <li>Prepare only the identity, qualification and reference documents lawfully requested by the employer.</li>
          <li>Agree in writing on working hours, probation, leave, benefits and reporting arrangements.</li>
          <li>Complete any lawful role-specific checks before reporting for duty.</li>
          <li>Keep a signed copy of the final employment agreement for your records.</li>
        </ul></section>
        <p class="notice">${isOffer
          ? "This is a conditional offer, not proof that employment has commenced. It becomes effective only after the candidate accepts it and the employer confirms the hire through Abijob. Any separate contract and applicable legal requirements remain in force."
          : "This confirmation records the hire in Abijob. It does not replace a signed contract, statutory documentation or the employer's physical onboarding process."}</p>
        <section class="signatures"><div>For the employer<br/><span>Authorised representative / signature</span></div><div>Candidate / employee<br/><span>Signature / date</span></div></section>
      `
      : "";

    popup.document.open();
    popup.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(title)} - Abijob</title>
      <style>
        *{box-sizing:border-box}body{margin:0;background:#eef2ed;color:#17251d;font:14px/1.65 Arial,sans-serif}
        .sheet{width:min(100%,850px);min-height:1050px;margin:24px auto;padding:64px 70px;background:#fff;box-shadow:0 8px 32px #173b2820}
        .brand{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #176b45;padding-bottom:20px}
        .brand strong{font-size:25px;color:#176b45;letter-spacing:-1px}.brand span{font-size:11px;color:#526358}
        .eyebrow{margin-top:34px;color:#176b45;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}
        h1{font-size:30px;line-height:1.2;margin:8px 0 22px;color:#103c2b}
        p{margin:12px 0}.meta{color:#526358;font-size:12px}.recipient{font-size:17px;font-weight:700}
        section{margin:26px 0}h2{font-size:16px;color:#103c2b;border-bottom:1px solid #d8e3d9;padding-bottom:8px}
        dl{display:grid;grid-template-columns:210px 1fr;gap:9px 18px}dt{font-weight:700;color:#526358}dd{margin:0}
        ul{padding-left:22px}li{margin:7px 0}.preserve{white-space:pre-wrap}
        .notice{padding:14px 16px;background:#edf5ee;border-left:4px solid #176b45;color:#103c2b}
        .signatures{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:65px}
        .signatures div{border-top:1px solid #526358;padding-top:10px;font-weight:700}
        .signatures span{font-size:11px;font-weight:400;color:#526358}
        .footer{margin-top:70px;padding-top:14px;border-top:1px solid #d8e3d9;color:#526358;font-size:10px}
        .toolbar{position:sticky;top:0;display:flex;justify-content:center;padding:12px;background:#103c2b}
        .toolbar button{border:0;border-radius:8px;background:#d7f078;color:#103c2b;padding:11px 18px;font-weight:800;cursor:pointer}
        @media(max-width:700px){.sheet{margin:0;padding:30px 22px;min-height:100vh}dl{grid-template-columns:1fr;gap:3px}dd{margin-bottom:10px}.signatures{gap:18px}}
        @media print{@page{size:A4;margin:16mm}body{background:#fff}.toolbar{display:none}.sheet{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}a{color:#103c2b;text-decoration:none}}
      </style></head><body>
      <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
      <main class="sheet">
        <header class="brand"><strong>Abijob</strong><span>Opportunity Starts Here</span></header>
        <div class="eyebrow">${safe(title)}</div><h1>${safe(title)}</h1>
        <p class="meta">Reference: ${reference} · Generated ${readableDate(new Date().toISOString())}</p>
        <p class="recipient">Dear ${recipient},</p>
        <p>${isInterview
          ? `You are invited to attend an interview with ${organization} for the ${position} opportunity. Please review the details below and respond to the invitation in your Abijob account.`
          : isOffer
            ? `${organization} is pleased to make you a conditional offer for the ${position} role, subject to your acceptance and the conditions set out below.`
            : `This letter confirms that ${organization} has recorded your appointment to the ${position} role. Please use the details below to prepare for your onboarding.`}</p>
        ${interviewDetails}${offerDetails}
        <p>Kind regards,<br/><strong>${organization}</strong><br/>Recruitment / Human Resources</p>
        <div class="footer">Generated through Abijob · Opportunity Starts Here<br/>This document is generated from the recruitment information recorded on the platform. Verify its contents with the issuing organisation before relying on it.</div>
      </main></body></html>`);
    popup.document.close();
    popup.focus();
  }

  return (
    <button type="button" className="recruitment-document-button" onClick={printDocument}>
      <Printer size={15} />
      {buttonLabel}
    </button>
  );
}
