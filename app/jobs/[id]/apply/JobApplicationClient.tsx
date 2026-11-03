
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CloudUpload,
  FileText,
  MapPin,
  ShieldCheck,
  Trash2,
  UserRound,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import Header from "../../../../components/Header";
import Footer from "../../../../components/Footer";
import { createClient } from "@/lib/supabase/client";

import "./application.css";

type Job = {
  id: string;
  employer_id: string;
  title: string;
  category: string | null;
  location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  application_deadline: string | null;
  status: string;
};

type ApplicationForm = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  professionalTitle: string;
  experience: string;
  skills: string;
  coverLetter: string;
};

function formatSalary(job: Job) {
  if (job.salary_min === null && job.salary_max === null) {
    return "Salary not specified";
  }

  const currency = job.currency || "NGN";

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(amount);

    return currency.toUpperCase() === "NGN"
      ? `₦${formatted}`
      : `${currency} ${formatted}`;
  };

  if (job.salary_min !== null && job.salary_max !== null) {
    return `${formatAmount(job.salary_min)} – ${formatAmount(job.salary_max)}`;
  }

  if (job.salary_min !== null) {
    return `From ${formatAmount(job.salary_min)}`;
  }

  return `Up to ${formatAmount(job.salary_max as number)}`;
}

function formatJobType(value: string | null) {
  if (!value) return "Not specified";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function JobApplicationClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [companyName, setCompanyName] = useState("Abi Job Employer");

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<ApplicationForm>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    professionalTitle: "",
    experience: "",
    skills: "",
    coverLetter: "",
  });

  const loadApplicationData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace(
          `/login?redirect=${encodeURIComponent(`/jobs/${jobId}/apply`)}`
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "role, full_name, phone, location, headline, skills, experience"
        )
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Your profile could not be loaded. Please try again.");
      }

      if (profile.role !== "job_seeker") {
        if (profile.role === "professional") {
          router.replace("/professional/dashboard");
        } else if (profile.role === "employer") {
          router.replace("/employer/dashboard");
        } else {
          router.replace("/login");
        }

        return;
      }

      const { data: jobData, error: jobError } = await supabase
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
          currency,
          description,
          requirements,
          responsibilities,
          application_deadline,
          status
        `)
        .eq("id", jobId)
        .eq("status", "approved")
        .maybeSingle();

      if (jobError) {
        throw jobError;
      }

      if (!jobData) {
        throw new Error(
          "This vacancy is unavailable or is no longer accepting applications."
        );
      }

      if (
        jobData.application_deadline &&
        new Date(jobData.application_deadline).getTime() <
          new Date().setHours(0, 0, 0, 0)
      ) {
        throw new Error("The application deadline for this vacancy has passed.");
      }

      setJob(jobData as Job);

      const { data: employerProfile } = await supabase
        .from("employer_profiles")
        .select("business_name")
        .eq("id", jobData.employer_id)
        .maybeSingle();

      if (employerProfile?.business_name) {
        setCompanyName(employerProfile.business_name);
      }

      setForm({
        fullName: profile.full_name || "",
        email: user.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        professionalTitle: profile.headline || "",
        experience: profile.experience || "",
        skills: Array.isArray(profile.skills)
          ? profile.skills.join(", ")
          : "",
        coverLetter: "",
      });
    } catch (err) {
      console.error("Application page loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, router, jobId]);

  useEffect(() => {
    loadApplicationData();
  }, [loadApplicationData]);

  const updateField = (
    field: keyof ApplicationForm,
    value: string
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };

  const handleCvUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [".pdf", ".doc", ".docx"];

    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (
      !allowedTypes.includes(file.type) ||
      !allowedExtensions.includes(extension)
    ) {
      setError("Please upload your CV as a PDF or Word document.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your CV must not be larger than 5MB.");
      event.target.value = "";
      return;
    }

    setCv(file);
    setError("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (
        !form.fullName.trim() ||
        !form.email.trim() ||
        !form.phone.trim() ||
        !form.location.trim()
      ) {
        setError("Please complete all required personal information.");
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }

    if (step === 2) {
      if (!cv) {
        setError("Please attach your CV before continuing.");
        return false;
      }

      if (!form.professionalTitle.trim() || !form.skills.trim()) {
        setError(
          "Please provide your professional title and key skills."
        );
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleContinue = () => {
    if (!validateStep()) return;

    setStep((current) => Math.min(current + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep() || !job || !cv) return;

    setSubmitting(true);
    setError("");

    let uploadedFilePath: string | null = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: existingApplication, error: existingError } =
        await supabase
          .from("job_applications")
          .select("job_id")
          .eq("job_id", job.id)
          .eq("applicant_id", user.id)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingApplication) {
        throw new Error(
          "You have already applied for this job. You cannot submit another application."
        );
      }

      const extension = cv.name
        .substring(cv.name.lastIndexOf("."))
        .toLowerCase();

      const safeFileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

      uploadedFilePath = `${user.id}/job_seeker/applications/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("abi-job-profile-files")
        .upload(uploadedFilePath, cv, {
          cacheControl: "3600",
          upsert: false,
          contentType: cv.type,
        });

      if (uploadError) {
        throw new Error(
          `CV upload failed: ${uploadError.message}. Please check your CV storage permissions.`
        );
      }

      const { error: applicationError } = await supabase
        .from("job_applications")
        .insert({
          job_id: job.id,
          cover_letter: form.coverLetter.trim() || null,
          cv_path: uploadedFilePath,
        });

      if (applicationError) {
        await supabase.storage
          .from("abi-job-profile-files")
          .remove([uploadedFilePath]);

        uploadedFilePath = null;

        if (applicationError.code === "23505") {
          throw new Error(
            "You have already applied for this job."
          );
        }

        throw applicationError;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Application submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Your application could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (size: number) => {
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(0)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="application-page">
          <div className="application-loading">
            <LoaderCircle size={34} className="animate-spin" />
            <p>Loading your application...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error && !job) {
    return (
      <>
        <Header />
        <main className="application-page">
          <section className="application-success">
            <div className="success-icon">
              <AlertCircle size={42} />
            </div>
            <span className="success-eyebrow">APPLICATION UNAVAILABLE</span>
            <h1>We couldn't open this vacancy.</h1>
            <p>{error}</p>
            <div className="success-actions">
              <Link href="/jobs" className="application-primary-btn">
                Browse available jobs
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (!job) return null;

  if (submitted) {
    return (
      <>
        <Header />

        <main className="application-page">
          <section className="application-success">
            <div className="success-icon">
              <CheckCircle2 size={42} />
            </div>

            <span className="success-eyebrow">
              APPLICATION SUBMITTED
            </span>

            <h1>Your application has been received!</h1>

            <p>
              Your application for <strong>{job.title}</strong> at{" "}
              <strong>{companyName}</strong> has been saved successfully.
            </p>

            <div className="success-notice">
              <ShieldCheck size={21} />
              <span>
                Your application is now marked as Submitted. You can
                follow its progress from your applications dashboard.
              </span>
            </div>

            <div className="success-actions">
              <Link
                href="/applications"
                className="application-primary-btn"
              >
                View my applications
                <ArrowRight size={18} />
              </Link>

              <Link href="/jobs" className="application-secondary-btn">
                Explore more jobs
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="application-page">
        <div className="application-container">
          <Link href="/jobs" className="application-back-link">
            <ArrowLeft size={17} />
            Back to job opportunities
          </Link>

          <div className="application-heading">
            <div>
              <span className="application-eyebrow">CAREER OPPORTUNITY</span>
              <h1>Apply for this job</h1>
              <p>
                Complete your application carefully. Make your experience
                count.
              </p>
            </div>

            <div className="application-job-summary">
              <div className="application-job-icon">
                <BriefcaseBusiness size={23} />
              </div>

              <div>
                <h3>{job.title}</h3>
                <p>{companyName}</p>
                <div className="application-job-meta">
                  <span>
                    <MapPin size={14} />
                    {job.location || "Location not specified"}
                  </span>
                  <span>{formatJobType(job.employment_type)}</span>
                </div>
                <strong className="application-job-salary">
                  {formatSalary(job)}
                </strong>
              </div>
            </div>
          </div>

          <div className="application-layout">
            <aside className="application-sidebar">
              <div className="application-progress-card">
                <span className="progress-label">APPLICATION PROGRESS</span>
                <h3>Almost there.</h3>
                <p>
                  Complete each stage to prepare your application for review.
                </p>

                <div className="application-progress-track">
                  <div
                    className="application-progress-fill"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>

                <span className="progress-percentage">
                  {Math.round((step / 3) * 100)}% completed
                </span>
              </div>

              <div className="application-steps">
                <div className={`application-step ${step >= 1 ? "active" : ""}`}>
                  <div className="step-number">
                    {step > 1 ? <Check size={17} /> : "01"}
                  </div>
                  <div>
                    <strong>Your details</strong>
                    <span>Personal information</span>
                  </div>
                </div>

                <div className="step-connector" />

                <div className={`application-step ${step >= 2 ? "active" : ""}`}>
                  <div className="step-number">
                    {step > 2 ? <Check size={17} /> : "02"}
                  </div>
                  <div>
                    <strong>Your application</strong>
                    <span>CV and experience</span>
                  </div>
                </div>

                <div className="step-connector" />

                <div className={`application-step ${step >= 3 ? "active" : ""}`}>
                  <div className="step-number">03</div>
                  <div>
                    <strong>Review</strong>
                    <span>Check your information</span>
                  </div>
                </div>
              </div>

              <div className="application-security">
                <ShieldCheck size={21} />
                <div>
                  <strong>Your information matters</strong>
                  <p>
                    Your application details should only be shared with the
                    relevant employer.
                  </p>
                </div>
              </div>
            </aside>

            <section className="application-form-card">
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="application-form-section">
                    <div className="form-section-heading">
                      <div className="form-section-icon">
                        <UserRound size={22} />
                      </div>
                      <div>
                        <h2>Personal information</h2>
                        <p>Tell the employer how to reach you.</p>
                      </div>
                    </div>

                    <div className="application-fields">
                      <div className="application-field full-field">
                        <label htmlFor="fullName">Full name *</label>
                        <input
                          id="fullName"
                          type="text"
                          value={form.fullName}
                          onChange={(event) =>
                            updateField("fullName", event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="application-field">
                        <label htmlFor="email">Email address *</label>
                        <input
                          id="email"
                          type="email"
                          value={form.email}
                          readOnly
                          required
                        />
                      </div>

                      <div className="application-field">
                        <label htmlFor="phone">Phone number *</label>
                        <input
                          id="phone"
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={form.phone}
                          onChange={(event) =>
                            updateField("phone", event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="application-field full-field">
                        <label htmlFor="location">Current location *</label>
                        <input
                          id="location"
                          type="text"
                          placeholder="e.g. Aba, Abia State"
                          value={form.location}
                          onChange={(event) =>
                            updateField("location", event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="application-form-section">
                    <div className="form-section-heading">
                      <div className="form-section-icon">
                        <FileText size={22} />
                      </div>
                      <div>
                        <h2>Your professional profile</h2>
                        <p>Help the employer understand what you can offer.</p>
                      </div>
                    </div>

                    <div className="application-fields">
                      <div className="application-field">
                        <label htmlFor="professionalTitle">
                          Professional title *
                        </label>
                        <input
                          id="professionalTitle"
                          type="text"
                          placeholder="e.g. Frontend Developer"
                          value={form.professionalTitle}
                          onChange={(event) =>
                            updateField("professionalTitle", event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="application-field">
                        <label htmlFor="experience">Years of experience</label>
                        <select
                          id="experience"
                          value={form.experience}
                          onChange={(event) =>
                            updateField("experience", event.target.value)
                          }
                        >
                          <option value="">Select experience</option>
                          <option value="No experience yet">No experience yet</option>
                          <option value="Less than 1 year">Less than 1 year</option>
                          <option value="1–2 years">1–2 years</option>
                          <option value="3–5 years">3–5 years</option>
                          <option value="6–10 years">6–10 years</option>
                          <option value="More than 10 years">
                            More than 10 years
                          </option>
                        </select>
                      </div>

                      <div className="application-field full-field">
                        <label htmlFor="skills">Key skills *</label>
                        <textarea
                          id="skills"
                          rows={3}
                          placeholder="List your relevant skills, separated by commas."
                          value={form.skills}
                          onChange={(event) =>
                            updateField("skills", event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="application-field full-field">
                        <label>Upload your CV *</label>

                        {!cv ? (
                          <label className="cv-upload-area">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleCvUpload}
                            />
                            <div className="cv-upload-icon">
                              <CloudUpload size={27} />
                            </div>
                            <strong>Choose a file or drag it here</strong>
                            <span>PDF or Word document · Maximum 5MB</span>
                          </label>
                        ) : (
                          <div className="uploaded-cv">
                            <div className="uploaded-cv-icon">
                              <FileText size={23} />
                            </div>
                            <div className="uploaded-cv-info">
                              <strong>{cv.name}</strong>
                              <span>{formatFileSize(cv.size)}</span>
                            </div>
                            <button
                              type="button"
                              className="remove-cv-btn"
                              onClick={() => setCv(null)}
                              aria-label="Remove CV"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="application-field full-field">
                        <label htmlFor="coverLetter">
                          Cover letter
                          <span className="optional-label">Optional</span>
                        </label>
                        <textarea
                          id="coverLetter"
                          rows={6}
                          placeholder="Introduce yourself and explain why you are a good fit for this opportunity..."
                          value={form.coverLetter}
                          onChange={(event) =>
                            updateField("coverLetter", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="application-form-section">
                    <div className="form-section-heading">
                      <div className="form-section-icon">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <h2>Review your application</h2>
                        <p>Make sure everything is correct before submitting.</p>
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-card-heading">
                        <h3>Personal information</h3>
                        <button type="button" onClick={() => setStep(1)}>
                          Edit
                        </button>
                      </div>
                      <div className="review-grid">
                        <div>
                          <span>Full name</span>
                          <strong>{form.fullName}</strong>
                        </div>
                        <div>
                          <span>Email address</span>
                          <strong>{form.email}</strong>
                        </div>
                        <div>
                          <span>Phone number</span>
                          <strong>{form.phone}</strong>
                        </div>
                        <div>
                          <span>Location</span>
                          <strong>{form.location}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-card-heading">
                        <h3>Professional information</h3>
                        <button type="button" onClick={() => setStep(2)}>
                          Edit
                        </button>
                      </div>
                      <div className="review-grid">
                        <div>
                          <span>Professional title</span>
                          <strong>{form.professionalTitle}</strong>
                        </div>
                        <div>
                          <span>Experience</span>
                          <strong>{form.experience || "Not specified"}</strong>
                        </div>
                        <div className="review-full">
                          <span>Key skills</span>
                          <strong>{form.skills}</strong>
                        </div>
                        <div className="review-full">
                          <span>CV attachment</span>
                          <strong className="review-file">
                            <FileText size={17} />
                            {cv?.name}
                          </strong>
                        </div>
                        <div className="review-full">
                          <span>Cover letter</span>
                          <strong className="review-cover-letter">
                            {form.coverLetter || "No cover letter provided."}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="final-confirmation">
                      <ShieldCheck size={22} />
                      <p>
                        By submitting, you confirm that the information
                        provided is accurate. Your application will be
                        delivered to the employer for review.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="application-error" role="alert">
                    {error}
                  </div>
                )}

                <div className="application-form-actions">
                  {step > 1 ? (
                    <button
                      type="button"
                      className="application-back-btn"
                      onClick={handleBack}
                      disabled={submitting}
                    >
                      <ArrowLeft size={17} />
                      Back
                    </button>
                  ) : (
                    <span className="required-note">* Required fields</span>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      className="application-continue-btn"
                      onClick={handleContinue}
                    >
                      Continue
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="application-continue-btn"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle size={18} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit application
                          <CheckCircle2 size={18} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
