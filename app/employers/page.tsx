import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldCheck,
  Users,
  UserRoundSearch,
  Zap,
} from "lucide-react";
import "./employers.css";

const benefits = [
  {
    icon: UserRoundSearch,
    title: "Find the right people",
    description:
      "Discover job seekers and skilled professionals whose experience and abilities match your business needs.",
  },
  {
    icon: ClipboardList,
    title: "Manage your hiring",
    description:
      "Create job listings, receive applications and keep your recruitment activities organised.",
  },
  {
    icon: ShieldCheck,
    title: "A more trusted process",
    description:
      "Job listings are reviewed by the Abi Job admin team before they are published on the platform.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Register your business and provide the basic information needed to set up your employer profile.",
  },
  {
    number: "02",
    title: "Publish an opportunity",
    description:
      "Describe the role, required skills, location and other important details about the vacancy.",
  },
  {
    number: "03",
    title: "Connect with talent",
    description:
      "Receive applications and discover people who can contribute to your business.",
  },
];

const talentCategories = [
  "Technology & IT",
  "Sales & Marketing",
  "Design & Creativity",
  "Hospitality",
  "Administration",
  "Skilled Trades",
  "Customer Service",
  "Finance & Accounting",
];

export default function EmployersPage() {
  return (
    <>
      <Header />

      <main className="employers-page">
        {/* HERO */}
        <section className="employers-hero">
          <div className="employers-hero-orbit employers-orbit-one" />
          <div className="employers-hero-orbit employers-orbit-two" />

          <div className="container employers-hero-layout">
            <div className="employers-hero-content">
              <span className="employers-eyebrow">
                FOR BUSINESSES & EMPLOYERS
              </span>

              <h1>
                Build your team.
                <br />
                <span>Find your people.</span>
              </h1>

              <p>
                Great businesses grow with great people. Find skilled
                professionals, discover promising talent and connect with
                people who can help your business move forward.
              </p>

              <div className="employers-hero-actions">
                <Link
                  href="/register/employer"
                  className="employers-primary-button"
                >
                  Create employer account
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/professionals"
                  className="employers-secondary-button"
                >
                  Explore professionals
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              <div className="employers-trust-note">
                <ShieldCheck size={17} />
                <span>
                  Job listings are subject to admin review before publication.
                </span>
              </div>
            </div>

            <div className="employers-hero-visual">
              <div className="employers-visual-ring employers-ring-one" />
              <div className="employers-visual-ring employers-ring-two" />

              <div className="employers-dashboard-card">
                <div className="employers-dashboard-top">
                  <div>
                    <span className="dashboard-overline">
                      EMPLOYER WORKSPACE
                    </span>
                    <h2>Your hiring starts here.</h2>
                  </div>

                  <span className="dashboard-icon">
                    <BriefcaseBusiness size={22} />
                  </span>
                </div>

                <div className="dashboard-stat">
                  <div className="dashboard-stat-icon">
                    <Users size={20} />
                  </div>
                  <div>
                    <strong>Discover talent</strong>
                    <span>Connect with skilled people</span>
                  </div>
                  <ArrowUpRight size={19} />
                </div>

                <div className="dashboard-stat">
                  <div className="dashboard-stat-icon dashboard-stat-icon-lime">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <strong>Manage vacancies</strong>
                    <span>Organise your job listings</span>
                  </div>
                  <ArrowUpRight size={19} />
                </div>

                <div className="dashboard-stat">
                  <div className="dashboard-stat-icon dashboard-stat-icon-orange">
                    <Zap size={20} />
                  </div>
                  <div>
                    <strong>Grow your business</strong>
                    <span>Find people who move you forward</span>
                  </div>
                  <ArrowUpRight size={19} />
                </div>

                <div className="dashboard-card-footer">
                  <span className="dashboard-live-dot" />
                  A better way to connect with talent
                </div>
              </div>

              <div className="employers-floating-note">
                <span className="employers-floating-icon">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <strong>Talent meets opportunity</strong>
                  <span>One connection can make a difference.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="employers-benefits">
          <div className="container">
            <div className="employers-section-heading">
              <span>WHY ABI JOB?</span>
              <h2>Everything starts with the right people.</h2>
              <p>
                Abi Job helps businesses and employers connect with the
                people they need to succeed.
              </p>
            </div>

            <div className="employers-benefit-grid">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <article
                    className="employers-benefit-card"
                    key={benefit.title}
                  >
                    <div className="employers-benefit-icon">
                      <Icon size={25} strokeWidth={1.8} />
                    </div>

                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="employers-process">
          <div className="container employers-process-layout">
            <div className="employers-process-intro">
              <span>GET STARTED IN THREE STEPS</span>
              <h2>
                From hiring needs
                <br />
                to the right talent.
              </h2>
              <p>
                Whether you run a small business, a growing company or an
                established organisation, getting started is simple.
              </p>

              <Link
                href="/register/employer"
                className="employers-process-link"
              >
                Start hiring with Abi Job
                <ArrowUpRight size={18} />
              </Link>
            </div>

            <div className="employers-steps">
              {steps.map((step) => (
                <article className="employers-step" key={step.number}>
                  <span className="employers-step-number">
                    {step.number}
                  </span>

                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* TALENT CATEGORIES */}
        <section className="employers-categories">
          <div className="container">
            <div className="employers-category-layout">
              <div className="employers-category-intro">
                <span>FIND THE SKILLS YOU NEED</span>
                <h2>
                  Talent across
                  <br />
                  different industries.
                </h2>
                <p>
                  From creative professionals to technical specialists,
                  Abi Job is designed to bring different kinds of talent
                  and opportunities together.
                </p>

                <Link href="/professionals">
                  Explore skilled professionals
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="employers-category-list">
                {talentCategories.map((category, index) => (
                  <div className="employers-category-item" key={category}>
                    <span>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <strong>{category}</strong>
                    <ArrowUpRight size={17} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="employers-cta">
          <div className="container employers-cta-content">
            <div>
              <span>YOUR NEXT GREAT HIRE COULD BE HERE</span>
              <h2>
                Find the people.
                <br />
                Build the future.
              </h2>
              <p>
                Join Abi Job and start connecting your business with talent
                across Abia State.
              </p>
            </div>

            <Link
              href="/register/employer"
              className="employers-cta-button"
            >
              Get started as an employer
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}