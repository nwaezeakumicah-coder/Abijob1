
"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
} from "lucide-react";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        throw error;
      }

      setEmail(trimmedEmail);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not process your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="forgot-page">
      <header className="forgot-topbar">
        <Logo size="medium" />

        <Link href="/login" className="forgot-back-link">
          <ArrowLeft size={17} />
          Back to login
        </Link>
      </header>

      <section className="forgot-layout">
        <div className="forgot-welcome">
          <span className="forgot-eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h1>
            A fresh start
            <br />
            is just one
            <br />
            step away.
          </h1>

          <p>
            Don't worry. It happens. We'll help you regain
            access to your Abijob account so you can
            continue pursuing your opportunities.
          </p>

          <div className="forgot-welcome-note">
            <span>✦</span>
            Your next opportunity is still waiting.
          </div>

          <div className="forgot-circle forgot-circle-one" />
          <div className="forgot-circle forgot-circle-two" />
        </div>

        <div className="forgot-form-card">
          {!submitted ? (
            <>
              <div className="forgot-icon">
                <Mail size={27} />
              </div>

              <div className="forgot-form-heading">
                <span>LET'S GET YOU BACK</span>
                <h2>Forgot password?</h2>
                <p>
                  Enter the email address associated with
                  your account. We'll send instructions
                  to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <label htmlFor="forgot-email">
                  Email address
                </label>

                <div className="forgot-input-wrapper">
                  <Mail size={19} />

                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrorMessage("");
                    }}
                    required
                  />
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    style={{
                      color: "#c0392b",
                      fontSize: "14px",
                      marginTop: "10px",
                    }}
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="forgot-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Sending instructions..."
                    : "Send reset instructions"}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="forgot-login-prompt">
                Remembered your password?{" "}
                <Link href="/login">Sign in</Link>
              </div>
            </>
          ) : (
            <div className="forgot-success">
              <div className="forgot-success-icon">
                <CheckCircle2 size={34} />
              </div>

              <span>REQUEST RECEIVED</span>

              <h2>Check your inbox.</h2>

              <p>
                If an Abijob account exists for{" "}
                <strong>{email}</strong>, you'll receive
                an email with instructions to reset your
                password. Please also check your spam folder.
              </p>

              <button
                type="button"
                className="forgot-submit-button"
                onClick={() => {
                  setSubmitted(false);
                  setErrorMessage("");
                }}
              >
                Try another email
              </button>

              <Link
                href="/login"
                className="forgot-return-link"
              >
                Return to login
              </Link>
            </div>
          )}
        </div>
      </section>

      <footer className="forgot-footer">
        <span>© 2026 Abijob. All rights reserved.</span>
        <span>OPPORTUNITY STARTS HERE</span>
      </footer>
    </main>
  );
}
