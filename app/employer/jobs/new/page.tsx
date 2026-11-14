
"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Bell,
  Send,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Logo from "../../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./create-job.css";
import "../jobs.css";

type JobForm = {
  title: string;
  category: string;
  employmentType: string;
  workplace: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  responsibilities: string;
  requirements: string;
  deadline: string;
  contactEmail: string;
};

const initialForm: JobForm = {
  title: "",
  category: "",
  employmentType: "",
  workplace: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  description: "",
  responsibilities: "",
  requirements: "",
  deadline: "",
  contactEmail: "",
};

export default function CreateJobPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<JobForm>(initialForm);
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [companyName, setCompanyName] = useState("Your Company");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function verifyEmployer() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || profile?.role !== "employer") {
          if (profile?.role === "job_seeker") {
            router.replace("/dashboard");
          } else if (profile?.role === "professional") {
            router.replace("/professional/dashboard");
          } else if (profile?.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/login");
          }
          return;
        }

        const { data: employer, error: employerError } = await supabase
          .from("employer_profiles")
          .select("business_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (employerError) {
          throw employerError;
        }

        if (!mounted) return;

        if (employer?.business_name) {
          setCompanyName(employer.business_name);
        }

        setAuthChecking(false);
      } catch (error) {
        console.error("Employer verification error:", error);

        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to verify your employer account."
          );
          setAuthChecking(false);
        }
      }
    }

    verifyEmployer();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (form.salaryMin && form.salaryMax) {
      if (Number(form.salaryMax) < Number(form.salaryMin)) {
        setErrorMessage(
          "Maximum salary cannot be lower than minimum salary."
        );
        return;
      }
    }

    if (
      (form.salaryMin && Number(form.salaryMin) < 0) ||
      (form.salaryMax && Number(form.salaryMax) < 0)
    ) {
      setErrorMessage("Salary cannot be a negative amount.");
      return;
    }

    setShowPreview(true);
    setSubmitted(false);
  }

  async function handleSubmit() {
    if (saving) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "employer") {
        setErrorMessage(
          "Only an authenticated employer account can submit a job vacancy."
        );
        return;
      }

      const { error: insertError } = await supabase.from("jobs").insert({
        employer_id: user.id,
        title: form.title.trim(),
        category: form.category,
        employment_type: form.employmentType,
        workplace: form.workplace,
        location: form.location.trim(),
        salary_min: form.salaryMin ? Number(form.salaryMin) : null,
        salary_max: form.salaryMax ? Number(form.salaryMax) : null,
        description: form.description.trim(),
        responsibilities: form.responsibilities.trim(),
        requirements: form.requirements.trim(),
        application_deadline: form.deadline,
        contact_email: form.contactEmail.trim(),
      });

      if (insertError) {
        console.error("Job submission error:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });

        setErrorMessage(
          insertError.message ||
            "Your job could not be submitted. Please try again."
        );
        return;
      }

      setSubmitted(true);
      setShowPreview(false);
    } catch (error) {
      console.error("Unexpected job submission error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your vacancy. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatSalary(value: string) {
    if (!value) return "";
    return Number(value).toLocaleString("en-NG");
  }

  if (authChecking) {
    return (
      <main className="employer-jobs-page create-job-workspace">
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            color: "#176b45",
            fontWeight: 700,
            fontSize: "17px",
          }}
        >
          Verifying employer account...
        </div>
      </main>
    );
  }

  return (
    <main className="employer-jobs-page create-job-workspace">
      <aside className="employer-jobs-sidebar">
        <div className="employer-jobs-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="employer-jobs-company">
          <div className="company-avatar">
            <Building2 size={22} />
          </div>

          <div>
            <strong>{companyName}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="employer-jobs-nav-label">WORKSPACE</p>

        <nav className="employer-jobs-nav">
          <Link href="/employer/dashboard">
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </Link>

          <Link href="/employer/jobs" className="active">
            <FileText size={18} />
            <span>My job posts</span>
          </Link>

          <Link href="/employer/applicants">
            <Users size={18} />
            <span>Applicants</span>
          </Link>

          <Link href="/employer/messages">
            <MessageSquare size={18} />
            <span>Messages</span>
          </Link>

          <Link href="/employer/notifications">
            <Bell size={18} />
            <span>Notifications</span>
          </Link>

          <Link href="/employer/profile">
            <Building2 size={18} />
            <span>Company profile</span>
          </Link>
        </nav>

        <p className="employer-jobs-nav-label settings-label">
          PREFERENCES
        </p>

        <nav className="employer-jobs-nav">
          <Link href="/employer/settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="employer-jobs-sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              <Users size={19} />
            </div>

            <strong>Need a hand?</strong>

            <p>
              Get help with posting jobs and managing applicants.
            </p>

            <Link href="/support">
              Visit help centre <ArrowRight size={14} />
            </Link>
          </div>

          <Link href="/" className="back-to-platform">
            <ArrowLeft size={16} />
            Back to Abijob
          </Link>
        </div>
      </aside>

      <section className="employer-jobs-main">
        <header className="employer-jobs-topbar">
          <div>
            <span className="topbar-eyebrow">EMPLOYER WORKSPACE</span>
            <p>Manage your recruitment activities</p>
          </div>

          <div className="topbar-profile">
            <div className="topbar-company-icon">
              <Building2 size={19} />
            </div>

            <div>
              <strong>{companyName}</strong>
              <span>Employer</span>
            </div>
          </div>
        </header>

        <div className="employer-jobs-content create-job-content">
          <Link href="/employer/jobs" className="create-job-back">
            <ArrowLeft size={17} />
            Back to job vacancies
          </Link>

          <div className="create-job-heading">
            <div>
              <span className="create-job-eyebrow">
                RECRUITMENT CENTRE
              </span>

              <h1>Create a job vacancy</h1>

              <p>
                Share an opportunity with talented people across Abia State.
                Complete the details below to prepare your vacancy.
              </p>
            </div>

            <div className="create-job-heading-icon">
              <BriefcaseBusiness size={27} />
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              style={{
                padding: "14px 18px",
                marginBottom: "20px",
                borderRadius: "12px",
                background: "#fff0ef",
                border: "1px solid #f2c3bf",
                color: "#a32920",
                fontWeight: 600,
              }}
            >
              {errorMessage}
            </div>
          )}

          {submitted ? (
            <section className="create-job-success">
              <div className="create-job-success-icon">
                <CheckCircle2 size={34} />
              </div>

              <h2>Vacancy submitted successfully!</h2>

              <p>
                Your job vacancy has been saved to Abijob and sent for
                administrative review. You can check its status under My job
                posts.
              </p>

              <div className="create-job-review-note">
                <strong>Publication status</strong>
                <span>Pending admin approval — not yet published</span>
              </div>

              <button
                type="button"
                className="create-job-primary"
                onClick={() => {
                  setSubmitted(false);
                  setShowPreview(false);
                  setForm(initialForm);
                  setErrorMessage("");
                }}
              >
                Create another vacancy
              </button>

              <Link
                href="/employer/jobs"
                className="create-job-return-link"
              >
                Return to my job posts
              </Link>
            </section>
          ) : showPreview ? (
            <section className="create-job-preview">
              <div className="create-job-preview-top">
                <div>
                  <span className="create-job-eyebrow">
                    VACANCY PREVIEW
                  </span>

                  <h2>{form.title}</h2>

                  <p>
                    {form.category} · {form.employmentType}
                  </p>
                </div>

                <span className="create-job-preview-status">
                  <Clock3 size={14} />
                  Awaiting review
                </span>
              </div>

              <div className="create-job-preview-meta">
                <span>
                  <MapPin size={16} />
                  {form.location}
                </span>

                <span>
                  <Wallet size={16} />
                  {form.salaryMin || form.salaryMax
                    ? `₦${formatSalary(form.salaryMin)} – ₦${formatSalary(
                        form.salaryMax
                      )}`
                    : "Salary not specified"}
                </span>

                <span>
                  <CalendarDays size={16} />
                  Deadline: {form.deadline}
                </span>

                <span>
                  <BriefcaseBusiness size={16} />
                  {form.workplace}
                </span>
              </div>

              <div className="create-job-preview-section">
                <h3>About the role</h3>
                <p>{form.description}</p>
              </div>

              <div className="create-job-preview-section">
                <h3>Responsibilities</h3>
                <p>{form.responsibilities}</p>
              </div>

              <div className="create-job-preview-section">
                <h3>Requirements</h3>
                <p>{form.requirements}</p>
              </div>

              <div className="create-job-preview-section">
                <h3>Application contact</h3>
                <p>{form.contactEmail}</p>
              </div>

              <div className="create-job-preview-notice">
                <strong>Before publication</strong>

                <p>
                  Every job vacancy must be reviewed and approved by the
                  Abijob administration team before it appears publicly.
                </p>
              </div>

              <div className="create-job-preview-actions">
                <button
                  type="button"
                  className="create-job-secondary"
                  onClick={() => setShowPreview(false)}
                  disabled={saving}
                >
                  <ArrowLeft size={16} />
                  Edit details
                </button>

                <button
                  type="button"
                  className="create-job-primary"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  <Send size={16} />
                  {saving ? "Submitting..." : "Submit for review"}
                </button>
              </div>
            </section>
          ) : (
            <form className="create-job-form" onSubmit={handlePreview}>
              <section className="create-job-section">
                <div className="create-job-section-heading">
                  <div className="create-job-section-icon">
                    <BriefcaseBusiness size={19} />
                  </div>

                  <div>
                    <h2>Job information</h2>
                    <p>Start with the basic details of the vacancy.</p>
                  </div>
                </div>

                <div className="create-job-fields">
                  <div className="create-job-field full">
                    <label htmlFor="title">Job title *</label>
                    <input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Customer Service Officer"
                      required
                    />
                  </div>

                  <div className="create-job-field">
                    <label htmlFor="category">Job category *</label>
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Technology">Technology</option>
                      <option value="Administration">Administration</option>
                      <option value="Sales and Marketing">Sales and Marketing</option>
                      <option value="Finance and Accounting">Finance and Accounting</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Creative and Design">Creative and Design</option>
                      <option value="Skilled Trades">Skilled Trades</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="create-job-field">
                    <label htmlFor="employmentType">Employment type *</label>
                    <select
                      id="employmentType"
                      name="employmentType"
                      value={form.employmentType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select employment type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Internship">Internship</option>
                      <option value="Apprenticeship">Apprenticeship</option>
                    </select>
                  </div>

                  <div className="create-job-field">
                    <label htmlFor="workplace">Work arrangement *</label>
                    <select
                      id="workplace"
                      name="workplace"
                      value={form.workplace}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select arrangement</option>
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="create-job-field">
                    <label htmlFor="location">Job location *</label>
                    <input
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Aba, Abia State"
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="create-job-section">
                <div className="create-job-section-heading">
                  <div className="create-job-section-icon">
                    <Wallet size={19} />
                  </div>

                  <div>
                    <h2>Salary and application deadline</h2>
                    <p>Help applicants understand the offer.</p>
                  </div>
                </div>

                <div className="create-job-fields">
                  <div className="create-job-field">
                    <label htmlFor="salaryMin">Minimum salary (₦)</label>
                    <input
                      id="salaryMin"
                      name="salaryMin"
                      type="number"
                      min="0"
                      value={form.salaryMin}
                      onChange={handleChange}
                      placeholder="e.g. 80000"
                    />
                  </div>

                  <div className="create-job-field">
                    <label htmlFor="salaryMax">Maximum salary (₦)</label>
                    <input
                      id="salaryMax"
                      name="salaryMax"
                      type="number"
                      min="0"
                      value={form.salaryMax}
                      onChange={handleChange}
                      placeholder="e.g. 150000"
                    />
                  </div>

                  <div className="create-job-field">
                    <label htmlFor="deadline">Application deadline *</label>
                    <input
                      id="deadline"
                      name="deadline"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={form.deadline}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="create-job-field">
                    <label htmlFor="contactEmail">Application email *</label>
                    <input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={form.contactEmail}
                      onChange={handleChange}
                      placeholder="careers@yourcompany.com"
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="create-job-section">
                <div className="create-job-section-heading">
                  <div className="create-job-section-icon">
                    <FileText size={19} />
                  </div>

                  <div>
                    <h2>Role description</h2>
                    <p>
                      Give applicants a clear picture of the opportunity.
                    </p>
                  </div>
                </div>

                <div className="create-job-fields single">
                  <div className="create-job-field full">
                    <label htmlFor="description">About the job *</label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe the role, your organisation and what the successful applicant will do..."
                      rows={5}
                      required
                    />
                  </div>

                  <div className="create-job-field full">
                    <label htmlFor="responsibilities">Key responsibilities *</label>
                    <textarea
                      id="responsibilities"
                      name="responsibilities"
                      value={form.responsibilities}
                      onChange={handleChange}
                      placeholder="List the main duties and responsibilities..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="create-job-field full">
                    <label htmlFor="requirements">
                      Requirements and qualifications *
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      value={form.requirements}
                      onChange={handleChange}
                      placeholder="Mention the skills, experience, education or qualifications required..."
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </section>

              <div className="create-job-form-footer">
                <p>
                  <CheckCircle2 size={16} />
                  Your vacancy will require admin approval before publication.
                </p>

                <button type="submit" className="create-job-primary">
                  <Eye size={17} />
                  Preview vacancy
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
