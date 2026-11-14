
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SaveJobButton from "@/components/SaveJobButton";
import "./job-details.css";

type Job = {
  id: string;
  title: string;
  company: string;
  initials: string;
  category: string;
  location: string;
  type: string;
  workplace: string;
  salary: string;
  salaryPeriod: string;
  experience: string;
  education: string;
  posted: string;
  deadline: string;
  applicants: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  about: string;
};

function splitList(value: string | null | undefined): string[] {
  const items = (value || "").split(/\r?\n|•/).map((item) => item.trim()).filter(Boolean);
  return items.length ? items : ["Not specified by the employer."];
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not specified";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly
    ? (() => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); })()
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

function formatEmploymentType(value: string | null): string {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "Not specified";
}

function formatSalary(minimum: number | null, maximum: number | null, currency: string | null): string {
  if (minimum === null && maximum === null) return "Salary not specified";
  const code = currency || "NGN";
  const amount = (value: number) => {
    const formatted = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value);
    return code.toUpperCase() === "NGN" ? `₦${formatted}` : `${code.toUpperCase()} ${formatted}`;
  };
  if (minimum !== null && maximum !== null) return `${amount(minimum)} – ${amount(maximum)}`;
  if (minimum !== null) return `From ${amount(minimum)}`;
  return `Up to ${amount(maximum as number)}`;
}
async function JobDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const supabase = await createClient();

  const { data: jobData, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, employer_id, title, category, employment_type, experience_level, location, salary_min, salary_max, salary_currency, description, requirements, responsibilities, benefits, application_deadline, created_at, workplace_type, workplace"
    )
    .eq("id", decodeURIComponent(id))
    .eq("status", "approved")
    .maybeSingle();

  if (jobError || !jobData) {
    if (jobError) console.error("Job details lookup failed:", jobError);
    notFound();
  }

  const [employerResult, profileResult] = await Promise.all([
    supabase
      .from("employer_profiles")
      .select("business_name, description")
      .eq("user_id", jobData.employer_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", jobData.employer_id)
      .maybeSingle(),
  ]);

  const company =
    employerResult.data?.business_name ||
    profileResult.data?.full_name ||
    "Abijob employer";
  const initials = company
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const job: Job = {
    id: jobData.id,
    title: jobData.title,
    company,
    initials: initials || "AB",
    category: jobData.category || "General",
    location: jobData.location || "Location not specified",
    type: formatEmploymentType(jobData.employment_type),
    workplace: jobData.workplace || jobData.workplace_type || "Not specified",
    salary: formatSalary(jobData.salary_min, jobData.salary_max, jobData.salary_currency),
    salaryPeriod: "As stated by the employer",
    experience: jobData.experience_level || "Not specified",
    education: "See requirements",
    posted: formatDate(jobData.created_at),
    deadline: formatDate(jobData.application_deadline),
    applicants: "Open to qualified applicants",
    description: jobData.description || "The employer has not added a job description yet.",
    responsibilities: splitList(jobData.responsibilities),
    requirements: splitList(jobData.requirements),
    benefits: splitList(jobData.benefits),
    about: employerResult.data?.description || "Employer details have not been added yet.",
  };

  return (
    <>
      <Header />

      <main className="job-details-page">
        <section className="job-details-hero">
          <div className="job-details-container">
            <div className="job-breadcrumb">
              <Link href="/jobs">
                <ArrowLeft size={16} />
                Back to jobs
              </Link>
              <span>/</span>
              <span>Job details</span>
            </div>

            <div className="job-heading-card">
              <div className="job-heading-main">
                <div className="job-company-logo">
                  <span>{job.initials}</span>
                </div>

                <div className="job-heading-copy">
                  <span className="job-category-tag">{job.category}</span>
                  <h1>{job.title}</h1>

                  <div className="job-company-line">
                    <Building2 size={16} />
                    <span>{job.company}</span>
                    <span className="job-verified">
                      <ShieldCheck size={14} />
                      Employer details
                    </span>
                  </div>

                  <div className="job-heading-meta">
                    <span>
                      <MapPin size={15} />
                      {job.location}
                    </span>
                    <span>
                      <BriefcaseBusiness size={15} />
                      {job.type}
                    </span>
                    <span>
                      <Clock3 size={15} />
                      {job.workplace}
                    </span>
                  </div>
                </div>
              </div>

              <div className="job-heading-actions">
                <Link href={`/jobs/${job.id}/apply`} className="job-apply-button">
                  Apply for this job <ArrowRight size={17} />
                </Link>

                <SaveJobButton jobId={job.id} />
              </div>
            </div>
          </div>
        </section>

        <section className="job-details-content">
          <div className="job-details-container job-details-layout">
            <div className="job-details-main">
              <section className="job-content-card">
                <div className="job-content-heading">
                  <span className="job-heading-icon">
                    <BriefcaseBusiness size={19} />
                  </span>
                  <h2>About this role</h2>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="job-content-divider" />

                <h3>Key responsibilities</h3>
                <ul className="job-detail-list">
                  {job.responsibilities.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={17} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="job-content-divider" />

                <h3>Requirements and qualifications</h3>
                <ul className="job-detail-list">
                  {job.requirements.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={17} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="job-content-divider" />

                <h3>What the employer offers</h3>
                <ul className="job-detail-list">
                  {job.benefits.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={17} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="job-content-card job-company-about">
                <div className="job-content-heading">
                  <span className="job-heading-icon">
                    <Building2 size={19} />
                  </span>
                  <h2>About the employer</h2>
                </div>

                <div className="job-about-company">
                  <div className="job-company-logo small">
                    {job.initials}
                  </div>
                  <div>
                    <h3>{job.company}</h3>
                    <span>{job.location}</span>
                  </div>
                </div>

                <p>{job.about}</p>

                <Link href="/employers" className="job-company-link">
                  Explore employers <ArrowUpRight size={16} />
                </Link>
              </section>

              <div className="job-report-link">
                <ShieldCheck size={17} />
                <span>Think this vacancy looks suspicious?</span>
                <Link href="/support">Report a concern</Link>
              </div>
            </div>

            <aside className="job-details-sidebar">
              <section className="job-sidebar-card job-summary-card">
                <div className="job-sidebar-title">
                  <h2>Job overview</h2>
                  <span className="job-open-indicator">
                    <span />
                    Open
                  </span>
                </div>

                <div className="job-salary-block">
                  <span>Salary range</span>
                  <strong>{job.salary}</strong>
                  <small>{job.salaryPeriod}</small>
                </div>

                <div className="job-overview-list">
                  <div>
                    <span className="job-overview-icon">
                      <MapPin size={17} />
                    </span>
                    <div>
                      <small>Location</small>
                      <strong>{job.location}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <BriefcaseBusiness size={17} />
                    </span>
                    <div>
                      <small>Employment type</small>
                      <strong>{job.type}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <Clock3 size={17} />
                    </span>
                    <div>
                      <small>Work arrangement</small>
                      <strong>{job.workplace}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <GraduationCap size={17} />
                    </span>
                    <div>
                      <small>Experience</small>
                      <strong>{job.experience}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <CalendarDays size={17} />
                    </span>
                    <div>
                      <small>Posted</small>
                      <strong>{job.posted}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <Wallet size={17} />
                    </span>
                    <div>
                      <small>Education</small>
                      <strong>{job.education}</strong>
                    </div>
                  </div>
                </div>

                <Link href={`/jobs/${job.id}/apply`} className="job-sidebar-apply">
                  Apply now <ArrowRight size={17} />
                </Link>

                <p className="job-sidebar-footnote">
                  Sign in or create an account to submit your application.
                </p>
              </section>

              <section className="job-sidebar-card job-safety-card">
                <span className="job-safety-icon">
                  <ShieldCheck size={23} />
                </span>
                <h3>Stay safe while job hunting</h3>
                <p>
                  Never pay anyone to secure a job. Verify employer details
                  and be careful with requests for sensitive information.
                </p>
                <Link href="/safety">
                  Read our safety tips <ArrowUpRight size={15} />
                </Link>
              </section>

              <section className="job-sidebar-card job-share-card">
                <div>
                  <Share2 size={18} />
                  <strong>Share this opportunity</strong>
                </div>
                <p>
                  Know someone who might be a good fit? Share this vacancy with
                  them.
                </p>
                <Link href="/login">
                  Sign in to share <ArrowRight size={15} />
                </Link>
              </section>
            </aside>
          </div>
        </section>

        <section className="job-bottom-cta">
          <div className="job-details-container">
            <div className="job-bottom-cta-inner">
              <div>
                <span>YOUR NEXT OPPORTUNITY</span>
                <h2>Ready to take the next step?</h2>
                <p>
                  Create your profile and get ready to connect with employers
                  looking for your skills.
                </p>
              </div>
              <Link href="/register">
                Get started <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default JobDetailsContent;
