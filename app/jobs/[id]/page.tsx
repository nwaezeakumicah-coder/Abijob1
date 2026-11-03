
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import "./job-details.css";

const jobs = [
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    company: "Digital Solutions",
    initials: "DS",
    category: "Technology",
    location: "Aba, Abia State",
    type: "Full-time",
    workplace: "On-site",
    salary: "₦150,000 – ₦250,000",
    salaryPeriod: "Monthly",
    experience: "1–3 years",
    education: "Relevant qualification or equivalent experience",
    posted: "Recently posted",
    deadline: "Applications close soon",
    applicants: "Open to qualified applicants",
    description:
      "Digital Solutions is looking for a creative and detail-oriented Frontend Developer to help build responsive, accessible and user-friendly web applications. You will work with a team to turn product ideas and designs into reliable digital experiences.",
    responsibilities: [
      "Build responsive and user-friendly web interfaces.",
      "Translate design concepts into functional web pages.",
      "Work with developers to integrate frontend interfaces with APIs.",
      "Test and improve website performance and accessibility.",
      "Identify and resolve interface issues and bugs.",
      "Keep up with modern frontend development practices.",
    ],
    requirements: [
      "Good knowledge of HTML, CSS and JavaScript.",
      "Experience with React or Next.js is an advantage.",
      "Understanding of responsive web design.",
      "Ability to work independently and collaboratively.",
      "Good problem-solving and communication skills.",
      "A portfolio or examples of previous projects are welcome.",
    ],
    benefits: [
      "Opportunity to work on real-world projects.",
      "Professional development and learning opportunities.",
      "Collaborative working environment.",
    ],
    about:
      "Digital Solutions is a growing technology-focused business delivering digital products and services to individuals and organisations.",
  },
  {
    id: "fashion-designer",
    title: "Fashion Designer",
    company: "Made in Aba Studio",
    initials: "MA",
    category: "Fashion & Creative",
    location: "Ariaria, Aba",
    type: "Full-time",
    workplace: "On-site",
    salary: "₦80,000 – ₦150,000",
    salaryPeriod: "Monthly",
    experience: "1–2 years",
    education: "Practical fashion design experience",
    posted: "Recently posted",
    deadline: "Applications close soon",
    applicants: "Open to qualified applicants",
    description:
      "Made in Aba Studio is seeking a talented Fashion Designer with a passion for creating quality clothing. The successful candidate will contribute to garment design, measurements, cutting, sewing and finishing while maintaining high production standards.",
    responsibilities: [
      "Develop clothing designs and interpret customer ideas.",
      "Take accurate body measurements and prepare patterns.",
      "Cut, sew and finish garments to a high standard.",
      "Work with fabrics, colours and design materials.",
      "Maintain quality and meet agreed delivery timelines.",
      "Collaborate with other members of the production team.",
    ],
    requirements: [
      "Practical experience in fashion design and garment making.",
      "Ability to operate sewing machines.",
      "Good knowledge of fabrics and garment construction.",
      "Attention to detail and finishing quality.",
      "Creativity and willingness to learn.",
      "A portfolio of previous work is an advantage.",
    ],
    benefits: [
      "Opportunity to improve your craft.",
      "Hands-on experience with different designs.",
      "Supportive creative working environment.",
    ],
    about:
      "Made in Aba Studio is a fashion business focused on clothing design, garment production and quality craftsmanship in Aba.",
  },
  {
    id: "customer-service-officer",
    title: "Customer Service Officer",
    company: "Business Hub",
    initials: "BH",
    category: "Administration",
    location: "Umuahia, Abia State",
    type: "Full-time",
    workplace: "On-site",
    salary: "₦90,000 – ₦130,000",
    salaryPeriod: "Monthly",
    experience: "1–2 years",
    education: "OND, HND or equivalent experience",
    posted: "Recently posted",
    deadline: "Applications close soon",
    applicants: "Open to qualified applicants",
    description:
      "Business Hub is seeking a friendly and organised Customer Service Officer to support customers, respond to enquiries and help maintain a positive customer experience. The ideal candidate should communicate clearly and be comfortable working with people.",
    responsibilities: [
      "Respond to customer enquiries through available channels.",
      "Provide accurate information about products and services.",
      "Handle customer complaints professionally.",
      "Record customer feedback and follow up on requests.",
      "Maintain organised customer service records.",
      "Work with other teams to resolve customer issues.",
    ],
    requirements: [
      "Good verbal and written communication skills.",
      "Customer service or related experience is an advantage.",
      "Basic computer and digital communication skills.",
      "Patience, professionalism and a positive attitude.",
      "Good organisation and time-management skills.",
      "Ability to work effectively with a team.",
    ],
    benefits: [
      "Practical workplace experience.",
      "Opportunity to develop communication skills.",
      "Professional growth opportunities.",
    ],
    about:
      "Business Hub supports business operations and customer engagement, with a focus on reliable service and positive customer relationships.",
  },
];

type Job = (typeof jobs)[number];

function getJob(id: string): Job | undefined {
  const normalized = decodeURIComponent(id).toLowerCase();

  return jobs.find((job) => {
    const slug = job.id.toLowerCase();

    return (
      slug === normalized ||
      normalized.includes(slug) ||
      slug.includes(normalized)
    );
  });
}

async function JobDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const job = getJob(id);

  if (!job) {
    notFound();
  }

  return (
    <>
      <Header />

      <main className="job-details-page">
        <section className="job-details-hero">
          <div className="job-details-container">
            <div className="job-breadcrumb">
              <Link href="/jobs">
                <ArrowLeft size={16} />
                Back to jobs
              </Link>
              <span>/</span>
              <span>Job details</span>
            </div>

            <div className="job-heading-card">
              <div className="job-heading-main">
                <div className="job-company-logo">
                  <span>{job.initials}</span>
                </div>

                <div className="job-heading-copy">
                  <span className="job-category-tag">{job.category}</span>
                  <h1>{job.title}</h1>

                  <div className="job-company-line">
                    <Building2 size={16} />
                    <span>{job.company}</span>
                    <span className="job-verified">
                      <ShieldCheck size={14} />
                      Employer profile
                    </span>
                  </div>

                  <div className="job-heading-meta">
                    <span>
                      <MapPin size={15} />
                      {job.location}
                    </span>
                    <span>
                      <BriefcaseBusiness size={15} />
                      {job.type}
                    </span>
                    <span>
                      <Clock3 size={15} />
                      {job.workplace}
                    </span>
                  </div>
                </div>
              </div>

              <div className="job-heading-actions">
                <Link href="/register" className="job-apply-button">
                  Apply for this job <ArrowRight size={17} />
                </Link>

                <Link
                  href="/login"
                  className="job-save-button"
                  aria-label="Sign in to save this job"
                >
                  <Heart size={18} />
                  Save job
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="job-details-content">
          <div className="job-details-container job-details-layout">
            <div className="job-details-main">
              <section className="job-content-card">
                <div className="job-content-heading">
                  <span className="job-heading-icon">
                    <BriefcaseBusiness size={19} />
                  </span>
                  <h2>About this role</h2>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="job-content-divider" />

                <h3>Key responsibilities</h3>
                <ul className="job-detail-list">
                  {job.responsibilities.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={17} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="job-content-divider" />

                <h3>Requirements and qualifications</h3>
                <ul className="job-detail-list">
                  {job.requirements.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={17} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="job-content-divider" />

                <h3>What the employer offers</h3>
                <ul className="job-detail-list">
                  {job.benefits.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={17} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="job-content-card job-company-about">
                <div className="job-content-heading">
                  <span className="job-heading-icon">
                    <Building2 size={19} />
                  </span>
                  <h2>About the employer</h2>
                </div>

                <div className="job-about-company">
                  <div className="job-company-logo small">
                    {job.initials}
                  </div>
                  <div>
                    <h3>{job.company}</h3>
                    <span>{job.location}</span>
                  </div>
                </div>

                <p>{job.about}</p>

                <Link href="/employers" className="job-company-link">
                  Explore employers <ArrowUpRight size={16} />
                </Link>
              </section>

              <div className="job-report-link">
                <ShieldCheck size={17} />
                <span>Think this vacancy looks suspicious?</span>
                <Link href="/support">Report a concern</Link>
              </div>
            </div>

            <aside className="job-details-sidebar">
              <section className="job-sidebar-card job-summary-card">
                <div className="job-sidebar-title">
                  <h2>Job overview</h2>
                  <span className="job-open-indicator">
                    <span />
                    Open
                  </span>
                </div>

                <div className="job-salary-block">
                  <span>Salary range</span>
                  <strong>{job.salary}</strong>
                  <small>{job.salaryPeriod}</small>
                </div>

                <div className="job-overview-list">
                  <div>
                    <span className="job-overview-icon">
                      <MapPin size={17} />
                    </span>
                    <div>
                      <small>Location</small>
                      <strong>{job.location}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <BriefcaseBusiness size={17} />
                    </span>
                    <div>
                      <small>Employment type</small>
                      <strong>{job.type}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <Clock3 size={17} />
                    </span>
                    <div>
                      <small>Work arrangement</small>
                      <strong>{job.workplace}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <GraduationCap size={17} />
                    </span>
                    <div>
                      <small>Experience</small>
                      <strong>{job.experience}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <CalendarDays size={17} />
                    </span>
                    <div>
                      <small>Posted</small>
                      <strong>{job.posted}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="job-overview-icon">
                      <Wallet size={17} />
                    </span>
                    <div>
                      <small>Education</small>
                      <strong>{job.education}</strong>
                    </div>
                  </div>
                </div>

                <Link href="/register" className="job-sidebar-apply">
                  Apply now <ArrowRight size={17} />
                </Link>

                <p className="job-sidebar-footnote">
                  Create an Abi Job account to continue with your application.
                </p>
              </section>

              <section className="job-sidebar-card job-safety-card">
                <span className="job-safety-icon">
                  <ShieldCheck size={23} />
                </span>
                <h3>Stay safe while job hunting</h3>
                <p>
                  Never pay anyone to secure a job. Verify employer details
                  and be careful with requests for sensitive information.
                </p>
                <Link href="/safety">
                  Read our safety tips <ArrowUpRight size={15} />
                </Link>
              </section>

              <section className="job-sidebar-card job-share-card">
                <div>
                  <Share2 size={18} />
                  <strong>Share this opportunity</strong>
                </div>
                <p>
                  Know someone who might be a good fit? Share this vacancy with
                  them.
                </p>
                <Link href="/login">
                  Sign in to share <ArrowRight size={15} />
                </Link>
              </section>
            </aside>
          </div>
        </section>

        <section className="job-bottom-cta">
          <div className="job-details-container">
            <div className="job-bottom-cta-inner">
              <div>
                <span>YOUR NEXT OPPORTUNITY</span>
                <h2>Ready to take the next step?</h2>
                <p>
                  Create your profile and get ready to connect with employers
                  looking for your skills.
                </p>
              </div>
              <Link href="/register">
                Get started <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="job-details-page">
          <div className="job-details-container">
            <p>Loading job details...</p>
          </div>
        </main>
      }
    >
      <JobDetailsContent params={params} />
    </Suspense>
  );
}
