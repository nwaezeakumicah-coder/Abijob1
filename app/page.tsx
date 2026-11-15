
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./home.css";

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="home-page">

        <section className="home-hero">
          <div className="home-hero-container">

            <div className="home-hero-content">
              <span className="home-eyebrow">
                ABIA'S PEOPLE. ABIA'S POSSIBILITIES.
              </span>

              <h1>
                Your talent.
                <br />
                Your ambition.
                <br />
                <span>Your opportunity.</span>
              </h1>

              <p>
                Discover jobs, connect with skilled professionals,
                and find the right people to grow your business.
                Your next opportunity starts here.
              </p>

              <div className="home-hero-actions">
                <Link href="/jobs" className="home-primary-button">
                  Find opportunities
                </Link>

                <Link href="/register" className="home-secondary-button">
                  Join Abijob
                </Link>
              </div>

              <div className="home-hero-note">
                <span>For job seekers</span>
                <span>For skilled professionals</span>
                <span>For employers</span>
              </div>
            </div>

            <div className="home-hero-visual home-hero-visual--abia">
              <div className="home-hero-image-frame">
                <Image
                  src="/images/abimage.webp"
                  alt="The Enyimba City elephant monument beside a major road in Abia State"
                  fill
                  priority
                  sizes="(max-width: 760px) 100vw, 48vw"
                  className="home-hero-image"
                />
                <div className="home-hero-image-shade" aria-hidden="true" />
                <div className="home-hero-image-caption">
                  <span className="home-hero-image-kicker">ROOTED IN ABIA</span>
                  <strong>Local talent. Wider opportunities.</strong>
                  <span>Opportunity Starts Here</span>
                </div>
              </div>
              <div className="home-hero-image-accent" aria-hidden="true" />
            </div>

          </div>
        </section>

        <section className="home-audience">
          <div className="container">
            <div className="home-section-heading">
              <span>ONE PLATFORM. MANY POSSIBILITIES.</span>
              <h2>What brings you to Abijob?</h2>
              <p>
                Whether you're looking for work, offering a skill,
                or building a business, there's a place for you.
              </p>
            </div>

            <div className="audience-grid">
              <Link href="/register/job-seeker" className="audience-card">
                <span className="audience-number">01</span>
                <h3>I'm looking for a job</h3>
                <p>
                  Discover opportunities, apply for jobs,
                  and take the next step in your career.
                </p>
                <span className="audience-link">Explore jobs ↗</span>
              </Link>

              <Link href="/register/professional" className="audience-card">
                <span className="audience-number">02</span>
                <h3>I'm a skilled professional</h3>
                <p>
                  Showcase your talent, build your portfolio,
                  and connect with people who need your services.
                </p>
                <span className="audience-link">Showcase your skills ↗</span>
              </Link>

              <Link href="/register/employer" className="audience-card">
                <span className="audience-number">03</span>
                <h3>I'm hiring</h3>
                <p>
                  Find talented people, publish job openings,
                  and grow your business with the right team.
                </p>
                <span className="audience-link">Find talent ↗</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="home-cta">
          <div className="container home-cta-content">
            <div>
              <span>YOUR NEXT CHAPTER STARTS HERE</span>
              <h2>
                Your opportunity could be
                <br />
                one connection away.
              </h2>
            </div>

            <Link href="/register" className="home-cta-button">
              Get started today ↗
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
