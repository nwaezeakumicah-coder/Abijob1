import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import "./home.css";

const audiences = [
  {
    number: "01",
    icon: BriefcaseBusiness,
    title: "Find meaningful work",
    description:
      "Build a strong profile, discover relevant vacancies and take the next step in your career.",
    action: "Explore jobs",
    href: "/register/job-seeker",
  },
  {
    number: "02",
    icon: Wrench,
    title: "Showcase your skills",
    description:
      "Put your craft, services and experience in front of people and businesses looking for your expertise.",
    action: "Create a professional profile",
    href: "/register/professional",
  },
  {
    number: "03",
    icon: Building2,
    title: "Build your team",
    description:
      "Present your business, publish vacancies and connect with people who can help you grow.",
    action: "Start hiring",
    href: "/register/employer",
  },
];

const steps = [
  ["Create your profile", "Tell us what you do, what you can offer and the kind of opportunity you want."],
  ["Discover the right match", "Explore jobs, skilled professionals and opportunities relevant to your goals."],
  ["Make your next move", "Apply, connect and manage your employment journey in one place."],
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-grid" aria-hidden="true" />
          <div className="home-hero-container">
            <div className="home-hero-content">
              <div className="home-hero-brand">
                <Logo href={null} size="large" />
                <span>ABIA STATE EMPLOYMENT & OPPORTUNITY PLATFORM</span>
              </div>
              <span className="home-eyebrow">
                <span className="home-eyebrow-dot" />
                ABIA'S PEOPLE. ABIA'S POSSIBILITIES.
              </span>
              <h1>
                Real skills.
                <br />
                <span>Real opportunities.</span>
                <br />
                A stronger Abia.
              </h1>
              <p>
                Abi Job brings job seekers, skilled professionals and employers
                together to make finding work, showcasing talent and building
                teams simpler.
              </p>
              <div className="home-hero-actions">
                <Link href="/jobs" className="home-primary-button">
                  Explore opportunities <ArrowRight size={18} />
                </Link>
                <Link href="/register" className="home-secondary-button">
                  Create your account <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="home-hero-proof">
                <span><CheckCircle2 size={15} /> Built around real employment</span>
                <span><MapPin size={15} /> Rooted in Abia State</span>
              </div>
            </div>

            <div className="home-hero-visual" aria-label="Abi Job connects people, skills and employers">
              <div className="home-orbit home-orbit-one" />
              <div className="home-orbit home-orbit-two" />
              <div className="home-opportunity-card">
                <div className="home-card-topline">
                  <span className="home-card-status"><span /> OPPORTUNITY NETWORK</span>
                  <Sparkles size={19} />
                </div>
                <h2>Bring your next move closer.</h2>
                <p>One platform for the people who power Abia's economy.</p>
                <div className="home-card-connection">
                  <div className="home-connection-node"><Users size={20} /></div>
                  <div className="home-connection-line" />
                  <div className="home-connection-node"><BriefcaseBusiness size={20} /></div>
                  <div className="home-connection-line" />
                  <div className="home-connection-node"><Building2 size={20} /></div>
                </div>
                <div className="home-card-labels">
                  <span>People</span><span>Skills</span><span>Employers</span>
                </div>
                <div className="home-card-footer">
                  <span>Opportunity starts here</span>
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="home-floating-note home-floating-note-top">
                <ShieldCheck size={18} />
                <span><strong>Reviewed vacancies</strong><small>Quality starts with trust</small></span>
              </div>
              <div className="home-floating-note home-floating-note-bottom">
                <span className="home-floating-icon"><Wrench size={18} /></span>
                <span><strong>Skills that matter</strong><small>Make your talent visible</small></span>
              </div>
            </div>
          </div>
        </section>

        <section className="home-audience" id="who-its-for">
          <div className="home-section-container">
            <div className="home-section-heading">
              <span className="home-section-kicker">ONE PLATFORM. THREE PATHS.</span>
              <h2>Whatever your next step, <em>start here.</em></h2>
              <p>Abi Job is designed around the people who create, find and provide work across Abia State.</p>
            </div>
            <div className="home-audience-grid">
              {audiences.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="home-audience-card" key={item.number}>
                    <div className="home-audience-card-top">
                      <span className="home-audience-number">{item.number}</span>
                      <span className="home-audience-icon"><Icon size={23} /></span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <Link href={item.href} className="home-card-link">
                      {item.action} <ArrowUpRight size={17} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="home-how">
          <div className="home-section-container home-how-grid">
            <div className="home-how-intro">
              <span className="home-section-kicker">A CLEARER WAY FORWARD</span>
              <h2>From potential to <em>progress.</em></h2>
              <p>Make your next move with practical tools that keep your employment journey organised.</p>
              <Link href="/about" className="home-text-link">Learn about Abi Job <ArrowUpRight size={17} /></Link>
            </div>
            <div className="home-steps">
              {steps.map(([title, description], index) => (
                <div className="home-step" key={title}>
                  <span className="home-step-number">0{index + 1}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-trust">
          <div className="home-section-container home-trust-inner">
            <div className="home-trust-icon"><ShieldCheck size={25} /></div>
            <div>
              <span className="home-section-kicker">A MORE TRUSTWORTHY EXPERIENCE</span>
              <h2>Opportunities deserve care.</h2>
              <p>Job vacancies submitted by employers go through an administrative review before they are made visible to job seekers.</p>
            </div>
            <Link href="/guidelines" className="home-trust-link">Our community guidelines <ArrowUpRight size={17} /></Link>
          </div>
        </section>

        <section className="home-cta">
          <div className="home-cta-content">
            <div>
              <span className="home-section-kicker">YOUR NEXT CHAPTER STARTS HERE</span>
              <h2>Bring your ambition.<br /><em>Let's make it count.</em></h2>
              <p>Join the platform connecting Abia's talent with meaningful opportunities.</p>
            </div>
            <div className="home-cta-actions">
              <Link href="/register" className="home-cta-button">Get started <ArrowRight size={18} /></Link>
              <Link href="/login" className="home-cta-login">Already have an account? Log in</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
