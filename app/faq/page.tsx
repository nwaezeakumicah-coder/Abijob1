
"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./faq.css";

const faqCategories = [
  "All Questions",
  "General",
  "Job Seekers",
  "Skilled Professionals",
  "Employers",
  "Payments",
  "Safety",
];

const faqItems = [
  {
    category: "General",
    question: "What is Abi Job?",
    answer:
      "Abi Job is an employment and professional connection platform designed to connect people in Abia State with job opportunities, skilled professionals, artisans and businesses. It provides a space where job seekers can discover opportunities and employers can find suitable talent.",
  },
  {
    category: "General",
    question: "Who can use Abi Job?",
    answer:
      "Abi Job is designed for three main user groups: job seekers looking for employment, Skilled Professionals & Artisans offering their services, and employers looking for workers or professionals.",
  },
  {
    category: "General",
    question: "Is Abi Job only for people living in Abia State?",
    answer:
      "Abi Job is focused on opportunities and talent within Abia State. Users can explore opportunities across different locations in the state, subject to the availability and location requirements of each listing.",
  },
  {
    category: "Job Seekers",
    question: "How do I find jobs on Abi Job?",
    answer:
      "Create a job seeker account, complete your profile and visit the Find Jobs section. You can explore available vacancies and review their descriptions, requirements and application instructions.",
  },
  {
    category: "Job Seekers",
    question: "Do I need a CV to use Abi Job?",
    answer:
      "A CV is useful when applying for many professional positions. Abi Job is planned to provide CV-building assistance to help users prepare and improve their CVs.",
  },
  {
    category: "Job Seekers",
    question: "Can I apply for more than one job?",
    answer:
      "Yes. You can explore and apply for multiple suitable vacancies, provided you meet the requirements and follow the application instructions for each opportunity.",
  },
  {
    category: "Skilled Professionals",
    question: "Who qualifies as a Skilled Professional or Artisan?",
    answer:
      "This category includes people who offer practical, creative, technical or professional services. Examples include fashion designers, tailors, barbers, hairdressers, electricians, plumbers, graphic designers, mechanics and other skilled service providers.",
  },
  {
    category: "Skilled Professionals",
    question: "How can I showcase my skills?",
    answer:
      "Create a Skilled Professional & Artisan profile and provide information about your skills, experience, services and previous work. You may also include relevant certificates and portfolio examples where supported.",
  },
  {
    category: "Skilled Professionals",
    question: "Can customers or employers find me through Abi Job?",
    answer:
      "The platform is designed to help employers and people looking for services discover suitable professionals through their profiles, skills and locations.",
  },
  {
    category: "Employers",
    question: "How can my business find workers?",
    answer:
      "Register as an employer, complete your business profile and use the platform's professional discovery and recruitment features to find suitable candidates.",
  },
  {
    category: "Employers",
    question: "Can I publish a job immediately?",
    answer:
      "No. Job listings are subject to Abi Job's administrative review and approval before they become publicly available. This helps maintain the quality and safety of published opportunities.",
  },
  {
    category: "Employers",
    question: "Can small businesses use Abi Job?",
    answer:
      "Yes. Abi Job is designed to support small businesses, shops, hotels, restaurants, startups and other employers looking for workers and skilled professionals.",
  },
  {
    category: "Payments",
    question: "Is Abi Job free?",
    answer:
      "Abi Job offers a 30-day introductory free plan for job seekers, with access limited to 25% of platform benefits. Job seekers can instead subscribe immediately for full access. Employers and Skilled Professionals & Artisans must subscribe to use the platform.",
  },
  {
    category: "Payments",
    question: "How much does a subscription cost?",
    answer:
      "The monthly subscription is ₦2,000, while the annual subscription is ₦22,800. The annual option includes a 5% discount compared with paying monthly for twelve months.",
  },
  {
    category: "Payments",
    question: "What happens after the job seeker free period?",
    answer:
      "After the 30-day introductory period, job seekers need an active paid subscription to continue using premium platform features.",
  },
  {
    category: "Safety",
    question: "Are all job listings verified?",
    answer:
      "Job listings are subject to administrative approval before publication. However, users should still exercise care, verify employers and never pay suspicious recruitment fees.",
  },
  {
    category: "Safety",
    question: "What should I do if I encounter a suspicious listing?",
    answer:
      "Avoid sharing sensitive information or making payments. Report suspicious listings or behaviour through the platform's reporting channels so the matter can be reviewed.",
  },
  {
    category: "Safety",
    question: "How can I protect my account?",
    answer:
      "Use a strong, unique password, keep your login details private and never share passwords, bank PINs or verification codes with anyone.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("All Questions");
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFAQs = faqItems
    .map((item, index) => ({ ...item, id: index }))
    .filter((item) => {
      const matchesCategory =
        activeCategory === "All Questions" ||
        item.category === activeCategory;

      const matchesSearch =
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });

  return (
    <>
      <Header />

      <main className="faq-page">
        <section className="faq-hero">
          <div className="faq-container faq-hero-content">
            <span className="faq-eyebrow">HELP CENTRE</span>

            <h1>
              Questions?
              <br />
              <span>We've got answers.</span>
            </h1>

            <p>
              Find clear answers to common questions about finding jobs,
              showcasing your skills and growing your business with Abi Job.
            </p>

            <div className="faq-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>FAQs</span>
            </div>

            <div className="faq-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search for a question or topic..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setOpenQuestion(null);
                }}
                aria-label="Search frequently asked questions"
              />
              <span className="faq-search-label">SEARCH</span>
            </div>
          </div>

          <div className="faq-decoration faq-decoration-one" />
          <div className="faq-decoration faq-decoration-two" />
        </section>

        <section className="faq-content-section">
          <div className="faq-container">
            <div className="faq-section-heading">
              <span>FIND YOUR ANSWER</span>
              <h2>Frequently asked questions</h2>
              <p>
                Browse by category or search for a specific topic.
              </p>
            </div>

            <div className="faq-category-list">
              {faqCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category ? "active" : ""
                  }
                  onClick={() => {
                    setActiveCategory(category);
                    setOpenQuestion(null);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="faq-results-heading">
              <h3>
                {activeCategory === "All Questions"
                  ? "All questions"
                  : activeCategory}
              </h3>
              <span>
                {filteredFAQs.length}{" "}
                {filteredFAQs.length === 1 ? "question" : "questions"}
              </span>
            </div>

            {filteredFAQs.length > 0 ? (
              <div className="faq-accordion">
                {filteredFAQs.map((item) => {
                  const isOpen = openQuestion === item.id;

                  return (
                    <article
                      className={`faq-item ${isOpen ? "faq-item-open" : ""}`}
                      key={item.id}
                    >
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() =>
                          setOpenQuestion(isOpen ? null : item.id)
                        }
                        aria-expanded={isOpen}
                      >
                        <span>{item.question}</span>
                        <span className="faq-toggle">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="faq-answer">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="faq-empty">
                <span>⌕</span>
                <h3>No matching questions found</h3>
                <p>
                  Try another search term or choose a different category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("All Questions");
                    setOpenQuestion(0);
                  }}
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="faq-contact-section">
          <div className="faq-container faq-contact-content">
            <div>
              <span>STILL NEED HELP?</span>
              <h2>Couldn't find what you were looking for?</h2>
              <p>
                Our Contact Us page is available for questions,
                suggestions and other enquiries.
              </p>
            </div>

            <Link href="/contact">
              Contact Abi Job <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
