
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./guidelines.css";

const guidelines = [
  {
    number: "01",
    title: "Treat Everyone with Respect",
    description:
      "Abi Job brings together people with different backgrounds, experiences and professional goals. Treat every user with courtesy and respect.",
    points: [
      "Communicate politely and professionally.",
      "Respect different opinions, identities and backgrounds.",
      "Avoid insults, intimidation, threats and personal attacks.",
      "Do not engage in harassment, bullying or discriminatory behaviour.",
    ],
  },
  {
    number: "02",
    title: "Be Honest and Authentic",
    description:
      "Trust is essential in employment and professional relationships. Information shared on Abi Job should be accurate and genuine.",
    points: [
      "Use your real identity and accurate account information.",
      "Do not invent qualifications, certificates or work experience.",
      "Do not impersonate another person, business or organisation.",
      "Keep your professional profile and business details truthful.",
    ],
  },
  {
    number: "03",
    title: "Publish Genuine Job Opportunities",
    description:
      "Employers should publish legitimate opportunities with clear and accurate information.",
    points: [
      "Provide an accurate job title, description and location.",
      "Clearly explain relevant requirements and responsibilities.",
      "Do not publish fake vacancies or misleading recruitment offers.",
      "Do not use job listings to collect money fraudulently or deceive applicants.",
      "Respect applicable employment and non-discrimination laws.",
    ],
  },
  {
    number: "04",
    title: "Represent Your Skills Professionally",
    description:
      "Skilled Professionals & Artisans should present their abilities, services and experience honestly.",
    points: [
      "Showcase genuine skills and relevant work samples.",
      "Do not claim certifications or expertise you do not possess.",
      "Communicate project expectations, prices and timelines clearly.",
      "Respect agreements made with clients.",
    ],
  },
  {
    number: "05",
    title: "Protect Personal Information",
    description:
      "Everyone has a responsibility to respect the privacy and personal information of other users.",
    points: [
      "Do not publish another person's private information without permission.",
      "Do not request passwords, PINs or unnecessary sensitive information.",
      "Use applicant information only for legitimate recruitment purposes.",
      "Be careful when sharing personal documents with people you do not know.",
    ],
  },
  {
    number: "06",
    title: "No Fraud, Scams or Exploitation",
    description:
      "Abi Job must not be used to deceive people, steal money or exploit users seeking opportunities.",
    points: [
      "Do not advertise fake jobs, contracts or business opportunities.",
      "Do not request suspicious payments from applicants.",
      "Do not promise guaranteed employment in exchange for money.",
      "Do not use fake testimonials, identities or business profiles.",
      "Do not manipulate users into sharing financial or login information.",
    ],
  },
  {
    number: "07",
    title: "Keep Content Appropriate",
    description:
      "Content published on Abi Job should be relevant, professional and suitable for an employment community.",
    points: [
      "Avoid hateful, threatening, abusive or sexually exploitative content.",
      "Do not publish unlawful, violent or deliberately harmful material.",
      "Do not spam users with repeated advertisements or irrelevant messages.",
      "Only upload photographs and materials you have permission to use.",
    ],
  },
  {
    number: "08",
    title: "Respect Platform Processes",
    description:
      "Users should respect the systems and procedures designed to keep Abi Job useful and reliable.",
    points: [
      "Do not attempt to bypass subscription requirements.",
      "Do not interfere with platform security or functionality.",
      "Do not manipulate job listings, reviews or engagement systems.",
      "Respect the administrative review and approval process for job publications.",
    ],
  },
  {
    number: "09",
    title: "Communicate Responsibly",
    description:
      "Professional communication helps users build confidence and establish productive relationships.",
    points: [
      "Respond to enquiries professionally where possible.",
      "Be clear about availability, expectations and commitments.",
      "Avoid repeated unwanted messages.",
      "Resolve disagreements respectfully and seek support when necessary.",
    ],
  },
  {
    number: "10",
    title: "Report Harmful Behaviour",
    description:
      "If you encounter suspicious listings, fraudulent accounts, harassment or other harmful behaviour, report your concerns through the available support channels.",
    points: [
      "Provide accurate details about the incident.",
      "Include relevant evidence where safe and appropriate.",
      "Do not retaliate against the person involved.",
      "Contact Abi Job through the Contact Us page if you need assistance.",
    ],
  },
];

export default function GuidelinesPage() {
  return (
    <>
      <Header />

      <main className="guidelines-page">
        <section className="guidelines-hero">
          <div className="guidelines-hero-inner">
            <div className="guidelines-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Community Guidelines</span>
            </div>

            <span className="guidelines-eyebrow">OUR COMMUNITY STANDARDS</span>

            <h1>
              Opportunities grow
              <br />
              where <span>respect</span> lives.
            </h1>

            <p>
              Abi Job is a community built around work, skills, businesses and
              opportunity. These guidelines help everyone participate safely,
              honestly and professionally.
            </p>

            <div className="guidelines-hero-note">
              <span>✓</span>
              Respect. Honesty. Opportunity.
            </div>
          </div>

          <div className="guidelines-decoration guidelines-decoration-one" />
          <div className="guidelines-decoration guidelines-decoration-two" />
        </section>

        <section className="guidelines-intro-section">
          <div className="guidelines-intro">
            <div>
              <span className="guidelines-section-label">WHY THESE GUIDELINES MATTER</span>
              <h2>
                A better platform starts with <span>all of us.</span>
              </h2>
            </div>

            <p>
              Whether you are searching for work, offering professional
              services or recruiting talent, your actions help shape the Abi
              Job experience. Every user is expected to contribute to a
              trustworthy and welcoming environment.
            </p>
          </div>
        </section>

        <section className="guidelines-list-section">
          <div className="guidelines-list-heading">
            <span className="guidelines-section-label">THE COMMUNITY RULES</span>
            <h2>How we expect users to behave</h2>
            <p>
              These standards apply to every account category and every
              interaction on the platform.
            </p>
          </div>

          <div className="guidelines-grid">
            {guidelines.map((item) => (
              <article className="guideline-card" key={item.number}>
                <div className="guideline-card-top">
                  <span className="guideline-number">{item.number}</span>
                  <span className="guideline-check">✓</span>
                </div>

                <h3>{item.title}</h3>
                <p className="guideline-description">{item.description}</p>

                <ul>
                  {item.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="guidelines-enforcement-section">
          <div className="guidelines-enforcement">
            <div className="guidelines-enforcement-icon">!</div>

            <div>
              <span className="guidelines-section-label">ACCOUNTABILITY</span>
              <h2>What happens when guidelines are violated?</h2>
              <p>
                Depending on the seriousness and circumstances of a violation,
                Abi Job may review reported activity and take appropriate
                action. This may include:
              </p>

              <ul>
                <li>A warning or request to correct the behaviour.</li>
                <li>Removal or restriction of inappropriate content.</li>
                <li>Temporary restriction or suspension of an account.</li>
                <li>Permanent account termination for serious or repeated violations.</li>
              </ul>

              <p className="guidelines-enforcement-footnote">
                Any action will be subject to applicable law and the platform's
                operating procedures.
              </p>
            </div>
          </div>
        </section>

        <section className="guidelines-final-section">
          <div className="guidelines-final-card">
            <span className="guidelines-section-label">BE PART OF THE DIFFERENCE</span>
            <h2>
              Let's make opportunity
              <br />
              accessible to everyone.
            </h2>
            <p>
              A professional community is built through the everyday actions
              of its members. Thank you for helping make Abi Job a better place
              to connect and grow.
            </p>

            <div className="guidelines-final-actions">
              <Link href="/jobs" className="guidelines-primary-button">
                Explore opportunities
              </Link>
              <Link href="/contact" className="guidelines-secondary-button">
                Contact Abi Job
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
