
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  BriefcaseBusiness,
  UserRound,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import "./register.css";

const accountTypes = [
  {
    title: "Job Seeker",
    description:
      "Discover job opportunities, apply for vacancies, build your CV and grow your career.",
    href: "/register/job-seeker",
    icon: BriefcaseBusiness,
    benefits: [
      "Find relevant jobs",
      "Build your professional profile",
    ],
  },
  {
    title: "Skilled Professionals & Artisans",
    description:
      "Showcase your skills, display your work and connect with people looking for your services.",
    href: "/register/professional",
    icon: UserRound,
    benefits: [
      "Showcase your skills",
      "Connect with potential clients",
    ],
  },
  {
    title: "Employer",
    description:
      "Find qualified workers, publish job opportunities and build your business team.",
    href: "/register/employer",
    icon: Building2,
    benefits: [
      "Find skilled talent",
      "Manage job applications",
    ],
  },
];

export default function RegisterPage() {
  return (
    <>
      <Header />

      <main className="register-page">
        <section className="register-intro">
          <span className="register-eyebrow">
            WELCOME TO ABIJOB
          </span>

          <h1>
            Opportunity starts
            <br />
            with <span>you.</span>
          </h1>

          <p>
            Create your account and become part of Abia's growing
            employment and professional community.
          </p>
        </section>

        <section className="register-selection">
          <div className="register-section-heading">
            <div>
              <span>GET STARTED</span>

              <h2>How would you like to use Abijob?</h2>

              <p>
                Choose the account type that best describes you.
                You can complete your profile after registration.
              </p>
            </div>
          </div>

          <div className="register-type-grid">
            {accountTypes.map((type) => {
              const Icon = type.icon;

              return (
                <Link
                  href={type.href}
                  className="register-type-card"
                  key={type.title}
                >
                  <div className="register-type-icon">
                    <Icon size={27} strokeWidth={1.8} />
                  </div>

                  <h3>{type.title}</h3>

                  <p>{type.description}</p>

                  <ul>
                    {type.benefits.map((benefit) => (
                      <li key={benefit}>
                        <CheckCircle2 size={16} />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <span className="register-type-link">
                    Continue
                    <ArrowRight size={17} />
                  </span>
                </Link>
              );
            })}
          </div>

          <p className="register-login-prompt">
            Already have an account?{" "}
            <Link href="/login">Log in</Link>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
