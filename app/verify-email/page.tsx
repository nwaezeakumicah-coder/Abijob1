
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MailCheck,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Mail,
} from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./verify-email.css";

const RESEND_COOLDOWN = 120;

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isSending, setIsSending] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get("email");

    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }

    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setInterval(() => {
      setCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const formattedCountdown = `${String(
    Math.floor(countdown / 60)
  ).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`;

  async function handleResend() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setMessageType("error");
      setMessage("Please enter the email address you used to register.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (isSending || countdown > 0) return;

    setIsSending(true);
    setMessage("");
    setMessageType("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        throw error;
      }

      setCountdown(RESEND_COOLDOWN);
      setMessageType("success");
      setMessage(
        "A new verification email has been requested. Please check your inbox and spam folder."
      );
    } catch (error) {
      console.error("Verification email error:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not resend your verification email. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="verify-page">
      <section className="verify-layout">
        <div className="verify-welcome">
          <div className="verify-logo">
            <Logo />
          </div>

          <div className="verify-welcome-content">
            <span className="verify-eyebrow">
              <ShieldCheck size={16} />
              YOUR ACCOUNT, YOUR OPPORTUNITY
            </span>

            <h1>
              One more step.
              <br />
              Then you're in.
            </h1>

            <p>
              We're building a trusted community where opportunities connect
              with talent. Verifying your email helps keep your Abi Job
              account secure.
            </p>

            <div className="verify-benefit">
              <div className="verify-benefit-icon">
                <ShieldCheck size={21} />
              </div>
              <div>
                <strong>A safer community</strong>
                <span>Help us protect your account and information.</span>
              </div>
            </div>

            <div className="verify-benefit">
              <div className="verify-benefit-icon">
                <MailCheck size={21} />
              </div>
              <div>
                <strong>Stay connected</strong>
                <span>Receive important account and opportunity updates.</span>
              </div>
            </div>
          </div>

          <div className="verify-welcome-footer">
            ABIA'S PEOPLE. ABIA'S POSSIBILITIES.
          </div>
        </div>

        <div className="verify-form-side">
          <div className="verify-card">
            <div className="verify-icon">
              <Mail size={34} />
            </div>

            <span className="verify-card-label">EMAIL CONFIRMATION</span>

            <h2>Check your inbox</h2>

            <p className="verify-description">
              Your next step is to verify the email address you used to create
              your Abi Job account.
            </p>

            <div className="verify-instruction">
              <div className="verify-instruction-icon">
                <MailCheck size={23} />
              </div>

              <div>
                <strong>Look out for a verification email</strong>
                <p>
                  Supabase will send you a message containing a secure
                  verification link.
                </p>
              </div>
            </div>

            <div className="verify-steps">
              <div className="verify-step">
                <span>1</span>
                <p>Open your email inbox.</p>
              </div>

              <div className="verify-step">
                <span>2</span>
                <p>Find the Abi Job verification message.</p>
              </div>

              <div className="verify-step">
                <span>3</span>
                <p>Follow the verification link to confirm your account.</p>
              </div>
            </div>

            <div className="verify-email-field">
              <label htmlFor="verification-email">
                Email address
              </label>

              <input
                id="verification-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                  setMessageType("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSending}
                required
              />
            </div>

            {message && (
              <div
                className={`verify-message ${
                  messageType === "success"
                    ? "verify-message-success"
                    : "verify-message-error"
                }`}
                role={messageType === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <button
              type="button"
              className="verify-resend-button"
              onClick={handleResend}
              disabled={isSending || countdown > 0}
            >
              <RefreshCw
                size={17}
                className={isSending ? "verify-spinning" : ""}
              />

              {isSending
                ? "Sending verification email..."
                : countdown > 0
                  ? `Resend available in ${formattedCountdown}`
                  : "Resend verification email"}
            </button>

            <p className="verify-help">
              {countdown > 0
                ? "Please wait for the countdown before requesting another email."
                : "Can't find the email? Check your spam or junk folder."}
            </p>

            <div className="verify-divider">
              <span />
              <small>OR</small>
              <span />
            </div>

            <Link href="/login" className="verify-login-link">
              <ArrowLeft size={17} />
              Return to login
            </Link>

            <p className="verify-register">
              Haven't created an account?{" "}
              <Link href="/register">Create an account</Link>
            </p>
          </div>

          <p className="verify-bottom-note">
            © {currentYear ?? ""} Abi Job. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}
