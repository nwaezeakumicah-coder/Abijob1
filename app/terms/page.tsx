
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./terms.css";

const sections = [
  {
    number: "01",
    title: "Acceptance of These Terms",
    paragraphs: [
      "Welcome to Abijob. These Terms & Conditions govern your access to and use of the Abijob website and services.",
      "By creating an account, accessing or using the platform, you agree to comply with these Terms. If you do not agree, you should not use the platform.",
    ],
  },
  {
    number: "02",
    title: "About Abijob",
    paragraphs: [
      "Abijob is an employment and professional networking platform designed to connect job seekers, Skilled Professionals & Artisans, employers and businesses, with an initial focus on Abia State, Nigeria.",
      "The platform is intended to help users discover opportunities, advertise vacancies, showcase professional skills and connect with people who may need their services.",
      "Abijob provides a platform for connections. It does not guarantee employment, contracts, customers, income or successful recruitment.",
    ],
  },
  {
    number: "03",
    title: "Eligibility and User Accounts",
    paragraphs: [
      "You must provide accurate information when registering and keep your account information reasonably up to date.",
      "You are responsible for maintaining the confidentiality of your login details and for activities carried out through your account.",
      "You must not impersonate another person, create accounts using false identities or provide misleading professional or business information.",
      "Abijob may restrict or suspend accounts where there are reasonable grounds to suspect fraud, abuse, impersonation or a violation of these Terms.",
    ],
  },
  {
    number: "04",
    title: "User Categories",
    paragraphs: [
      "Abijob supports three primary user categories: Job Seekers, Skilled Professionals & Artisans, and Employers.",
      "Job Seekers use the platform to explore vacancies, create professional profiles and apply for suitable opportunities.",
      "Skilled Professionals & Artisans use the platform to showcase their skills, experience, portfolios and services to potential clients.",
      "Employers use the platform to create business profiles, publish vacancies and discover potential candidates.",
    ],
  },
  {
    number: "05",
    title: "Subscriptions and Payments",
    paragraphs: [
      "Access to Abijob may require a subscription depending on your account category and the subscription option selected.",
      "The subscription options currently planned for the platform are:",
    ],
    bullets: [
      "Job Seekers may choose a 30-day introductory free plan with access limited to 25% of platform benefits, or subscribe immediately to a paid plan.",
      "After the introductory period, Job Seekers must subscribe to continue using premium features.",
      "Skilled Professionals & Artisans and Employers do not have an introductory free plan.",
      "Paid subscription options are ₦2,000 monthly or ₦22,800 annually.",
      "The annual option reflects a 5% discount compared with paying monthly for twelve months.",
    ],
    ending:
      "Subscription prices, payment methods, renewal arrangements and applicable terms will be displayed during the relevant subscription or payment process. Do not make a payment unless the payment details and amount are clearly presented.",
  },
  {
    number: "06",
    title: "Job Listings and Applications",
    paragraphs: [
      "Employers are responsible for ensuring that job listings are genuine, accurate, lawful and not misleading.",
      "Job listings submitted to Abijob are subject to administrative review and approval before publication.",
      "Job Seekers should carefully review vacancies and independently assess employers and employment offers before sharing sensitive information or accepting an offer.",
      "Abijob does not guarantee that an application will receive a response or result in employment.",
    ],
  },
  {
    number: "07",
    title: "Employer Responsibilities",
    paragraphs: [
      "Employers must provide truthful business and vacancy information and must not advertise discriminatory, fraudulent, unlawful or deceptive opportunities.",
      "Employers must handle applicant information responsibly and only use it for legitimate recruitment-related purposes.",
      "Employers must not request inappropriate payments, passwords or unnecessary sensitive information from applicants.",
    ],
  },
  {
    number: "08",
    title: "Skilled Professionals & Artisans",
    paragraphs: [
      "Skilled Professionals & Artisans are responsible for accurately describing their skills, experience, qualifications, services and portfolio materials.",
      "Users should communicate clearly with potential clients about pricing, timelines, deliverables and other project expectations.",
      "Abijob does not guarantee that a professional will receive a job, project or customer through the platform.",
    ],
  },
  {
    number: "09",
    title: "Prohibited Activities",
    paragraphs: [
      "You must not use Abijob to:",
    ],
    bullets: [
      "Publish fake vacancies, fraudulent offers or misleading business information.",
      "Impersonate another individual, company or organisation.",
      "Harass, threaten, discriminate against or exploit other users.",
      "Upload malicious software or attempt to compromise platform security.",
      "Collect personal information from other users without a legitimate reason or permission.",
      "Publish unlawful, abusive, hateful or deceptive content.",
      "Circumvent subscription requirements or interfere with platform operations.",
      "Use the platform for activities that violate applicable laws.",
    ],
  },
  {
    number: "10",
    title: "Content and Intellectual Property",
    paragraphs: [
      "You retain responsibility for content you upload, including profile information, photographs, portfolios, job descriptions and other materials.",
      "By submitting content, you confirm that you have the rights or permissions necessary to share it.",
      "You grant Abijob permission to host, display and use your submitted content as reasonably necessary to operate and provide the platform's services.",
      "Abijob's name, branding, website design and original platform materials may not be copied, reproduced or commercially exploited without appropriate permission.",
    ],
  },
  {
    number: "11",
    title: "Privacy and Personal Information",
    paragraphs: [
      "Your use of Abijob is also subject to our Privacy Policy, which explains how personal information may be collected, used and shared.",
      "You should avoid publishing sensitive personal information that is not necessary for your professional profile or platform activities.",
    ],
  },
  {
    number: "12",
    title: "Third-Party Services and External Links",
    paragraphs: [
      "Abijob may contain links to external websites or integrate with services provided by third parties.",
      "We do not control every external service and are not responsible for its content, availability, security or independent policies. Your use of those services may be subject to separate terms.",
    ],
  },
  {
    number: "13",
    title: "Platform Availability",
    paragraphs: [
      "We aim to make Abijob useful and accessible, but uninterrupted availability cannot be guaranteed.",
      "The platform may undergo maintenance, updates, temporary interruptions or changes as new features are developed.",
      "We may modify, suspend or discontinue features where reasonably necessary for operational, security or business reasons.",
    ],
  },
  {
    number: "14",
    title: "Account Suspension and Termination",
    paragraphs: [
      "Abijob may restrict, suspend or terminate access where an account is reasonably believed to have violated these Terms, endangered other users or compromised the platform.",
      "Users may stop using the platform and may request account-related assistance through the available support channels.",
      "Any outstanding obligations or provisions that should reasonably continue after termination will remain applicable.",
    ],
  },
  {
    number: "15",
    title: "Disclaimers and Limitation of Liability",
    paragraphs: [
      "Abijob provides a platform for discovering opportunities and connecting users. We do not act as the employer, employee, contractor or client in arrangements made directly between users unless expressly stated otherwise.",
      "We do not guarantee the accuracy of every user-submitted listing, profile, qualification or claim. Users should carry out appropriate checks before entering into agreements.",
      "To the extent permitted by applicable law, Abijob will not be responsible for losses arising from user-to-user dealings, inaccurate information supplied by users, third-party services or temporary platform interruptions.",
      "Nothing in these Terms excludes liability that cannot lawfully be excluded under applicable law.",
    ],
  },
  {
    number: "16",
    title: "Changes to These Terms",
    paragraphs: [
      "We may revise these Terms as the platform develops or when legal, operational or business requirements change.",
      "Updated Terms will be published on this page with a revised effective date. Continued use of the platform after an update takes effect may constitute acceptance of the revised Terms, where permitted by law.",
    ],
  },
  {
    number: "17",
    title: "Applicable Law",
    paragraphs: [
      "These Terms are intended to operate in accordance with the applicable laws of the Federal Republic of Nigeria.",
      "Any dispute arising from the use of Abijob should be addressed through appropriate lawful channels.",
    ],
  },
  {
    number: "18",
    title: "Contact and Support",
    paragraphs: [
      "If you have questions about these Terms or need assistance with your account, please visit our Contact Us page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="terms-page">
        <section className="terms-hero">
          <div className="terms-hero-inner">
            <div className="terms-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Terms &amp; Conditions</span>
            </div>

            <span className="terms-eyebrow">PLATFORM TERMS</span>

            <h1>
              Clear terms.
              <br />
              Better connections.
              <br />
              <span>Shared responsibility.</span>
            </h1>

            <p>
              These terms explain the responsibilities and expectations that
              help make Abijob a reliable platform for opportunities,
              businesses and professional services.
            </p>

            <div className="terms-hero-note">
              <span>✓</span>
              Built around transparency and responsible use.
            </div>
          </div>

          <div className="terms-decoration terms-decoration-one" />
          <div className="terms-decoration terms-decoration-two" />
        </section>

        <section className="terms-content-section">
          <div className="terms-content-layout">
            <aside className="terms-sidebar">
              <div className="terms-sidebar-card">
                <span className="terms-sidebar-label">ON THIS PAGE</span>
                <h3>Terms &amp; Conditions</h3>

                <nav aria-label="Terms and conditions sections">
                  {sections.map((section) => (
                    <a
                      href={`#terms-${section.number}`}
                      key={section.number}
                    >
                      <span>{section.number}</span>
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="terms-help-card">
                <div className="terms-help-icon">?</div>
                <h3>Have a question?</h3>
                <p>
                  Need clarification about using Abijob or these terms?
                </p>
                <Link href="/contact">Contact our team →</Link>
              </div>
            </aside>

            <div className="terms-document">
              <div className="terms-document-heading">
                <span className="terms-document-tag">LEGAL INFORMATION</span>
                <h2>Abijob Terms &amp; Conditions</h2>
                <p>
                  Please read these terms before registering or using the
                  platform.
                </p>
              </div>

              <div className="terms-important-note">
                <strong>Important notice</strong>
                <p>
                  This is an initial website terms draft. It should receive
                  appropriate legal review before the platform launches and
                  before users are asked to accept it.
                </p>
              </div>

              {sections.map((section) => (
                <article
                  className="terms-article"
                  id={`terms-${section.number}`}
                  key={section.number}
                >
                  <div className="terms-article-number">
                    {section.number}
                  </div>

                  <div className="terms-article-body">
                    <h2>{section.title}</h2>

                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}

                    {section.bullets && (
                      <ul>
                        {section.bullets.map((bullet, index) => (
                          <li key={index}>{bullet}</li>
                        ))}
                      </ul>
                    )}

                    {section.ending && <p>{section.ending}</p>}

                    {section.number === "11" && (
                      <p>
                        Read our <Link href="/privacy">Privacy Policy</Link>.
                      </p>
                    )}

                    {section.number === "18" && (
                      <p>
                        Visit <Link href="/contact">Contact Us</Link> for
                        assistance.
                      </p>
                    )}
                  </div>
                </article>
              ))}

              <div className="terms-bottom-note">
                <div className="terms-bottom-icon">✦</div>
                <div>
                  <h3>Let's build opportunities responsibly.</h3>
                  <p>
                    A better employment community starts with honesty, respect
                    and accountability from everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
