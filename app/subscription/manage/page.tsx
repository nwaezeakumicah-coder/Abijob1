
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  History,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CircleHelp,
  Crown,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

import "./manage.css";

type Subscription = {
  id: string;
  account_role: string;
  billing_interval: string | null;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

type SubscriptionResponse = {
  subscription: Subscription | null;
  hasAccess?: boolean;
  hasPlatformAccess?: boolean;
  isTrialActive?: boolean;
  isPaidActive?: boolean;
  access?: {
    hasAccess?: boolean;
  };
  error?: string;
  message?: string;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRoleLabel(role: string | undefined) {
  switch (role) {
    case "job_seeker":
      return "Job Seeker";
    case "professional":
      return "Skilled Professionals & Artisans";
    case "employer":
      return "Employer";
    default:
      return "Not available";
  }
}

function getBillingLabel(interval: string | null | undefined) {
  if (interval === "monthly") return "Monthly";
  if (interval === "yearly") return "Annual";
  return "Not available";
}

function getStatusLabel(
  subscription: Subscription | null,
  isTrialActive: boolean,
  isPaidActive: boolean
) {
  if (!subscription) return "No subscription found";

  if (subscription.cancel_at_period_end && isPaidActive) {
    return "Scheduled not to renew";
  }

  if (isTrialActive) return "Free trial active";
  if (isPaidActive) return "Paid membership active";

  return subscription.status.replace(/_/g, " ");
}

export default function ManageSubscriptionPage() {
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [hasAccess, setHasAccess] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isPaidActive, setIsPaidActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subscription/status", {
        method: "GET",
        cache: "no-store",
      });

      const data: SubscriptionResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load your subscription information."
        );
      }

      const currentSubscription = data.subscription ?? null;

      const trialActive =
        data.isTrialActive ??
        Boolean(
          currentSubscription?.trial_ends_at &&
            new Date(currentSubscription.trial_ends_at).getTime() >
              Date.now() &&
            (!currentSubscription.current_period_end ||
              new Date(currentSubscription.current_period_end).getTime() <=
                Date.now())
        );

      const paidActive =
        data.isPaidActive ??
        Boolean(
          currentSubscription?.status === "active" &&
            currentSubscription.current_period_end &&
            new Date(currentSubscription.current_period_end).getTime() >
              Date.now() &&
            !trialActive
        );

      // FIX: Parentheses prevent mixing ?? and || syntax incorrectly.
      const platformAccess =
        data.hasAccess ??
        data.hasPlatformAccess ??
        data.access?.hasAccess ??
        (trialActive || paidActive);

      setSubscription(currentSubscription);
      setIsTrialActive(trialActive);
      setIsPaidActive(paidActive);
      setHasAccess(Boolean(platformAccess));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your subscription."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  async function handleCancellation() {
    const confirmed = window.confirm(
      "Are you sure you want to schedule your subscription not to renew? You will keep your paid access until the current period expires."
    );

    if (!confirmed) return;

    setCancelling(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "We could not update your subscription."
        );
      }

      setNotice(
        data.message ||
          "Your subscription has been scheduled not to renew."
      );

      await loadSubscription();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  }

  const statusLabel = getStatusLabel(
    subscription,
    isTrialActive,
    isPaidActive
  );

  const accessEndDate = isTrialActive
    ? subscription?.trial_ends_at
    : subscription?.current_period_end;

  const canCancel =
    isPaidActive &&
    subscription !== null &&
    !subscription.cancel_at_period_end;

  return (
    <main className="manage-subscription-page">
      <Header />

      <section className="manage-hero">
        <div className="manage-hero-content">
          <Link href="/subscription" className="manage-back-link">
            <ArrowLeft size={16} />
            Back to membership plans
          </Link>

          <span className="manage-eyebrow">
            <Sparkles size={15} />
            MEMBERSHIP MANAGEMENT
          </span>

          <h1>
            Manage your
            <span> subscription.</span>
          </h1>

          <p>
            Review your membership information, understand your billing
            options and keep track of your Abi Job subscription.
          </p>
        </div>

        <div className="manage-hero-icon">
          <Crown size={48} />
        </div>
      </section>

      <section className="manage-content">
        {/* SUBSCRIPTION STATUS */}
        <div className="manage-status-card">
          <div className="manage-status-top">
            <div className="manage-status-heading">
              <div className="manage-status-icon">
                <BadgeCheck size={24} />
              </div>

              <div>
                <span className="manage-card-label">
                  SUBSCRIPTION STATUS
                </span>

                <h2>
                  {loading ? "Loading membership..." : statusLabel}
                </h2>
              </div>
            </div>

            <span className="manage-status-badge">
              {loading ? "Please wait" : statusLabel}
            </span>
          </div>

          {loading ? (
            <p className="manage-status-description">
              Retrieving your subscription information...
            </p>
          ) : error && !subscription ? (
            <div>
              <p className="manage-status-description">{error}</p>

              <button
                type="button"
                onClick={loadSubscription}
                className="manage-billing-button"
                style={{ border: "none", cursor: "pointer" }}
              >
                Try again
                <RefreshCw size={16} />
              </button>
            </div>
          ) : !subscription ? (
            <p className="manage-status-description">
              No subscription record was found for your account. Your
              membership information will appear here once your account
              has been registered and your subscription has been created.
            </p>
          ) : (
            <>
              <p className="manage-status-description">
                {isTrialActive
                  ? "Your 30-day free trial is active. You currently have access to 100% of Abi Job platform benefits."
                  : isPaidActive && subscription.cancel_at_period_end
                  ? "Your membership is scheduled not to renew. You will retain access until your current paid period expires."
                  : isPaidActive
                  ? "Your paid membership is active. You can continue using the platform until your current paid period expires."
                  : hasAccess
                  ? "Your account currently has platform access. Review the details below for your membership period."
                  : "Your membership is not currently active. Choose a membership plan to continue accessing Abi Job."}
              </p>

              <div className="manage-status-divider" />

              <div className="manage-status-details">
                <div>
                  <span>Account category</span>
                  <strong>
                    {getRoleLabel(subscription.account_role)}
                  </strong>
                </div>

                <div>
                  <span>Billing cycle</span>
                  <strong>
                    {isTrialActive
                      ? "30-day free trial"
                      : getBillingLabel(subscription.billing_interval)}
                  </strong>
                </div>

                <div>
                  <span>
                    {subscription.cancel_at_period_end
                      ? "Access ends"
                      : isTrialActive
                      ? "Trial ends"
                      : "Current period ends"}
                  </span>
                  <strong>{formatDate(accessEndDate)}</strong>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <p className="manage-status-description">
                  Your subscription will not renew automatically. You can
                  choose a new plan before your access expires.
                </p>
              )}
            </>
          )}
        </div>

        {/* NOTICES AND ERRORS */}
        {notice && (
          <div
            role="status"
            style={{
              marginTop: "18px",
              padding: "16px 20px",
              borderRadius: "12px",
              background: "#e7f2e9",
              color: "#176b45",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <BadgeCheck size={20} />
            <span>{notice}</span>
          </div>
        )}

        {error && subscription && (
          <div
            role="alert"
            style={{
              marginTop: "18px",
              padding: "16px 20px",
              borderRadius: "12px",
              background: "#fff0ed",
              color: "#a12d20",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* MEMBERSHIP ACTIONS */}
        <div className="manage-section-heading">
          <span className="manage-section-kicker">
            YOUR MEMBERSHIP
          </span>

          <h2>Subscription tools</h2>

          <p>
            Everything you need to review and manage your membership.
          </p>
        </div>

        <div className="manage-tools-grid">
          <Link
            href="/subscription"
            className="manage-tool-card"
          >
            <div className="manage-tool-icon green">
              <CreditCard size={23} />
            </div>

            <span className="manage-tool-arrow">
              <ArrowRight size={18} />
            </span>

            <h3>View membership plans</h3>

            <p>
              Compare monthly and annual membership options and
              choose the plan that suits your account.
            </p>

            <span className="manage-tool-link">
              Explore plans
              <ArrowRight size={15} />
            </span>
          </Link>

          <Link
            href="/subscription/history"
            className="manage-tool-card"
          >
            <div className="manage-tool-icon orange">
              <History size={23} />
            </div>

            <span className="manage-tool-arrow">
              <ArrowRight size={18} />
            </span>

            <h3>Payment history</h3>

            <p>
              Review your subscription payments, transaction
              references and payment records.
            </p>

            <span className="manage-tool-link">
              View payment history
              <ArrowRight size={15} />
            </span>
          </Link>

          <Link
            href="/subscription/checkout"
            className="manage-tool-card"
          >
            <div className="manage-tool-icon purple">
              <RefreshCw size={23} />
            </div>

            <span className="manage-tool-arrow">
              <ArrowRight size={18} />
            </span>

            <h3>
              {isPaidActive || isTrialActive
                ? "Choose another plan"
                : "Continue to checkout"}
            </h3>

            <p>
              Review the available membership options and proceed
              to secure payment when you are ready.
            </p>

            <span className="manage-tool-link">
              Continue
              <ArrowRight size={15} />
            </span>
          </Link>
        </div>

        {/* CANCELLATION */}
        {canCancel && (
          <div className="manage-billing-card">
            <div className="manage-billing-heading">
              <div className="manage-billing-icon">
                <RefreshCw size={22} />
              </div>

              <div>
                <span className="manage-section-kicker">
                  MEMBERSHIP CONTROL
                </span>

                <h2>Manage subscription renewal</h2>
              </div>
            </div>

            <p className="manage-billing-note">
              You can schedule your current paid membership not to
              renew. Your platform access will remain available until{" "}
              {formatDate(subscription?.current_period_end)}.
            </p>

            <button
              type="button"
              onClick={handleCancellation}
              disabled={cancelling}
              className="manage-billing-button"
              style={{
                border: "none",
                cursor: cancelling ? "not-allowed" : "pointer",
                opacity: cancelling ? 0.65 : 1,
              }}
            >
              {cancelling ? (
                <>
                  <LoaderCircle size={17} />
                  Processing...
                </>
              ) : (
                <>
                  Schedule non-renewal
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        )}

        {/* BILLING INFORMATION */}
        <div className="manage-billing-card">
          <div className="manage-billing-heading">
            <div className="manage-billing-icon">
              <CalendarDays size={22} />
            </div>

            <div>
              <span className="manage-section-kicker">
                BILLING INFORMATION
              </span>

              <h2>Understand your membership billing</h2>
            </div>
          </div>

          <div className="manage-billing-options">
            <div className="manage-billing-option">
              <span className="billing-option-label">
                MONTHLY MEMBERSHIP
              </span>

              <strong>₦2,000</strong>

              <span>Every month</span>
            </div>

            <div className="manage-billing-option featured">
              <span className="billing-option-label">
                ANNUAL MEMBERSHIP
              </span>

              <strong>₦20,160</strong>

              <span>Every year</span>

              <small>Save 16% — ₦3,840 annually</small>
            </div>
          </div>

          <p className="manage-billing-note">
            Every account category receives a 30-day free trial with
            access to 100% of Abi Job platform benefits. After the
            trial, a paid membership is required to continue accessing
            the platform. Monthly membership costs ₦2,000, while annual
            membership costs ₦20,160.
          </p>

          <Link
            href="/subscription"
            className="manage-billing-button"
          >
            Review membership pricing
            <ArrowRight size={17} />
          </Link>
        </div>

        {/* SECURITY AND SUPPORT */}
        <div className="manage-support-row">
          <div className="manage-support-icon">
            <ShieldCheck size={23} />
          </div>

          <div className="manage-support-content">
            <h3>Your account and payment security</h3>

            <p>
              Abi Job verifies Paystack transactions before activating
              paid memberships. Payment records and subscription
              information are linked to your authenticated account.
            </p>
          </div>
        </div>

        <div className="manage-help-card">
          <div className="manage-help-icon">
            <CircleHelp size={23} />
          </div>

          <div>
            <h3>Need help with your membership?</h3>

            <p>
              Contact the Abi Job team if you have questions about
              subscription plans or payment arrangements.
            </p>
          </div>

          <Link href="/contact">
            Contact support
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
