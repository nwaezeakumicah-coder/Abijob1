
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Lightbulb,
  Sparkles,
  UserRound,
  WandSparkles,
  Camera,
  Trash2,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import "./cv-builder.css";

type Template = "classic" | "modern" | "minimal";
type AccountType = "job-seeker" | "professional";

type CVData = {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  certifications: string;
  passportPhoto: string;
};

const initialData: CVData = {
  fullName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  experience: "",
  education: "",
  skills: "",
  certifications: "",
  passportPhoto: "",
};

const sections = [
  { id: "personal", label: "Personal details", icon: UserRound },
  { id: "summary", label: "Professional summary", icon: FileText },
  { id: "experience", label: "Work experience", icon: BriefcaseBusiness },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Award },
];

const STORAGE_PREFIX = "abijob-cv-draft";
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function getDashboardPath(accountType: AccountType) {
  return accountType === "professional"
    ? "/professional/dashboard"
    : "/dashboard";
}

function isValidTemplate(value: unknown): value is Template {
  return (
    value === "modern" ||
    value === "classic" ||
    value === "minimal"
  );
}

export default function CVBuilderPage() {
  const router = useRouter();

  const [data, setData] = useState<CVData>(initialData);
  const [template, setTemplate] = useState<Template>("modern");
  const [activeSection, setActiveSection] = useState("personal");
  const [showPreview, setShowPreview] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState("");
  const [accountType, setAccountType] =
    useState<AccountType>("job-seeker");
  const [storageKey, setStorageKey] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [photoError, setPhotoError] = useState("");

  const dashboardHref = getDashboardPath(accountType);

  // Confirm the real Supabase user and account role.
  // Browser storage is used only for CV drafts, never for authentication.
  useEffect(() => {
    let active = true;

    async function loadAccountAndDraft() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?redirect=/cv-builder");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, phone, location")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        if (
          profile.role !== "job_seeker" &&
          profile.role !== "professional"
        ) {
          if (profile.role === "employer") {
            router.replace("/employer/dashboard");
          } else if (profile.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/login");
          }
          return;
        }

        if (!active) return;

        const detectedAccount: AccountType =
          profile.role === "professional"
            ? "professional"
            : "job-seeker";

        setAccountType(detectedAccount);

        // Drafts are separated by the authenticated user's unique ID.
        const userStorageKey = `${STORAGE_PREFIX}-${user.id}`;
        setStorageKey(userStorageKey);

        let savedData: Partial<CVData> = {};
        let savedTemplate: Template = "modern";
        let savedAt = "";

        try {
          let savedDraft = window.localStorage.getItem(userStorageKey);

          // Migrate an older role-based draft if a user has one.
          if (!savedDraft) {
            const oldKey = `${STORAGE_PREFIX}-${detectedAccount}`;
            savedDraft = window.localStorage.getItem(oldKey);
          }

          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);

            if (parsed && typeof parsed === "object") {
              if (parsed.data && typeof parsed.data === "object") {
                savedData = parsed.data;
              }

              if (isValidTemplate(parsed.template)) {
                savedTemplate = parsed.template;
              }

              savedAt =
                typeof parsed.savedAt === "string"
                  ? parsed.savedAt
                  : "";
            }
          }
        } catch {
          savedData = {};
          savedTemplate = "modern";
          savedAt = "";
        }

        if (!active) return;

        // Prefill profile details only when the CV draft has no value.
        setData({
          ...initialData,
          ...savedData,
          fullName:
            savedData.fullName?.trim() ||
            profile.full_name ||
            "",
          email:
            savedData.email?.trim() ||
            user.email ||
            "",
          phone:
            savedData.phone?.trim() ||
            profile.phone ||
            "",
          location:
            savedData.location?.trim() ||
            profile.location ||
            "",
        });

        setTemplate(savedTemplate);
        setLastSaved(savedAt);
        setIsHydrated(true);
      } catch (error) {
        console.error("CV Builder account loading error:", error);

        if (active) {
          setSummaryMessage(
            "We could not load your account. Please refresh the page or sign in again."
          );
        }
      } finally {
        if (active) {
          setIsLoadingAccount(false);
        }
      }
    }

    loadAccountAndDraft();

    return () => {
      active = false;
    };
  }, [router]);

  // Save the CV draft separately for each authenticated user.
  useEffect(() => {
    if (!isHydrated || !storageKey) return;

    const savedAt = new Date().toISOString();

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          data,
          template,
          savedAt,
        })
      );

      setLastSaved(savedAt);
    } catch {
      setSummaryMessage(
        "Your browser could not save this draft. The photograph may be too large, or browser storage may be full. Try using a smaller photo."
      );
    }
  }, [data, template, storageKey, isHydrated]);

  const updateField = (field: keyof CVData, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Please upload a JPG, PNG or WebP photograph.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("Your photograph must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("passportPhoto", reader.result);
        setSummaryMessage("Your passport photograph has been added.");
      }
    };

    reader.onerror = () => {
      setPhotoError("We could not read that photograph. Please try again.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removePhoto = () => {
    updateField("passportPhoto", "");
    setPhotoError("");
  };

  const completion = useMemo(() => {
    const fields = [
      data.fullName,
      data.professionalTitle,
      data.email,
      data.phone,
      data.location,
      data.summary,
      data.experience,
      data.education,
      data.skills,
    ];

    const completed = fields.filter(
      (field) => field.trim().length > 0
    ).length;

    return Math.round((completed / fields.length) * 100);
  }, [data]);

  const skillList = useMemo(
    () =>
      data.skills
        .split(/[\n,]+/)
        .map((skill) => skill.trim())
        .filter(Boolean),
    [data.skills]
  );

  const generateSummary = () => {
    if (!data.professionalTitle.trim() && !data.skills.trim()) {
      setSummaryMessage(
        "Add your professional title and skills first so the assistant can suggest a relevant summary."
      );
      return;
    }

    const skills = data.skills
      .split(/[\n,]+/)
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 4);

    const skillText =
      skills.length > 0
        ? ` My key skills include ${skills.join(", ")}.`
        : "";

    const suggestion = `Motivated ${
      data.professionalTitle || "professional"
    } with a strong interest in delivering quality work and contributing to team success. I bring a practical approach to problem-solving, a willingness to learn, and a commitment to continuous improvement.${skillText}`;

    updateField("summary", suggestion);

    setSummaryMessage(
      "A draft suggestion has been added. Review and edit it to reflect your actual experience."
    );
  };

  const loadSample = () => {
    setData({
      fullName: "Adaeze Okafor",
      professionalTitle: "Graphic Designer",
      email: "adaeze@example.com",
      phone: "+234 800 000 0000",
      location: "Aba, Abia State, Nigeria",
      website: "portfolio.example.com",
      summary:
        "Creative graphic designer with experience developing visual identities, marketing materials and digital designs. Passionate about clear communication, thoughtful design and helping businesses build memorable brands.",
      experience:
        "Graphic Designer | Creative Studio, Aba\nJanuary 2024 – Present\n• Designed brand identities and marketing materials for small businesses.\n• Created social media graphics and promotional artwork.\n• Worked with clients to understand project requirements and deliver designs on schedule.\n\nDesign Assistant | Print House, Aba\nJune 2022 – December 2023\n• Prepared print-ready artwork and edited customer designs.\n• Assisted with layout, typography and production checks.",
      education:
        "Higher National Diploma in Graphic Design\nAbia State Polytechnic | 2020 – 2022",
      skills:
        "CorelDRAW\nAdobe Photoshop\nBrand Identity Design\nTypography\nSocial Media Design\nCommunication",
      certifications:
        "Professional Graphic Design Certificate | 2023",
      passportPhoto: "",
    });

    setActiveSection("personal");
    setSummaryMessage(
      "Sample CV information loaded. Replace it with your own details."
    );
  };

  const clearDraft = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all your CV information and photograph? This action cannot be undone."
    );

    if (!confirmed) return;

    setData(initialData);
    setTemplate("modern");
    setPhotoError("");
    setSummaryMessage("Your CV has been cleared.");
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const formattedSavedTime = lastSaved
    ? new Date(lastSaved).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (isLoadingAccount || !isHydrated) {
    return (
      <main className="cv-builder-page cv-loading-page">
        <div className="cv-loading-card">
          <Image
            src="/images/abijob-logo-green.png"
            alt="Abi Job"
            width={142}
            height={48}
            priority
          />
          <div className="cv-loading-spinner" />
          <h2>Preparing your CV Builder</h2>
          <p>Checking your account and loading your saved CV draft...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="cv-builder-page">
      <header className="cv-topbar">
        <div className="cv-topbar-inner">
          <Link href={dashboardHref} className="cv-back-link">
            <ArrowLeft size={17} />
            <span>Back to dashboard</span>
          </Link>

          <Link href="/" className="cv-brand">
            <Image
              src="/images/abijob-logo-green.png"
              alt="Abi Job"
              width={142}
              height={48}
              priority
            />
          </Link>

          <div className="cv-topbar-right">
            <span className="cv-save-indicator">
              <Check size={14} />
              <span>
                {formattedSavedTime
                  ? `Saved ${formattedSavedTime}`
                  : "Auto-save ready"}
              </span>
            </span>

            <button
              className="cv-topbar-download"
              onClick={handlePrint}
              type="button"
            >
              <Download size={16} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      <section className="cv-page-heading">
        <div>
          <div className="cv-eyebrow">
            <Sparkles size={15} />
            CAREER TOOLS
          </div>

          <h1>Build a CV that opens doors.</h1>

          <p>
            Create a professional CV, highlight your strengths and get ready
            for your next opportunity.
          </p>
        </div>

        <div className="cv-completion-card">
          <div className="cv-completion-top">
            <span>CV completion</span>
            <strong>{completion}%</strong>
          </div>

          <div className="cv-completion-track">
            <span style={{ width: `${completion}%` }} />
          </div>

          <small>
            Complete each section to strengthen your CV.
          </small>
        </div>
      </section>

      <div className="cv-workspace">
        <aside className="cv-editor-sidebar">
          <div className="cv-sidebar-heading">
            <span>YOUR CV</span>
            <strong>Build your profile</strong>
          </div>

          <nav className="cv-section-nav">
            {sections.map((section, index) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={
                    activeSection === section.id ? "active" : ""
                  }
                  onClick={() => scrollToSection(section.id)}
                >
                  <span className="cv-section-number">{index + 1}</span>
                  <Icon size={17} />
                  <span>{section.label}</span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </nav>

          <div className="cv-sidebar-tip">
            <span className="cv-tip-icon">
              <Lightbulb size={19} />
            </span>

            <strong>Make your CV stand out</strong>

            <p>
              Use clear language, include relevant skills and focus on
              achievements you can explain.
            </p>
          </div>

          <button
            className="cv-sample-button"
            onClick={loadSample}
            type="button"
          >
            <WandSparkles size={16} />
            Load sample CV
          </button>

          <button
            className="cv-clear-button"
            onClick={clearDraft}
            type="button"
          >
            Clear CV information
          </button>
        </aside>

        <section className="cv-editor">
          <div className="cv-editor-heading">
            <div>
              <span className="cv-editor-kicker">CV INFORMATION</span>
              <h2>Tell us about yourself</h2>
              <p>
                Add accurate information. You can edit every section at any
                time.
              </p>
            </div>

            <button
              className="cv-preview-mobile-button"
              onClick={() => setShowPreview(!showPreview)}
              type="button"
            >
              <Eye size={16} />
              {showPreview ? "Hide preview" : "Preview CV"}
            </button>
          </div>

          <div className="cv-form-section" id="personal">
            <div className="cv-form-section-heading">
              <span className="cv-form-icon">
                <UserRound size={19} />
              </span>

              <div>
                <h3>Personal details</h3>
                <p>How employers can identify and contact you.</p>
              </div>
            </div>

            <div className="cv-passport-upload">
              <div className="cv-passport-preview">
                {data.passportPhoto ? (
                  <Image
                    src={data.passportPhoto}
                    alt="Your CV passport photograph"
                    width={112}
                    height={132}
                    unoptimized
                  />
                ) : (
                  <div className="cv-passport-placeholder">
                    <Camera size={27} />
                    <span>Passport photo</span>
                  </div>
                )}
              </div>

              <div className="cv-passport-details">
                <strong>Passport photograph</strong>
                <p>
                  Add a clear, professional photograph. It is optional and
                  will appear on your CV.
                </p>

                <div className="cv-passport-actions">
                  <label className="cv-passport-upload-button">
                    <Camera size={15} />
                    {data.passportPhoto ? "Replace photo" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  {data.passportPhoto && (
                    <button
                      className="cv-passport-remove-button"
                      type="button"
                      onClick={removePhoto}
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  )}
                </div>

                <small>JPG, PNG or WebP · Maximum 2MB · Optional</small>

                {photoError && (
                  <p className="cv-photo-error" role="alert">
                    {photoError}
                  </p>
                )}
              </div>
            </div>

            <div className="cv-fields-grid">
              <label className="cv-field cv-field-full">
                <span>Full name</span>
                <input
                  value={data.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  placeholder="e.g. Adaeze Okafor"
                />
              </label>

              <label className="cv-field cv-field-full">
                <span>Professional title</span>
                <input
                  value={data.professionalTitle}
                  onChange={(event) =>
                    updateField("professionalTitle", event.target.value)
                  }
                  placeholder="e.g. Graphic Designer"
                />
              </label>

              <label className="cv-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={data.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label className="cv-field">
                <span>Phone number</span>
                <input
                  value={data.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  placeholder="+234 800 000 0000"
                />
              </label>

              <label className="cv-field">
                <span>Location</span>
                <input
                  value={data.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  placeholder="e.g. Aba, Abia State"
                />
              </label>

              <label className="cv-field">
                <span>
                  Portfolio or website <small>Optional</small>
                </span>
                <input
                  value={data.website}
                  onChange={(event) =>
                    updateField("website", event.target.value)
                  }
                  placeholder="yourportfolio.com"
                />
              </label>
            </div>
          </div>

          <div className="cv-form-section" id="summary">
            <div className="cv-form-section-heading">
              <span className="cv-form-icon">
                <FileText size={19} />
              </span>

              <div>
                <h3>Professional summary</h3>
                <p>
                  Introduce yourself and explain what you bring to a role.
                </p>
              </div>
            </div>

            <label className="cv-field">
              <span>Your summary</span>
              <textarea
                rows={5}
                value={data.summary}
                onChange={(event) =>
                  updateField("summary", event.target.value)
                }
                placeholder="Write a short introduction about your experience, strengths and career goals..."
              />

              <small className="cv-field-hint">
                Aim for 3–5 sentences that are relevant to the jobs you want.
              </small>
            </label>

            <button
              className="cv-ai-button"
              onClick={generateSummary}
              type="button"
            >
              <Sparkles size={16} />
              Suggest a summary
            </button>

            {summaryMessage && (
              <p className="cv-summary-message" role="status">
                {summaryMessage}
              </p>
            )}

            <p className="cv-feature-note">
              This is a basic writing suggestion. AI-powered CV assistance
              will be connected in a future update.
            </p>
          </div>

          <div className="cv-form-section" id="experience">
            <div className="cv-form-section-heading">
              <span className="cv-form-icon">
                <BriefcaseBusiness size={19} />
              </span>

              <div>
                <h3>Work experience</h3>
                <p>
                  Include previous jobs, internships, freelance work or
                  projects.
                </p>
              </div>
            </div>

            <label className="cv-field">
              <span>Experience details</span>
              <textarea
                rows={8}
                value={data.experience}
                onChange={(event) =>
                  updateField("experience", event.target.value)
                }
                placeholder={
                  "Job title | Company name\nMonth Year – Month Year\nDescribe your responsibilities and achievements..."
                }
              />

              <small className="cv-field-hint">
                Include your job title, employer, dates and key achievements.
              </small>
            </label>
          </div>

          <div className="cv-form-section" id="education">
            <div className="cv-form-section-heading">
              <span className="cv-form-icon">
                <GraduationCap size={20} />
              </span>

              <div>
                <h3>Education</h3>
                <p>
                  Add your academic qualifications and relevant training.
                </p>
              </div>
            </div>

            <label className="cv-field">
              <span>Education details</span>
              <textarea
                rows={4}
                value={data.education}
                onChange={(event) =>
                  updateField("education", event.target.value)
                }
                placeholder={
                  "Qualification or degree\nInstitution name | Year\nRelevant course or achievement..."
                }
              />
            </label>
          </div>

          <div className="cv-form-section" id="skills">
            <div className="cv-form-section-heading">
              <span className="cv-form-icon">
                <Award size={19} />
              </span>

              <div>
                <h3>Skills and certifications</h3>
                <p>
                  Show employers what you can do and what you have earned.
                </p>
              </div>
            </div>

            <label className="cv-field">
              <span>Skills</span>
              <textarea
                rows={4}
                value={data.skills}
                onChange={(event) =>
                  updateField("skills", event.target.value)
                }
                placeholder={
                  "Communication\nGraphic design\nMicrosoft Office\nCustomer service"
                }
              />

              <small className="cv-field-hint">
                Separate each skill with a new line or comma.
              </small>
            </label>

            <label className="cv-field cv-certification-field">
              <span>
                Certifications and achievements <small>Optional</small>
              </span>

              <textarea
                rows={3}
                value={data.certifications}
                onChange={(event) =>
                  updateField("certifications", event.target.value)
                }
                placeholder="Certificate name | Issuing organisation | Year"
              />
            </label>
          </div>

          <div className="cv-editor-footer">
            <span>
              <Check size={15} />
              Your CV draft is saved automatically in this browser.
            </span>

            <button onClick={handlePrint} type="button">
              <Download size={17} />
              Export CV as PDF
            </button>
          </div>
        </section>

        <aside
          className={`cv-preview-panel ${
            showPreview ? "mobile-open" : ""
          }`}
        >
          <div className="cv-preview-heading">
            <div>
              <span className="cv-editor-kicker">LIVE PREVIEW</span>
              <h2>Your CV</h2>
            </div>

            <button
              onClick={handlePrint}
              aria-label="Print or save as PDF"
              type="button"
            >
              <Download size={17} />
            </button>
          </div>

          <div className="cv-template-picker">
            <span>Choose a layout</span>

            <div>
              {(["modern", "classic", "minimal"] as Template[]).map(
                (item) => (
                  <button
                    key={item}
                    className={template === item ? "selected" : ""}
                    onClick={() => setTemplate(item)}
                    type="button"
                  >
                    {item === "modern"
                      ? "Modern"
                      : item === "classic"
                        ? "Classic"
                        : "Minimal"}

                    {template === item && <Check size={13} />}
                  </button>
                )
              )}
            </div>
          </div>

          <article className={`cv-paper cv-paper-${template}`}>
            <div className="cv-paper-header">
              {data.passportPhoto && (
                <div className="cv-paper-photo">
                  <Image
                    src={data.passportPhoto}
                    alt="Passport photograph"
                    width={100}
                    height={116}
                    unoptimized
                  />
                </div>
              )}

              <h1>{data.fullName || "Your Name"}</h1>

              <h2>
                {data.professionalTitle || "Your Professional Title"}
              </h2>

              <div className="cv-paper-contact">
                {data.email && <span>{data.email}</span>}
                {data.phone && <span>{data.phone}</span>}
                {data.location && <span>{data.location}</span>}
                {data.website && <span>{data.website}</span>}

                {!data.email && !data.phone && !data.location && (
                  <span>Your contact details will appear here</span>
                )}
              </div>
            </div>

            <div className="cv-paper-body">
              <section>
                <h3>Professional Summary</h3>
                <p>
                  {data.summary ||
                    "Your professional summary will appear here. Describe your experience, strengths and career goals."}
                </p>
              </section>

              <section>
                <h3>Work Experience</h3>
                <p className="cv-paper-multiline">
                  {data.experience ||
                    "Your work experience will appear here."}
                </p>
              </section>

              <section>
                <h3>Education</h3>
                <p className="cv-paper-multiline">
                  {data.education ||
                    "Your educational qualifications will appear here."}
                </p>
              </section>

              <section>
                <h3>Skills</h3>

                {skillList.length > 0 ? (
                  <div className="cv-paper-skills">
                    {skillList.map((skill, index) => (
                      <span key={`${skill}-${index}`}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p>Your skills will appear here.</p>
                )}
              </section>

              {data.certifications.trim() && (
                <section>
                  <h3>Certifications & Achievements</h3>
                  <p className="cv-paper-multiline">
                    {data.certifications}
                  </p>
                </section>
              )}
            </div>

            <div className="cv-paper-footer">
              Created with Abi Job
            </div>
          </article>

          <div className="cv-preview-note">
            <Eye size={16} />
            <p>
              This is a live preview. Use Print / Save as PDF to export your
              CV using your selected layout.
            </p>
          </div>

          <button
            className="cv-preview-export"
            onClick={handlePrint}
            type="button"
          >
            <Download size={17} />
            Print / Save as PDF
            <ArrowRight size={16} />
          </button>
        </aside>
      </div>

      <footer className="cv-builder-footer">
        <span>© 2026 Abi Job. Opportunity starts here.</span>

        <Link href="/jobs">
          Explore opportunities <ArrowRight size={14} />
        </Link>
      </footer>
    </main>
  );
}
