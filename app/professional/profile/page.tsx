
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Logo from "../../../components/Logo";
import { createClient } from "../../../lib/supabase/client";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  User,
  UserRound,
  X,
  Trash2,
} from "lucide-react";
import "./profile.css";

type Experience = {
  id: number;
  role: string;
  company: string;
  description: string;
};

type ProfileData = {
  fullName: string;
  professionalTitle: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  bio: string;
  skills: string[];
  availability: string;
  photo: string;
  experiences: Experience[];
};

type ExtraProfileData = {
  website?: string;
  availability?: string;
  experiences?: Experience[];
  photo_path?: string;
};

const initialProfile: ProfileData = {
  fullName: "",
  professionalTitle: "",
  location: "",
  email: "",
  phone: "",
  website: "",
  bio: "",
  skills: [],
  availability: "Available for work",
  photo: "",
  experiences: [],
};

const STORAGE_BUCKET = "abi-job-profile-files";

export default function ProfessionalProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [newSkill, setNewSkill] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  const [experienceFormOpen, setExperienceFormOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<number | null>(
    null
  );

  const [experienceForm, setExperienceForm] = useState({
    role: "",
    company: "",
    description: "",
  });

  const [savedSnapshot, setSavedSnapshot] =
    useState<ProfileData>(initialProfile);

  const [photoPath, setPhotoPath] = useState("");
  const [savedPhotoPath, setSavedPhotoPath] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          window.location.replace("/login");
          return;
        }

        const { data: personal, error: personalError } = await supabase
          .from("profiles")
          .select(
            "id, role, full_name, phone, location, avatar_url, headline, about, skills"
          )
          .eq("id", user.id)
          .single();

        if (personalError) throw personalError;

        if (personal.role !== "professional") {
          window.location.replace("/login");
          return;
        }

        const { data: professional, error: professionalError } =
          await supabase
            .from("professional_profiles")
            .select("category, skills, service_area, profile_data")
            .eq("user_id", user.id)
            .maybeSingle();

        if (professionalError) throw professionalError;

        const extra = (professional?.profile_data || {}) as ExtraProfileData;

        let signedPhoto = "";
        const storedPhotoPath =
          extra.photo_path || personal.avatar_url || "";

        if (storedPhotoPath) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from(STORAGE_BUCKET)
              .createSignedUrl(storedPhotoPath, 60 * 60 * 24 * 7);

          if (!signedError && signedData?.signedUrl) {
            signedPhoto = signedData.signedUrl;
          }
        }

        const loadedProfile: ProfileData = {
          fullName: personal.full_name || "",
          professionalTitle:
            professional?.category || personal.headline || "",
          location:
            personal.location || professional?.service_area || "",
          email: user.email || "",
          phone: personal.phone || "",
          website: extra.website || "",
          bio: personal.about || "",
          skills: Array.isArray(professional?.skills)
            ? professional.skills
            : Array.isArray(personal.skills)
              ? personal.skills
              : [],
          availability: extra.availability || "Available for work",
          photo: signedPhoto,
          experiences: Array.isArray(extra.experiences)
            ? extra.experiences
            : [],
        };

        if (!active) return;

        setProfile(loadedProfile);
        setSavedSnapshot(loadedProfile);
        setPhotoPath(storedPhotoPath);
        setSavedPhotoPath(storedPhotoPath);
      } catch (err) {
        console.error("Professional profile loading error:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your professional profile."
          );
        }
      } finally {
        if (active) setHydrated(true);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [supabase]);

  function updateProfile<K extends keyof ProfileData>(
    field: K,
    value: ProfileData[K]
  ) {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSaved(false);
  }

  function addSkill() {
    const value = newSkill.trim();

    if (!value) return;

    const alreadyExists = profile.skills.some(
      (skill) => skill.toLowerCase() === value.toLowerCase()
    );

    if (alreadyExists) {
      alert("This skill has already been added.");
      return;
    }

    updateProfile("skills", [...profile.skills, value]);
    setNewSkill("");
  }

  function removeSkill(skillToRemove: string) {
    updateProfile(
      "skills",
      profile.skills.filter((skill) => skill !== skillToRemove)
    );
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateProfile("photo", String(reader.result));
      setPendingPhoto(file);
    };

    reader.onerror = () => {
      alert("Unable to read this image. Please try another one.");
    };

    reader.readAsDataURL(file);
  }

  function openAddExperience() {
    setEditingExperience(null);
    setExperienceForm({
      role: "",
      company: "",
      description: "",
    });
    setExperienceFormOpen(true);
  }

  function openEditExperience(experience: Experience) {
    setEditingExperience(experience.id);
    setExperienceForm({
      role: experience.role,
      company: experience.company,
      description: experience.description,
    });
    setExperienceFormOpen(true);
  }

  function saveExperience() {
    if (!experienceForm.role.trim() || !experienceForm.company.trim()) {
      alert("Please enter the job title and organisation.");
      return;
    }

    if (editingExperience !== null) {
      updateProfile(
        "experiences",
        profile.experiences.map((experience) =>
          experience.id === editingExperience
            ? { ...experience, ...experienceForm }
            : experience
        )
      );
    } else {
      const newExperience: Experience = {
        id: Date.now(),
        ...experienceForm,
      };

      updateProfile("experiences", [
        ...profile.experiences,
        newExperience,
      ]);
    }

    setExperienceFormOpen(false);
    setEditingExperience(null);
  }

  function deleteExperience(id: number) {
    if (!window.confirm("Are you sure you want to delete this experience?")) {
      return;
    }

    updateProfile(
      "experiences",
      profile.experiences.filter((experience) => experience.id !== id)
    );
  }

  async function saveProfile() {
    if (!hydrated || saving) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        window.location.replace("/login");
        return;
      }

      let newPhotoPath = photoPath;

      if (pendingPhoto) {
        const extension =
          pendingPhoto.name
            .split(".")
            .pop()
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, "") || "jpg";

        const uploadPath = `${user.id}/professional/avatar-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(uploadPath, pendingPhoto, {
            upsert: true,
            contentType: pendingPhoto.type,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        newPhotoPath = uploadPath;
      }

      const { error: personalError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.fullName.trim(),
          phone: profile.phone.trim(),
          location: profile.location.trim(),
          headline: profile.professionalTitle.trim(),
          about: profile.bio.trim(),
          skills: profile.skills,
          avatar_url: newPhotoPath || null,
        })
        .eq("id", user.id);

      if (personalError) throw personalError;

      const profileData: ExtraProfileData = {
        website: profile.website.trim(),
        availability: profile.availability,
        experiences: profile.experiences,
        photo_path: newPhotoPath,
      };

      const { error: professionalError } = await supabase
        .from("professional_profiles")
        .upsert(
          {
            user_id: user.id,
            category: profile.professionalTitle.trim() || "General",
            skills: profile.skills,
            service_area: profile.location.trim(),
            profile_data: profileData,
          },
          { onConflict: "user_id" }
        );

      if (professionalError) throw professionalError;

      let signedPhoto = profile.photo;

      if (newPhotoPath) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(newPhotoPath, 60 * 60 * 24 * 7);

        if (signedError) throw signedError;

        signedPhoto = signedData.signedUrl;
      }

      const updatedProfile = {
        ...profile,
        photo: signedPhoto,
        email: user.email || profile.email,
      };

      setProfile(updatedProfile);
      setSavedSnapshot(updatedProfile);
      setPhotoPath(newPhotoPath);
      setSavedPhotoPath(newPhotoPath);
      setPendingPhoto(null);
      setSaved(true);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Professional profile save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Your profile could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    if (
      !window.confirm(
        "Discard your unsaved changes and restore your last saved profile?"
      )
    ) {
      return;
    }

    setProfile(savedSnapshot);
    setPhotoPath(savedPhotoPath);
    setPendingPhoto(null);
    setNewSkill("");
    setExperienceFormOpen(false);
    setEditingExperience(null);
    setSaved(false);
    setError("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  const completenessItems = [
    {
      label: "Personal information",
      complete: Boolean(
        profile.fullName.trim() &&
          profile.email.trim() &&
          profile.phone.trim() &&
          profile.location.trim()
      ),
    },
    {
      label: "Professional introduction",
      complete: Boolean(profile.bio.trim()),
    },
    {
      label: "Skills and expertise",
      complete: profile.skills.length > 0,
    },
    {
      label: "Work experience",
      complete: profile.experiences.length > 0,
    },
    {
      label: "Portfolio or website",
      complete: Boolean(profile.website.trim()),
    },
  ];

  const completedItems = completenessItems.filter(
    (item) => item.complete
  ).length;

  const completeness = Math.round(
    (completedItems / completenessItems.length) * 100
  );

  const initials =
    profile.fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  if (!hydrated) {
    return (
      <div className="pp-page">
        <main className="pp-main">
          <div className="pp-content">
            <p>Loading your professional profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pp-page">
      <aside className="pp-sidebar">
        <div className="pp-brand">
          <Logo size="medium" light />
        </div>

        <p className="pp-sidebar-label">Professional workspace</p>

        <nav className="pp-nav">
          <Link href="/professional/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link href="/professional/opportunities">
            <BriefcaseBusiness size={18} />
            Opportunities
          </Link>

          <Link href="/professional/saved">
            <FileText size={18} />
            Saved opportunities
          </Link>

          <Link href="/professional/applications">
            <FileText size={18} />
            My applications
          </Link>

          <Link href="/professional/profile" className="active">
            <UserRound size={18} />
            My profile
          </Link>

          <Link href="/professional/experience">
            <GraduationCap size={18} />
            Experience
          </Link>

          <Link href="/professional/messages">
            <Activity size={18} />
            Messages
          </Link>

          <Link href="/professional/notifications">
            <Bell size={18} />
            Notifications
          </Link>

          <Link href="/professional/settings">
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        <div className="pp-sidebar-bottom">
          <div className="pp-help-card">
            <h4>Need a hand?</h4>
            <p>Get help with your professional account and opportunities.</p>
            <Link href="/support">
              Visit help centre <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </aside>

      <main className="pp-main">
        <header className="pp-topbar">
          <div className="pp-breadcrumb">
            Professional workspace <ChevronRight size={13} />{" "}
            <strong>My profile</strong>
          </div>

          <div className="pp-topbar-right">
            <Link
              href="/professional/notifications"
              className="pp-icon-button"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </Link>

            <div className="pp-user">
              <div className="pp-user-avatar">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="pp-user-info">
                <strong>{profile.fullName || "Professional"}</strong>
                <span>Professional account</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pp-content">
          <div className="pp-heading">
            <div>
              <h1>My professional profile</h1>
              <p>
                Manage your professional identity and show employers what you
                can do.
              </p>
            </div>

            <div className="pp-heading-actions">
              <button
                className="pp-button"
                type="button"
                onClick={() => window.print()}
              >
                <FileText size={15} />
                Preview profile
              </button>

              <button
                className="pp-button pp-button-primary"
                type="button"
                onClick={saveProfile}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          {error && (
            <div className="pp-save-notice" role="alert">
              {error}
            </div>
          )}

          {saved && (
            <div className="pp-save-notice">
              <CheckCircle2 size={17} />
              Your profile has been saved successfully.
            </div>
          )}

          <div className="pp-layout">
            <div className="pp-left-column">
              <section className="pp-card">
                <div className="pp-profile-cover" />

                <div className="pp-profile-intro">
                  <div className="pp-avatar-wrap">
                    <div className="pp-avatar">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt="Your profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "50%",
                          }}
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    <button
                      className="pp-avatar-edit"
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      aria-label="Change profile picture"
                      title="Change profile picture"
                    >
                      <Camera size={14} />
                    </button>

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: "none" }}
                    />
                  </div>

                  <div className="pp-profile-name">
                    <h2>{profile.fullName || "Your name"}</h2>
                    <p>
                      {profile.professionalTitle || "Add your professional title"}
                    </p>
                  </div>
                </div>

                <div className="pp-profile-meta">
                  <span>
                    <MapPin size={14} /> {profile.location || "Add your location"}
                  </span>
                  <span>
                    <ShieldCheck size={14} /> Professional account
                  </span>
                </div>
              </section>

              <section className="pp-card">
                <div className="pp-card-header">
                  <div>
                    <h2>Personal information</h2>
                    <p>
                      Keep your contact details and professional identity up
                      to date.
                    </p>
                  </div>
                  <User size={19} />
                </div>

                <div className="pp-form-grid">
                  <div className="pp-field">
                    <label htmlFor="pp-name">Full name</label>
                    <input
                      id="pp-name"
                      value={profile.fullName}
                      onChange={(e) =>
                        updateProfile("fullName", e.target.value)
                      }
                    />
                  </div>

                  <div className="pp-field">
                    <label htmlFor="pp-title">Professional title</label>
                    <input
                      id="pp-title"
                      value={profile.professionalTitle}
                      onChange={(e) =>
                        updateProfile("professionalTitle", e.target.value)
                      }
                    />
                  </div>

                  <div className="pp-field">
                    <label htmlFor="pp-email">Email address</label>
                    <input
                      id="pp-email"
                      type="email"
                      value={profile.email}
                      readOnly
                      title="Your email address is managed by your account settings."
                    />
                  </div>

                  <div className="pp-field">
                    <label htmlFor="pp-phone">Phone number</label>
                    <input
                      id="pp-phone"
                      value={profile.phone}
                      onChange={(e) =>
                        updateProfile("phone", e.target.value)
                      }
                    />
                  </div>

                  <div className="pp-field">
                    <label htmlFor="pp-location">Location</label>
                    <input
                      id="pp-location"
                      value={profile.location}
                      onChange={(e) =>
                        updateProfile("location", e.target.value)
                      }
                    />
                  </div>

                  <div className="pp-field">
                    <label htmlFor="pp-website">Portfolio or website</label>
                    <input
                      id="pp-website"
                      value={profile.website}
                      onChange={(e) =>
                        updateProfile("website", e.target.value)
                      }
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="pp-field pp-field-full">
                    <label htmlFor="pp-bio">
                      Professional introduction
                    </label>
                    <textarea
                      id="pp-bio"
                      value={profile.bio}
                      onChange={(e) => updateProfile("bio", e.target.value)}
                      placeholder="Tell employers about yourself..."
                    />
                    <span className="pp-field-hint">
                      Briefly describe your experience, strengths and the
                      value you offer.
                    </span>
                  </div>
                </div>
              </section>

              <section className="pp-card">
                <div className="pp-card-header">
                  <div>
                    <h2>Skills and expertise</h2>
                    <p>
                      Add the skills that best describe your professional
                      abilities.
                    </p>
                  </div>
                  <Activity size={19} />
                </div>

                <div className="pp-skills">
                  {profile.skills.map((skill) => (
                    <span className="pp-skill" key={skill}>
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  {profile.skills.length === 0 && (
                    <p>You haven't added any skills yet.</p>
                  )}
                </div>

                <div className="pp-add-skill-row">
                  <input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Enter a skill..."
                  />

                  <button
                    className="pp-add-skill"
                    type="button"
                    onClick={addSkill}
                  >
                    <Plus size={14} /> Add skill
                  </button>
                </div>
              </section>

              <section className="pp-card">
                <div className="pp-card-header">
                  <div>
                    <h2>Professional experience</h2>
                    <p>
                      Give employers an overview of your work history.
                    </p>
                  </div>
                  <BriefcaseBusiness size={19} />
                </div>

                {profile.experiences.map((experience) => (
                  <div
                    className="pp-experience-item"
                    key={experience.id}
                  >
                    <div className="pp-experience-icon">
                      <BriefcaseBusiness size={19} />
                    </div>

                    <div className="pp-experience-info">
                      <h3>{experience.role}</h3>
                      <p>{experience.company}</p>
                      <span>{experience.description}</span>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "10px",
                        }}
                      >
                        <button
                          type="button"
                          className="pp-text-action"
                          onClick={() => openEditExperience(experience)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="pp-text-action"
                          onClick={() => deleteExperience(experience.id)}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {profile.experiences.length === 0 && (
                  <p>You haven't added any work experience yet.</p>
                )}

                <button
                  className="pp-add-skill pp-add-experience"
                  type="button"
                  onClick={openAddExperience}
                >
                  <Plus size={14} /> Add experience
                </button>

                {experienceFormOpen && (
                  <div
                    className="pp-experience-form"
                    style={{
                      marginTop: "20px",
                      padding: "20px",
                      border: "1px solid #e5eae4",
                      borderRadius: "12px",
                    }}
                  >
                    <h3>
                      {editingExperience !== null
                        ? "Edit experience"
                        : "Add work experience"}
                    </h3>

                    <div className="pp-field" style={{ marginTop: "14px" }}>
                      <label htmlFor="experience-role">Job title / Role</label>
                      <input
                        id="experience-role"
                        value={experienceForm.role}
                        onChange={(e) =>
                          setExperienceForm({
                            ...experienceForm,
                            role: e.target.value,
                          })
                        }
                        placeholder="e.g. Graphic Designer"
                      />
                    </div>

                    <div className="pp-field" style={{ marginTop: "14px" }}>
                      <label htmlFor="experience-company">
                        Company / Organisation
                      </label>
                      <input
                        id="experience-company"
                        value={experienceForm.company}
                        onChange={(e) =>
                          setExperienceForm({
                            ...experienceForm,
                            company: e.target.value,
                          })
                        }
                        placeholder="e.g. SIRMIC Creativities"
                      />
                    </div>

                    <div className="pp-field" style={{ marginTop: "14px" }}>
                      <label htmlFor="experience-description">
                        Responsibilities / Description
                      </label>
                      <textarea
                        id="experience-description"
                        value={experienceForm.description}
                        onChange={(e) =>
                          setExperienceForm({
                            ...experienceForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your work..."
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="pp-button pp-button-primary"
                        onClick={saveExperience}
                      >
                        <Check size={15} /> Save experience
                      </button>

                      <button
                        type="button"
                        className="pp-button"
                        onClick={() => setExperienceFormOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="pp-card">
                <div className="pp-card-header">
                  <div>
                    <h2>Online presence</h2>
                    <p>Help employers discover more of your work.</p>
                  </div>
                  <Globe size={19} />
                </div>

                <div className="pp-field">
                  <label htmlFor="pp-portfolio">Portfolio URL</label>
                  <input
                    id="pp-portfolio"
                    value={profile.website}
                    onChange={(e) =>
                      updateProfile("website", e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </section>

              <div className="pp-save-row">
                <button
                  className="pp-button"
                  type="button"
                  onClick={cancelChanges}
                >
                  Cancel
                </button>

                <button
                  className="pp-button pp-button-primary"
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </div>

            <aside className="pp-right-column">
              <section className="pp-side-card">
                <h3>Profile completeness</h3>

                <div className="pp-completion">
                  <div
                    className="pp-completion-ring"
                    style={{
                      background: `conic-gradient(#176b45 ${completeness}%, #e7eee8 ${completeness}% 100%)`,
                    }}
                  >
                    <strong>{completeness}%</strong>
                  </div>

                  <div className="pp-completion-copy">
                    <strong>
                      {completeness === 100
                        ? "Profile complete!"
                        : "Keep going!"}
                    </strong>
                    <span>
                      Complete more sections to improve your profile.
                    </span>
                  </div>
                </div>

                <div className="pp-checklist">
                  {completenessItems.map((item) => (
                    <div
                      className={`pp-checklist-item ${
                        item.complete ? "" : "pending"
                      }`}
                      key={item.label}
                    >
                      {item.complete ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <CircleHelp size={16} />
                      )}
                      {item.label}
                    </div>
                  ))}
                </div>
              </section>

              <section className="pp-side-card">
                <h3>Work availability</h3>

                <div className="pp-visibility">
                  <div>
                    <strong>{profile.availability}</strong>
                    <span>Employers can see your availability.</span>
                  </div>
                  <span className="pp-status-dot" />
                </div>

                <select
                  className="pp-availability-select"
                  value={profile.availability}
                  onChange={(e) =>
                    updateProfile("availability", e.target.value)
                  }
                >
                  <option>Available for work</option>
                  <option>Open to opportunities</option>
                  <option>Currently unavailable</option>
                </select>
              </section>

              <section className="pp-side-card">
                <h3>Verification status</h3>

                <div className="pp-verification">
                  <ShieldCheck size={25} />
                  <div>
                    <strong>Profile not yet verified</strong>
                    <span>
                      Verification features will be available soon.
                    </span>
                  </div>
                </div>
              </section>

              <section className="pp-side-card">
                <h3>Profile visibility</h3>

                <div className="pp-tip">
                  <strong>Make a strong first impression</strong>
                  <p>
                    A complete profile helps employers understand your skills,
                    experience and professional interests.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
