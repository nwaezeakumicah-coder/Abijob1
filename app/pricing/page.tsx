"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Crown,
  Gem,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import "./pricing.css";

type Audience = "job-seekers" | "professionals" | "employers";

type Plan = {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
};

const MONTHLY_PRICE = 2000;
const YEARLY_PRICE = 22800;

const plans: Record<Audience, Plan> = {
  "job-seekers": {
    name: "Abijob Membership",
    description: "Find opportunities and build your career with Abijob.",
    monthlyPrice: MONTHLY_PRICE,
    yearlyPrice: YEARLY_PRICE,
    features: [
      "Create and manage your professional profile",
      "Browse available job opportunities",
      "Apply for jobs",
      "Save interesting opportunities",
      "Receive job alerts",
      "Track application updates",
      "AI-assisted CV builder",
      "AI interview practice",
      "Personalised job recommendations",
    ],
  },

  professionals: {
    name: "Abijob Membership",
    description: "Showcase your skills and connect with customers.",
    monthlyPrice: MONTHLY_PRICE,
    yearlyPrice: YEARLY_PRICE,
    features: [
      "Create and manage your professional profile",
      "Display your skills and services",
      "Add work samples to your portfolio",
      "Receive customer enquiries",
      "Appear in professional searches",
      "Showcase your experience",
      "Discover relevant opportunities",
      "Manage your professional presence",
    ],
  },

  employers: {
    name: "Abijob Membership",
    description: "Find skilled people and manage your recruitment.",
    monthlyPrice: MONTHLY_PRICE,
    yearlyPrice: YEARLY_PRICE,
    features: [
      "Create and manage your business profile",
      "Publish job opportunities",
      "Receive applications",
      "View applicant profiles",
      "Manage recruitment activities",
      "Review applicants",
      "Connect with skilled professionals",
      "Access recruitment tools",
    ],
  },
};

const audiences: {
  id: Audience;
  label: string;
  description: string;
  icon: typeof BriefcaseBusiness;
}[] = [
  {
    id: "job-seekers",
    label: "Job seekers",
    description: "Find work and build your career.",
    icon: BriefcaseBusiness,
  },
  {
    id: "professionals",
    label: "Skilled professionals",
    description: "Showcase your skills and attract customers.",
    icon: Users,
  },
  {
    id: "employers",
    label: "Employers",
    description: "Find talent and grow your business.",
    icon: Crown,
  },
];

function formatPrice(price: number) {
  return `₦${price.toLocaleString("en-NG")}`;
}

export default function PricingPage() {
  const [audience, setAudience] = useState<Audience>("job-seekers");
  const [yearly, setYearly] = useState(false);

  const selectedPlan = plans[audience];
  const price = yearly
    ? selectedPlan.yearlyPrice
    : selectedPlan.monthlyPrice;

  return (
    <main className="pricing-page">
      <Header />

      <section className="pricing-hero">
        <div className="pricing-hero-decoration pricing-decoration-one" />
        <div className="pricing-hero-decoration pricing-decoration-two" />

        <div className="pricing-container pricing-hero-content">
          <span className="pricing-eyebrow">
            SIMPLE PLANS. REAL OPPORTUNITIES.
          </span>

          <h1>
            More opportunities.
            <br />
            <span>More ways to grow.</span>
          </h1>

          <p>
            Start with a 30-day free trial. Explore Abijob and discover
            opportunities, connect with talent and grow your career or
            business.
          </p>

          <div className="pricing-hero-points">
            <span>
              <Check size={16} /> 30-day free trial
            </span>
            <span>
              <Check size={16} /> One simple membership
            </span>
            <span>
              <Check size={16} /> Built for Abia businesses and talent
            </span>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="pricing-container">
          <div className="pricing-section-heading">
            <span className="pricing-eyebrow">OUR MEMBERSHIP</span>
            <h2>One membership. Real opportunities.</h2>
            <p>
              Choose your account type to see the features available to you.
              The membership price is the same for everyone.
            </p>
          </div>

          <div className="pricing-audience-tabs">
            {audiences.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  key={item.id}
                  className={
                    audience === item.id
                      ? "pricing-audience-tab active"
                      : "pricing-audience-tab"
                  }
                  onClick={() => setAudience(item.id)}
                  aria-pressed={audience === item.id}
                >
                  <span className="pricing-audience-icon">
                    <Icon size={20} />
                  </span>

                  <span className="pricing-audience-copy">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>

                  {audience === item.id && (
                    <Check
                      className="pricing-audience-check"
                      size={18}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pricing-billing-row">
            <div>
              <strong>Choose your billing period</strong>
              <p>Every new verified account gets one 30-day free trial.</p>
            </div>

            <div className="pricing-billing-switch">
              <button
                type="button"
                className={!yearly ? "active" : ""}
                onClick={() => setYearly(false)}
                aria-pressed={!yearly}
              >
                Monthly
              </button>

              <button
                type="button"
                className={yearly ? "active" : ""}
                onClick={() => setYearly(true)}
                aria-pressed={yearly}
              >
                Yearly <span>Save 5%</span>
              </button>
            </div>
          </div>

          <div className="pricing-cards pricing-cards-1">
            <article className="pricing-card pricing-card-popular">
              <div className="pricing-popular-label">
                <Gem size={14} />
                ABIJOB MEMBERSHIP
              </div>

              <div className="pricing-card-top">
                <div className="pricing-plan-icon premium">
                  <Crown size={22} />
                </div>

                <h3>{selectedPlan.name}</h3>
                <p>{selectedPlan.description}</p>
              </div>

              <div className="pricing-trial-highlight">
                <ShieldCheck size={20} />
                <div>
                  <strong>First 30 days free</strong>
                  <span>
                    Your free trial starts after successful account
                    verification.
                  </span>
                </div>
              </div>

              <div className="pricing-price">
                <strong>{formatPrice(price)}</strong>
                <span> / {yearly ? "year" : "month"}</span>
              </div>

              {yearly && (
                <div className="pricing-yearly-note">
                  Equivalent to {formatPrice(Math.round(price / 12))} per
                  month. Billed annually.
                </div>
              )}

              <Link
                href="/register"
                className="pricing-cta pricing-cta-primary"
              >
                Start your free trial
                <ArrowRight size={17} />
              </Link>

              <div className="pricing-features-heading">
                What's included
              </div>

              <ul className="pricing-features">
                {selectedPlan.features.map((feature) => (
                  <li key={feature}>
                    <span>
                      <Check size={14} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="pricing-note">
            <ShieldCheck size={20} />
            <p>
              <strong>Clear and consistent pricing.</strong>
              All account types receive one 30-day free trial per verified
              account. After the trial, membership costs ₦2,000 monthly or
              ₦22,800 annually. Your profile remains yours if your trial or
              subscription expires; subscription-protected features may
              require an active membership.
            </p>
          </div>
        </div>
      </section>

      <section className="pricing-faq-section">
        <div className="pricing-container">
          <div className="pricing-section-heading">
            <span className="pricing-eyebrow">GOOD TO KNOW</span>
            <h2>Questions about our membership?</h2>
          </div>

          <div className="pricing-faq-grid">
            <article>
              <h3>How long is the free trial?</h3>
              <p>
                Every new verified account receives one 30-day free trial.
                The trial is available to job seekers, skilled professionals
                and employers.
              </p>
            </article>

            <article>
              <h3>How much does membership cost?</h3>
              <p>
                Membership costs ₦2,000 per month or ₦22,800 per year after
                the free trial.
              </p>
            </article>

            <article>
              <h3>What happens when my trial expires?</h3>
              <p>
                You can subscribe to continue using subscription-protected
                features. Your profile is retained even if your trial or
                subscription expires.
              </p>
            </article>

            <article>
              <h3>How will payments work?</h3>
              <p>
                Payments will be processed through supported payment
                providers. Subscription access should only be activated
                after successful payment verification.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="pricing-bottom-cta">
        <div className="pricing-container pricing-bottom-cta-inner">
          <div>
            <span className="pricing-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </span>

            <h2>Ready to make your next move?</h2>

            <p>
              Join a growing community of job seekers, skilled professionals
              and businesses.
            </p>
          </div>

          <Link href="/register" className="pricing-bottom-button">
            Create your account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}