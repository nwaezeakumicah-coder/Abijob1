
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Search,
  MapPin,
  Star,
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
  id: number;
  name: string;
  profession: string;
  category: string;
  location: string;
  experience: string;
  rating: number;
  reviews: number;
  description: string;
  skills: string[];
  initials: string;
  featured?: boolean;
};

const professionals: Professional[] = [
  {
    id: 1,
    name: "Chinedu Okafor",
    profession: "Graphic Designer",
    category: "Creative & Design",
    location: "Aba",
    experience: "4 years experience",
    rating: 4.9,
    reviews: 28,
    description:
      "Creative designer specialising in brand identity, business graphics, advertising designs and digital content.",
    skills: ["Brand Identity", "CorelDRAW", "Social Media Design"],
    initials: "CO",
    featured: true,
  },
  {
    id: 2,
    name: "Amara Nwosu",
    profession: "Fashion Designer",
    category: "Fashion & Tailoring",
    location: "Ariaria, Aba",
    experience: "6 years experience",
    rating: 4.8,
    reviews: 34,
    description:
      "Fashion designer creating beautiful ready-to-wear outfits, traditional attire and custom clothing.",
    skills: ["Fashion Design", "Tailoring", "Styling"],
    initials: "AN",
    featured: true,
  },
  {
    id: 3,
    name: "Emeka Eze",
    profession: "Professional Barber",
    category: "Beauty & Personal Care",
    location: "Osisioma",
    experience: "5 years experience",
    rating: 4.7,
    reviews: 19,
    description:
      "Experienced barber offering modern haircuts, grooming, beard styling and professional hair care.",
    skills: ["Haircuts", "Beard Grooming", "Hair Styling"],
    initials: "EE",
  },
  {
    id: 4,
    name: "Blessing Kalu",
    profession: "Makeup Artist",
    category: "Beauty & Personal Care",
    location: "Umuahia",
    experience: "3 years experience",
    rating: 4.9,
    reviews: 16,
    description:
      "Professional makeup artist for weddings, special events, photoshoots and everyday beauty.",
    skills: ["Bridal Makeup", "Beauty", "Photoshoot Makeup"],
    initials: "BK",
  },
  {
    id: 5,
    name: "Ikenna Nwachukwu",
    profession: "Web Developer",
    category: "Technology",
    location: "Aba",
    experience: "3 years experience",
    rating: 4.8,
    reviews: 22,
    description:
      "Web developer building responsive websites and digital solutions for individuals and businesses.",
    skills: ["React", "Next.js", "Web Design"],
    initials: "IN",
  },
  {
    id: 6,
    name: "Ngozi Umeh",
    profession: "Caterer",
    category: "Food & Hospitality",
    location: "Umuahia",
    experience: "7 years experience",
    rating: 4.9,
    reviews: 41,
    description:
      "Experienced caterer providing delicious meals, event catering and food services for all occasions.",
    skills: ["Event Catering", "Meal Preparation", "Small Chops"],
    initials: "NU",
  },
  {
    id: 7,
    name: "Obinna Aja",
    profession: "Electrician",
    category: "Technical Services",
    location: "Aba",
    experience: "8 years experience",
    rating: 4.7,
    reviews: 25,
    description:
      "Qualified electrical technician handling domestic wiring, electrical installations and repairs.",
    skills: ["Electrical Wiring", "Installation", "Repairs"],
    initials: "OA",
  },
  {
    id: 8,
    name: "Esther Otti",
    profession: "Photographer",
    category: "Creative & Design",
    location: "Arochukwu",
    experience: "4 years experience",
    rating: 4.8,
    reviews: 18,
    description:
      "Creative photographer covering portraits, celebrations, product photography and events.",
    skills: ["Portraits", "Event Photography", "Editing"],
    initials: "EO",
  },
];

const categories = [
  "All categories",
  "Creative & Design",
  "Fashion & Tailoring",
  "Beauty & Personal Care",
  "Technology",
  "Food & Hospitality",
  "Technical Services",
];

const locations = [
  "All Abia",
  "Aba",
  "Umuahia",
  "Osisioma",
  "Arochukwu",
];

export default function ProfessionalsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [location, setLocation] = useState("All Abia");
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredProfessionals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return professionals.filter((person) => {
      const matchesSearch =
        !query ||
        person.name.toLowerCase().includes(query) ||
        person.profession.toLowerCase().includes(query) ||
        person.category.toLowerCase().includes(query) ||
        person.skills.some((skill) =>
          skill.toLowerCase().includes(query)
        );

      const matchesCategory =
        category === "All categories" ||
        person.category === category;

      const matchesLocation =
        location === "All Abia" ||
        person.location.toLowerCase().includes(location.toLowerCase());

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [search, category, location]);

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
                    {filteredProfessionals.length} professionals found
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

              {filteredProfessionals.length > 0 ? (
                <div className="professionals-grid">
                  {filteredProfessionals.map((person) => (
                    <article
                      className="professional-card"
                      key={person.id}
                    >
                      {person.featured && (
                        <span className="professional-featured">
                          FEATURED
                        </span>
                      )}

                      <div className="professional-card-top">
                        <div className="professional-avatar">
                          {person.initials}
                        </div>

                        <div className="professional-rating">
                          <Star size={15} fill="currentColor" />
                          <strong>{person.rating}</strong>
                          <span>({person.reviews})</span>
                        </div>
                      </div>

                      <div className="professional-card-info">
                        <h3>{person.name}</h3>
                        <span className="professional-role">
                          {person.profession}
                        </span>

                        <p>{person.description}</p>
                      </div>

                      <div className="professional-skills">
                        {person.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>

                      <div className="professional-meta">
                        <span>
                          <MapPin size={15} />
                          {person.location}
                        </span>

                        <span>
                          <BriefcaseBusiness size={15} />
                          {person.experience}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="professional-view-button"
                        onClick={() => setSelectedProfessional(person)}
                      >
                        View profile
                        <ArrowUpRight size={17} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="professionals-empty-state">
                  <div>
                    <Search size={28} />
                  </div>

                  <h3>No professionals found</h3>

                  <p>
                    We couldn't find anyone matching your search.
                    Try another profession, skill or location.
                  </p>

                  <button type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
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
              {selectedProfessional.initials}
            </div>

            <span className="professional-details-eyebrow">
              PROFESSIONAL PROFILE
            </span>

            <h2 id="professional-details-title">
              {selectedProfessional.name}
            </h2>

            <p className="professional-details-role">
              {selectedProfessional.profession}
            </p>

            <div className="professional-details-rating">
              <Star size={16} fill="currentColor" />
              {selectedProfessional.rating} rating
              ({selectedProfessional.reviews} reviews)
            </div>

            <div className="professional-details-section">
              <h3>About this professional</h3>
              <p>{selectedProfessional.description}</p>
            </div>

            <div className="professional-details-section">
              <h3>Skills and services</h3>

              <div className="professional-skills">
                {selectedProfessional.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="professional-details-section">
              <h3>Experience</h3>
              <p>{selectedProfessional.experience}</p>
            </div>

            <div className="professional-details-section">
              <h3>Location</h3>
              <p>{selectedProfessional.location}, Abia State</p>
            </div>

            <Link
              href="/login"
              className="professional-contact-button"
              onClick={() => setSelectedProfessional(null)}
            >
              Sign in to connect
              <ArrowRight size={18} />
            </Link>

            <p className="professional-contact-note">
              Sign in to contact professionals through Abi Job.
            </p>
          </section>
        </div>
      )}

      <Footer />
    </>
  );
}
