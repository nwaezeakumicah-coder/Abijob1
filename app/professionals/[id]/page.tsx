"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { createClient } from "@/lib/supabase/client";
import "./profile.css";

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

function ProfessionalProfileContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactNotice, setContactNotice] = useState("");
  const [contacting, setContacting] = useState(false);

  const handledContactRef = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function loadProfessional() {
      setLoading(true);
      setPageError("");
      setProfessional(null);

      const { data, error } = await supabase.rpc(
        "get_public_professionals",
        { p_professional_id: id }
      );

      if (!active) return;

      if (error) {
        console.error("Professional profile loading failed:", error);
        setPageError(
          "We couldn't load this professional's profile. Please try again."
        );
        setLoading(false);
        return;
      }

      const result = Array.isArray(data) ? data[0] : null;

      if (!result) {
        setPageError(
          "This professional is not currently available for public viewing."
        );
        setLoading(false);
        return;
      }

      setProfessional(result as Professional);
      setLoading(false);
    }

    if (id) {
      void loadProfessional();
    }

    return () => {
      active = false;
    };
  }, [id, supabase]);

  const contactProfessional = useCallback(async () => {
    if (!professional || contacting) return;

    setContactError("");
    setContactNotice("");
    setContacting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Contact authentication check failed:", authError);
        setContactError(
          "We couldn't verify your sign-in. Please refresh the page and try again."
        );
        return;
      }

      if (!user) {
        const returnTo = `/professionals/${encodeURIComponent(
          professional.user_id
        )}?contact=1`;

        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error(
          "Contact role verification failed:",
          profileError
        );
        setContactError(
          "We couldn't verify your account type. Please try again."
        );
        return;
      }

      const role = String(profile.role ?? "")
        .toLowerCase()
        .replaceAll("-", "_");

      if (role !== "job_seeker") {
        setContactNotice(
          "Direct professional enquiries are currently available to signed-in Job Seekers."
        );
        return;
      }

      const { data: conversationId, error: conversationError } =
        await supabase.rpc("create_direct_conversation", {
          p_professional_id: professional.user_id,
        });

      if (conversationError || !conversationId) {
        console.error(
          "Direct conversation creation failed:",
          conversationError
        );
        setContactError(
          conversationError?.message ||
            "We couldn't start this conversation. Please try again."
        );
        return;
      }

      router.push(
        `/messages?conversation=${encodeURIComponent(conversationId)}`
      );
    } catch (error) {
      console.error("Unexpected contact error:", error);
      setContactError(
        "Something went wrong while connecting. Please try again."
      );
    } finally {
      setContacting(false);
    }
  }, [professional, contacting, router, supabase]);

  // Resume the contact action after a Job Seeker signs in.
  useEffect(() => {
    if (
      loading ||
      !professional ||
      handledContactRef.current ||
      typeof window === "undefined"
    ) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("contact") !== "1") return;

    handledContactRef.current = true;
    void contactProfessional();
  }, [loading, professional, contactProfessional]);

  const skills = Array.from(
    new Set([
      ...(professional?.professional_skills ?? []),
      ...(professional?.profile_skills ?? []),
    ])
  ).filter(Boolean);

  const name = professional?.full_name?.trim() || "Professional";
  const experience = getExperience(
    professional?.experience_years ?? null
  );

  return (
    <>
      <Header />

      <main className="public-profile-page">
        <div className="public-profile-container">
          <Link href="/professionals" className="public-profile-back">
            <ArrowLeft size={17} />
            Back to professionals
          </Link>

          {loading && (
            <section className="public-profile-section">
              <p>Loading professional profile...</p>
            </section>
          )}

          {!loading && pageError && (
            <section className="public-profile-section">
              <h1>Professional profile unavailable</h1>
              <p className="public-profile-about">{pageError}</p>
              <Link href="/professionals" className="public-profile-back">
                <ArrowLeft size={17} />
                Return to professionals
              </Link>
            </section>
          )}

          {!loading && !pageError && professional && (
            <>
              <section className="public-profile-hero">
                <div className="public-profile-identity">
                  <div className="public-profile-avatar">
                    {getInitials(name)}
                  </div>

                  <div className="public-profile-name-block">
                    <div className="public-profile-badges">
                      <span className="public-profile-verified">
                        <ShieldCheck size={14} />
                        Public professional profile
                      </span>
                    </div>

                    <h1>{name}</h1>
                    <p>
                      {professional.headline ||
                        professional.category ||
                        "Skilled Professional"}
                    </p>

                    <div className="public-profile-quick-meta">
                      {professional.location && (
                        <span>
                          <MapPin size={16} />
                          {professional.location}
                        </span>
                      )}

                      <span>
                        <BriefcaseBusiness size={16} />
                        {experience}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="public-profile-actions">
                  <button
                    type="button"
                    className="public-profile-contact"
                    onClick={() => void contactProfessional()}
                    disabled={contacting}
                  >
                    <MessageCircle size={18} />
                    {contacting ? "Connecting..." : "Contact professional"}
                  </button>

                  <span className="public-profile-action-note">
                    Signed-in Job Seekers can connect through Abi Job.
                  </span>

                  {contactError && (
                    <p role="alert" className="public-profile-contact-error">
                      {contactError}
                    </p>
                  )}

                  {contactNotice && (
                    <p role="status" className="public-profile-contact-error">
                      {contactNotice}
                    </p>
                  )}
                </div>
              </section>

              <div className="public-profile-layout">
                <div className="public-profile-main-column">
                  <section className="public-profile-section">
                    <div className="public-profile-section-heading">
                      <span>01</span>
                      <h2>About this professional</h2>
                    </div>

                    <p className="public-profile-about">
                      {professional.professional_bio?.trim() ||
                        professional.about?.trim() ||
                        "This professional has not added an introduction yet."}
                    </p>
                  </section>

                  <section className="public-profile-section">
                    <div className="public-profile-section-heading">
                      <span>02</span>
                      <h2>Skills and expertise</h2>
                    </div>

                    {skills.length > 0 ? (
                      <div className="public-profile-skills">
                        {skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="public-profile-section-intro">
                        This professional has not added skills yet.
                      </p>
                    )}
                  </section>

                  <section className="public-profile-section">
                    <div className="public-profile-section-heading">
                      <span>03</span>
                      <h2>Portfolio</h2>
                    </div>

                    {professional.portfolio_url ? (
                      <p className="public-profile-section-intro">
                        <a
                          href={professional.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View portfolio
                          <ArrowUpRight
                            size={16}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                              marginLeft: 5,
                            }}
                          />
                        </a>
                      </p>
                    ) : (
                      <p className="public-profile-section-intro">
                        This professional has not added a portfolio link yet.
                      </p>
                    )}
                  </section>
                </div>

                <aside className="public-profile-sidebar">
                  <section className="public-profile-side-card">
                    <h2>Professional overview</h2>

                    <div className="public-profile-side-row">
                      <span>
                        <BriefcaseBusiness size={17} />
                        Category
                      </span>
                      <strong>
                        {professional.category || "Not specified"}
                      </strong>
                    </div>

                    <div className="public-profile-side-row">
                      <span>
                        <MapPin size={17} />
                        Location
                      </span>
                      <strong>
                        {professional.location || "Not specified"}
                      </strong>
                    </div>

                    <div className="public-profile-side-row">
                      <span>
                        <Clock3 size={17} />
                        Experience
                      </span>
                      <strong>{experience}</strong>
                    </div>

                    {professional.service_area && (
                      <div className="public-profile-side-row">
                        <span>
                          <MapPin size={17} />
                          Service area
                        </span>
                        <strong>{professional.service_area}</strong>
                      </div>
                    )}
                  </section>

                  <section className="public-profile-help-card">
                    <div>
                      <MessageCircle size={22} />
                    </div>
                    <h2>Interested in working together?</h2>
                    <p>
                      Start a direct conversation with this professional
                      through Abi Job.
                    </p>
                    <button
                      type="button"
                      onClick={() => void contactProfessional()}
                      disabled={contacting}
                    >
                      {contacting ? "Connecting..." : "Connect"}
                      <ArrowUpRight size={17} />
                    </button>
                  </section>
                </aside>
              </div>

              <div className="public-profile-bottom-link">
                <Link href="/professionals">
                  <ArrowLeft size={17} />
                  Explore more professionals
                </Link>
                <Link href="/register/professional">
                  Are you a professional? Join Abi Job
                  <ArrowRight size={17} />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function ProfessionalProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="public-profile-page">
          <div className="public-profile-container">
            <section className="public-profile-section">
              <p>Loading professional profile...</p>
            </section>
          </div>
        </main>
      }
    >
      <ProfessionalProfileContent />
    </Suspense>
  );
}