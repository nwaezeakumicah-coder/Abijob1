
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  ArrowUpRight,
  ArrowRight,
  SlidersHorizontal,
  UserRound,
  X,
  CheckCircle2,
} from "lucide-react";
import "./professionals.css";

type Professional = {
  user_id: string;
  full_name: string | null;
  location: string | null;
  headline: string | null;
  about: string | null;
  profile_skills: string[] | null;
  category: string | null;
  professional_skills: string[] | null;
  experience_years: number | null;
  professional_bio: string | null;
  service_area: string | null;
  portfolio_url: string | null;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getExperience(years: number | null) {
  if (years === null || years < 0) return "Not specified";
  if (years === 0) return "Less than 1 year";
  return `${years} ${years === 1 ? "year" : "years"} experience`;
}

function getSkills(person: Professional) {
  return Array.from(
    new Set([
      ...(person.professional_skills ?? []),
      ...(person.profile_skills ?? []),
    ])
  ).filter((skill) => typeof skill === "string" && skill.trim());
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [location, setLocation] = useState("All Abia");
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function loadProfessionals() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase.rpc(
        "get_public_professionals",
        { p_professional_id: null }
      );

      if (!active) return;

      if (error) {
        console.error("Public professionals loading failed:", error);
        setLoadError(
          "We couldn't load professionals at the moment. Please try again."
        );
        setProfessionals([]);
        setLoading(false);
        return;
      }

      const records = Array.isArray(data)
        ? (data as Professional[])
        : [];

      setProfessionals(records);
      setLoading(false);
    }

    void loadProfessionals();

    return () => {
      active = false;
    };
  }, [supabase]);

  const categories = useMemo(() => {
    const available = Array.from(
      new Set(
        professionals
          .map((person) => person.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["All categories", ...available];
  }, [professionals]);

  const locations = useMemo(() => {
    const available = Array.from(
      new Set(
        professionals
          .map((person) => person.location?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["All Abia", ...available];
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return professionals.filter((person) => {
      const name = person.full_name ?? "";
      const headline = person.headline ?? "";
      const categoryName = person.category ?? "";
      const description =
        person.professional_bio ?? person.about ?? "";
      const skills = getSkills(person);

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        headline.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        skills.some((skill) =>
          skill.toLowerCase().includes(query)
        );

      const matchesCategory =
        category === "All categories" ||
        categoryName === category;

      const matchesLocation =
        location === "All Abia" ||
        (person.location ?? "")
          .toLowerCase()
          .includes(location.toLowerCase());

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [professionals, search, category, location]);

  function clearFilters() {
    setSearch("");
    setCategory("All categories");
    setLocation("All Abia");
  }

  function scrollToResults() {
    document.querySelector(".professionals-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <Header />

      <main className="professionals-page">
        <section className="professionals-hero">
          <div className="professionals-container professionals-hero-content">
            <div className="professionals-hero-copy">
              <span className="professionals-eyebrow">
                ABIA'S TALENT. ONE COMMUNITY.
              </span>

              <h1>
                Find the right
                <br />
                <span>person for the job.</span>
              </h1>

              <p>
                Discover skilled professionals, talented artisans and
                reliable service providers across Abia State.
                Find the expertise you need.
              </p>

              <div className="professionals-hero-actions">
                <Link href="/register/professional">
                  Showcase your skills
                  <ArrowRight size={18} />
                </Link>

                <span>
                  <CheckCircle2 size={17} />
                  Discover local talent
                </span>
              </div>
            </div>

            <div className="professionals-hero-visual">
              <div className="professionals-orbit orbit-one" />
              <div className="professionals-orbit orbit-two" />

              <div className="professionals-hero-card">
                <div className="professionals-hero-card-icon">
                  <UserRound size={28} />
                </div>

                <span>THE POWER OF SKILLS</span>
                <h2>
                  Great talent
                  <br />
                  deserves to be
                  <br />
                  <strong>discovered.</strong>
                </h2>

                <div className="professionals-hero-card-bottom">
                  <span>Skills. People. Opportunities.</span>
                  <ArrowUpRight size={19} />
                </div>
              </div>

              <div className="professionals-floating-note">
                <span />
                Local professionals, closer to you
              </div>
            </div>
          </div>
        </section>

        <section className="professionals-main professionals-container">
          <div className="professionals-search-panel">
            <div className="professionals-search-field">
              <Search size={20} />

              <input
                type="search"
                placeholder="Search skills, professions or names"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search professionals"
              />
            </div>

            <div className="professionals-search-location">
              <MapPin size={19} />

              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                aria-label="Filter by location"
              >
                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="professionals-search-button"
              onClick={scrollToResults}
            >
              <Search size={18} />
              Find professionals
            </button>
          </div>

          <div className="professionals-content-layout">
            <aside className="professionals-sidebar">
              <div className="professionals-filter-heading">
                <h3>
                  <SlidersHorizontal size={19} />
                  Refine search
                </h3>

                <button type="button" onClick={clearFilters}>
                  Clear all
                </button>
              </div>

              <div className="professionals-filter-group">
                <label htmlFor="professional-category">
                  Professional category
                </label>

                <select
                  id="professional-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="professionals-filter-group">
                <label htmlFor="professional-location">
                  Location
                </label>

                <select
                  id="professional-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  {locations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="professionals-sidebar-note">
                <span>✦</span>
                <p>
                  Are you a skilled professional? Create your profile
                  and let people discover what you do best.
                </p>
                <Link href="/register/professional">
                  Join Abi Job <ArrowRight size={15} />
                </Link>
              </div>
            </aside>

            <div className="professionals-results">
              <div className="professionals-results-heading">
                <div>
                  <span>DISCOVER LOCAL TALENT</span>
                  <h2>Skilled professionals</h2>
                  <p>
                    {loading
                      ? "Loading public profiles..."
                      : `${filteredProfessionals.length} professionals found`}
                  </p>
                </div>

                <button
                  type="button"
                  className="professionals-mobile-filter"
                  onClick={() => setShowFilters(true)}
                >
                  <SlidersHorizontal size={17} />
                  Filters
                </button>
              </div>

              {loading ? (
                <div className="professionals-empty-state" role="status">
                  <div>
                    <UserRound size={28} />
                  </div>
                  <h3>Loading professionals</h3>
                  <p>
                    Please wait while we retrieve public professional
                    profiles.
                  </p>
                </div>
              ) : loadError ? (
                <div className="professionals-empty-state" role="alert">
                  <div>
                    <Search size={28} />
                  </div>
                  <h3>Unable to load professionals</h3>
                  <p>{loadError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredProfessionals.length > 0 ? (
                <div className="professionals-grid">
                  {filteredProfessionals.map((person) => {
                    const name =
                      person.full_name?.trim() || "Professional";
                    const headline =
                      person.headline?.trim() ||
                      person.category ||
                      "Skilled Professional";
                    const description =
                      person.professional_bio?.trim() ||
                      person.about?.trim() ||
                      "This professional has not added an introduction yet.";
                    const skills = getSkills(person);
                    const experience = getExperience(
                      person.experience_years
                    );

                    return (
                      <article
                        className="professional-card"
                        key={person.user_id}
                      >
                        <div className="professional-card-top">
                          <div className="professional-avatar">
                            {getInitials(name)}
                          </div>
                        </div>

                        <div className="professional-card-info">
                          <h3>{name}</h3>
                          <span className="professional-role">
                            {headline}
                          </span>

                          <p>{description}</p>
                        </div>

                        {skills.length > 0 && (
                          <div className="professional-skills">
                            {skills.slice(0, 5).map((skill) => (
                              <span key={skill}>{skill}</span>
                            ))}
                          </div>
                        )}

                        <div className="professional-meta">
                          {person.location && (
                            <span>
                              <MapPin size={15} />
                              {person.location}
                            </span>
                          )}

                          <span>
                            <BriefcaseBusiness size={15} />
                            {experience}
                          </span>
                        </div>

                        <Link
                          href={`/professionals/${encodeURIComponent(
                            person.user_id
                          )}`}
                          className="professional-view-button"
                        >
                          View profile
                          <ArrowUpRight size={17} />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="professionals-empty-state">
                  <div>
                    <Search size={28} />
                  </div>

                  <h3>
                    {professionals.length === 0
                      ? "No public professionals yet"
                      : "No professionals found"}
                  </h3>

                  <p>
                    {professionals.length === 0
                      ? "There are currently no professional profiles available for public viewing. Professionals who enable public visibility will appear here."
                      : "We couldn't find anyone matching your search. Try another profession, skill or location."}
                  </p>

                  {professionals.length > 0 && (
                    <button type="button" onClick={clearFilters}>
                      Clear filters
                    </button>
                  )}

                  <Link href="/register/professional">
                    Are you a professional? Create your profile
                    <ArrowRight size={17} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="professionals-cta">
          <div className="professionals-container professionals-cta-content">
            <div>
              <span>YOUR SKILLS HAVE VALUE</span>
              <h2>Let the right people discover your talent.</h2>
              <p>
                Create your professional profile, showcase your
                experience and connect with people who need your skills.
              </p>
            </div>

            <Link href="/register/professional">
              Create professional profile
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      {showFilters && (
        <div
          className="professionals-filter-overlay"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="professionals-filter-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="professionals-drawer-heading">
              <h2>Filter professionals</h2>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
              >
                <X size={21} />
              </button>
            </div>

            <div className="professionals-filter-group">
              <label htmlFor="mobile-professional-category">
                Professional category
              </label>

              <select
                id="mobile-professional-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="professionals-filter-group">
              <label htmlFor="mobile-professional-location">
                Location
              </label>

              <select
                id="mobile-professional-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="professionals-drawer-actions">
              <button
                type="button"
                onClick={clearFilters}
                className="professionals-drawer-clear"
              >
                Clear all
              </button>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="professionals-drawer-apply"
              >
                Show {filteredProfessionals.length} professionals
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProfessional && (
        <div
          className="professional-details-overlay"
          onClick={() => setSelectedProfessional(null)}
        >
          <section
            className="professional-details-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="professional-details-title"
          >
            <button
              type="button"
              className="professional-details-close"
              onClick={() => setSelectedProfessional(null)}
              aria-label="Close profile"
            >
              <X size={21} />
            </button>

            <div className="professional-details-avatar">
              {getInitials(
                selectedProfessional.full_name || "Professional"
              )}
            </div>

            <span className="professional-details-eyebrow">
              PROFESSIONAL PROFILE
            </span>

            <h2 id="professional-details-title">
              {selectedProfessional.full_name || "Professional"}
            </h2>

            <p className="professional-details-role">
              {selectedProfessional.headline ||
                selectedProfessional.category ||
                "Skilled Professional"}
            </p>

            <div className="professional-details-section">
              <h3>About this professional</h3>
              <p>
                {selectedProfessional.professional_bio ||
                  selectedProfessional.about ||
                  "No introduction has been added yet."}
              </p>
            </div>

            <div className="professional-details-section">
              <h3>Skills and expertise</h3>
              <div className="professional-skills">
                {getSkills(selectedProfessional).length > 0 ? (
                  getSkills(selectedProfessional).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))
                ) : (
                  <p>No skills have been added yet.</p>
                )}
              </div>
            </div>

            <div className="professional-details-section">
              <h3>Experience</h3>
              <p>
                {getExperience(
                  selectedProfessional.experience_years
                )}
              </p>
            </div>

            <div className="professional-details-section">
              <h3>Location</h3>
              <p>
                {selectedProfessional.location || "Not specified"}
              </p>
            </div>

            <Link
              href={`/professionals/${encodeURIComponent(
                selectedProfessional.user_id
              )}`}
              className="professional-contact-button"
              onClick={() => setSelectedProfessional(null)}
            >
              View full profile
              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
      )}

      <Footer />
    </>
  );
}
