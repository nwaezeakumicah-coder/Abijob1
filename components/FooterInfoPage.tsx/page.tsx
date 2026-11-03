
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";
import "./FooterInfoPage.css";

export type FooterInfoPageKey =
  | "about"
  | "contact"
  | "faq"
  | "support"
  | "privacy"
  | "terms"
  | "guidelines"
  | "safety";

type InfoSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

type InfoPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InfoSection[];
};

const pageContent: Record<FooterInfoPageKey, InfoPageContent> = {
  about: {
    eyebrow: "ABOUT ABI JOB",
    title: "Connecting talent with opportunity.",
    intro:
      "Abi Job is a digital employment and professional networking platform created to connect people, skills and businesses across Abia State.",
    sections: [
      {
        heading: "Why Abi Job exists",
        paragraphs: [
          "Finding work, discovering reliable skilled professionals and recruiting the right people can be difficult. Abi Job brings these opportunities together in one place.",
          "Our goal is to make it easier for job seekers to discover opportunities, for skilled professionals and artisans to showcase their services, and for employers to find the people they need.",
        ],
      },
      {
        heading: "Who we serve",
        items: [
          "Job seekers looking for meaningful employment.",
          "Skilled professionals and artisans offering their services.",
          "Employers and businesses looking for capable people.",
        ],
      },
      {
        heading: "Our commitment",
        paragraphs: [
          "We aim to provide an accessible, organised and trustworthy platform where talent can be discovered and opportunities can grow.",
          "Abi Job is built around a simple belief: opportunity should be easier to find, and talent should be easier to discover.",
        ],
      },
    ],
  },

  contact: {
    eyebrow: "GET IN TOUCH",
    title: "We would like to hear from you.",
    intro:
      "Have a question, suggestion or business enquiry? Use the available support channels provided by Abi Job when they are published.",
    sections: [
      {
        heading: "General enquiries",
        paragraphs: [
          "For questions about the platform, partnerships, business opportunities or general information, contact the Abi Job team through the official contact details published on this website.",
        ],
      },
      {
        heading: "Account and technical issues",
        paragraphs: [
          "If you are experiencing a problem with your account, sign-in, profile or another platform feature, visit Help & Support and provide a clear description of the issue.",
        ],
      },
      {
        heading: "Reporting a concern",
        paragraphs: [
          "For suspicious job listings, inappropriate conduct or safety concerns, visit our Safety & Reporting page.",
        ],
      },
    ],
  },

  faq: {
    eyebrow: "FREQUENTLY ASKED QUESTIONS",
    title: "Questions? Start here.",
    intro: "Find answers to common questions about using Abi Job.",
    sections: [
      {
        heading: "What is Abi Job?",
        paragraphs: [
          "Abi Job is a platform connecting job seekers, skilled professionals and artisans, and employers across Abia State.",
        ],
      },
      {
        heading: "Who can create an account?",
        paragraphs: [
          "The platform is designed for job seekers, skilled professionals and artisans, and employers.",
        ],
      },
      {
        heading: "How do I find a job?",
        paragraphs: [
          "Visit Find Jobs to explore available opportunities. Open a listing to review its details and follow the application instructions.",
        ],
      },
      {
        heading: "How can I showcase my skills?",
        paragraphs: [
          "Register as a Skilled Professional and complete your profile with your skills, experience, services and relevant examples of previous work.",
        ],
      },
      {
        heading: "How do employers find workers?",
        paragraphs: [
          "Employers can create an account, build their business profile and use the platform to discover suitable professionals or publish job opportunities.",
        ],
      },
      {
        heading: "Are job listings reviewed?",
        paragraphs: [
          "Job submissions are intended to go through an administrative review process before publication. A listing should not be treated as verified employment solely because it appears on a platform.",
        ],
      },
      {
        heading: "What should I do if I see a suspicious job?",
        paragraphs: [
          "Do not send money or sensitive information. Use the Safety & Reporting guidance to report the listing or activity.",
        ],
      },
      {
        heading: "How do I get help with my account?",
        paragraphs: [
          "Visit Help & Support for guidance on account access, profile issues and other platform concerns.",
        ],
      },
    ],
  },

  support: {
    eyebrow: "HELP & SUPPORT",
    title: "We're here to help you move forward.",
    intro:
      "Find guidance for common account, profile, job-search and platform issues.",
    sections: [
      {
        heading: "Account access",
        items: [
          "Check that you are using the correct email address and password.",
          "Use the Forgot Password option if you cannot remember your password.",
          "If you still cannot access your account, use the official contact channel when available.",
        ],
      },
      {
        heading: "Profile assistance",
        items: [
          "Keep your personal and contact information accurate.",
          "Add relevant skills, qualifications and experience.",
          "Skilled professionals should include clear descriptions of their services and examples of previous work.",
        ],
      },
      {
        heading: "Job and application assistance",
        items: [
          "Read the full job description before applying.",
          "Check the stated location, requirements and application deadline.",
          "Follow the application instructions included in the job listing.",
        ],
      },
      {
        heading: "Report a technical problem",
        paragraphs: [
          "When reporting a technical issue, explain what you were trying to do, what happened and which page you were using. Avoid including your password or other sensitive information.",
        ],
      },
    ],
  },

  privacy: {
    eyebrow: "LEGAL",
    title: "Privacy Policy",
    intro:
      "This page explains the privacy principles that should guide the collection and use of information on Abi Job. The final policy should be reviewed and approved before the platform launches.",
    sections: [
      {
        heading: "Information we may collect",
        paragraphs: [
          "Depending on the features you use, Abi Job may collect account information, contact details, profile information, employment history, skills, job applications and information submitted by employers.",
        ],
      },
      {
        heading: "How information may be used",
        items: [
          "To create and manage user accounts.",
          "To provide job-search, recruitment and professional-profile services.",
          "To support communication between relevant platform users.",
          "To improve platform functionality, security and user experience.",
          "To investigate reports of abuse, fraud or suspicious activity.",
        ],
      },
      {
        heading: "Information sharing",
        paragraphs: [
          "Information may be displayed to other users when necessary for platform features. For example, information in a professional profile may be visible to potential clients or employers according to the platform's settings.",
          "Personal information should not be sold or disclosed indiscriminately. Any sharing must have a lawful and clearly explained purpose.",
        ],
      },
      {
        heading: "Security and retention",
        paragraphs: [
          "Abi Job should use appropriate technical and organisational measures to protect personal information. Information should only be retained for as long as necessary for the purposes for which it was collected or as required by law.",
        ],
      },
      {
        heading: "Your privacy choices",
        paragraphs: [
          "Users should be able to request access to, correction of or deletion of their personal information, subject to applicable legal requirements.",
        ],
      },
      {
        heading: "Policy status",
        paragraphs: [
          "This is an initial website policy draft, not a statement that all privacy procedures have already been implemented. The final version must identify the responsible organisation, official contact details, applicable retention periods and effective date before launch.",
        ],
      },
    ],
  },

  terms: {
    eyebrow: "LEGAL",
    title: "Terms & Conditions",
    intro:
      "These draft terms describe the expected rules for using Abi Job. They should be reviewed and approved as the platform's final terms before launch.",
    sections: [
      {
        heading: "Using Abi Job",
        paragraphs: [
          "Users are expected to provide accurate information, use the platform lawfully and respect other users. You must not use Abi Job to deceive, harass, exploit or harm others.",
        ],
      },
      {
        heading: "User responsibilities",
        items: [
          "Provide truthful account and profile information.",
          "Keep your login credentials secure.",
          "Do not impersonate another person or organisation.",
          "Do not publish misleading, discriminatory or fraudulent content.",
          "Respect intellectual property and other users' privacy.",
        ],
      },
      {
        heading: "Employers and job listings",
        paragraphs: [
          "Employers are responsible for the accuracy and legality of their job listings, recruitment requirements and communications with applicants.",
          "Submitting a job does not guarantee publication. Listings are subject to the platform's review process.",
        ],
      },
      {
        heading: "Skilled professionals",
        paragraphs: [
          "Professionals and artisans are responsible for accurately describing their skills, qualifications, services and experience.",
        ],
      },
      {
        heading: "Subscriptions and payments",
        paragraphs: [
          "Any subscription fees, billing periods, renewal conditions, cancellation procedures and applicable payment terms must be clearly displayed before a user makes a payment.",
        ],
      },
      {
        heading: "Platform access and enforcement",
        paragraphs: [
          "Abi Job may review, restrict or remove content and take appropriate action against accounts that violate the platform rules, subject to applicable law and established procedures.",
        ],
      },
      {
        heading: "Terms status",
        paragraphs: [
          "This is an initial terms draft. It must be reviewed for legal compliance and completed with the platform operator's legal identity, effective date and official contact details before publication as binding terms.",
        ],
      },
    ],
  },

  guidelines: {
    eyebrow: "COMMUNITY",
    title: "Community Guidelines",
    intro:
      "Abi Job works best when everyone treats others with respect and uses the platform responsibly.",
    sections: [
      {
        heading: "Treat people with respect",
        items: [
          "Communicate professionally and respectfully.",
          "Do not harass, threaten, bully or intimidate other users.",
          "Do not discriminate against people based on protected characteristics.",
        ],
      },
      {
        heading: "Be honest",
        items: [
          "Use your real identity and accurate information.",
          "Do not invent qualifications, work experience or business credentials.",
          "Do not publish fake vacancies or misleading service offers.",
        ],
      },
      {
        heading: "Keep the platform relevant",
        items: [
          "Publish content related to jobs, skills, professional services and career development in the appropriate places.",
          "Do not spam users or repeatedly publish irrelevant content.",
          "Do not use the platform for unlawful activities.",
        ],
      },
      {
        heading: "Respect privacy",
        paragraphs: [
          "Do not publish another person's private information, documents, photographs or contact details without appropriate permission.",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "Content that violates these guidelines may be reviewed and removed. Accounts involved in serious or repeated violations may face restrictions or suspension.",
        ],
      },
    ],
  },

  safety: {
    eyebrow: "SAFETY & REPORTING",
    title: "Protect yourself while finding opportunities.",
    intro:
      "Your safety matters. Use these precautions when applying for jobs, hiring workers or communicating with other users.",
    sections: [
      {
        heading: "Avoid recruitment scams",
        items: [
          "Be cautious of anyone demanding payment in exchange for a guaranteed job.",
          "Do not pay for an interview invitation or an employment promise without independently verifying the arrangement.",
          "Research employers and verify suspicious claims before proceeding.",
        ],
      },
      {
        heading: "Protect your personal information",
        items: [
          "Never share your bank PIN, passwords or one-time verification codes.",
          "Do not send sensitive identity or financial documents to unverified contacts.",
          "Use care when sharing your home address or other private details.",
        ],
      },
      {
        heading: "Meet safely",
        items: [
          "Where possible, arrange initial meetings in public or appropriate professional locations.",
          "Tell someone you trust where you are going.",
          "For service work, agree on the scope, price and expectations before work begins.",
        ],
      },
      {
        heading: "Report suspicious activity",
        paragraphs: [
          "If you encounter a suspicious job listing, fraudulent employer, impersonation, harassment or unsafe request, preserve relevant evidence and report the issue through the official Abi Job reporting channel when available.",
        ],
      },
      {
        heading: "Important reminder",
        paragraphs: [
          "Abi Job provides a platform for discovering opportunities and connecting users. Always exercise independent judgement and verify important claims before sharing information, making payments or accepting work.",
        ],
      },
    ],
  },
};

export default function FooterInfoPage({
  page,
}: {
  page: FooterInfoPageKey;
}) {
  const content = pageContent[page];

  return (
    <>
      <Header />

      <main className="footer-info-page">
        <div className="footer-info-hero">
          <div className="footer-info-container">
            <Link href="/" className="footer-info-breadcrumb">
              Home <span>/</span> {content.eyebrow}
            </Link>

            <span className="footer-info-eyebrow">{content.eyebrow}</span>
            <h1>{content.title}</h1>
            <p>{content.intro}</p>
          </div>
        </div>

        <div className="footer-info-container footer-info-body">
          <div className="footer-info-content">
            {content.sections.map((section, index) => (
              <section className="footer-info-section" key={section.heading}>
                <span className="footer-info-section-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <h2>{section.heading}</h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.items && (
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <aside className="footer-info-aside">
            <span className="footer-info-aside-icon">✦</span>
            <h2>Opportunity starts here.</h2>
            <p>
              Explore opportunities, connect with skilled people and
              discover what Abi Job can help you achieve.
            </p>
            <Link href="/jobs" className="footer-info-aside-link">
              Explore opportunities <span>→</span>
            </Link>
          </aside>
        </div>

        <section className="footer-info-bottom-cta">
          <div className="footer-info-container">
            <div>
              <span>BE PART OF THE COMMUNITY</span>
              <h2>Make your next move with Abi Job.</h2>
            </div>
            <Link href="/register">
              Get started <span>↗</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
