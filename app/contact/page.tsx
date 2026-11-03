
"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./contact.css";

export default function ContactPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    alert(
      "Thank you for your enquiry. Message submission will be available when the contact service is connected."
    );
  }

  return (
    <>
      <Header />

      <main className="contact-page">
        <section className="contact-hero">
          <div className="contact-container">
            <span className="contact-eyebrow">WE'RE HERE TO HELP</span>

            <h1>
              Let's start a
              <br />
              <span>conversation.</span>
            </h1>

            <p>
              Have a question, suggestion or business enquiry?
              We'd love to hear from you. Tell us how we can help.
            </p>

            <div className="contact-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>Contact Us</span>
            </div>
          </div>

          <div className="contact-hero-decoration contact-decoration-one" />
          <div className="contact-hero-decoration contact-decoration-two" />
        </section>

        <section className="contact-main-section">
          <div className="contact-container">
            <div className="contact-intro">
              <span>GET IN TOUCH</span>
              <h2>How can we assist you?</h2>
              <p>
                Choose the most relevant enquiry type and send us a message.
                Our contact channels will be published here as they become
                available.
              </p>
            </div>

            <div className="contact-layout">
              <div className="contact-information">
                <div className="contact-info-heading">
                  <span className="contact-info-icon">✦</span>
                  <h3>Contact Abi Job</h3>
                  <p>
                    Whether you're a job seeker, professional or employer,
                    we're interested in hearing from you.
                  </p>
                </div>

                <div className="contact-info-item">
                  <span className="contact-info-symbol">◎</span>
                  <div>
                    <small>OUR LOCATION</small>
                    <strong>Abia State, Nigeria</strong>
                  </div>
                </div>

                <div className="contact-info-item">
                  <span className="contact-info-symbol">✉</span>
                  <div>
                    <small>EMAIL</small>
                    <strong>Official email coming soon</strong>
                  </div>
                </div>

                <div className="contact-info-item">
                  <span className="contact-info-symbol">◷</span>
                  <div>
                    <small>SUPPORT HOURS</small>
                    <strong>Support schedule to be announced</strong>
                  </div>
                </div>

                <div className="contact-info-divider" />

                <div className="contact-info-bottom">
                  <h4>Need immediate guidance?</h4>
                  <p>
                    Visit our Help & Support page for guidance on common
                    platform issues.
                  </p>

                  <Link href="/support">
                    Visit Help & Support <span>→</span>
                  </Link>
                </div>

                <div className="contact-info-pattern">a.</div>
              </div>

              <div className="contact-form-card">
                <div className="contact-form-heading">
                  <span>YOUR MESSAGE</span>
                  <h2>Send us an enquiry</h2>
                  <p>
                    Complete the form below. The form is a frontend
                    demonstration until a contact submission service is
                    connected.
                  </p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label htmlFor="contact-name">Full name</label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact-email">Email address</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label htmlFor="contact-phone">
                        Phone number <span>(optional)</span>
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder="+234"
                      />
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact-type">Enquiry type</label>
                      <select
                        id="contact-type"
                        name="enquiry"
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>
                          Select enquiry type
                        </option>
                        <option value="general">General enquiry</option>
                        <option value="job-seeker">Job seeker enquiry</option>
                        <option value="professional">
                          Skilled professional enquiry
                        </option>
                        <option value="employer">Employer enquiry</option>
                        <option value="partnership">
                          Partnership or business enquiry
                        </option>
                        <option value="technical">Technical issue</option>
                        <option value="complaint">Complaint or report</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="contact-field">
                    <label htmlFor="contact-subject">Subject</label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      placeholder="What is your message about?"
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="contact-message">Your message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={6}
                      placeholder="Tell us how we can help..."
                      required
                    />
                  </div>

                  <label className="contact-consent">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                    />
                    <span>
                      I confirm that the information provided is accurate
                      and may be used to respond to my enquiry.
                    </span>
                  </label>

                  <button type="submit" className="contact-submit-button">
                    Send message <span>→</span>
                  </button>

                  <p className="contact-form-disclaimer">
                    Please do not include passwords, bank PINs or sensitive
                    financial information in your message.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-bottom-section">
          <div className="contact-container contact-bottom-content">
            <div>
              <span>WE'RE BUILDING OPPORTUNITIES</span>
              <h2>
                Every great connection starts with a conversation.
              </h2>
            </div>

            <Link href="/jobs">
              Explore opportunities <span>↗</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
