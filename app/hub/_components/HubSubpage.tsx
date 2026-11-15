import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, GraduationCap, Users } from "lucide-react";
import "./hub-subpage.css";

type HubSection = "scholarships" | "communities" | "events";

const content = {
  scholarships: {
    eyebrow: "INVEST IN YOUR FUTURE",
    title: "Scholarships and learning opportunities",
    intro: "A practical starting point for finding education funding, preparing strong applications and building skills that open doors.",
    icon: GraduationCap,
    cards: [
      { title: "Prepare your documents", body: "Keep your academic records, identification, CV, references and a clear personal statement ready. Check each scholarship's exact document requirements before applying." },
      { title: "Find opportunities that fit", body: "Prioritise programmes that match your course, qualification level, location and eligibility. Always confirm deadlines and requirements on the provider's official website." },
      { title: "Write a strong application", body: "Explain your goals, achievements and how the opportunity will help you contribute to your community. Use specific examples and proofread every response." },
      { title: "Avoid scholarship scams", body: "Be cautious of guaranteed awards, unofficial agents and requests for payment to secure a scholarship. Verify the provider and never share account passwords or one-time codes." }
    ],
    actionTitle: "Keep building your career while you learn",
    actionText: "Explore current vacancies and opportunities on Abijob."
  },
  communities: {
    eyebrow: "GROW TOGETHER",
    title: "Career communities in Abia",
    intro: "Find people working towards similar goals, discover professional networks and take practical steps to build your connections.",
    icon: Users,
    cards: [
      { title: "Technology and digital skills", body: "Connect with developers, designers and digital professionals. Share learning resources, project ideas and career opportunities." },
      { title: "Fashion and creative design", body: "Discover creative professionals, tailors, designers, printers and makers. Build a portfolio and learn how others find customers." },
      { title: "Business and entrepreneurship", body: "Learn from business owners and people building new ventures. Exchange practical ideas about customers, branding and sustainable growth." },
      { title: "Skilled professionals and artisans", body: "Discover tradespeople and service providers across Abia. Build professional visibility and help customers find the skills they need." }
    ],
    actionTitle: "Start by discovering people and opportunities",
    actionText: "Browse public professional profiles and connect through the contact options available on their profiles."
  },
  events: {
    eyebrow: "LEARN SOMETHING NEW",
    title: "Career events and workshops",
    intro: "Use these practical session guides to prepare for learning, improve your employability and build confidence. Event dates shown on the Career Hub are programme examples, not confirmed bookings.",
    icon: CalendarDays,
    cards: [
      { title: "Building a professional CV", body: "Learn how to organise your experience, skills and achievements into a clear CV. Bring your current CV or a list of your education, work and projects." },
      { title: "Starting and growing a small business", body: "Explore customer discovery, pricing, record keeping, branding and practical ways to reach customers in your community." },
      { title: "Introduction to digital skills", body: "Explore digital literacy, online safety, productivity tools and pathways into technology-related work." },
      { title: "Preparing for an interview", body: "Practise explaining your experience, answering common questions and asking employers useful questions about a role." }
    ],
    actionTitle: "Make your next step count",
    actionText: "Keep your Abijob profile updated so employers can understand your skills and experience."
  }
} satisfies Record<HubSection, {
  eyebrow: string; title: string; intro: string;
  icon: typeof GraduationCap;
  cards: { title: string; body: string }[];
  actionTitle: string; actionText: string;
}>;

export default function HubSubpage({ section }: { section: HubSection }) {
  const page = content[section];
  const Icon = page.icon;
  const actionHref = section === "communities" ? "/professionals" : "/jobs";
  const actionLabel = section === "communities" ? "Explore professionals" : "Explore opportunities";

  return (
    <main className="hub-subpage">
      <header className="hub-subpage-top">
        <Link href="/hub" className="hub-subpage-back"><ArrowLeft size={17} /> Back to Career Hub</Link>
        <span>ABIJOB CAREER HUB · ABIA STATE, NIGERIA</span>
      </header>
      <section className="hub-subpage-hero">
        <div className="hub-subpage-hero-icon"><Icon size={34} /></div>
        <span>{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
      </section>
      <section className="hub-subpage-grid">
        {page.cards.map((card, index) => (
          <article className="hub-subpage-card" key={card.title}>
            <span className="hub-subpage-number">{String(index + 1).padStart(2, "0")}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>
      <section className="hub-subpage-action">
        <div>
          <h2>{page.actionTitle}</h2>
          <p>{page.actionText}</p>
        </div>
        <Link href={actionHref}>{actionLabel} <ArrowRight size={17} /></Link>
      </section>
      <footer className="hub-subpage-footer">© 2026 Abijob. Opportunity starts here.</footer>
    </main>
  );
}
