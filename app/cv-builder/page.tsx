"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  Plus,
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

type ExperienceEntry = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

type EducationEntry = {
  id: string;
  qualification: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

type CVData = {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string;
  certifications: string;
  passportPhoto: string;
};

type LegacyCVData = Partial<CVData> & {
  experience?: unknown;
  education?: unknown;
};

const STORAGE_PREFIX = "abijob-cv-draft";
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_PHOTO_DATA_LENGTH = 3 * 1024 * 1024;

const initialData: CVData = {
  fullName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
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

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createExperienceEntry(
  values: Partial<ExperienceEntry> = {}
): ExperienceEntry {
  return {
    id: asText(values.id) || createId(),
    jobTitle: asText(values.jobTitle),
    company: asText(values.company),
    location: asText(values.location),
    startDate: asText(values.startDate),
    endDate: asText(values.endDate),
    description: asText(values.description),
  };
}

function createEducationEntry(
  values: Partial<EducationEntry> = {}
): EducationEntry {
  return {
    id: asText(values.id) || createId(),
    qualification: asText(values.qualification),
    institution: asText(values.institution),
    location: asText(values.location),
    startDate: asText(values.startDate),
    endDate: asText(values.endDate),
    description: asText(values.description),
  };
}

function migrateLegacyExperience(value: unknown): ExperienceEntry[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object"
      )
      .map((item) =>
        createExperienceEntry({
          id: asText(item.id),
          jobTitle: asText(item.jobTitle),
          company: asText(item.company),
          location: asText(item.location),
          startDate: asText(item.startDate),
          endDate: asText(item.endDate),
          description: asText(item.description),
        })
      );
  }

  const legacyText = asText(value).trim();

  // Preserve old free-text experience instead of discarding it.
  return legacyText
    ? [
        createExperienceEntry({
          jobTitle: "Previous experience",
          description: legacyText,
        }),
      ]
    : [];
}

function migrateLegacyEducation(value: unknown): EducationEntry[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object"
      )
      .map((item) =>
        createEducationEntry({
          id: asText(item.id),
          qualification: asText(item.qualification),
          institution: asText(item.institution),
          location: asText(item.location),
          startDate: asText(item.startDate),
          endDate: asText(item.endDate),
          description: asText(item.description),
        })
      );
  }

  const legacyText = asText(value).trim();

  // Preserve old free-text education as one editable qualification.
  return legacyText
    ? [
        createEducationEntry({
          qualification: "Previous education or training",
          description: legacyText,
        }),
      ]
    : [];
}

function sanitizeCVData(value: unknown): CVData {
  if (!value || typeof value !== "object") {
    return { ...initialData };
  }

  const raw = value as LegacyCVData;
  const photo = asText(raw.passportPhoto);

  return {
    fullName: asText(raw.fullName),
    professionalTitle: asText(raw.professionalTitle),
    email: asText(raw.email),
    phone: asText(raw.phone),
    location: asText(raw.location),
    website: asText(raw.website),
    summary: asText(raw.summary),
    experience: migrateLegacyExperience(raw.experience),
    education: migrateLegacyEducation(raw.education),
    skills: asText(raw.skills),
    certifications: asText(raw.certifications),
    passportPhoto:
      photo.length <= MAX_PHOTO_DATA_LENGTH &&
      /^data:image\/(jpeg|png|webp);base64,/i.test(photo)
        ? photo
        : "",
  };
}

function formatDateRange(start: string, end: string): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  return end;
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
  const [loadError, setLoadError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const dashboardHref = getDashboardPath(accountType);

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

        if (profileError) {
          console.error("CV Builder profile lookup failed:", profileError);

          if (active) {
            setLoadError(
              "We could not verify your account details. Please refresh and try again."
            );
          }
          return;
        }

        if (!profile) {
          if (active) {
            setLoadError(
              "Your account profile could not be found. Please contact support."
            );
          }
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

        const userStorageKey = `${STORAGE_PREFIX}-${user.id}`;
        setStorageKey(userStorageKey);

        let savedDraft: string | null = null;
        let cameFromLegacyKey = false;

        try {
          savedDraft = window.localStorage.getItem(userStorageKey);

          if (!savedDraft) {
            const oldKey = `${STORAGE_PREFIX}-${detectedAccount}`;
            savedDraft = window.localStorage.getItem(oldKey);
            cameFromLegacyKey = Boolean(savedDraft);
          }
        } catch (storageError) {
          console.error("CV Builder storage read failed:", storageError);
        }

        let savedData: CVData = { ...initialData };
        let savedTemplate: Template = "modern";
        let savedAt = "";

        if (savedDraft) {
          try {
            const parsed: unknown = JSON.parse(savedDraft);

            if (parsed && typeof parsed === "object") {
              const draft = parsed as {
                data?: unknown;
                template?: unknown;
                savedAt?: unknown;
              };

              savedData = sanitizeCVData(draft.data);

              if (isValidTemplate(draft.template)) {
                savedTemplate = draft.template;
              }

              savedAt = asText(draft.savedAt);
            }
          } catch {
            setSummaryMessage(
              "An older saved draft could not be read. You can start a new CV."
            );
          }
        }

        if (!active) return;

        setData({
          ...savedData,
          fullName:
            savedData.fullName.trim() ||
            asText(profile.full_name),
          email: savedData.email.trim() || asText(user.email),
          phone: savedData.phone.trim() || asText(profile.phone),
          location: savedData.location.trim() || asText(profile.location),
        });

        setTemplate(savedTemplate);
        setLastSaved(savedAt);
        setIsHydrated(true);

        // The next autosave stores migrated drafts under the user's ID.
        if (cameFromLegacyKey) {
          setSummaryMessage(
            "Your previous CV draft has been restored and migrated to your account's browser storage."
          );
        }
      } catch (error) {
        console.error("CV Builder account loading error:", error);

        if (active) {
          setLoadError(
            "We could not load the CV Builder. Please refresh the page and try again."
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

  // Debounced local browser autosave.
  useEffect(() => {
    if (!isHydrated || !storageKey) return;

    setIsSaving(true);

    const timeout = window.setTimeout(() => {
      const savedAt = new Date().toISOString();

      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            version: 2,
            data,
            template,
            savedAt,
          })
        );

        setLastSaved(savedAt);
        setSummaryMessage((current) =>
          current.startsWith("Your browser could not save")
            ? ""
            : current
        );
      } catch (error) {
        console.error("CV Builder autosave failed:", error);
        setSummaryMessage(
          "Your browser could not save this draft. Remove or replace the photograph, or free some browser storage, then try again."
        );
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [data, template, storageKey, isHydrated]);

  const updateField = useCallback(
    (field: keyof Omit<CVData, "experience" | "education">, value: string) => {
      setData((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateExperience = (
    id: string,
    field: keyof Omit<ExperienceEntry, "id">,
    value: string
  ) => {
    setData((current) => ({
      ...current,
      experience: current.experience.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const addExperience = () => {
    setData((current) => ({
      ...current,
      experience: [...current.experience, createExperienceEntry()],
    }));
  };

  const removeExperience = (id: string) => {
    setData((current) => ({
      ...current,
      experience: current.experience.filter((entry) => entry.id !== id),
    }));
  };

  const updateEducation = (
    id: string,
    field: keyof Omit<EducationEntry, "id">,
    value: string
  ) => {
    setData((current) => ({
      ...current,
      education: current.education.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const addEducation = () => {
    setData((current) => ({
      ...current,
      education: [...current.education, createEducationEntry()],
    }));
  };

  const removeEducation = (id: string) => {
    setData((current) => ({
      ...current,
      education: current.education.filter((entry) => entry.id !== id),
    }));
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
      if (typeof reader.result !== "string") {
        setPhotoError("We could not read that photograph. Please try again.");
        return;
      }

      if (reader.result.length > MAX_PHOTO_DATA_LENGTH) {
        setPhotoError(
          "This photograph is too large to store reliably in your browser. Please choose a smaller image."
        );
        return;
      }

      updateField("passportPhoto", reader.result);
      setSummaryMessage("Your passport photograph has been added.");
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

  const skillList = useMemo(
    () =>
      data.skills
        .split(/[\n,]+/)
        .map((skill) => skill.trim())
        .filter(Boolean),
    [data.skills]
  );

  const completion = useMemo(() => {
    const fields = [
      data.fullName,
      data.professionalTitle,
      data.email,
      data.phone,
      data.location,
      data.summary,
      data.skills,
    ];

    const completed = fields.filter(
      (field) => field.trim().length > 0
    ).length;

    const hasExperience = data.experience.some(
      (entry) =>
        entry.jobTitle.trim() ||
        entry.company.trim() ||
        entry.description.trim()
    );

    const hasEducation = data.education.some(
      (entry) =>
        entry.qualification.trim() ||
        entry.institution.trim() ||
        entry.description.trim()
    );

    return Math.round(
      ((completed + Number(hasExperience) + Number(hasEducation)) / 9) * 100
    );
  }, [data]);

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
        ? ` Key skills include ${skills.join(", ")}.`
        : "";

    const suggestion = `Motivated ${
      data.professionalTitle.trim() || "professional"
    } committed to delivering quality work and contributing to team success. Brings a practical approach to problem-solving, a willingness to learn, and a commitment to continuous improvement.${skillText}`;

    updateField("summary", suggestion);

    setSummaryMessage(
      "A writing suggestion has been added. Review it and make sure it accurately represents your experience."
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
      experience: [
        createExperienceEntry({
          jobTitle: "Graphic Designer",
          company: "Creative Studio",
          location: "Aba",
          startDate: "January 2024",
          endDate: "Present",
          description:
            "Designed brand identities and marketing materials for small businesses.\nCreated social media graphics and promotional artwork.\nWorked with clients to understand requirements and deliver designs on schedule.",
        }),
        createExperienceEntry({
          jobTitle: "Design Assistant",
          company: "Print House",
          location: "Aba",
          startDate: "June 2022",
          endDate: "December 2023",
          description:
            "Prepared print-ready artwork and edited customer designs.\nAssisted with layout, typography and production checks.",
        }),
      ],
      education: [
        createEducationEntry({
          qualification: "Higher National Diploma in Graphic Design",
          institution: "Abia State Polytechnic",
          location: "Aba",
          startDate: "2020",
          endDate: "2022",
        }),
      ],
      skills:
        "CorelDRAW\nAdobe Photoshop\nBrand Identity Design\nTypography\nSocial Media Design\nCommunication",
      certifications:
        "Professional Graphic Design Certificate | 2023",
      passportPhoto: "",
    });

    setTemplate("modern");
    setActiveSection("personal");
    setSummaryMessage(
      "Sample CV information loaded. Replace it with your own accurate details."
    );
  };

  const clearDraft = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all your CV information and photograph? This action cannot be undone."
    );

    if (!confirmed) return;

    setData({ ...initialData });
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

  if (isLoadingAccount) {
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

  if (loadError || !isHydrated) {
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
          <h2>CV Builder unavailable</h2>
          <p role="alert">
            {loadError || "Your account could not be verified."}
          </p>
          <button type="button" onClick={() => router.refresh()}>
            Try again
          </button>
          <Link href="/login">Return to login</Link>
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
            <span className="cv-save-indicator" aria-live="polite">
              <Check size={14} />
              <span>
                {isSaving
                  ? "Saving..."
                  : formattedSavedTime
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

          <small>Complete each section to strengthen your CV.</small>
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
                  className={activeSection === section.id ? "active" : ""}
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
                  maxLength={120}
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
                  maxLength={120}
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
                  maxLength={254}
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
                  type="tel"
                  maxLength={40}
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
                  maxLength={160}
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
                  maxLength={300}
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
                maxLength={1800}
                value={data.summary}
                onChange={(event) =>
                  updateField("summary", event.target.value)
                }
                placeholder="Write a short introduction about your experience, strengths and career goals..."
              />
              <small className="cv-field-hint">
                Aim for 3–5 sentences that are relevant to the jobs you want.
                {` ${data.summary.length}/1800`}
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
              This is a basic writing suggestion, not an AI-generated or
              independently verified CV. Review it before using it.
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
                  Add jobs, internships, freelance work, apprenticeships or
                  projects. If you are new to work, you can leave this section
                  empty.
                </p>
              </div>
            </div>

            {data.experience.map((entry, index) => (
              <div className="cv-entry-card" key={entry.id}>
                <div className="cv-entry-card-heading">
                  <strong>Experience {index + 1}</strong>
                  <button
                    className="cv-entry-remove"
                    type="button"
                    onClick={() => removeExperience(entry.id)}
                    aria-label={`Remove experience ${index + 1}`}
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>

                <div className="cv-fields-grid">
                  <label className="cv-field">
                    <span>Job title / Role</span>
                    <input
                      maxLength={120}
                      value={entry.jobTitle}
                      onChange={(event) =>
                        updateExperience(
                          entry.id,
                          "jobTitle",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Graphic Designer"
                    />
                  </label>

                  <label className="cv-field">
                    <span>Company / Organisation</span>
                    <input
                      maxLength={160}
                      value={entry.company}
                      onChange={(event) =>
                        updateExperience(
                          entry.id,
                          "company",
                          event.target.value
                        )
                      }
                      placeholder="e.g. SIRMIC Creativities"
                    />
                  </label>

                  <label className="cv-field">
                    <span>Location</span>
                    <input
                      maxLength={120}
                      value={entry.location}
                      onChange={(event) =>
                        updateExperience(
                          entry.id,
                          "location",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Aba, Abia State"
                    />
                  </label>

                  <label className="cv-field">
                    <span>Start date</span>
                    <input
                      maxLength={40}
                      value={entry.startDate}
                      onChange={(event) =>
                        updateExperience(
                          entry.id,
                          "startDate",
                          event.target.value
                        )
                      }
                      placeholder="e.g. January 2024"
                    />
                  </label>

                  <label className="cv-field">
                    <span>End date</span>
                    <input
                      maxLength={40}
                      value={entry.endDate}
                      onChange={(event) =>
                        updateExperience(
                          entry.id,
                          "endDate",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Present"
                    />
                  </label>

                  <label className="cv-field cv-field-full">
                    <span>Responsibilities and achievements</span>
                    <textarea
                      rows={5}
                      maxLength={2500}
                      value={entry.description}
                      onChange={(event) =>
                        updateExperience(
                          entry.id,
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Describe what you did, tools you used and results you achieved. Use a new line for each point."
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              className="cv-add-entry-button"
              type="button"
              onClick={addExperience}
            >
              <Plus size={17} />
              Add work experience
            </button>
          </div>

          <div className="cv-form-section" id="education">
            <div className="cv-form-section-heading">
              <span className="cv-form-icon">
                <GraduationCap size={20} />
              </span>
              <div>
                <h3>Education and training</h3>
                <p>
                  Add degrees, school qualifications, vocational training,
                  apprenticeships or professional courses.
                </p>
              </div>
            </div>

            {data.education.map((entry, index) => (
              <div className="cv-entry-card" key={entry.id}>
                <div className="cv-entry-card-heading">
                  <strong>Education {index + 1}</strong>
                  <button
                    className="cv-entry-remove"
                    type="button"
                    onClick={() => removeEducation(entry.id)}
                    aria-label={`Remove education ${index + 1}`}
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>

                <div className="cv-fields-grid">
                  <label className="cv-field cv-field-full">
                    <span>Qualification / Course</span>
                    <input
                      maxLength={180}
                      value={entry.qualification}
                      onChange={(event) =>
                        updateEducation(
                          entry.id,
                          "qualification",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Higher National Diploma in Computer Science"
                    />
                  </label>

                  <label className="cv-field">
                    <span>Institution</span>
                    <input
                      maxLength={180}
                      value={entry.institution}
                      onChange={(event) =>
                        updateEducation(
                          entry.id,
                          "institution",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Abia State Polytechnic"
                    />
                  </label>

                  <label className="cv-field">
                    <span>Location</span>
                    <input
                      maxLength={120}
                      value={entry.location}
                      onChange={(event) =>
                        updateEducation(
                          entry.id,
                          "location",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Aba, Abia State"
                    />
                  </label>

                  <label className="cv-field">
                    <span>Start year / Date</span>
                    <input
                      maxLength={40}
                      value={entry.startDate}
                      onChange={(event) =>
                        updateEducation(
                          entry.id,
                          "startDate",
                          event.target.value
                        )
                      }
                      placeholder="e.g. 2020"
                    />
                  </label>

                  <label className="cv-field">
                    <span>End year / Date</span>
                    <input
                      maxLength={40}
                      value={entry.endDate}
                      onChange={(event) =>
                        updateEducation(
                          entry.id,
                          "endDate",
                          event.target.value
                        )
                      }
                      placeholder="e.g. 2022"
                    />
                  </label>

                  <label className="cv-field cv-field-full">
                    <span>Additional details <small>Optional</small></span>
                    <textarea
                      rows={3}
                      maxLength={1200}
                      value={entry.description}
                      onChange={(event) =>
                        updateEducation(
                          entry.id,
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Relevant courses, awards, projects or achievements..."
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              className="cv-add-entry-button"
              type="button"
              onClick={addEducation}
            >
              <Plus size={17} />
              Add education or training
            </button>
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
                maxLength={2000}
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
                maxLength={2000}
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
              <h2>{data.professionalTitle || "Your Professional Title"}</h2>

              <div className="cv-paper-contact">
                {data.email && <span>{data.email}</span>}
                {data.phone && <span>{data.phone}</span>}
                {data.location && <span>{data.location}</span>}
                {data.website && <span>{data.website}</span>}
                {!data.email && !data.phone && !data.location && !data.website && (
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
                {data.experience.some(
                  (entry) =>
                    entry.jobTitle.trim() ||
                    entry.company.trim() ||
                    entry.description.trim()
                ) ? (
                  <div className="cv-paper-entries">
                    {data.experience
                      .filter(
                        (entry) =>
                          entry.jobTitle.trim() ||
                          entry.company.trim() ||
                          entry.description.trim()
                      )
                      .map((entry) => (
                        <div className="cv-paper-entry" key={entry.id}>
                          <div className="cv-paper-entry-top">
                            <strong>
                              {entry.jobTitle || "Position"}
                            </strong>
                            {formatDateRange(
                              entry.startDate,
                              entry.endDate
                            ) && (
                              <span>
                                {formatDateRange(
                                  entry.startDate,
                                  entry.endDate
                                )}
                              </span>
                            )}
                          </div>
                          {(entry.company || entry.location) && (
                            <div className="cv-paper-entry-subtitle">
                              {[entry.company, entry.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                          {entry.description && (
                            <p className="cv-paper-multiline">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p>Your work experience will appear here.</p>
                )}
              </section>

              <section>
                <h3>Education</h3>
                {data.education.some(
                  (entry) =>
                    entry.qualification.trim() ||
                    entry.institution.trim() ||
                    entry.description.trim()
                ) ? (
                  <div className="cv-paper-entries">
                    {data.education
                      .filter(
                        (entry) =>
                          entry.qualification.trim() ||
                          entry.institution.trim() ||
                          entry.description.trim()
                      )
                      .map((entry) => (
                        <div className="cv-paper-entry" key={entry.id}>
                          <div className="cv-paper-entry-top">
                            <strong>
                              {entry.qualification || "Qualification"}
                            </strong>
                            {formatDateRange(
                              entry.startDate,
                              entry.endDate
                            ) && (
                              <span>
                                {formatDateRange(
                                  entry.startDate,
                                  entry.endDate
                                )}
                              </span>
                            )}
                          </div>
                          {(entry.institution || entry.location) && (
                            <div className="cv-paper-entry-subtitle">
                              {[entry.institution, entry.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                          {entry.description && (
                            <p className="cv-paper-multiline">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p>Your educational qualifications will appear here.</p>
                )}
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

            <div className="cv-paper-footer">Created with Abi Job</div>
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