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
  accountRole: string;
  billingInterval: string | null;
  status: string;
  trial: {
    startedAt: string | null;
    endsAt: string | null;
    isActive: boolean;
  };
  paidPeriod: {
    startedAt: string | null;
    endsAt: string | null;
    isActive: boolean;
    isScheduled: boolean;
  };
  cancelAtPeriodEnd: boolean;
};

type SubscriptionResponse = {
  success?: boolean;
  hasSubscription?: boolean;
  hasAccess?: boolean;
  hasPlatformAccess?: boolean;
  subscription: Subscription | null;
  access?: {
    hasAccess?: boolean;
    hasPlatformAccess?: boolean;
    isTrialActive?: boolean;
    isPaidSubscriptionActive?: boolean;
    hasScheduledPaidPeriod?: boolean;
  };
  error?: string;
  message?: string;
};

type CancellationResponse = {
  success?: boolean;
  alreadyScheduled?: boolean;
  automaticRecurringBilling?: boolean;
  message?: string;
  error?: string;
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
  isPaidActive: boolean,
  hasScheduledPaidPeriod: boolean,
  hasAccess: boolean
) {
  if (!subscription) return "No subscription found";

  if (
    subscription.cancelAtPeriodEnd &&
    (isTrialActive || isPaidActive || hasScheduledPaidPeriod)
  ) {
    return "Membership not renewing";
  }

  if (isTrialActive) return "Free trial active";
  if (isPaidActive) return "Paid membership active";
  if (hasScheduledPaidPeriod) return "Paid membership scheduled";
  if (hasAccess) return "Platform access active";

  return subscription.status.replace(/_/g, " ");
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      "The server returned an invalid response. Please try again."
    );
  }
}

export default function ManageSubscriptionPage() {
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [hasAccess, setHasAccess] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isPaidActive, setIsPaidActive] = useState(false);
  const [hasScheduledPaidPeriod, setHasScheduledPaidPeriod] =
    useState(false);

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
        headers: {
          Accept: "application/json",
        },
      });

      const data = await readJson<SubscriptionResponse>(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load your subscription information."
        );
      }

      const currentSubscription = data.subscription ?? null;

      const trialActive = Boolean(
        currentSubscription?.trial?.isActive ??
          data.access?.isTrialActive
      );

      const paidActive = Boolean(
        currentSubscription?.paidPeriod?.isActive ??
          data.access?.isPaidSubscriptionActive
      );

      const scheduledPaidPeriod = Boolean(
        currentSubscription?.paidPeriod?.isScheduled ??
          data.access?.hasScheduledPaidPeriod
      );

      const platformAccess = Boolean(
        data.hasAccess ??
          data.hasPlatformAccess ??
          data.access?.hasAccess ??
          data.access?.hasPlatformAccess ??
          false
      );

      setSubscription(currentSubscription);
      setIsTrialActive(trialActive);
      setIsPaidActive(paidActive);
      setHasScheduledPaidPeriod(scheduledPaidPeriod);
      setHasAccess(platformAccess);
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
    void loadSubscription();
  }, [loadSubscription]);

  async function handleCancellation() {
    if (!subscription || cancelling) return;

    const confirmed = window.confirm(
      "Are you sure you want to mark this membership as not renewing? Your current trial and any already-purchased paid access will continue until their applicable expiry dates. Abi Job does not automatically charge recurring subscription payments."
    );

    if (!confirmed) return;

    setCancelling(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/subscription/status/cancel",
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readJson<CancellationResponse>(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "We could not update your subscription."
        );
      }

      setNotice(
        data.message ||
          "Your membership has been marked as not renewing."
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
    isPaidActive,
    hasScheduledPaidPeriod,
    hasAccess
  );

  const accessEndDate = (() => {
    if (!subscription) return null;

    if (isTrialActive && hasScheduledPaidPeriod) {
      return subscription.paidPeriod.endsAt;
    }

    if (isTrialActive) {
      return subscription.trial.endsAt;
    }

    if (isPaidActive || hasScheduledPaidPeriod) {
      return subscription.paidPeriod.endsAt;
    }

    return subscription.trial.endsAt;
  })();

  const canCancel =
    subscription !== null &&
    ["active", "trialing"].includes(subscription.status) &&
    (isTrialActive || isPaidActive || hasScheduledPaidPeriod) &&
    !subscription.cancelAtPeriodEnd;

  const billingLabel = isTrialActive
    ? "Trial period"
    : getBillingLabel(subscription?.billingInterval);

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
                onClick={() => void loadSubscription()}
                disabled={loading}
                className="manage-billing-button"
                style={{ border: "none", cursor: "pointer" }}
              >
                Try again
                <RefreshCw size={16} />
              </button>
            </div>
          ) : !subscription ? (
            <p className="manage-status-description">
              No subscription record was found for your account. You can
              review the available membership plans and choose one when
              you are ready.
            </p>
          ) : (
            <>
              <p className="manage-status-description">
                {subscription.cancelAtPeriodEnd
                  ? isTrialActive && hasScheduledPaidPeriod
                    ? "Your membership is marked not to renew. Your current trial and already-purchased paid period remain available until their applicable expiry dates."
                    : isTrialActive
                      ? "Your membership is marked not to renew. Your free trial remains available until its expiry date."
                      : "Your membership is marked not to renew. Your existing paid access remains available until its expiry date."
                  : isTrialActive && hasScheduledPaidPeriod
                    ? "Your free trial is active. An already-purchased paid period is scheduled to begin afterward."
                    : isTrialActive
                      ? "Your free trial is currently active. Your access continues until the trial expiry date shown below."
                      : isPaidActive
                        ? "Your paid membership is active. Your current paid access continues until the displayed expiry date."
                        : hasScheduledPaidPeriod
                          ? "Your paid membership has been scheduled and will begin after the current trial period."
                          : hasAccess
                            ? "Your account currently has platform access. Review the dates and membership information below."
                            : "Your membership is not currently active. Review the available plans to restore access."}
              </p>

              <div className="manage-status-divider" />

              <div className="manage-status-details">
                <div>
                  <span>Account category</span>
                  <strong>
                    {getRoleLabel(subscription.accountRole)}
                  </strong>
                </div>

                <div>
                  <span>Billing cycle</span>
                  <strong>{billingLabel}</strong>
                </div>

                <div>
                  <span>
                    {subscription.cancelAtPeriodEnd
                      ? "Access ends"
                      : isTrialActive && hasScheduledPaidPeriod
                        ? "Paid period ends"
                        : isTrialActive
                          ? "Trial ends"
                          : "Current period ends"}
                  </span>
                  <strong>{formatDate(accessEndDate)}</strong>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <p className="manage-status-description">
                  Your membership is marked not to renew. You can
                  purchase another membership plan before your current
                  access expires.
                </p>
              )}
            </>
          )}
        </div>

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
          <Link href="/subscription" className="manage-tool-card">
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

          <Link href="/subscription" className="manage-tool-card">
            <div className="manage-tool-icon purple">
              <RefreshCw size={23} />
            </div>

            <span className="manage-tool-arrow">
              <ArrowRight size={18} />
            </span>

            <h3>
              {isPaidActive || isTrialActive
                ? "Review membership plans"
                : "Choose a membership plan"}
            </h3>

            <p>
              Review available membership options and proceed to
              secure payment when you are ready.
            </p>

            <span className="manage-tool-link">
              Continue
              <ArrowRight size={15} />
            </span>
          </Link>
        </div>

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

                <h2>Manage membership renewal</h2>
              </div>
            </div>

            <p className="manage-billing-note">
              {isTrialActive && hasScheduledPaidPeriod
                ? "You can mark your membership as not renewing. Your current free trial and already-purchased paid period will remain available until their applicable expiry dates."
                : isTrialActive
                  ? `You can mark your free trial membership as not renewing. Your trial access will remain available until ${formatDate(subscription?.trial?.endsAt)}.`
                  : `You can mark your paid membership as not renewing. Your existing access will remain available until ${formatDate(subscription?.paidPeriod?.endsAt)}.`}{" "}
              Abi Job does not automatically charge recurring
              subscription payments.
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
                  Mark membership not to renew
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        )}

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

              <strong>
                {"\u20A6"}2,000
              </strong>

              <span>Every month</span>
            </div>

            <div className="manage-billing-option featured">
              <span className="billing-option-label">
                ANNUAL MEMBERSHIP
              </span>

              <strong>
                {"\u20A6"}20,160
              </strong>

              <span>Every year</span>

              <small>
                Save 16% — {"\u20A6"}3,840 annually
              </small>
            </div>
          </div>

          <p className="manage-billing-note">
            A 30-day free trial may be available to eligible accounts.
            The trial is optional: you can choose a paid membership
            immediately instead. Monthly membership costs {"\u20A6"}2,000,
            while annual membership costs {"\u20A6"}20,160. Your selected
            payment is processed through Paystack.
          </p>

          <Link
            href="/subscription"
            className="manage-billing-button"
          >
            Review membership pricing
            <ArrowRight size={17} />
          </Link>
        </div>

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