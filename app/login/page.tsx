
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase/client";
import "./login.css";

const dashboardRoutes: Record<string, string> = {
  job_seeker: "/dashboard",
  professional: "/professional/dashboard",
  employer: "/employer/dashboard",
  admin: "/admin",
};

const confirmationMessages: Record<string, string> = {
  email_confirmation_failed:
    "Your email confirmation link could not be verified. It may have expired. Please request a new confirmation email.",
  invalid_confirmation_link:
    "This confirmation link is invalid. Please request a new confirmation email.",
  confirmation_session_failed:
    "Your email was confirmed, but we could not establish your login session. Please sign in manually.",
  profile_not_found:
    "We could not find a profile connected to this account. Please contact Abijob support.",
  profile_lookup_failed:
    "We could not access your account profile. Please try again. If the problem continues, contact Abijob support.",
  invalid_account_role:
    "Your account has an unrecognized role. Please contact Abijob support.",
};

const formSectionStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#17251d",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
};

const inputWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
  width: "100%",
  minHeight: "60px",
  padding: "0 17px",
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5ce",
  borderRadius: "12px",
  color: "#176b45",
  opacity: 1,
};

const inputStyle: CSSProperties = {
  flex: 1,
  width: "100%",
  minWidth: 0,
  height: "56px",
  padding: "0",
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  color: "#17251d",
  WebkitTextFillColor: "#17251d",
  fontSize: "16px",
  fontWeight: 500,
  opacity: 1,
  boxShadow: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#17251d",
  fontSize: "15px",
  fontWeight: 700,
  opacity: 1,
};

// Only allow redirects to this Abijob website.
function getSafeNextDestination(): string | null {
  const params = new URLSearchParams(window.location.search);
  const requestedNext = params.get("next");

  if (
    !requestedNext ||
    !requestedNext.startsWith("/") ||
    requestedNext.startsWith("//") ||
    requestedNext.includes("\\")
  ) {
    return null;
  }

  try {
    const destination = new URL(
      requestedNext,
      window.location.origin
    );

    if (destination.origin !== window.location.origin) {
      return null;
    }

    return (
      destination.pathname +
      destination.search +
      destination.hash
    );
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmationError = params.get("error");

    if (confirmationError && confirmationMessages[confirmationError]) {
      setMessageType("error");
      setMessage(confirmationMessages[confirmationError]);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setMessageType("error");
      setMessage("Please enter your email address and password.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error(
            "Your email address has not been verified. Please check your inbox for the verification link."
          );
        }

        throw error;
      }

      if (!data.user) {
        throw new Error("We could not verify your account. Please try again.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Abijob profile lookup failed:", {
          userId: data.user.id,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });

        throw new Error(
          `We could not access your account profile. Database error: ${
            profileError.code || "UNKNOWN"
          }. Please contact Abijob support if this continues.`
        );
      }

      if (!profile) {
        console.error("Abijob profile not found:", {
          authenticatedUserId: data.user.id,
          email: data.user.email,
        });

        await supabase.auth.signOut();

        throw new Error(
          "No Abijob profile is connected to this account. Please contact Abijob support."
        );
      }

      const dashboardDestination = dashboardRoutes[profile.role];

      if (!dashboardDestination) {
        console.error("Abijob invalid account role:", profile.role);

        await supabase.auth.signOut();

        throw new Error(
          "Your account has an unrecognized role. Please contact Abijob support."
        );
      }

      // Use the requested internal destination when it is safe.
      // Otherwise, send the user to their role-specific dashboard.
      const requestedDestination = getSafeNextDestination();
      const destination =
        requestedDestination || dashboardDestination;

      setPassword("");
      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error("Abijob login error:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while signing in. Please try again."
      );

      setIsSubmitting(false);
    }
  }

  async function handlePasskeySignIn() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPasskey();

      if (error) throw error;
      if (!data.user) {
        throw new Error("The passkey could not identify an Abijob account.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error(
          "We could not verify the account profile for this passkey. Please sign in with your password or contact support."
        );
      }

      const destination = dashboardRoutes[profile.role];
      if (!destination) {
        await supabase.auth.signOut();
        throw new Error("This account does not have a supported Abijob role.");
      }

      setPassword("");
      router.replace(getSafeNextDestination() || destination);
      router.refresh();
    } catch (cause) {
      setMessageType("error");
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Passkey sign-in failed. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  function clearMessage() {
    if (message) {
      setMessage("");
      setMessageType("");
    }
  }

  return (
    <main className="login-page">
      <style jsx global>{`
        .login-form-section {
          background: #ffffff !important;
          color: #17251d !important;
          opacity: 1 !important;
        }

        .login-form-section .login-heading h2,
        .login-form-section .login-heading p,
        .login-form-section .login-welcome,
        .login-form-section .login-field label,
        .login-form-section .login-register span,
        .login-form-section .login-security span,
        .login-form-section .login-divider p {
          color: #17251d !important;
          opacity: 1 !important;
        }

        .login-form-section .login-field {
          opacity: 1 !important;
          visibility: visible !important;
        }

        .login-form-section .login-input-wrap {
          background: #ffffff !important;
          border: 1px solid #cbd5ce !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .login-form-section .login-input-wrap input {
          color: #17251d !important;
          -webkit-text-fill-color: #17251d !important;
          background: transparent !important;
          opacity: 1 !important;
          visibility: visible !important;
          font-size: 16px !important;
          font-weight: 500 !important;
          caret-color: #176b45 !important;
        }

        .login-form-section .login-input-wrap input::placeholder {
          color: #647168 !important;
          -webkit-text-fill-color: #647168 !important;
          opacity: 1 !important;
        }

        .login-form-section .login-input-wrap input:-webkit-autofill,
        .login-form-section .login-input-wrap input:-webkit-autofill:hover,
        .login-form-section .login-input-wrap input:-webkit-autofill:focus {
          -webkit-text-fill-color: #17251d !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          caret-color: #176b45 !important;
        }

        .login-form-section .login-input-wrap > svg {
          color: #176b45 !important;
          opacity: 1 !important;
          flex-shrink: 0;
        }

        .login-form-section .login-password-toggle {
          color: #176b45 !important;
          background: transparent !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .login-form-section .login-password-label a,
        .login-form-section .login-register a,
        .login-form-section .login-back-home {
          color: #176b45 !important;
          opacity: 1 !important;
        }

        .login-form-section .login-submit {
          background: #176b45 !important;
          color: #ffffff !important;
          opacity: 1 !important;
        }

        .login-form-section .login-submit:disabled {
          background: #527b65 !important;
          color: #ffffff !important;
        }

        .login-form-section .login-message {
          opacity: 1 !important;
          visibility: visible !important;
        }

        .login-form-section .login-passkey-button {
          width: 100%;
          min-height: 54px;
          margin-top: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid #b8cbbd;
          border-radius: 12px;
          background: #f5f8f3;
          color: #176b45;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .login-form-section .login-passkey-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
      `}</style>

      <section className="login-visual">
        <div className="login-visual-pattern" />

        <div className="login-visual-top">
          <Logo href="/" size="medium" light />
        </div>

        <div className="login-visual-content">
          <span className="login-eyebrow">
            <span />
            OPPORTUNITY STARTS HERE
          </span>

          <h1>
            Your next
            <br />
            opportunity
            <br />
            <span>starts here.</span>
          </h1>

          <p>
            Connect with employers, discover opportunities, and put your
            skills in front of the people who need them.
          </p>

          <div className="login-visual-stats">
            <div>
              <strong>Discover</strong>
              <span>New opportunities</span>
            </div>

            <div>
              <strong>Connect</strong>
              <span>With the right people</span>
            </div>

            <div>
              <strong>Grow</strong>
              <span>Your career</span>
            </div>
          </div>
        </div>

        <div className="login-visual-footer">
          <ShieldCheck size={17} />
          <span>Built for the people and businesses of Abia State.</span>
        </div>
      </section>

      <section className="login-form-section" style={formSectionStyle}>
        <div
          className="login-form-wrapper"
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "35px 30px",
            color: "#17251d",
            opacity: 1,
            visibility: "visible",
          }}
        >
          <div className="login-mobile-logo">
            <Logo href="/" size="medium" />
          </div>

          <div className="login-heading">
            <span className="login-welcome">WELCOME BACK</span>
            <h2 style={{ color: "#17251d" }}>Good to see you again.</h2>
            <p style={{ color: "#526157" }}>
              Sign in to your Abijob account to continue where you left off.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            method="post"
            noValidate
          >
            <div className="login-field">
              <label htmlFor="email" style={labelStyle}>
                Email address
              </label>

              <div className="login-input-wrap" style={inputWrapStyle}>
                <Mail size={19} aria-hidden="true" color="#176b45" />

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  style={inputStyle}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearMessage();
                  }}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-password-label">
                <label htmlFor="password" style={labelStyle}>
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  style={{ color: "#176b45", fontWeight: 600 }}
                >
                  Forgot password?
                </Link>
              </div>

              <div className="login-input-wrap" style={inputWrapStyle}>
                <LockKeyhole size={19} aria-hidden="true" color="#176b45" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  style={inputStyle}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearMessage();
                  }}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#176b45",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: "5px",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`login-message ${
                  messageType === "error"
                    ? "login-message-error"
                    : "login-message-info"
                }`}
                role={messageType === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                minHeight: "58px",
                backgroundColor: "#176b45",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: 1,
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <ArrowRight size={19} />}
            </button>

            <button
              type="button"
              className="login-passkey-button"
              onClick={() => void handlePasskeySignIn()}
              disabled={isSubmitting}
              aria-label="Sign in with fingerprint, face recognition or device passkey"
            >
              <Fingerprint size={19} />
              {isSubmitting ? "Verifying passkey…" : "Sign in with fingerprint or passkey"}
            </button>
          </form>

          <div className="login-register">
            <span style={{ color: "#526157" }}>
              Don't have an account?
            </span>
            <Link href="/register" style={{ color: "#176b45" }}>
              Create an account
            </Link>
          </div>

          <div className="login-divider">
            <span />
            <p>YOUR NEXT CHAPTER BEGINS HERE</p>
            <span />
          </div>

          <Link
            href="/"
            className="login-back-home"
            style={{ color: "#176b45" }}
          >
            Back to homepage
          </Link>

          <div className="login-security">
            <ShieldCheck size={16} color="#176b45" />
            <span style={{ color: "#526157" }}>
              Your information is protected.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
