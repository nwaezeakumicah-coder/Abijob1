import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import "./hub-subpage.css";

const scholarshipGuides = [
  { title: "Prepare your documents", body: "Keep your academic records, identification, CV, references and a clear personal statement ready. Check each scholarship's exact document requirements before applying." },
  { title: "Find opportunities that fit", body: "Prioritise programmes that match your course, qualification level, location and eligibility. Always confirm deadlines and requirements on the provider's official website." },
  { title: "Write a strong application", body: "Explain your goals, achievements and how the opportunity will help you contribute to your community. Use specific examples and proofread every response." },
  { title: "Avoid scholarship scams", body: "Be cautious of guaranteed awards, unofficial agents and requests for payment to secure a scholarship. Verify the provider and never share account passwords or one-time codes." }
];

export default function HubSubpage({ section }: { section: "scholarships" }) {
  return (
    <main className="hub-subpage">
      <header className="hub-subpage-top">
        <Link href="/hub" className="hub-subpage-back"><ArrowLeft size={17} /> Back to Career Hub</Link>
        <span>ABIJOB CAREER HUB · ABIA STATE, NIGERIA</span>
      </header>
      <section className="hub-subpage-hero">
        <div className="hub-subpage-hero-icon"><GraduationCap size={34} /></div>
        <span>INVEST IN YOUR FUTURE</span>
        <h1>Scholarships and learning opportunities</h1>
        <p>A practical starting point for finding education funding, preparing strong applications and building skills that open doors.</p>
      </section>
      <section className="hub-subpage-grid">
        {scholarshipGuides.map((card, index) => (
          <article className="hub-subpage-card" key={card.title}>
            <span className="hub-subpage-number">{String(index + 1).padStart(2, "0")}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>
      <section className="hub-subpage-action">
        <div><h2>Keep building your career while you learn</h2><p>Explore current vacancies and opportunities on Abijob.</p></div>
        <Link href="/jobs">Explore opportunities <ArrowRight size={17} /></Link>
      </section>
      <footer className="hub-subpage-footer">© 2026 Abijob. Opportunity starts here.</footer>
    </main>
  );
}
