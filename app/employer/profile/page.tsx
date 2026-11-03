
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  Users,
  CalendarDays,
  Upload,
  Share2,
  Bell,
  MessageCircle,
} from "lucide-react";

import Logo from "../../../components/Logo";
import "./profile.css";

type CompanyProfile = {
  companyName: string;
  industry: string;
  companySize: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  founded: string;
  description: string;
  facebook: string;
  instagram: string;
  linkedin: string;
};

const defaultProfile: CompanyProfile = {
  companyName: "Your Company",
  industry: "Technology",
  companySize: "1–10 employees",
  location: "Aba, Abia State",
  website: "",
  email: "",
  phone: "",
  founded: "",
  description: "",
  facebook: "",
  instagram: "",
  linkedin: "",
};

export default function EmployerProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    // Calculate the current year in the browser after mounting.
    setCurrentYear(new Date().getFullYear());

    try {
      const storedProfile = localStorage.getItem(
        "abijob-employer-company-profile"
      );

      if (storedProfile) {
        const parsedProfile = JSON.parse(
          storedProfile
        ) as Partial<CompanyProfile>;

        setProfile({ ...defaultProfile, ...parsedProfile });
      }
    } catch {
      setSaveError("We couldn't load your saved profile information.");
    }
  }, []);

  function updateField<K extends keyof CompanyProfile>(
    field: K,
    value: CompanyProfile[K]
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSaveError("");
  }

  function handleSave() {
    try {
      localStorage.setItem(
        "abijob-employer-company-profile",
        JSON.stringify(profile)
      );

      setSaved(true);
      setSaveError("");
    } catch {
      setSaved(false);
      setSaveError("Your changes could not be saved in this browser.");
    }
  }

  return (
    <main className="employer-profile-page">
      <aside className="employer-profile-sidebar">
        <div className="employer-profile-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="employer-profile-company">
          <div className="employer-profile-company-icon">
            <Building2 size={21} />
          </div>

          <div>
            <strong>{profile.companyName || "Your Company"}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="employer-profile-nav-label">WORKSPACE</p>

        <nav className="employer-profile-nav">
          <Link href="/employer/dashboard">
            <BriefcaseBusiness size={18} />
            <span>Overview</span>
          </Link>

          <Link href="/employer/jobs">
            <BriefcaseBusiness size={18} />
            <span>My job posts</span>
          </Link>

          <Link href="/employer/applicants">
            <Users size={18} />
            <span>Applicants</span>
          </Link>

          <Link href="/employer/messages">
            <MessageCircle size={18} />
            <span>Messages</span>
          </Link>

          <Link href="/employer/notifications">
            <Bell size={18} />
            <span>Notifications</span>
          </Link>

          <Link href="/employer/profile" className="active">
            <Building2 size={18} />
            <span>Company profile</span>
          </Link>
        </nav>

        <p className="employer-profile-nav-label employer-profile-preferences">
          PREFERENCES
        </p>

        <nav className="employer-profile-nav">
          <Link href="/employer/settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="employer-profile-sidebar-bottom">
          <div className="employer-profile-help">
            <div className="employer-profile-help-icon">
              <Users size={19} />
            </div>

            <strong>Need a hand?</strong>

            <p>
              Need help presenting your business to job seekers?
              Visit our help centre.
            </p>

            <Link href="/support">Visit help centre →</Link>
          </div>

          <Link href="/" className="employer-profile-back">
            <ArrowLeft size={16} />
            Back to Abi Job
          </Link>
        </div>
      </aside>

      <section className="employer-profile-main">
        <header className="employer-profile-topbar">
          <div>
            <span>EMPLOYER WORKSPACE</span>
            <p>Build your company&apos;s presence on Abi Job</p>
          </div>

          <div className="employer-profile-account">
            <div className="employer-profile-account-icon">
              <Building2 size={18} />
            </div>

            <div>
              <strong>{profile.companyName || "Your Company"}</strong>
              <small>Employer</small>
            </div>

            <ChevronDown size={16} />
          </div>
        </header>

        <div className="employer-profile-content">
          <div className="employer-profile-heading">
            <div>
              <span className="employer-profile-kicker">
                BUSINESS IDENTITY
              </span>

              <h1>Company profile</h1>

              <p>
                Introduce your business and help talented people
                understand who you are.
              </p>
            </div>

            <button
              type="button"
              className="employer-profile-save-top"
              onClick={handleSave}
            >
              <Save size={17} />
              Save changes
            </button>
          </div>

          <section className="employer-profile-banner">
            <div className="employer-profile-banner-art">
              <div className="employer-profile-banner-circle circle-one" />
              <div className="employer-profile-banner-circle circle-two" />

              <div className="employer-profile-banner-content">
                <span>YOUR BUSINESS. YOUR STORY.</span>
                <h2>Make your company stand out.</h2>
                <p>
                  A complete profile helps candidates discover
                  your business and trust your opportunities.
                </p>
              </div>
            </div>

            <div className="employer-profile-logo-area">
              <div className="employer-profile-company-logo">
                <Building2 size={34} />

                <button
                  type="button"
                  aria-label="Company logo upload coming soon"
                  title="Company logo upload will be available with backend storage"
                  disabled
                >
                  <Camera size={15} />
                </button>
              </div>

              <div className="employer-profile-company-summary">
                <strong>{profile.companyName || "Your Company"}</strong>
                <span>
                  {profile.industry} · {profile.location || "Location not added"}
                </span>
              </div>

              <span className="employer-profile-completion">
                <CheckCircle2 size={15} />
                Profile editor
              </span>
            </div>
          </section>

          <section className="employer-profile-card">
            <div className="employer-profile-section-heading">
              <div className="employer-profile-section-icon">
                <Building2 size={19} />
              </div>

              <div>
                <h2>Company information</h2>
                <p>Basic details about your business.</p>
              </div>
            </div>

            <div className="employer-profile-form-grid">
              <label className="employer-profile-field">
                <span>Company name</span>
                <input
                  type="text"
                  value={profile.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Enter your company name"
                />
              </label>

              <label className="employer-profile-field">
                <span>Industry</span>
                <select
                  value={profile.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                >
                  <option>Technology</option>
                  <option>Fashion and textiles</option>
                  <option>Manufacturing</option>
                  <option>Retail and commerce</option>
                  <option>Hospitality and tourism</option>
                  <option>Education</option>
                  <option>Healthcare</option>
                  <option>Finance</option>
                  <option>Media and entertainment</option>
                  <option>Construction</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="employer-profile-field">
                <span>Company size</span>
                <select
                  value={profile.companySize}
                  onChange={(e) => updateField("companySize", e.target.value)}
                >
                  <option>1–10 employees</option>
                  <option>11–50 employees</option>
                  <option>51–200 employees</option>
                  <option>201–500 employees</option>
                  <option>501–1,000 employees</option>
                  <option>1,000+ employees</option>
                </select>
              </label>

              <label className="employer-profile-field">
                <span>Business location</span>
                <div className="employer-profile-input-icon">
                  <MapPin size={16} />
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="City, State"
                  />
                </div>
              </label>

              <label className="employer-profile-field">
                <span>Year established</span>
                <div className="employer-profile-input-icon">
                  <CalendarDays size={16} />
                  <input
                    type="number"
                    min="1800"
                    max={currentYear ?? 2100}
                    value={profile.founded}
                    onChange={(e) => updateField("founded", e.target.value)}
                    placeholder="e.g. 2022"
                  />
                </div>
              </label>

              <label className="employer-profile-field">
                <span>Company website</span>
                <div className="employer-profile-input-icon">
                  <Globe size={16} />
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </label>
            </div>

            <label className="employer-profile-field employer-profile-description">
              <span>About your company</span>
              <textarea
                value={profile.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={5}
                maxLength={700}
                placeholder="Tell job seekers about your business..."
              />
              <small>{profile.description.length}/700 characters</small>
            </label>
          </section>

          <section className="employer-profile-card">
            <div className="employer-profile-section-heading">
              <div className="employer-profile-section-icon">
                <Phone size={19} />
              </div>

              <div>
                <h2>Contact information</h2>
                <p>How candidates and customers can reach your business.</p>
              </div>
            </div>

            <div className="employer-profile-form-grid">
              <label className="employer-profile-field">
                <span>Business email</span>
                <div className="employer-profile-input-icon">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="business@example.com"
                  />
                </div>
              </label>

              <label className="employer-profile-field">
                <span>Business phone number</span>
                <div className="employer-profile-input-icon">
                  <Phone size={16} />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+234..."
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="employer-profile-card">
            <div className="employer-profile-section-heading">
              <div className="employer-profile-section-icon">
                <Globe size={19} />
              </div>

              <div>
                <h2>Social media</h2>
                <p>Connect your company&apos;s social media pages.</p>
              </div>
            </div>

            <div className="employer-profile-form-grid">
              <label className="employer-profile-field">
                <span>Facebook URL</span>
                <div className="employer-profile-input-icon">
                  <Globe size={16} />
                  <input
                    type="url"
                    value={profile.facebook}
                    onChange={(e) => updateField("facebook", e.target.value)}
                    placeholder="https://facebook.com/yourcompany"
                  />
                </div>
              </label>

              <label className="employer-profile-field">
                <span>Instagram URL</span>
                <div className="employer-profile-input-icon">
                  <Globe size={16} />
                  <input
                    type="url"
                    value={profile.instagram}
                    onChange={(e) => updateField("instagram", e.target.value)}
                    placeholder="https://instagram.com/yourcompany"
                  />
                </div>
              </label>

              <label className="employer-profile-field">
                <span>LinkedIn URL</span>
                <div className="employer-profile-input-icon">
                  <Share2 size={16} />
                  <input
                    type="url"
                    value={profile.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="employer-profile-upload-card">
            <div className="employer-profile-upload-icon">
              <Upload size={22} />
            </div>

            <div>
              <h3>Company branding</h3>
              <p>
                A company logo and cover image help your profile look
                more professional. Image uploads will be connected
                when backend storage is implemented.
              </p>
            </div>

            <span>Backend integration pending</span>
          </section>

          <div className="employer-profile-bottom-actions">
            <span>
              <CheckCircle2 size={16} />
              Saved in this browser for this demo.
            </span>

            <button type="button" onClick={handleSave}>
              <Save size={17} />
              Save company profile
            </button>
          </div>

          {saved && (
            <div className="employer-profile-save-message" role="status">
              <CheckCircle2 size={17} />
              Your company profile has been saved in this browser.
            </div>
          )}

          {saveError && (
            <div className="employer-profile-error-message" role="alert">
              {saveError}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
