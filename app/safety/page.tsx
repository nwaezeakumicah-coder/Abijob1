
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./safety.css";

const safetyTopics = [
  {
    number: "01",
    title: "Recognising Fake Job Offers",
    description:
      "Be cautious of job offers that appear unrealistic or demand unusual commitments before employment.",
    points: [
      "Be suspicious of guaranteed jobs without a proper recruitment process.",
      "Watch out for employers demanding money before interviews or appointments.",
      "Check whether the company and job description appear genuine.",
      "Be careful with offers that pressure you to make immediate decisions.",
    ],
  },
  {
    number: "02",
    title: "Avoiding Recruitment Scams",
    description:
      "Scammers may pretend to represent legitimate businesses to collect money or personal information.",
    points: [
      "Never share your bank PIN, passwords or one-time verification codes.",
      "Do not pay suspicious recruitment or processing fees.",
      "Verify payment requests independently before sending money.",
      "Do not open suspicious links or download unexpected attachments.",
    ],
  },
  {
    number: "03",
    title: "Protecting Your Personal Information",
    description:
      "Your personal information is valuable. Share only what is reasonably necessary for a legitimate professional interaction.",
    points: [
      "Avoid publishing sensitive financial or identity information on your profile.",
      "Share certificates and documents only when necessary.",
      "Be careful when sending identity documents to unfamiliar people.",
      "Use strong passwords and keep your account credentials private.",
    ],
  },
  {
    number: "04",
    title: "Safe Communication",
    description:
      "Good communication practices help reduce the risk of harassment, impersonation and exploitation.",
    points: [
      "Keep professional conversations respectful.",
      "Be cautious when someone asks you to move a conversation to an unfamiliar platform.",
      "Do not respond to threats, intimidation or suspicious demands.",
      "Keep relevant records of concerning conversations where safe and lawful.",
    ],
  },
  {
    number: "05",
    title: "Safety for Skilled Professionals & Artisans",
    description:
      "Professionals and artisans should take reasonable precautions before accepting projects or meeting prospective clients.",
    points: [
      "Discuss project scope, pricing and payment expectations clearly.",
      "Verify client details where reasonably possible.",
      "Be cautious of unusual advance-payment or refund arrangements.",
      "Consider meeting in an appropriate public or professional setting when meeting someone for the first time.",
      "Tell someone you trust about an unfamiliar appointment when appropriate.",
    ],
  },
  {
    number: "06",
    title: "Safety for Employers",
    description:
      "Employers should protect their businesses and applicants by following responsible recruitment practices.",
    points: [
      "Use accurate business details and genuine job descriptions.",
      "Do not request applicants' passwords or banking credentials.",
      "Handle candidate information confidentially.",
      "Avoid discriminatory or exploitative recruitment practices.",
      "Verify important qualifications through appropriate and lawful processes.",
    ],
  },
];

const reportReasons = [
  "Fake job listing or recruitment scam",
  "Suspicious employer or business account",
  "Impersonation or false identity",
  "Harassment, threats or abusive behaviour",
  "Fraudulent payment request",
  "Misuse of personal information",
  "Inappropriate or prohibited content",
  "Other safety concern",
];

export default function SafetyPage() {
  return (
    <>
      <Header />

      <main className="safety-page">
        <section className="safety-hero">
          <div className="safety-hero-inner">
            <div className="safety-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Safety &amp; Reporting</span>
            </div>

            <span className="safety-eyebrow">YOUR SAFETY MATTERS</span>

            <h1>
              Stay alert.
              <br />
              Stay protected.
              <br />
              <span>Grow with confidence.</span>
            </h1>

            <p>
              Whether you are looking for work, offering professional services
              or recruiting talent, your safety matters. Learn how to recognise
              risks and take action when something does not feel right.
            </p>

            <div className="safety-hero-note">
              <span>✓</span>
              Your safety is a shared responsibility.
            </div>
          </div>

          <div className="safety-decoration safety-decoration-one" />
          <div className="safety-decoration safety-decoration-two" />
        </section>

        <section className="safety-emergency-section">
          <div className="safety-emergency-card">
            <div className="safety-emergency-icon">!</div>
            <div>
              <h2>Are you in immediate danger?</h2>
              <p>
                Abi Job is not an emergency response service. If you are facing
                an immediate threat, contact the appropriate emergency
                authorities or local law enforcement. Do not wait for a
                platform report to be reviewed.
              </p>
            </div>
          </div>
        </section>

        <section className="safety-tips-section">
          <div className="safety-section-heading">
            <span className="safety-section-label">PRACTICAL SAFETY TIPS</span>
            <h2>Protect yourself while using Abi Job</h2>
            <p>
              Follow these recommendations when exploring opportunities,
              communicating with users and accepting professional engagements.
            </p>
          </div>

          <div className="safety-topics-grid">
            {safetyTopics.map((topic) => (
              <article className="safety-topic-card" key={topic.number}>
                <div className="safety-topic-number">{topic.number}</div>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>

                <ul>
                  {topic.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="safety-report-section">
          <div className="safety-report-layout">
            <div className="safety-report-intro">
              <span className="safety-section-label">SPEAK UP</span>
              <h2>
                See something
                <br />
                <span>wrong?</span>
              </h2>
              <p>
                If you encounter suspicious activity or behaviour that violates
                our community standards, let Abi Job know through the available
                contact channel.
              </p>

              <div className="safety-report-promise">
                <span>✓</span>
                Provide clear and accurate information.
              </div>
              <div className="safety-report-promise">
                <span>✓</span>
                Include relevant evidence where safe.
              </div>
              <div className="safety-report-promise">
                <span>✓</span>
                Avoid confronting or retaliating against the person involved.
              </div>
            </div>

            <div className="safety-report-card">
              <div className="safety-report-card-heading">
                <div className="safety-report-card-icon">!</div>
                <div>
                  <h3>What can you report?</h3>
                  <p>Examples of concerns you can bring to our attention.</p>
                </div>
              </div>

              <ul>
                {reportReasons.map((reason) => (
                  <li key={reason}>
                    <span>✓</span>
                    {reason}
                  </li>
                ))}
              </ul>

              <Link href="/contact" className="safety-report-button">
                Report a concern →
              </Link>

              <p className="safety-report-disclaimer">
                This link opens the Contact Us page. A dedicated reporting
                submission and review system will need to be implemented before
                reports can be processed directly through Abi Job.
              </p>
            </div>
          </div>
        </section>

        <section className="safety-review-section">
          <div className="safety-review-content">
            <span className="safety-section-label">WHAT HAPPENS NEXT?</span>
            <h2>How safety reports should be handled</h2>
            <p>
              When a reporting system is operational, reports should be
              assessed according to their seriousness and available evidence.
              Appropriate actions may include:
            </p>

            <div className="safety-review-steps">
              <div className="safety-review-step">
                <span>01</span>
                <h3>Receive</h3>
                <p>Collect the report and relevant information.</p>
              </div>

              <div className="safety-review-step">
                <span>02</span>
                <h3>Review</h3>
                <p>Assess the reported activity and available evidence.</p>
              </div>

              <div className="safety-review-step">
                <span>03</span>
                <h3>Respond</h3>
                <p>Take appropriate action where a violation is established.</p>
              </div>

              <div className="safety-review-step">
                <span>04</span>
                <h3>Improve</h3>
                <p>Use reports to strengthen platform safety practices.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="safety-final-section">
          <div className="safety-final-card">
            <span className="safety-section-label">A SAFER COMMUNITY</span>
            <h2>
              Opportunity should
              <br />
              never come at the cost of safety.
            </h2>
            <p>
              Help us create a professional environment where people can
              discover opportunities and build meaningful connections with
              greater confidence.
            </p>

            <div className="safety-final-actions">
              <Link href="/guidelines" className="safety-primary-button">
                Community Guidelines
              </Link>
              <Link href="/contact" className="safety-secondary-button">
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
