
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./privacy.css";

const sections = [
  {
    number: "01",
    title: "Introduction",
    content: (
      <>
        <p>
          Welcome to Abi Job. We respect your privacy and are committed to
          protecting the personal information you share with us when using our
          platform.
        </p>
        <p>
          This Privacy Policy explains the types of information Abi Job may
          collect, how that information may be used, and the choices available
          to you.
        </p>
      </>
    ),
  },
  {
    number: "02",
    title: "Information We May Collect",
    content: (
      <>
        <p>Depending on how you use Abi Job, information may include:</p>
        <ul>
          <li>
            <strong>Account information:</strong> Your name, email address,
            phone number, account type and other registration details.
          </li>
          <li>
            <strong>Professional information:</strong> Your skills, work
            experience, qualifications, certificates, portfolio and employment
            preferences.
          </li>
          <li>
            <strong>Employer information:</strong> Business name, business
            details, contact information and job vacancy information.
          </li>
          <li>
            <strong>Application information:</strong> Details you provide when
            applying for jobs or communicating with employers and professionals.
          </li>
          <li>
            <strong>Technical information:</strong> Device, browser and usage
            information that may help us maintain and improve the platform.
          </li>
          <li>
            <strong>Payment information:</strong> Subscription and transaction
            records where payment services are introduced. Payment card details
            should be handled by the relevant payment provider.
          </li>
        </ul>
      </>
    ),
  },
  {
    number: "03",
    title: "How We Use Your Information",
    content: (
      <>
        <p>Information may be used to:</p>
        <ul>
          <li>Create and manage user accounts.</li>
          <li>Connect job seekers with relevant employment opportunities.</li>
          <li>Help employers discover suitable candidates.</li>
          <li>Help clients discover Skilled Professionals &amp; Artisans.</li>
          <li>Personalise job recommendations and platform content.</li>
          <li>Manage subscriptions and related account services.</li>
          <li>Respond to enquiries and provide customer support.</li>
          <li>Protect the platform against fraud, misuse and unauthorised access.</li>
          <li>Improve the quality, reliability and performance of Abi Job.</li>
        </ul>
      </>
    ),
  },
  {
    number: "04",
    title: "How Information May Be Shared",
    content: (
      <>
        <p>
          Abi Job does not intend to make your private account information
          publicly available without a valid reason.
        </p>
        <p>
          Some information may be shared when necessary to provide the service,
          including:
        </p>
        <ul>
          <li>
            <strong>Employers:</strong> Relevant profile and application
            information when you apply for a job or choose to make your
            professional profile available.
          </li>
          <li>
            <strong>Service providers:</strong> Trusted providers that help
            operate services such as hosting, payment processing and technical
            support.
          </li>
          <li>
            <strong>Legal authorities:</strong> Where disclosure is required by
            applicable law or a lawful request.
          </li>
        </ul>
        <p>
          We will seek to limit information sharing to what is reasonably
          necessary for the relevant purpose.
        </p>
      </>
    ),
  },
  {
    number: "05",
    title: "Public Profiles and Job Applications",
    content: (
      <>
        <p>
          Abi Job may allow users to create professional profiles containing
          information such as skills, work experience, qualifications and
          portfolios.
        </p>
        <p>
          Information displayed on a public or discoverable profile may be
          viewed by other platform users. Before publishing information, review
          what you are comfortable sharing.
        </p>
        <p>
          When you apply for a job, information included in your application
          may be made available to the relevant employer.
        </p>
      </>
    ),
  },
  {
    number: "06",
    title: "Data Security",
    content: (
      <>
        <p>
          We intend to use reasonable technical and organisational safeguards
          to protect personal information against unauthorised access, loss,
          alteration or disclosure.
        </p>
        <p>
          However, no internet-based platform or electronic storage system can
          be guaranteed to be completely secure.
        </p>
        <p>
          Users should protect their login credentials and avoid sharing
          passwords with other people.
        </p>
      </>
    ),
  },
  {
    number: "07",
    title: "Data Retention",
    content: (
      <>
        <p>
          Personal information may be retained for as long as necessary to
          provide the platform's services, maintain account records, resolve
          disputes, meet legal obligations and protect the platform.
        </p>
        <p>
          Where information is no longer required, appropriate steps should be
          taken to delete it or remove identifying details, subject to
          applicable legal requirements.
        </p>
      </>
    ),
  },
  {
    number: "08",
    title: "Cookies and Similar Technologies",
    content: (
      <>
        <p>
          Abi Job may use cookies or similar technologies to support essential
          website functions, remember preferences, understand platform usage
          and improve the user experience.
        </p>
        <p>
          You can manage cookies through your browser settings. Disabling some
          cookies may affect how certain website features work.
        </p>
      </>
    ),
  },
  {
    number: "09",
    title: "Your Privacy Choices",
    content: (
      <>
        <p>
          Subject to applicable law, you may have the right to:
        </p>
        <ul>
          <li>Request access to personal information held about you.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of information where legally appropriate.</li>
          <li>Object to or request restrictions on certain data processing.</li>
          <li>Withdraw consent where processing is based on your consent.</li>
        </ul>
        <p>
          You should be able to review and update relevant profile information
          through your account settings as those features become available.
        </p>
      </>
    ),
  },
  {
    number: "10",
    title: "Third-Party Services",
    content: (
      <>
        <p>
          Abi Job may integrate with external services such as payment
          providers, analytics services and other technology partners.
        </p>
        <p>
          These services may have their own privacy policies and terms. We
          encourage users to review the privacy practices of any third-party
          service they interact with.
        </p>
      </>
    ),
  },
  {
    number: "11",
    title: "Children's Privacy",
    content: (
      <p>
        Abi Job is intended for people who are legally eligible to use the
        employment and professional services offered on the platform. We do not
        knowingly seek to collect personal information from children in
        violation of applicable law.
      </p>
    ),
  },
  {
    number: "12",
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy as Abi Job develops, introduces new
        features or responds to changes in applicable laws. Any updated version
        should be published on this page with a revised effective date.
      </p>
    ),
  },
  {
    number: "13",
    title: "Contact and Privacy Enquiries",
    content: (
      <p>
        If you have questions, concerns or requests relating to this Privacy
        Policy or your personal information, please use our{" "}
        <Link href="/contact">Contact Us page</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main className="privacy-page">
        <section className="privacy-hero">
          <div className="privacy-hero-inner">
            <div className="privacy-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Privacy Policy</span>
            </div>

            <span className="privacy-eyebrow">YOUR PRIVACY MATTERS</span>

            <h1>
              Your information.
              <br />
              Your privacy.
              <br />
              <span>Our responsibility.</span>
            </h1>

            <p>
              We believe that finding opportunities should not mean giving up
              control of your personal information. Learn how Abi Job intends
              to handle and protect your data.
            </p>

            <div className="privacy-hero-note">
              <span className="privacy-note-icon">✓</span>
              <span>Clear information. Responsible data practices.</span>
            </div>
          </div>

          <div className="privacy-decoration privacy-decoration-one" />
          <div className="privacy-decoration privacy-decoration-two" />
        </section>

        <section className="privacy-content-section">
          <div className="privacy-content-layout">
            <aside className="privacy-sidebar">
              <div className="privacy-sidebar-card">
                <span className="privacy-sidebar-label">ON THIS PAGE</span>
                <h3>Privacy Policy</h3>

                <nav aria-label="Privacy policy sections">
                  {sections.map((section) => (
                    <a
                      href={`#privacy-${section.number}`}
                      key={section.number}
                    >
                      <span>{section.number}</span>
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="privacy-help-card">
                <div className="privacy-help-icon">?</div>
                <h3>Need clarification?</h3>
                <p>
                  Have a question about how your information is handled?
                </p>
                <Link href="/contact">Contact our team →</Link>
              </div>
            </aside>

            <div className="privacy-document">
              <div className="privacy-document-heading">
                <span className="privacy-document-tag">LEGAL INFORMATION</span>
                <h2>Abi Job Privacy Policy</h2>
                <p>
                  Please read this policy carefully to understand our intended
                  approach to personal information.
                </p>
              </div>

              <div className="privacy-important-note">
                <strong>Important notice</strong>
                <p>
                  This is the website's initial privacy policy draft. It must
                  be reviewed and aligned with the actual data collection,
                  storage, payment and security systems before Abi Job launches
                  its live services.
                </p>
              </div>

              {sections.map((section) => (
                <article
                  className="privacy-article"
                  id={`privacy-${section.number}`}
                  key={section.number}
                >
                  <div className="privacy-article-number">
                    {section.number}
                  </div>
                  <div className="privacy-article-body">
                    <h2>{section.title}</h2>
                    {section.content}
                  </div>
                </article>
              ))}

              <div className="privacy-bottom-note">
                <div className="privacy-bottom-icon">✦</div>
                <div>
                  <h3>Opportunity starts with trust.</h3>
                  <p>
                    Thank you for being part of a platform working to connect
                    Abia's people with meaningful opportunities.
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
