
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ReceiptText,
  LayoutDashboard,
  Crown,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

import "./success.css";

type VerificationStatus =
  | "verifying"
  | "success"
  | "failed";

export default function SubscriptionSuccessPage() {
  const [status, setStatus] =
    useState<VerificationStatus>("verifying");

  const [message, setMessage] = useState(
    "We're confirming your payment with Paystack. Please wait."
  );

  const [reference, setReference] = useState("");

  const verificationStarted = useRef(false);

  const verifyPayment = useCallback(async (paymentReference: string) => {
    if (!paymentReference) {
      setStatus("failed");
      setMessage(
        "No payment reference was found. Please check your payment history or contact support."
      );
      return;
    }

    setStatus("verifying");
    setMessage(
      "We're confirming your payment with Paystack. Please wait."
    );

    try {
      const response = await fetch(
        "/api/payments/paystack/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reference: paymentReference,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "We could not confirm your payment yet."
        );
      }

      setStatus("success");
      setMessage(
        "Your payment has been successfully verified and your Abi Job subscription is now active."
      );
    } catch (error) {
      console.error("Payment verification failed:", error);

      setStatus("failed");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not verify your payment. Please try again."
      );
    }
  }, []);

  useEffect(() => {
    const parameters = new URLSearchParams(
      window.location.search
    );

    const paymentReference =
      parameters.get("reference") ||
      parameters.get("trxref") ||
      "";

    setReference(paymentReference);

    if (verificationStarted.current) return;

    verificationStarted.current = true;

    verifyPayment(paymentReference);
  }, [verifyPayment]);

  return (
    <main className="subscription-success-page">
      <Header />

      <section className="success-main">
        <div className="success-card">
          <div className="success-icon">
            {status === "verifying" && (
              <LoaderCircle
                size={54}
                strokeWidth={1.7}
                className="animate-spin"
              />
            )}

            {status === "success" && (
              <CheckCircle2
                size={54}
                strokeWidth={1.7}
              />
            )}

            {status === "failed" && (
              <AlertCircle
                size={54}
                strokeWidth={1.7}
              />
            )}
          </div>

          <span className="success-eyebrow">
            ABI JOB MEMBERSHIP
          </span>

          <h1>
            {status === "verifying" && (
              <>
                Confirming your
                <span> payment...</span>
              </>
            )}

            {status === "success" && (
              <>
                You're one step closer to your next
                <span> opportunity!</span>
              </>
            )}

            {status === "failed" && (
              <>
                Payment verification
                <span> unsuccessful</span>
              </>
            )}
          </h1>

          <p className="success-description">
            {message}
          </p>

          <div className="success-status">
            <div className="success-status-icon">
              {status === "verifying" && (
                <LoaderCircle
                  size={21}
                  className="animate-spin"
                />
              )}

              {status === "success" && (
                <ShieldCheck size={21} />
              )}

              {status === "failed" && (
                <AlertCircle size={21} />
              )}
            </div>

            <div>
              <strong>
                {status === "verifying" &&
                  "Payment verification in progress"}

                {status === "success" &&
                  "Payment successfully verified"}

                {status === "failed" &&
                  "Payment confirmation needs attention"}
              </strong>

              <span>
                {status === "verifying" &&
                  "Please keep this page open while we confirm your transaction."}

                {status === "success" &&
                  "Your subscription has been activated in Abi Job."}

                {status === "failed" &&
                  "Your subscription has not been activated by this verification attempt. You can retry below."}
              </span>
            </div>
          </div>

          {reference && (
            <div className="success-status">
              <div className="success-status-icon">
                <ReceiptText size={20} />
              </div>

              <div>
                <strong>Payment reference</strong>
                <span>{reference}</span>
              </div>
            </div>
          )}

          <div className="success-benefits">
            <h2>
              <Crown size={19} />
              What's next?
            </h2>

            <div className="success-benefit">
              <span className="success-benefit-number">
                01
              </span>

              <div>
                <strong>Payment confirmation</strong>
                <p>
                  Your payment is checked securely with
                  Paystack before membership activation.
                </p>
              </div>
            </div>

            <div className="success-benefit">
              <span className="success-benefit-number">
                02
              </span>

              <div>
                <strong>Membership activation</strong>
                <p>
                  Once verified, your selected subscription
                  benefits become available.
                </p>
              </div>
            </div>

            <div className="success-benefit">
              <span className="success-benefit-number">
                03
              </span>

              <div>
                <strong>Explore Abi Job</strong>
                <p>
                  Start discovering opportunities and using
                  the features available to your account.
                </p>
              </div>
            </div>
          </div>

          <div className="success-actions">
            {status === "success" && (
              <Link
                href="/dashboard"
                className="success-primary-btn"
              >
                Go to dashboard
                <ArrowRight size={18} />
              </Link>
            )}

            {status === "verifying" && (
              <button
                type="button"
                className="success-primary-btn"
                disabled
              >
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Verifying payment...
              </button>
            )}

            {status === "failed" && (
              <button
                type="button"
                className="success-primary-btn"
                onClick={() => verifyPayment(reference)}
              >
                Retry verification
                <RefreshCw size={18} />
              </button>
            )}

            <Link
              href="/subscription/history"
              className="success-secondary-btn"
            >
              <ReceiptText size={17} />
              View payment history
            </Link>
          </div>

          <div className="success-footer-note">
            <ShieldCheck size={16} />

            <span>
              Your membership and payment records are
              securely managed in your Abi Job account.
            </span>
          </div>
        </div>

        <div className="success-bottom-link">
          <LayoutDashboard size={17} />
          Need to manage your membership?

          <Link href="/subscription/manage">
            Manage subscription
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
