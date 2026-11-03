"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  popular?: boolean;
  premium?: boolean;
};

const plans: Record<Audience, Plan[]> = {
  "job-seekers": [
    {
      name: "Basic",
      description: "Everything you need to start finding opportunities.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Create your professional profile",
        "Browse available job opportunities",
        "Apply for jobs",
        "Save interesting opportunities",
        "Receive job alerts",
        "Track application updates",
      ],
    },
    {
      name: "Career Plus",
      description: "Extra career tools to help you stand out.",
      monthlyPrice: 1500,
      yearlyPrice: 15000,
      premium: true,
      popular: true,
      features: [
        "Everything in Basic",
        "AI-assisted CV builder",
        "AI interview practice",
        "Advanced job matching",
        "Enhanced career guidance",
        "Priority career resources",
      ],
    },
  ],

  professionals: [
    {
      name: "Professional Basic",
      description: "Build your presence and get discovered.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Create a professional profile",
        "Display your skills and services",
        "Add work samples to your portfolio",
        "Receive customer enquiries",
        "Appear in professional searches",
        "Manage your profile",
      ],
    },
    {
      name: "Professional Plus",
      description: "Grow your visibility and attract more customers.",
      monthlyPrice: 2000,
      yearlyPrice: 20000,
      premium: true,
      popular: true,
      features: [
        "Everything in Professional Basic",
        "Featured professional profile",
        "Increased search visibility",
        "Portfolio promotion opportunities",
        "Additional profile insights",
        "Priority promotional opportunities",
      ],
    },
  ],

  employers: [
    {
      name: "Starter",
      description: "For small businesses hiring occasionally.",
      monthlyPrice: 5000,
      yearlyPrice: 50000,
      features: [
        "Business profile",
        "Publish up to 2 active job listings",
        "Receive applications",
        "View applicant profiles",
        "Basic recruitment dashboard",
        "Standard job visibility",
      ],
    },
    {
      name: "Growth",
      description: "For growing businesses hiring regularly.",
      monthlyPrice: 12000,
      yearlyPrice: 120000,
      premium: true,
      popular: true,
      features: [
        "Everything in Starter",
        "Publish up to 8 active job listings",
        "Advanced applicant filtering",
        "Featured job opportunities",
        "Recruitment performance insights",
        "Enhanced applicant management",
      ],
    },
    {
      name: "Business",
      description: "For organisations with larger hiring needs.",
      monthlyPrice: 25000,
      yearlyPrice: 250000,
      premium: true,
      features: [
        "Everything in Growth",
        "Publish up to 20 active job listings",
        "Priority job promotion",
        "Advanced recruitment analytics",
        "Expanded hiring tools",
        "Priority support",
      ],
    },
  ],
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
  if (price === 0) return "Free";
  return `₦${price.toLocaleString("en-NG")}`;
}

export default function PricingPage() {
  const [audience, setAudience] = useState<Audience>("job-seekers");
  const [yearly, setYearly] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("abijob-theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const selectedPlans = plans[audience];

  return (
    <main className={`pricing-page ${darkMode ? "dark-mode" : ""}`}>
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
            Start with the essentials for free. Upgrade when you need more
            tools, visibility or recruitment power.
          </p>

          <div className="pricing-hero-points">
            <span>
              <Check size={16} /> Free basic access
            </span>
            <span>
              <Check size={16} /> Flexible plans
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
            <span className="pricing-eyebrow">CHOOSE YOUR PLAN</span>
            <h2>A plan for every kind of ambition.</h2>
            <p>
              Select the account type that describes you to see the available
              plans.
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
              <p>Change your billing preference at any time.</p>
            </div>

            <div className="pricing-billing-switch">
              <button
                type="button"
                className={!yearly ? "active" : ""}
                onClick={() => setYearly(false)}
              >
                Monthly
              </button>

              <button
                type="button"
                className={yearly ? "active" : ""}
                onClick={() => setYearly(true)}
              >
                Yearly <span>Save</span>
              </button>
            </div>
          </div>

          <div
            className={`pricing-cards pricing-cards-${selectedPlans.length}`}
          >
            {selectedPlans.map((plan) => {
              const price = yearly
                ? plan.yearlyPrice
                : plan.monthlyPrice;

              const isFree = price === 0;

              return (
                <article
                  key={plan.name}
                  className={`pricing-card ${
                    plan.popular ? "pricing-card-popular" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="pricing-popular-label">
                      <Gem size={14} />
                      MOST POPULAR
                    </div>
                  )}

                  <div className="pricing-card-top">
                    <div
                      className={`pricing-plan-icon ${
                        plan.premium ? "premium" : ""
                      }`}
                    >
                      {plan.premium ? (
                        <Crown size={22} />
                      ) : (
                        <Zap size={22} />
                      )}
                    </div>

                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                  </div>

                  <div className="pricing-price">
                    <strong>{formatPrice(price)}</strong>

                    {!isFree && (
                      <span> / {yearly ? "year" : "month"}</span>
                    )}
                  </div>

                  {yearly && !isFree && (
                    <div className="pricing-yearly-note">
                      Equivalent to{" "}
                      {formatPrice(Math.round(price / 12))} per month
                    </div>
                  )}

                  <Link
                    href="/register"
                    className={
                      plan.popular
                        ? "pricing-cta pricing-cta-primary"
                        : "pricing-cta pricing-cta-secondary"
                    }
                  >
                    {isFree ? "Get started for free" : "Choose this plan"}
                    <ArrowRight size={17} />
                  </Link>

                  <div className="pricing-features-heading">
                    What's included
                  </div>

                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span>
                          <Check size={14} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <div className="pricing-note">
            <ShieldCheck size={20} />
            <p>
              <strong>Fair access is part of our promise.</strong>
              Job seekers can continue browsing and applying for opportunities
              with a free Abi Job account. Premium features are optional.
            </p>
          </div>
        </div>
      </section>

      <section className="pricing-faq-section">
        <div className="pricing-container">
          <div className="pricing-section-heading">
            <span className="pricing-eyebrow">GOOD TO KNOW</span>
            <h2>Questions about our plans?</h2>
          </div>

          <div className="pricing-faq-grid">
            <article>
              <h3>Can I use Abi Job for free?</h3>
              <p>
                Yes. Job seekers and skilled professionals can start with
                free accounts. Employers can choose a recruitment plan that
                suits their hiring needs.
              </p>
            </article>

            <article>
              <h3>Do I need Premium to apply for jobs?</h3>
              <p>
                No. Applying for jobs remains free. Premium plans offer
                additional career tools, not access to basic applications.
              </p>
            </article>

            <article>
              <h3>Can I change my plan later?</h3>
              <p>
                Our planned subscription system will allow users to upgrade,
                downgrade or cancel according to the terms of their plan.
              </p>
            </article>

            <article>
              <h3>How will payments work?</h3>
              <p>
                We plan to support trusted Nigerian payment methods. Payments
                will be verified securely before premium features are
                activated.
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