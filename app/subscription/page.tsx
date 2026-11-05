
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  BriefcaseBusiness,
  Building2,
  HardHat,
  Sparkles,
  Crown,
  ShieldCheck,
  Megaphone,
  CalendarDays,
  Zap,
  Target,
  CircleHelp,
} from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import "./subscription.css";

type AccountType = "job-seeker" | "professional" | "employer";
type BillingCycle = "monthly" | "annual";

type AccountDetails = {
  id: AccountType;
  name: string;
  description: string;
  icon: typeof BriefcaseBusiness;
  benefits: string[];
};

const accountTypes: AccountDetails[] = [
  {
    id: "job-seeker",
    name: "Job Seekers",
    description: "Find opportunities and build your career.",
    icon: BriefcaseBusiness,
    benefits: [
      "Access job opportunities across Abia State",
      "Personalised job recommendations",
      "Apply for suitable vacancies",
      "Build and manage your professional profile",
      "AI-assisted CV building",
      "Interview preparation resources",
      "Career news, scholarships and learning resources",
      "Connect with employers",
    ],
  },
  {
    id: "professional",
    name: "Skilled Professionals & Artisans",
    description: "Showcase your skills and connect with customers.",
    icon: HardHat,
    benefits: [
      "Create a professional skills profile",
      "Showcase your portfolio and previous work",
      "Discover relevant work opportunities",
      "Connect with potential customers",
      "Receive and manage work enquiries",
      "Promote your professional services",
      "Access professional resources",
      "Build your reputation on Abi Job",
    ],
  },
  {
    id: "employer",
    name: "Employers",
    description: "Find the right people for your business.",
    icon: Building2,
    benefits: [
      "Create and manage your business profile",
      "Publish job vacancies for admin approval",
      "Discover suitable candidates",
      "Access job seeker profiles",
      "Manage applications and recruitment",
      "Connect with skilled professionals",
      "Manage your recruitment activities",
      "Reach talent across Abia State",
    ],
  },
];

const accountDetails: Record<AccountType, AccountDetails> = {
  "job-seeker": accountTypes[0],
  professional: accountTypes[1],
  employer: accountTypes[2],
};

export default function SubscriptionPage() {
  const [selectedType, setSelectedType] =
    useState<AccountType>("job-seeker");

  const [billing, setBilling] =
    useState<BillingCycle>("annual");

  const selectedAccount = accountDetails[selectedType];

  const monthlyPrice = 2000;
  const annualPrice = 22800;

  const currentPrice =
    billing === "monthly" ? monthlyPrice : annualPrice;

  const annualSavings = monthlyPrice * 12 - annualPrice;

  const checkoutBilling = billing === "annual" ? "annual" : "monthly";

  const checkoutUrl =
    `/subscription/checkout?type=${selectedType}&plan=${checkoutBilling}`;

  const trialUrl = `/register?type=${selectedType}&plan=introductory`;

  return (
    <main className="subscription-page">
      <Header />

      {/* HERO SECTION */}
      <section className="subscription-hero">
        <div className="subscription-hero-content">
          <div className="subscription-eyebrow">
            <Sparkles size={16} />
            ABI JOB MEMBERSHIP
          </div>

          <h1>
            Invest in your next
            <span> opportunity.</span>
          </h1>

          <p>
            Whether you are searching for a job, offering your skills,
            or building a business, Abi Job gives you the tools and
            connections to move forward.
          </p>

          <div className="subscription-hero-points">
            <span>
              <CheckCircle2 size={17} />
              30 days completely free
            </span>

            <span>
              <CheckCircle2 size={17} />
              Full platform benefits
            </span>

            <span>
              <CheckCircle2 size={17} />
              Opportunities across Abia
            </span>
          </div>
        </div>

        <div className="subscription-hero-card">
          <div className="hero-card-top">
            <div className="hero-card-icon">
              <Crown size={23} />
            </div>

            <span>ABI JOB MEMBERSHIP</span>
          </div>

          <div className="hero-card-price">
            <small>Starting from</small>
            <h2>₦2,000</h2>
            <span>per month</span>
          </div>

          <div className="hero-card-divider" />

          <div className="hero-card-detail">
            <ShieldCheck size={19} />

            <div>
              <strong>30-day free trial</strong>
              <small>
                Enjoy all available platform benefits during your trial.
              </small>
            </div>
          </div>

          <div className="hero-card-detail">
            <Target size={19} />

            <div>
              <strong>Purpose-built platform</strong>
              <small>
                Connecting talent, businesses and opportunities.
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* ACCOUNT TYPE SELECTION */}
      <section className="subscription-section">
        <div className="subscription-section-heading">
          <span className="section-kicker">
            CHOOSE YOUR MEMBERSHIP
          </span>

          <h2>What brings you to Abi Job?</h2>

          <p>
            Select your account category to see the membership benefits
            available to you.
          </p>
        </div>

        <div className="account-type-grid">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            const active = selectedType === account.id;

            return (
              <button
                type="button"
                key={account.id}
                className={`account-type-card ${
                  active ? "active" : ""
                }`}
                onClick={() => setSelectedType(account.id)}
                aria-pressed={active}
              >
                <div className="account-card-icon">
                  <Icon size={25} />
                </div>

                {active && (
                  <span className="account-selected">
                    <Check size={14} />
                    Selected
                  </span>
                )}

                <h3>{account.name}</h3>

                <p>{account.description}</p>

                <span className="account-card-action">
                  View membership
                  <ArrowRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SUBSCRIPTION PRICING */}
      <section className="subscription-pricing-section">
        <div className="subscription-section-heading">
          <span className="section-kicker">
            SIMPLE AND TRANSPARENT
          </span>

          <h2>Your membership, your choice.</h2>

          <p>
            Every account category starts with 30 days of full platform
            access. Choose a billing option for your paid membership.
          </p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="billing-toggle">
          <button
            type="button"
            className={billing === "monthly" ? "active" : ""}
            onClick={() => setBilling("monthly")}
            aria-pressed={billing === "monthly"}
          >
            Monthly
          </button>

          <button
            type="button"
            className={billing === "annual" ? "active" : ""}
            onClick={() => setBilling("annual")}
            aria-pressed={billing === "annual"}
          >
            Annually
            <span>Save 5%</span>
          </button>
        </div>

        <div className="subscription-plan-layout">
          {/* PAID MEMBERSHIP CARD */}
          <div className="subscription-plan-card">
            <div className="plan-card-heading">
              <div>
                <span className="plan-label">
                  YOUR SELECTED PLAN
                </span>

                <h3>{selectedAccount.name}</h3>

                <p>{selectedAccount.description}</p>
              </div>

              <div className="plan-icon">
                {selectedType === "job-seeker" && (
                  <BriefcaseBusiness size={25} />
                )}

                {selectedType === "professional" && (
                  <HardHat size={25} />
                )}

                {selectedType === "employer" && (
                  <Building2 size={25} />
                )}
              </div>
            </div>

            <div className="plan-price-area">
              <div>
                <span className="plan-price">
                  ₦{currentPrice.toLocaleString("en-NG")}
                </span>

                <span className="plan-duration">
                  / {billing === "monthly" ? "month" : "year"}
                </span>
              </div>

              {billing === "annual" && (
                <span className="annual-saving">
                  Save ₦{annualSavings.toLocaleString("en-NG")}
                </span>
              )}
            </div>

            <div className="plan-divider" />

            <h4>What's included</h4>

            <ul className="plan-benefits">
              {selectedAccount.benefits.map((benefit) => (
                <li key={benefit}>
                  <span className="benefit-check">
                    <Check size={14} />
                  </span>

                  {benefit}
                </li>
              ))}
            </ul>

            <Link
              href={checkoutUrl}
              className="subscription-primary-btn"
            >
              Continue to payment
              <ArrowRight size={18} />
            </Link>

            <div className="plan-security-note">
              <ShieldCheck size={16} />

              <span>
                Secure payments powered by Paystack. Your selected
                paid plan will be activated after successful payment
                verification.
              </span>
            </div>
          </div>

          {/* FULL ACCESS FREE TRIAL */}
          <div className="introductory-plan-card">
            <div className="intro-badge">
              <Sparkles size={14} />
              AVAILABLE TO EVERY ACCOUNT
            </div>

            <div className="intro-icon">
              <Zap size={25} />
            </div>

            <h3>Start with 30 days free</h3>

            <p>
              Experience Abi Job without paying during your first
              30 days. Every account category receives full access
              to its available platform benefits.
            </p>

            <div className="intro-price">
              <strong>FREE</strong>
              <span>For your first 30 days</span>
            </div>

            <div className="intro-access">
              <strong>100% platform benefits</strong>

              <div className="access-progress">
                <span />
              </div>

              <small>
                No restricted trial features. Enjoy the full benefits
                available to your account category.
              </small>
            </div>

            <ul className="intro-benefits">
              <li>
                <Check size={15} />
                Full access to your account features
              </li>

              <li>
                <Check size={15} />
                Access to relevant opportunities
              </li>

              <li>
                <Check size={15} />
                Full use of available platform tools
              </li>

              <li>
                <Check size={15} />
                No payment required to start your trial
              </li>
            </ul>

            <Link
              href={trialUrl}
              className="subscription-secondary-btn"
            >
              Start your free trial
              <ArrowRight size={17} />
            </Link>

            <p className="intro-footnote">
              After the 30-day trial, an active paid subscription is
              required to continue accessing the platform.
            </p>
          </div>
        </div>
      </section>

      {/* ADVERTISING SERVICES */}
      <section className="advertising-section">
        <div className="advertising-icon">
          <Megaphone size={27} />
        </div>

        <div className="advertising-content">
          <span className="section-kicker">
            FOR BUSINESSES & ORGANISATIONS
          </span>

          <h2>Want to advertise on Abi Job?</h2>

          <p>
            Abi Job also offers promotional campaigns for businesses,
            brands, training centres and organisations. Our team can
            help design, prepare, schedule and publish your
            advertisement across the platform.
          </p>

          <div className="advertising-points">
            <span>
              <Check size={15} />
              Promotional campaigns
            </span>

            <span>
              <Check size={15} />
              Sponsored placements
            </span>

            <span>
              <Check size={15} />
              Campaign management
            </span>
          </div>
        </div>

        <Link
          href="/contact?subject=advertising"
          className="advertising-btn"
        >
          Discuss advertising
          <ArrowRight size={17} />
        </Link>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="subscription-faq-section">
        <div className="subscription-section-heading">
          <span className="section-kicker">
            NEED CLARITY?
          </span>

          <h2>Frequently asked questions</h2>

          <p>
            Some helpful information about Abi Job membership.
          </p>
        </div>

        <div className="subscription-faq-grid">
          <div className="faq-item">
            <CircleHelp size={20} />

            <div>
              <h3>Can I change my billing cycle?</h3>

              <p>
                You can choose monthly or annual billing when
                selecting your paid membership.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <CircleHelp size={20} />

            <div>
              <h3>Who can use the free trial?</h3>

              <p>
                All three account categories receive a 30-day free
                trial with 100% access to their available platform
                benefits.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <CircleHelp size={20} />

            <div>
              <h3>Do employers get a free trial?</h3>

              <p>
                Yes. Employers receive the same 30-day full-access
                free trial as job seekers and skilled professionals.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <CircleHelp size={20} />

            <div>
              <h3>What happens after 30 days?</h3>

              <p>
                An active paid subscription is required to continue
                accessing Abi Job after the introductory trial ends.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <CircleHelp size={20} />

            <div>
              <h3>How much does membership cost?</h3>

              <p>
                Membership costs ₦2,000 monthly or ₦22,800 annually.
                Annual subscribers save ₦1,200 compared with monthly
                payments over 12 months.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <CircleHelp size={20} />

            <div>
              <h3>Is advertising included?</h3>

              <p>
                No. Advertising campaigns are separate services with
                their own agreed campaign fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="subscription-bottom-cta">
        <CalendarDays size={25} />

        <div>
          <h2>Ready to move forward?</h2>

          <p>
            Start with 30 days of full access or choose your paid
            membership with Abi Job.
          </p>
        </div>

        <Link href={trialUrl}>
          Start free
          <ArrowRight size={17} />
        </Link>
      </section>

      <Footer />
    </main>
  );
}
