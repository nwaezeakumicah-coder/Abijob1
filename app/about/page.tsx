import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Lightbulb,
  Target,
  Users,
} from "lucide-react";
import "./about.css";

const audiences = [
  {
    icon: BriefcaseBusiness,
    title: "Job seekers",
    description:
      "People looking for employment, career opportunities and a place to showcase their experience.",
  },
  {
    icon: Users,
    title: "Skilled professionals",
    description:
      "Artisans, creatives and skilled workers who want to display their abilities and reach more clients.",
  },
  {
    icon: Building2,
    title: "Employers & businesses",
    description:
      "Small businesses and organisations looking for the right people to help them grow.",
  },
];

const values = [
  {
    icon: Target,
    title: "Opportunity",
    description:
      "We believe talent deserves access to opportunities, regardless of where someone starts.",
  },
  {
    icon: HeartHandshake,
    title: "Connection",
    description:
      "We bring people, skills, businesses and opportunities closer together.",
  },
  {
    icon: Lightbulb,
    title: "Growth",
    description:
      "We encourage learning, professional development and the discovery of new possibilities.",
  },
  {
    icon: CheckCircle2,
    title: "Trust",
    description:
      "We are committed to building a platform where users can connect with greater confidence.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="about-page">
        {/* HERO */}
        <section className="about-hero">
          <div className="about-hero-orbit about-orbit-one" />
          <div className="about-hero-orbit about-orbit-two" />

          <div className="container about-hero-layout">
            <div className="about-hero-content">
              <span className="about-eyebrow">ABOUT ABIJOB</span>

              <h1>
                Abia has talent.
                <br />
                <span>Let's connect it</span>
                <br />
                to opportunity.
              </h1>

              <p>
                Abijob is an employment and professional connection
                platform built to help people discover opportunities,
                showcase their skills and connect with businesses
                across Abia State.
              </p>

              <div className="about-hero-actions">
                <Link href="/register" className="about-primary-button">
                  Join our community
                  <ArrowRight size={18} />
                </Link>

                <Link href="/jobs" className="about-secondary-button">
                  Explore opportunities
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>

            <div className="about-hero-visual">
              <div className="about-visual-circle about-circle-one" />
              <div className="about-visual-circle about-circle-two" />

              <div className="about-visual-card">
                <span className="about-card-overline">
                  OUR BELIEF
                </span>

                <div className="about-card-symbol">
                  <Compass size={31} />
                </div>

                <h2>
                  Every talent
                  <br />
                  deserves a
                  <br />
                  <span>chance to shine.</span>
                </h2>

                <div className="about-card-footer">
                  <span>ABIJOB</span>
                  <span>OPPORTUNITY STARTS HERE</span>
                </div>
              </div>

              <div className="about-floating-note">
                <span className="about-floating-icon">
                  <Users size={20} />
                </span>
                <div>
                  <strong>People first</strong>
                  <span>Connecting talent and opportunity</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTRODUCTION */}
        <section className="about-introduction">
          <div className="container about-intro-layout">
            <div className="about-intro-heading">
              <span>WHO WE ARE</span>
              <h2>
                A platform built around
                <br />
                people and possibilities.
              </h2>
            </div>

            <div className="about-intro-copy">
              <p>
                Finding a job, getting customers or hiring the right
                person should not have to be unnecessarily difficult.
                Yet many talented people and growing businesses struggle
                to find one another.
              </p>

              <p>
                Abijob is designed to bridge that gap. By bringing
                employment opportunities, skilled professionals and
                employers together in one place, we aim to make it
                easier for people across Abia State to discover,
                connect and grow.
              </p>
            </div>
          </div>
        </section>

        {/* MISSION AND VISION */}
        <section className="about-purpose">
          <div className="container about-purpose-grid">
            <article className="about-purpose-card about-mission">
              <span className="about-purpose-icon">
                <Target size={26} />
              </span>
              <span className="about-purpose-label">OUR MISSION</span>
              <h2>Connecting people to meaningful opportunities.</h2>
              <p>
                To make it easier for job seekers, skilled professionals
                and employers to find one another through an accessible
                platform that supports employment, skills discovery
                and business growth.
              </p>
            </article>

            <article className="about-purpose-card about-vision">
              <span className="about-purpose-icon">
                <Compass size={26} />
              </span>
              <span className="about-purpose-label">OUR VISION</span>
              <h2>A stronger Abia through connected talent.</h2>
              <p>
                To become a trusted platform where talent is visible,
                opportunities are accessible and people and businesses
                can build a better future together.
              </p>
            </article>
          </div>
        </section>

        {/* WHO WE SERVE */}
        <section className="about-audience">
          <div className="container">
            <div className="about-section-heading">
              <span>WHO WE SERVE</span>
              <h2>One platform. Different journeys.</h2>
              <p>
                Abijob is designed for the different people who make
                up Abia's working and business community.
              </p>
            </div>

            <div className="about-audience-grid">
              {audiences.map((audience, index) => {
                const Icon = audience.icon;

                return (
                  <article
                    className="about-audience-card"
                    key={audience.title}
                  >
                    <div className="about-audience-top">
                      <span>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="about-audience-icon">
                        <Icon size={25} />
                      </div>
                    </div>

                    <h3>{audience.title}</h3>
                    <p>{audience.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="about-values">
          <div className="container">
            <div className="about-values-heading">
              <div>
                <span>WHAT GUIDES US</span>
                <h2>The values behind Abijob.</h2>
              </div>

              <p>
                Our goal is bigger than simply listing jobs. We want
                to help create meaningful connections that support
                people, skills and businesses.
              </p>
            </div>

            <div className="about-values-grid">
              {values.map((value, index) => {
                const Icon = value.icon;

                return (
                  <article className="about-value-card" key={value.title}>
                    <div className="about-value-icon">
                      <Icon size={24} />
                    </div>

                    <span>
                      VALUE {String(index + 1).padStart(2, "0")}
                    </span>

                    <h3>{value.title}</h3>
                    <p>{value.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="about-cta">
          <div className="container about-cta-content">
            <div>
              <span>THE FUTURE STARTS WITH CONNECTION</span>
              <h2>
                Your talent.
                <br />
                Your ambition.
                <br />
                Your opportunity.
              </h2>
              <p>
                Be part of a growing community connecting people
                and possibilities across Abia State.
              </p>
            </div>

            <Link href="/register" className="about-cta-button">
              Get started with Abijob
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}