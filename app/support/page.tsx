
"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./support.css";

const supportTopics = [
  {
    id: "account",
    icon: "◎",
    title: "Account & Registration",
    description: "Getting started, signing in and managing your account.",
    articles: [
      {
        title: "How do I create an Abi Job account?",
        content:
          "Visit the registration page and select the account type that describes you: Job Seeker, Skilled Professional & Artisan, or Employer. Complete the required information and follow the registration instructions.",
      },
      {
        title: "I cannot sign in to my account",
        content:
          "Check that you entered the correct email address and password. If you have forgotten your password, use the Forgot Password link on the login page. Never share your password or verification codes with another person.",
      },
      {
        title: "How do I reset my password?",
        content:
          "Open the Forgot Password page, enter the email address associated with your account and follow the password reset instructions when the authentication service is connected.",
      },
      {
        title: "Can I change my account information?",
        content:
          "Your profile and account settings are intended to allow you to maintain accurate personal or business information. Some account changes may require additional verification.",
      },
    ],
  },
  {
    id: "jobs",
    icon: "▤",
    title: "Jobs & Applications",
    description: "Finding vacancies, applying and tracking applications.",
    articles: [
      {
        title: "Where can I find available jobs?",
        content:
          "Visit the Find Jobs section to browse published vacancies. Review the job description, location, requirements and application instructions before applying.",
      },
      {
        title: "Why can't I find a job I saw earlier?",
        content:
          "A job may have expired, been removed, filled or temporarily become unavailable. Check the listing again and explore other opportunities that match your skills.",
      },
      {
        title: "How do I improve my chances of getting hired?",
        content:
          "Complete your profile, provide accurate information about your qualifications and experience, prepare a clear CV and apply only for opportunities that match your abilities.",
      },
      {
        title: "Can I report a suspicious job listing?",
        content:
          "Yes. Avoid making payments or sharing sensitive information with suspicious recruiters. Use the platform's reporting channels when available to report the listing for review.",
      },
    ],
  },
  {
    id: "professional",
    icon: "✧",
    title: "Skilled Professionals & Artisans",
    description: "Profiles, skills, services and professional visibility.",
    articles: [
      {
        title: "How do I create my professional profile?",
        content:
          "Register as a Skilled Professional & Artisan and provide accurate details about your services, skills, experience and location. Include certificates and examples of previous work where supported.",
      },
      {
        title: "Which skills can I list?",
        content:
          "You can list practical, creative, technical and professional skills. Examples include fashion design, tailoring, hairdressing, barbering, electrical work, plumbing, graphic design and mechanics.",
      },
      {
        title: "How can I attract more customers?",
        content:
          "Keep your profile complete and up to date. Describe your services clearly, provide accurate contact information through approved platform features and showcase the quality of your work.",
      },
    ],
  },
  {
    id: "employers",
    icon: "▣",
    title: "Employers & Businesses",
    description: "Business profiles, recruitment and job publication.",
    articles: [
      {
        title: "How can my business recruit workers?",
        content:
          "Register as an Employer, complete your business profile and explore the platform's recruitment features to discover suitable job seekers and skilled professionals.",
      },
      {
        title: "Why has my job listing not appeared?",
        content:
          "All submitted job listings are subject to administrative review and approval before publication. A listing may remain unpublished while it is being reviewed or if changes are required.",
      },
      {
        title: "Can small businesses recruit on Abi Job?",
        content:
          "Yes. The platform is designed to support small businesses, shops, hotels, restaurants, startups and other organisations looking for suitable workers.",
      },
    ],
  },
  {
    id: "subscription",
    icon: "₦",
    title: "Subscriptions & Payments",
    description: "Plans, subscription access and payment questions.",
    articles: [
      {
        title: "What are the subscription prices?",
        content:
          "The monthly subscription is ₦2,000 and the annual subscription is ₦22,800. The annual option includes a 5% discount compared with twelve monthly payments.",
      },
      {
        title: "Is there a free introductory plan?",
        content:
          "Job seekers can start with a 30-day introductory free plan that provides access to 25% of platform benefits, or subscribe immediately for full access. Employers and Skilled Professionals & Artisans do not have a free plan.",
      },
      {
        title: "What happens when my subscription expires?",
        content:
          "You will need to renew your subscription to continue accessing features that require an active paid plan. Your available access will depend on your account type and subscription status.",
      },
      {
        title: "What should I do if a payment fails?",
        content:
          "Check your payment details and confirm the transaction status with your payment provider. Do not repeat a payment if you are unsure whether the first transaction succeeded. Keep your transaction reference for support enquiries.",
      },
    ],
  },
  {
    id: "technical",
    icon: "⚙",
    title: "Technical Issues",
    description: "Website problems, loading issues and unexpected errors.",
    articles: [
      {
        title: "The website is not loading properly",
        content:
          "Check your internet connection, refresh the page and try again. You can also try another browser or clear your browser cache if the problem continues.",
      },
      {
        title: "A page or button is not working",
        content:
          "Refresh the page and try again. If the issue persists, note the page address, what you were trying to do and any error message displayed so the support team can investigate.",
      },
      {
        title: "How do I report a technical problem?",
        content:
          "Use the Contact Us page to describe the issue. Include the affected page and the steps that caused the problem, but never send your password, bank PIN or verification code.",
      },
    ],
  },
];

export default function SupportPage() {
  const [activeTopic, setActiveTopic] = useState("account");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(
    "account-0"
  );
  const [search, setSearch] = useState("");

  const selectedTopic = supportTopics.find(
    (topic) => topic.id === activeTopic
  );

  const filteredTopics = supportTopics
    .map((topic) => ({
      ...topic,
      articles: topic.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(search.toLowerCase()) ||
          article.content.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((topic) => topic.articles.length > 0);

  return (
    <>
      <Header />

      <main className="support-page">
        <section className="support-hero">
          <div className="support-container support-hero-content">
            <span className="support-eyebrow">ABI JOB HELP CENTRE</span>

            <h1>
              We're here to
              <br />
              <span>help you move forward.</span>
            </h1>

            <p>
              Find guidance for your account, job applications, professional
              profile, business recruitment and other Abi Job services.
            </p>

            <div className="support-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Help & Support</span>
            </div>

            <div className="support-search">
              <span>⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="What do you need help with?"
                aria-label="Search help articles"
              />
              <span className="support-search-label">SEARCH HELP</span>
            </div>
          </div>

          <div className="support-hero-ring support-ring-one" />
          <div className="support-hero-ring support-ring-two" />
        </section>

        <section className="support-main-section">
          <div className="support-container">
            <div className="support-section-heading">
              <span>HOW CAN WE HELP?</span>
              <h2>Explore our help topics</h2>
              <p>
                Choose a topic to find practical guidance and answers.
              </p>
            </div>

            <div className="support-topic-grid">
              {supportTopics.map((topic) => (
                <button
                  type="button"
                  key={topic.id}
                  className={`support-topic-card ${
                    activeTopic === topic.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTopic(topic.id);
                    setExpandedArticle(null);
                  }}
                >
                  <span className="support-topic-icon">{topic.icon}</span>
                  <strong>{topic.title}</strong>
                  <p>{topic.description}</p>
                  <span className="support-topic-arrow">Explore topic →</span>
                </button>
              ))}
            </div>

            <div className="support-articles-section">
              <div className="support-articles-heading">
                <div>
                  <span>SUPPORT GUIDES</span>
                  <h2>
                    {search
                      ? "Search results"
                      : selectedTopic?.title ?? "Help articles"}
                  </h2>
                </div>

                <span className="support-article-count">
                  {search
                    ? filteredTopics.reduce(
                        (total, topic) => total + topic.articles.length,
                        0
                      )
                    : selectedTopic?.articles.length ?? 0}{" "}
                  articles
                </span>
              </div>

              {search ? (
                filteredTopics.length > 0 ? (
                  <div className="support-article-list">
                    {filteredTopics.map((topic) => (
                      <div key={topic.id}>
                        <h3 className="support-search-category">
                          {topic.title}
                        </h3>
                        {topic.articles.map((article) => {
                          const articleId = `${topic.id}-${article.title}`;
                          const isExpanded =
                            expandedArticle === articleId;

                          return (
                            <article
                              className="support-article"
                              key={articleId}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedArticle(
                                    isExpanded ? null : articleId
                                  )
                                }
                                aria-expanded={isExpanded}
                              >
                                <span>{article.title}</span>
                                <span className="support-article-toggle">
                                  {isExpanded ? "−" : "+"}
                                </span>
                              </button>

                              {isExpanded && (
                                <p className="support-article-answer">
                                  {article.content}
                                </p>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="support-empty">
                    <span>⌕</span>
                    <h3>No matching help articles</h3>
                    <p>
                      Try a different search term or contact us for
                      additional assistance.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                    >
                      Clear search
                    </button>
                  </div>
                )
              ) : (
                <div className="support-article-list">
                  {selectedTopic?.articles.map((article, index) => {
                    const articleId = `${activeTopic}-${index}`;
                    const isExpanded =
                      expandedArticle === articleId;

                    return (
                      <article
                        className="support-article"
                        key={articleId}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedArticle(
                              isExpanded ? null : articleId
                            )
                          }
                          aria-expanded={isExpanded}
                        >
                          <span>{article.title}</span>
                          <span className="support-article-toggle">
                            {isExpanded ? "−" : "+"}
                          </span>
                        </button>

                        {isExpanded && (
                          <p className="support-article-answer">
                            {article.content}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="support-contact-section">
          <div className="support-container support-contact-content">
            <div>
              <span>WE'RE HAPPY TO HELP</span>
              <h2>Still need assistance?</h2>
              <p>
                If you cannot find the answer you need, send us an enquiry
                through our Contact Us page.
              </p>
            </div>

            <Link href="/contact">
              Contact Support <span>→</span>
            </Link>
          </div>
        </section>

        <section className="support-faq-link">
          <div className="support-container">
            <p>
              Looking for quick answers? Visit our{" "}
              <Link href="/faq">Frequently Asked Questions</Link> page.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
