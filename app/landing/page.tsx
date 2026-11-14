import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import "./landing.css";

const pathways = [
  { icon: BriefcaseBusiness, label: "Find a job" },
  { icon: Wrench, label: "Show your skills" },
  { icon: Building2, label: "Hire talent" },
];

export const metadata = {
  title: "Welcome to Abi Job | Opportunity Starts Here",
  description:
    "A home for Abia's talent, employers and opportunities. Find work, showcase your skills and build your team with Abi Job.",
};

export default function WelcomeLandingPage() {
  return (
    <main className="welcome-page">
      <div className="welcome-grain" aria-hidden="true" />
      <header className="welcome-header">
        <Link href="/" className="welcome-logo-link" aria-label="Go to Abi Job homepage">
          <Image
            src="/image/abijob-logo-green.png"
            alt="Abi Job — Opportunity Starts Here"
            width={210}
            height={76}
            priority
            className="welcome-logo"
          />
        </Link>
        <Link href="/" className="welcome-header-link">
          Go to homepage <ArrowRight size={16} />
        </Link>
      </header>

      <section className="welcome-hero">
        <div className="welcome-copy">
          <div className="welcome-eyebrow">
            <span className="welcome-live-dot" />
            ABIA STATE EMPLOYMENT &amp; OPPORTUNITY PLATFORM
          </div>
          <h1>
            Your next
            <span className="welcome-heading-accent"> opportunity</span>
            <br />
            starts <span className="welcome-heading-serif">here.</span>
          </h1>
          <p className="welcome-description">
            A place where ambition meets opportunity. Find meaningful work,
            put your skills in the spotlight, and connect with businesses
            building the future of Abia.
          </p>
          <div className="welcome-actions">
            <Link href="/" className="welcome-enter-button">
              Enter Abi Job <ArrowRight size={19} />
            </Link>
            <span className="welcome-action-note">One platform. More possibilities.</span>
          </div>
          <div className="welcome-proof">
            <span><Users size={16} /> People</span>
            <i />
            <span><Wrench size={16} /> Skills</span>
            <i />
            <span><Building2 size={16} /> Employers</span>
          </div>
        </div>

        <div className="welcome-art" aria-label="People, skills and employers connected through Abi Job">
          <div className="welcome-ring welcome-ring-outer" />
          <div className="welcome-ring welcome-ring-inner" />
          <div className="welcome-glow" />
          <div className="welcome-center-mark">
            <Image
              src="/image/abijob-logo-green.png"
              alt=""
              width={160}
              height={58}
              className="welcome-center-logo"
            />
            <span>OPPORTUNITY STARTS HERE</span>
          </div>
          <div className="welcome-orbit-node welcome-node-one">
            <span><Users size={22} /></span><small>People</small>
          </div>
          <div className="welcome-orbit-node welcome-node-two">
            <span><Wrench size={22} /></span><small>Skills</small>
          </div>
          <div className="welcome-orbit-node welcome-node-three">
            <span><Building2 size={22} /></span><small>Employers</small>
          </div>
          <div className="welcome-spark welcome-spark-one"><Sparkles size={18} /></div>
          <div className="welcome-spark welcome-spark-two"><Sparkles size={13} /></div>
        </div>
      </section>

      <section className="welcome-pathways" aria-label="What you can do on Abi Job">
        <div className="welcome-pathways-label">A place to move forward</div>
        <div className="welcome-pathway-list">
          {pathways.map(({ icon: Icon, label }, index) => (
            <div className="welcome-pathway" key={label} style={{ animationDelay: `${1.1 + index * 0.13}s` }}>
              <span><Icon size={17} /></span>{label}
            </div>
          ))}
        </div>
      </section>
      <footer className="welcome-footer">
        <span>Made for the people and possibilities of Abia State.</span>
        <Link href="/">Continue to Abi Job <ArrowRight size={14} /></Link>
      </footer>
    </main>
  );
}
