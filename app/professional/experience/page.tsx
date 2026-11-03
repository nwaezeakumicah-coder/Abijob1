
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Logo from "../../../components/Logo";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlus,
  FileBadge,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import "./experience.css";

type Experience = {
  id: number;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

type Education = {
  id: number;
  qualification: string;
  institution: string;
  year: string;
};

type Certificate = {
  id: number;
  name: string;
  issuer: string;
  year: string;
};

const initialExperiences: Experience[] = [
  {
    id: 1,
    role: "Senior Graphic Designer",
    company: "Creative Hub Studio",
    location: "Aba, Abia State",
    startDate: "January 2024",
    endDate: "",
    current: true,
    description:
      "Creating brand identities, marketing materials, social media designs and print-ready graphics for businesses and individual clients.",
  },
  {
    id: 2,
    role: "Junior Graphic Designer",
    company: "PixelPoint Creatives",
    location: "Umuahia, Abia State",
    startDate: "March 2022",
    endDate: "December 2023",
    current: false,
    description:
      "Designed promotional materials, business cards, flyers, banners and other visual communication materials.",
  },
];

const initialEducation: Education[] = [
  {
    id: 1,
    qualification: "Certificate in Graphic Design",
    institution: "Professional Design Training",
    year: "2023",
  },
];

const initialCertificates: Certificate[] = [
  {
    id: 1,
    name: "Graphic Design and Visual Communication",
    issuer: "Creative Skills Institute",
    year: "2023",
  },
];

export default function ProfessionalExperiencePage() {
  const [experiences, setExperiences] =
    useState<Experience[]>(initialExperiences);

  const [education, setEducation] =
    useState<Education[]>(initialEducation);

  const [certificates, setCertificates] =
    useState<Certificate[]>(initialCertificates);

  const [activeModal, setActiveModal] = useState<
    "experience" | "education" | "certificate" | null
  >(null);

  const [editingExperience, setEditingExperience] =
    useState<Experience | null>(null);

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [current, setCurrent] = useState(false);
  const [description, setDescription] = useState("");

  const [qualification, setQualification] = useState("");
  const [institution, setInstitution] = useState("");
  const [educationYear, setEducationYear] = useState("");

  const [certificateName, setCertificateName] = useState("");
  const [certificateIssuer, setCertificateIssuer] = useState("");
  const [certificateYear, setCertificateYear] = useState("");

  const resetExperienceForm = () => {
    setRole("");
    setCompany("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setCurrent(false);
    setDescription("");
    setEditingExperience(null);
  };

  const openExperienceModal = (experience?: Experience) => {
    if (experience) {
      setEditingExperience(experience);
      setRole(experience.role);
      setCompany(experience.company);
      setLocation(experience.location);
      setStartDate(experience.startDate);
      setEndDate(experience.endDate);
      setCurrent(experience.current);
      setDescription(experience.description);
    } else {
      resetExperienceForm();
    }

    setActiveModal("experience");
  };

  const saveExperience = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const experienceData: Experience = {
      id: editingExperience?.id ?? Date.now(),
      role,
      company,
      location,
      startDate,
      endDate: current ? "" : endDate,
      current,
      description,
    };

    if (editingExperience) {
      setExperiences((previous) =>
        previous.map((item) =>
          item.id === editingExperience.id ? experienceData : item
        )
      );
    } else {
      setExperiences((previous) => [experienceData, ...previous]);
    }

    setActiveModal(null);
    resetExperienceForm();
  };

  const saveEducation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setEducation((previous) => [
      {
        id: Date.now(),
        qualification,
        institution,
        year: educationYear,
      },
      ...previous,
    ]);

    setQualification("");
    setInstitution("");
    setEducationYear("");
    setActiveModal(null);
  };

  const saveCertificate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCertificates((previous) => [
      {
        id: Date.now(),
        name: certificateName,
        issuer: certificateIssuer,
        year: certificateYear,
      },
      ...previous,
    ]);

    setCertificateName("");
    setCertificateIssuer("");
    setCertificateYear("");
    setActiveModal(null);
  };

  const removeExperience = (id: number) => {
    setExperiences((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const removeEducation = (id: number) => {
    setEducation((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const removeCertificate = (id: number) => {
    setCertificates((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  return (
    <main className="professional-experience">
      <aside className="professional-sidebar">
        <div className="professional-sidebar-brand">
          <Logo size="medium" light />
        </div>

        <div className="professional-sidebar-label">WORKSPACE</div>

        <nav className="professional-sidebar-nav">
          <Link href="/professional/dashboard">
            <Activity size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/professional/opportunities">
            <BriefcaseBusiness size={19} />
            <span>Find opportunities</span>
          </Link>

          <Link href="/professional/applications">
            <FileBadge size={19} />
            <span>My applications</span>
          </Link>

          <Link href="/professional/profile">
            <GraduationCap size={19} />
            <span>My profile</span>
          </Link>

          <Link
            href="/professional/experience"
            className="active"
          >
            <BriefcaseBusiness size={19} />
            <span>Experience & credentials</span>
          </Link>

          <Link href="/professional/notifications">
            <Activity size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="professional-sidebar-bottom">
          <div className="professional-sidebar-help">
            <div className="professional-help-icon">
              <Award size={21} />
            </div>

            <h4>Build a stronger profile</h4>
            <p>
              Complete your professional history to help employers
              understand your experience.
            </p>

            <Link href="/professional/profile">
              Improve profile <ArrowRight size={15} />
            </Link>
          </div>

          <Link
            href="/professional/settings"
            className="professional-settings-link"
          >
            <MoreHorizontal size={19} />
            Account settings
          </Link>
        </div>
      </aside>

      <section className="professional-main">
        <header className="professional-topbar">
          <div className="professional-breadcrumb">
            <span>Professional workspace</span>
            <ChevronRight size={15} />
            <strong>Experience & credentials</strong>
          </div>

          <div className="professional-topbar-right">
            <div className="professional-status">
              <span />
              Profile active
            </div>

            <div className="professional-avatar">MJ</div>
          </div>
        </header>

        <div className="experience-content">
          <div className="experience-heading">
            <div>
              <Link
                href="/professional/profile"
                className="experience-back-link"
              >
                <ArrowLeft size={15} />
                Back to profile
              </Link>

              <span className="experience-eyebrow">
                YOUR PROFESSIONAL BACKGROUND
              </span>

              <h1>Experience & credentials</h1>

              <p>
                Showcase your work history, education, certifications
                and professional achievements.
              </p>
            </div>

            <button
              className="experience-primary-button"
              onClick={() => openExperienceModal()}
            >
              <Plus size={18} />
              Add experience
            </button>
          </div>

          <div className="experience-overview">
            <div className="experience-overview-card">
              <div className="overview-icon green">
                <BriefcaseBusiness size={21} />
              </div>
              <div>
                <span>Work experiences</span>
                <strong>{experiences.length}</strong>
              </div>
            </div>

            <div className="experience-overview-card">
              <div className="overview-icon orange">
                <GraduationCap size={21} />
              </div>
              <div>
                <span>Education records</span>
                <strong>{education.length}</strong>
              </div>
            </div>

            <div className="experience-overview-card">
              <div className="overview-icon purple">
                <Award size={21} />
              </div>
              <div>
                <span>Certifications</span>
                <strong>{certificates.length}</strong>
              </div>
            </div>
          </div>

          <div className="experience-layout">
            <div className="experience-primary-column">
              <section className="experience-section">
                <div className="experience-section-heading">
                  <div className="experience-section-title">
                    <div className="section-heading-icon">
                      <BriefcaseBusiness size={20} />
                    </div>
                    <div>
                      <h2>Work experience</h2>
                      <p>
                        Your previous and current professional roles.
                      </p>
                    </div>
                  </div>

                  <button
                    className="experience-add-button"
                    onClick={() => openExperienceModal()}
                  >
                    <CirclePlus size={17} />
                    Add
                  </button>
                </div>

                {experiences.length > 0 ? (
                  <div className="experience-timeline">
                    {experiences.map((item) => (
                      <article
                        className="experience-record"
                        key={item.id}
                      >
                        <div className="experience-timeline-marker">
                          <span />
                        </div>

                        <div className="experience-record-content">
                          <div className="experience-record-top">
                            <div>
                              <h3>{item.role}</h3>
                              <strong>{item.company}</strong>
                            </div>

                            <div className="experience-record-actions">
                              <button
                                aria-label="Edit experience"
                                onClick={() =>
                                  openExperienceModal(item)
                                }
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                aria-label="Delete experience"
                                onClick={() =>
                                  removeExperience(item.id)
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="experience-record-meta">
                            <span>
                              <CalendarDays size={15} />
                              {item.startDate} –{" "}
                              {item.current
                                ? "Present"
                                : item.endDate}
                            </span>

                            <span>
                              <MapPin size={15} />
                              {item.location}
                            </span>
                          </div>

                          {item.current && (
                            <span className="current-role-badge">
                              <span />
                              Currently working here
                            </span>
                          )}

                          <p className="experience-description">
                            {item.description}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="experience-empty">
                    <BriefcaseBusiness size={30} />
                    <h3>No work experience added yet</h3>
                    <p>
                      Add your previous roles to show employers what
                      you can do.
                    </p>
                    <button
                      onClick={() => openExperienceModal()}
                    >
                      Add your first experience
                    </button>
                  </div>
                )}
              </section>

              <section className="experience-section">
                <div className="experience-section-heading">
                  <div className="experience-section-title">
                    <div className="section-heading-icon orange">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h2>Education</h2>
                      <p>
                        Your academic qualifications and training.
                      </p>
                    </div>
                  </div>

                  <button
                    className="experience-add-button"
                    onClick={() => setActiveModal("education")}
                  >
                    <CirclePlus size={17} />
                    Add
                  </button>
                </div>

                {education.length > 0 ? (
                  <div className="experience-simple-list">
                    {education.map((item) => (
                      <div
                        className="experience-simple-record"
                        key={item.id}
                      >
                        <div className="simple-record-icon orange">
                          <GraduationCap size={21} />
                        </div>

                        <div className="simple-record-info">
                          <h3>{item.qualification}</h3>
                          <p>{item.institution}</p>
                          <span>{item.year}</span>
                        </div>

                        <button
                          aria-label="Delete education record"
                          onClick={() => removeEducation(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="experience-empty compact">
                    <p>No education records added yet.</p>
                    <button
                      onClick={() => setActiveModal("education")}
                    >
                      Add education
                    </button>
                  </div>
                )}
              </section>

              <section className="experience-section">
                <div className="experience-section-heading">
                  <div className="experience-section-title">
                    <div className="section-heading-icon purple">
                      <Award size={20} />
                    </div>
                    <div>
                      <h2>Certifications & training</h2>
                      <p>
                        Professional certificates, licences and
                        completed training.
                      </p>
                    </div>
                  </div>

                  <button
                    className="experience-add-button"
                    onClick={() => setActiveModal("certificate")}
                  >
                    <CirclePlus size={17} />
                    Add
                  </button>
                </div>

                {certificates.length > 0 ? (
                  <div className="experience-simple-list">
                    {certificates.map((item) => (
                      <div
                        className="experience-simple-record"
                        key={item.id}
                      >
                        <div className="simple-record-icon purple">
                          <FileBadge size={21} />
                        </div>

                        <div className="simple-record-info">
                          <h3>{item.name}</h3>
                          <p>{item.issuer}</p>
                          <span>{item.year}</span>
                        </div>

                        <button
                          aria-label="Delete certificate"
                          onClick={() =>
                            removeCertificate(item.id)
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="experience-empty compact">
                    <p>No certifications added yet.</p>
                    <button
                      onClick={() => setActiveModal("certificate")}
                    >
                      Add certification
                    </button>
                  </div>
                )}
              </section>
            </div>

            <aside className="experience-side-column">
              <div className="experience-tip-card">
                <div className="tip-card-icon">
                  <Award size={22} />
                </div>

                <span>PROFILE TIP</span>
                <h3>Show employers what makes you valuable.</h3>
                <p>
                  Detailed work descriptions and relevant
                  certifications can help employers understand your
                  capabilities.
                </p>

                <Link href="/professional/profile">
                  View your profile <ArrowRight size={16} />
                </Link>
              </div>

              <div className="experience-checklist-card">
                <h3>Professional profile checklist</h3>
                <p>Build a complete professional profile.</p>

                <div className="checklist-item completed">
                  <span><Check size={13} /></span>
                  Basic profile information
                </div>

                <div className="checklist-item">
                  <span />
                  Work experience
                </div>

                <div className="checklist-item">
                  <span />
                  Education history
                </div>

                <div className="checklist-item">
                  <span />
                  Certifications
                </div>

                <div className="checklist-item">
                  <span />
                  Portfolio and work samples
                </div>
              </div>

              <div className="experience-support-card">
                <div className="support-icon">
                  <Upload size={19} />
                </div>
                <div>
                  <h3>Have a CV already?</h3>
                  <p>
                    Keep your professional documents organised.
                  </p>
                  <Link href="/professional/profile">
                    Manage documents <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          <footer className="experience-footer">
            <span>Abi Job · Opportunity Starts Here</span>
            <span>Professional workspace</span>
          </footer>
        </div>
      </section>

      {activeModal && (
        <div
          className="experience-modal-overlay"
          onClick={() => {
            setActiveModal(null);
            resetExperienceForm();
          }}
        >
          <div
            className="experience-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="experience-modal-header">
              <div>
                <span>PROFESSIONAL RECORDS</span>
                <h2>
                  {activeModal === "experience"
                    ? editingExperience
                      ? "Edit work experience"
                      : "Add work experience"
                    : activeModal === "education"
                    ? "Add education"
                    : "Add certification"}
                </h2>
              </div>

              <button
                aria-label="Close modal"
                onClick={() => {
                  setActiveModal(null);
                  resetExperienceForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            {activeModal === "experience" && (
              <form
                className="experience-form"
                onSubmit={saveExperience}
              >
                <label>
                  Job title
                  <input
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value)
                    }
                    placeholder="e.g. Graphic Designer"
                    required
                  />
                </label>

                <label>
                  Company or organisation
                  <input
                    value={company}
                    onChange={(event) =>
                      setCompany(event.target.value)
                    }
                    placeholder="Enter company name"
                    required
                  />
                </label>

                <label>
                  Location
                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Aba, Abia State"
                    required
                  />
                </label>

                <div className="experience-form-grid">
                  <label>
                    Start date
                    <input
                      value={startDate}
                      onChange={(event) =>
                        setStartDate(event.target.value)
                      }
                      placeholder="e.g. January 2024"
                      required
                    />
                  </label>

                  <label>
                    End date
                    <input
                      value={endDate}
                      onChange={(event) =>
                        setEndDate(event.target.value)
                      }
                      placeholder="e.g. December 2024"
                      disabled={current}
                      required={!current}
                    />
                  </label>
                </div>

                <label className="experience-current-checkbox">
                  <input
                    type="checkbox"
                    checked={current}
                    onChange={(event) =>
                      setCurrent(event.target.checked)
                    }
                  />
                  I currently work here
                </label>

                <label>
                  Job description
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Describe your responsibilities, achievements and skills..."
                    rows={4}
                    required
                  />
                </label>

                <div className="experience-modal-actions">
                  <button
                    type="button"
                    className="experience-cancel-button"
                    onClick={() => {
                      setActiveModal(null);
                      resetExperienceForm();
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="experience-primary-button"
                  >
                    <Check size={17} />
                    Save experience
                  </button>
                </div>
              </form>
            )}

            {activeModal === "education" && (
              <form
                className="experience-form"
                onSubmit={saveEducation}
              >
                <label>
                  Qualification
                  <input
                    value={qualification}
                    onChange={(event) =>
                      setQualification(event.target.value)
                    }
                    placeholder="e.g. B.Sc. Computer Science"
                    required
                  />
                </label>

                <label>
                  Institution
                  <input
                    value={institution}
                    onChange={(event) =>
                      setInstitution(event.target.value)
                    }
                    placeholder="School or training institution"
                    required
                  />
                </label>

                <label>
                  Year completed
                  <input
                    value={educationYear}
                    onChange={(event) =>
                      setEducationYear(event.target.value)
                    }
                    placeholder="e.g. 2024"
                    required
                  />
                </label>

                <div className="experience-modal-actions">
                  <button
                    type="button"
                    className="experience-cancel-button"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="experience-primary-button"
                  >
                    <Check size={17} />
                    Save education
                  </button>
                </div>
              </form>
            )}

            {activeModal === "certificate" && (
              <form
                className="experience-form"
                onSubmit={saveCertificate}
              >
                <label>
                  Certificate or training name
                  <input
                    value={certificateName}
                    onChange={(event) =>
                      setCertificateName(event.target.value)
                    }
                    placeholder="Enter certificate name"
                    required
                  />
                </label>

                <label>
                  Issuing organisation
                  <input
                    value={certificateIssuer}
                    onChange={(event) =>
                      setCertificateIssuer(event.target.value)
                    }
                    placeholder="Who issued the certificate?"
                    required
                  />
                </label>

                <label>
                  Year obtained
                  <input
                    value={certificateYear}
                    onChange={(event) =>
                      setCertificateYear(event.target.value)
                    }
                    placeholder="e.g. 2025"
                    required
                  />
                </label>

                <div className="experience-modal-actions">
                  <button
                    type="button"
                    className="experience-cancel-button"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="experience-primary-button"
                  >
                    <Check size={17} />
                    Save certificate
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
