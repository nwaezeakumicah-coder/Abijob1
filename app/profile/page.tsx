
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  MapPin,
  Phone,
  Mail,
  BriefcaseBusiness,
  GraduationCap,
  FileText,
  Camera,
  Upload,
  Trash2,
  Eye,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Menu,
  X,
  Bell,
  LayoutDashboard,
  Search,
  Users,
  Settings,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./profile.css";

const BUCKET = "abi-job-profile-files";
const MAX_PHOTO_SIZE = 3 * 1024 * 1024;
const MAX_CV_SIZE = 5 * 1024 * 1024;

type ProfileData = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  about: string;
  skills: string;
  experience: string;
  education: string;
};

const emptyProfile: ProfileData = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "Aba, Abia State",
  about: "",
  skills: "",
  experience: "",
  education: "",
};

type Notice = {
  type: "success" | "error";
  text: string;
};

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function getReadableError(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>(emptyProfile);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isDeletingCV, setIsDeletingCV] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [userId, setUserId] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [cvPath, setCvPath] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [cvName, setCvName] = useState("");

  const showNotice = useCallback(
    (type: Notice["type"], text: string) => {
      setNotice({ type, text });
    },
    []
  );

  const getSignedFileUrl = useCallback(
    async (path: string | null) => {
      if (!path) return "";

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60);

      if (error) {
        console.error("Could not create signed file URL:", error.message);
        return "";
      }

      return data.signedUrl;
    },
    [supabase]
  );

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, role, full_name, phone, location, avatar_url, headline, about, skills, experience, education, cv_path"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        throw new Error(
          "We could not load your profile. Please check your database setup and try again."
        );
      }

      if (data.role !== "job_seeker") {
        if (data.role === "professional") {
          router.replace("/professional/dashboard");
        } else if (data.role === "employer") {
          router.replace("/employer/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }

      setUserId(user.id);

      setProfile({
        fullName: data.full_name || "",
        headline: data.headline || "",
        email: user.email || "",
        phone: data.phone || "",
        location: data.location || "",
        about: data.about || "",
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
        experience: data.experience || "",
        education: data.education || "",
      });

      const savedPhotoPath = data.avatar_url || null;
      const savedCVPath = data.cv_path || null;

      setPhotoPath(savedPhotoPath);
      setCvPath(savedCVPath);

      const [signedPhotoUrl, signedCVUrl] = await Promise.all([
        getSignedFileUrl(savedPhotoPath),
        getSignedFileUrl(savedCVPath),
      ]);

      setPhotoUrl(signedPhotoUrl);
      setCvUrl(signedCVUrl);

      if (savedCVPath) {
        const savedName = savedCVPath.split("/").pop() || "My CV";
        setCvName(savedName.replace(/^[0-9a-f-]+_/, ""));
      }
    } catch (error) {
      showNotice("error", getReadableError(error));
    } finally {
      setIsLoading(false);
    }
  }, [getSignedFileUrl, router, showNotice, supabase]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const skillsList = profile.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  const completionItems = [
    Boolean(profile.fullName.trim()),
    Boolean(profile.headline.trim()),
    Boolean(profile.phone.trim()),
    Boolean(profile.location.trim()),
    Boolean(profile.about.trim()),
    skillsList.length > 0,
    Boolean(profile.experience.trim()),
    Boolean(profile.education.trim()),
    Boolean(photoPath),
    Boolean(cvPath),
  ];

  const completedCount = completionItems.filter(Boolean).length;
  const completion = Math.round(
    (completedCount / completionItems.length) * 100
  );

  const saveProfile = async () => {
    if (!userId) {
      showNotice("error", "Your session has expired. Please log in again.");
      return;
    }

    if (!profile.fullName.trim()) {
      showNotice("error", "Please enter your full name.");
      return;
    }

    if (!profile.phone.trim()) {
      showNotice("error", "Please enter your phone number.");
      return;
    }

    if (!profile.location.trim()) {
      showNotice("error", "Please enter your location.");
      return;
    }

    setIsSaving(true);
    setNotice(null);

    try {
      const cleanSkills = skillsList;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.fullName.trim(),
          phone: profile.phone.trim(),
          location: profile.location.trim(),
          headline: profile.headline.trim(),
          about: profile.about.trim(),
          skills: cleanSkills,
          experience: profile.experience.trim(),
          education: profile.education.trim(),
        })
        .eq("id", userId);

      if (error) throw error;

      showNotice("success", "Your profile has been saved successfully.");
    } catch (error) {
      showNotice("error", getReadableError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = async (file?: File) => {
    if (!file || !userId) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showNotice("error", "Please select a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      showNotice("error", "Your profile photo must not exceed 3MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setNotice(null);

    let uploadedPath: string | null = null;

    try {
      const extension = getExtension(file.name) || "jpg";
      uploadedPath = `${userId}/avatar/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(uploadedPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: uploadedPath })
        .eq("id", userId);

      if (updateError) {
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
        throw updateError;
      }

      const newSignedUrl = await getSignedFileUrl(uploadedPath);

      setPhotoPath(uploadedPath);
      setPhotoUrl(newSignedUrl);

      if (photoPath && photoPath !== uploadedPath) {
        const { error: oldFileError } = await supabase.storage
          .from(BUCKET)
          .remove([photoPath]);

        if (oldFileError) {
          console.error("Old profile photo could not be removed:", oldFileError);
        }
      }

      showNotice("success", "Your profile photo has been uploaded.");
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
      }

      showNotice("error", getReadableError(error));
    } finally {
      setIsUploadingPhoto(false);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const deletePhoto = async () => {
    if (!photoPath || !userId) return;

    setIsDeletingPhoto(true);
    setNotice(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove([photoPath]);

      if (removeError) {
        console.error("Photo file removal failed:", removeError.message);
      }

      setPhotoPath(null);
      setPhotoUrl("");

      showNotice("success", "Your profile photo has been removed.");
    } catch (error) {
      showNotice("error", getReadableError(error));
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const uploadCV = async (file?: File) => {
    if (!file || !userId) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      showNotice("error", "Please select a PDF, DOC or DOCX CV.");
      return;
    }

    if (file.size > MAX_CV_SIZE) {
      showNotice("error", "Your CV must not exceed 5MB.");
      return;
    }

    setIsUploadingCV(true);
    setNotice(null);

    let uploadedPath: string | null = null;

    try {
      const extension = getExtension(file.name) || "pdf";
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      uploadedPath = `${userId}/cv/${crypto.randomUUID()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(uploadedPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cv_path: uploadedPath })
        .eq("id", userId);

      if (updateError) {
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
        throw updateError;
      }

      const newSignedUrl = await getSignedFileUrl(uploadedPath);

      setCvPath(uploadedPath);
      setCvUrl(newSignedUrl);
      setCvName(file.name);

      if (cvPath && cvPath !== uploadedPath) {
        const { error: oldFileError } = await supabase.storage
          .from(BUCKET)
          .remove([cvPath]);

        if (oldFileError) {
          console.error("Old CV could not be removed:", oldFileError);
        }
      }

      showNotice("success", "Your CV has been uploaded successfully.");
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
      }

      showNotice("error", getReadableError(error));
    } finally {
      setIsUploadingCV(false);

      if (cvInputRef.current) {
        cvInputRef.current.value = "";
      }
    }
  };

  const deleteCV = async () => {
    if (!cvPath || !userId) return;

    setIsDeletingCV(true);
    setNotice(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cv_path: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove([cvPath]);

      if (removeError) {
        console.error("CV file removal failed:", removeError.message);
      }

      setCvPath(null);
      setCvUrl("");
      setCvName("");

      showNotice("success", "Your CV has been removed.");
    } catch (error) {
      showNotice("error", getReadableError(error));
    } finally {
      setIsDeletingCV(false);
    }
  };

  if (isLoading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <LoaderCircle size={34} className="animate-spin" />
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <aside className={`profile-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="profile-sidebar-logo">
          <Logo />
        </div>

        <div className="profile-sidebar-label">WORKSPACE</div>

        <nav className="profile-nav">
          <Link href="/dashboard" className="profile-nav-link">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/jobs" className="profile-nav-link">
            <Search size={19} />
            <span>Find Jobs</span>
          </Link>

          <Link href="/applications" className="profile-nav-link">
            <BriefcaseBusiness size={19} />
            <span>My Applications</span>
          </Link>

          <Link href="/profile" className="profile-nav-link active">
            <UserRound size={19} />
            <span>My Profile</span>
          </Link>

          <Link href="/notifications" className="profile-nav-link">
            <Bell size={19} />
            <span>Notifications</span>
          </Link>

          <Link href="/professionals" className="profile-nav-link">
            <Users size={19} />
            <span>Find Professionals</span>
          </Link>

          <Link href="/hub" className="profile-nav-link">
            <Sparkles size={19} />
            <span>Abi Hub</span>
          </Link>

          <Link href="/settings" className="profile-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="profile-sidebar-bottom">
          <div className="profile-sidebar-tip">
            <Sparkles size={19} />
            <strong>Stand out to employers</strong>
            <p>Complete your profile to improve your job opportunities.</p>
          </div>
          <Link href="/dashboard" className="profile-back-link">
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="profile-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <section className="profile-main">
        <header className="profile-topbar">
          <button
            type="button"
            className="profile-menu-button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="profile-topbar-title">
            <span>JOB SEEKER WORKSPACE</span>
            <strong>My Profile</strong>
          </div>

          <Link href="/notifications" className="profile-topbar-notification">
            <Bell size={20} />
          </Link>
        </header>

        <div className="profile-content">
          <div className="profile-heading">
            <div>
              <span className="profile-eyebrow">YOUR PROFESSIONAL IDENTITY</span>
              <h1>My Profile</h1>
              <p>
                Keep your information up to date so employers can understand
                your experience, skills and potential.
              </p>
            </div>

            <button
              type="button"
              className="profile-preview-button"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye size={17} />
              Preview profile
            </button>
          </div>

          {notice && (
            <div
              className={`profile-message ${
                notice.type === "success" ? "success" : "error"
              }`}
              role="status"
            >
              {notice.type === "success" ? (
                <CheckCircle2 size={19} />
              ) : (
                <AlertCircle size={19} />
              )}
              <span>{notice.text}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <section className="profile-completion-card">
            <div className="profile-completion-top">
              <div>
                <span className="profile-section-kicker">PROFILE STRENGTH</span>
                <h2>{completion}% completed</h2>
                <p>
                  A complete profile gives employers a better picture of what
                  you can offer.
                </p>
              </div>

              <div className="profile-completion-number">{completion}%</div>
            </div>

            <div
              className="profile-progress-track"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
            >
              <div
                className="profile-progress-fill"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="profile-completion-footer">
              <span>
                {completedCount} of {completionItems.length} sections completed
              </span>
              <span>
                {completion === 100 ? "Excellent work!" : "Keep going"}
              </span>
            </div>
          </section>

          <section className="profile-form-section">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <UserRound size={21} />
              </div>
              <div>
                <h2>Personal information</h2>
                <p>These details help employers identify and contact you.</p>
              </div>
            </div>

            <div className="profile-photo-area">
              <div className="profile-photo-preview">
                {photoUrl ? (
                  <img src={photoUrl} alt="Your profile" />
                ) : (
                  <UserRound size={42} />
                )}
              </div>

              <div className="profile-photo-details">
                <strong>Profile photo</strong>
                <p>
                  Use a clear, professional photo. JPG, PNG or WEBP, maximum
                  3MB.
                </p>

                <div className="profile-photo-actions">
                  <label
                    htmlFor="profile-photo-input"
                    className="profile-upload-button"
                    aria-disabled={isUploadingPhoto}
                    style={{
                      cursor: isUploadingPhoto ? "not-allowed" : "pointer",
                      opacity: isUploadingPhoto ? 0.55 : 1,
                      pointerEvents: isUploadingPhoto ? "none" : "auto",
                    }}
                  >
                    {isUploadingPhoto ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}
                    {isUploadingPhoto ? "Uploading..." : "Upload photo"}
                  </label>

                  {photoPath && (
                    <button
                      type="button"
                      className="profile-delete-button"
                      onClick={deletePhoto}
                      disabled={isDeletingPhoto}
                    >
                      {isDeletingPhoto ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Remove
                    </button>
                  )}
                </div>

                <input
                  id="profile-photo-input"
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  disabled={isUploadingPhoto}
                  onChange={(event) => {
                    void uploadPhoto(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
            </div>

            <div className="profile-form-grid">
              <label className="profile-field">
                <span>Full name *</span>
                <div className="profile-input-wrap">
                  <UserRound size={17} />
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Email address</span>
                <div className="profile-input-wrap disabled">
                  <Mail size={17} />
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                  />
                </div>
                <small>Your email comes from your verified account.</small>
              </label>

              <label className="profile-field">
                <span>Phone number *</span>
                <div className="profile-input-wrap">
                  <Phone size={17} />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="e.g. 08012345678"
                    autoComplete="tel"
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Location *</span>
                <div className="profile-input-wrap">
                  <MapPin size={17} />
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    placeholder="Town, State"
                    autoComplete="address-level2"
                  />
                </div>
              </label>

              <label className="profile-field profile-field-full">
                <span>Professional headline</span>
                <div className="profile-input-wrap">
                  <BriefcaseBusiness size={17} />
                  <input
                    type="text"
                    value={profile.headline}
                    onChange={(event) =>
                      updateField("headline", event.target.value)
                    }
                    placeholder="e.g. Entry-level Accountant | Customer Service Professional"
                    maxLength={120}
                  />
                </div>
                <small>
                  A short description of the kind of work you are looking for.
                </small>
              </label>
            </div>
          </section>

          <section className="profile-form-section">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <FileText size={21} />
              </div>
              <div>
                <h2>About me</h2>
                <p>Tell employers about yourself and what you do well.</p>
              </div>
            </div>

            <label className="profile-field">
              <span>Professional summary</span>
              <textarea
                value={profile.about}
                onChange={(event) => updateField("about", event.target.value)}
                placeholder="Introduce yourself, describe your strengths, interests and career goals..."
                rows={6}
                maxLength={1500}
              />
              <small>{profile.about.length}/1500 characters</small>
            </label>
          </section>

          <section className="profile-form-section">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <Sparkles size={21} />
              </div>
              <div>
                <h2>Skills and experience</h2>
                <p>Show employers the abilities and experience you bring.</p>
              </div>
            </div>

            <label className="profile-field">
              <span>Skills</span>
              <textarea
                value={profile.skills}
                onChange={(event) =>
                  updateField("skills", event.target.value)
                }
                placeholder="e.g. Microsoft Excel, Communication, Graphic Design, Customer Service"
                rows={3}
              />
              <small>Separate each skill with a comma.</small>
            </label>

            {skillsList.length > 0 && (
              <div className="profile-skills-list">
                {skillsList.map((skill, index) => (
                  <span className="profile-skill-tag" key={`${skill}-${index}`}>
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <label className="profile-field">
              <span>Work experience</span>
              <textarea
                value={profile.experience}
                onChange={(event) =>
                  updateField("experience", event.target.value)
                }
                placeholder="Describe your previous jobs, internships, volunteering, projects or relevant work experience..."
                rows={5}
              />
            </label>

            <label className="profile-field">
              <span>Education and qualifications</span>
              <textarea
                value={profile.education}
                onChange={(event) =>
                  updateField("education", event.target.value)
                }
                placeholder="List your schools, qualifications, certificates and relevant training..."
                rows={5}
              />
            </label>
          </section>

          <section className="profile-form-section">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <GraduationCap size={21} />
              </div>
              <div>
                <h2>My CV / Resume</h2>
                <p>
                  Upload your latest CV so you can use it when applying for
                  opportunities.
                </p>
              </div>
            </div>

            <div className="profile-cv-upload">
              {cvPath ? (
                <div className="profile-cv-file">
                  <div className="profile-cv-file-icon">
                    <FileText size={25} />
                  </div>

                  <div className="profile-cv-file-info">
                    <strong>{cvName || "Uploaded CV"}</strong>
                    <span>Your CV is saved securely in Abi Job.</span>
                  </div>

                  <div className="profile-cv-file-actions">
                    {cvUrl && (
                      <a
                        href={cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-cv-view"
                      >
                        <ExternalLink size={16} />
                        View
                      </a>
                    )}

                    <button
                      type="button"
                      className="profile-delete-button"
                      onClick={deleteCV}
                      disabled={isDeletingCV}
                    >
                      {isDeletingCV ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-cv-empty">
                  <div className="profile-cv-empty-icon">
                    <Upload size={27} />
                  </div>
                  <strong>No CV uploaded yet</strong>
                  <p>
                    Upload a PDF, DOC or DOCX file. Maximum file size: 5MB.
                  </p>
                </div>
              )}

              <label
                htmlFor="profile-cv-input"
                className="profile-cv-upload-button"
                aria-disabled={isUploadingCV}
                style={{
                  cursor: isUploadingCV ? "not-allowed" : "pointer",
                  opacity: isUploadingCV ? 0.55 : 1,
                  pointerEvents: isUploadingCV ? "none" : "auto",
                }}
              >
                {isUploadingCV ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Upload size={17} />
                )}
                {isUploadingCV
                  ? "Uploading CV..."
                  : cvPath
                    ? "Replace CV"
                    : "Upload CV"}
              </label>

              <input
                id="profile-cv-input"
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                hidden
                disabled={isUploadingCV}
                onChange={(event) => {
                  void uploadCV(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>
          </section>

          <div className="profile-save-area">
            <div>
              <strong>Keep your profile up to date</strong>
              <p>Your profile information is saved to your Abi Job account.</p>
            </div>

            <button
              type="button"
              className="profile-save-button"
              onClick={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>

          <footer className="profile-footer">
            <span>© {new Date().getFullYear()} Abi Job</span>
            <span>Opportunity Starts Here</span>
          </footer>
        </div>
      </section>

      {previewOpen && (
        <div
          className="profile-preview-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewOpen(false);
            }
          }}
        >
          <section
            className="profile-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-preview-title"
          >
            <div className="profile-preview-header">
              <div>
                <span className="profile-eyebrow">YOUR PUBLIC PROFILE</span>
                <h2 id="profile-preview-title">Profile preview</h2>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                <X size={22} />
              </button>
            </div>

            <div className="profile-preview-body">
              <div className="profile-preview-person">
                <div className="profile-preview-photo">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" />
                  ) : (
                    <UserRound size={38} />
                  )}
                </div>

                <div>
                  <h3>{profile.fullName || "Your name"}</h3>
                  <p>{profile.headline || "Your professional headline"}</p>
                  <span>
                    <MapPin size={14} />
                    {profile.location || "Your location"}
                  </span>
                </div>
              </div>

              <div className="profile-preview-block">
                <h4>About</h4>
                <p>
                  {profile.about ||
                    "Your professional summary will appear here."}
                </p>
              </div>

              <div className="profile-preview-block">
                <h4>Skills</h4>
                {skillsList.length ? (
                  <div className="profile-skills-list">
                    {skillsList.map((skill, index) => (
                      <span
                        className="profile-skill-tag"
                        key={`${skill}-preview-${index}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>Your skills will appear here.</p>
                )}
              </div>

              <div className="profile-preview-block">
                <h4>Work experience</h4>
                <p>{profile.experience || "No experience added yet."}</p>
              </div>

              <div className="profile-preview-block">
                <h4>Education</h4>
                <p>{profile.education || "No education details added yet."}</p>
              </div>

              <div className="profile-preview-contact">
                <span>
                  <Mail size={15} />
                  {profile.email}
                </span>
                <span>
                  <Phone size={15} />
                  {profile.phone || "Phone number not added"}
                </span>
              </div>
            </div>

            <div className="profile-preview-actions">
              <button
                type="button"
                className="profile-preview-close"
                onClick={() => setPreviewOpen(false)}
              >
                Close preview
              </button>
              <button
                type="button"
                className="profile-save-button"
                onClick={() => {
                  setPreviewOpen(false);
                  void saveProfile();
                }}
              >
                <Save size={17} />
                Save profile
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
