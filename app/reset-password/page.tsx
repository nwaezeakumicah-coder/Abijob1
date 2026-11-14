
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import "./reset-password.css";

type RecoveryStatus = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info">("info");
  const [recoveryStatus, setRecoveryStatus] =
    useState<RecoveryStatus>("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function verifyRecoveryLink() {
      setCurrentYear(new Date().getFullYear());

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const urlError = params.get("error");

      if (urlError) {
        if (active) setRecoveryStatus("invalid");
        return;
      }

      // A normal signed-in session is not proof of a password-recovery
      // request. Only a successfully exchanged, one-time recovery credential
      // may authorize this page to change a password.
      let recoverySession = false;
      let verificationError: Error | null = null;

      if (code) {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          verificationError = error;
        } else {
          recoverySession = Boolean(data.session);
        }
      } else if (tokenHash && type === "recovery") {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (error) {
          verificationError = error;
        } else {
          recoverySession = Boolean(data.session);
        }
      } else {
        if (active) setRecoveryStatus("invalid");
        return;
      }

      if (!active) return;

      if (recoverySession) {
        setRecoveryStatus("ready");

        // Remove the one-time credential from the address bar.
        window.history.replaceState(null, "", "/reset-password");
        return;
      }

      console.error(
        "Password recovery verification failed:",
        verificationError?.message || "No recovery session was issued."
      );

      setRecoveryStatus("invalid");
    }

    void verifyRecoveryLink();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    if (recoveryStatus !== "ready") {
      setMessage(
        "Your password reset link is not valid. Please request a new one."
      );
      setMessageType("error");
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match. Please try again.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setPasswordUpdated(true);
      setMessage("Your password has been updated successfully.");
      setMessageType("info");

      // Revoke all sessions after a password reset so an older stolen
      // session cannot remain usable after the credential has changed.
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "global",
      });

      if (signOutError) {
        // The password has already changed. Keep the success state truthful
        // while recording that global session revocation needs investigation.
        console.error("Global session revocation after password reset failed:", signOutError);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not update your password. Please try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="reset-page">
      <section className="reset-layout">
        <div className="reset-welcome">
          <div className="reset-logo">
            <Logo />
          </div>

          <div className="reset-welcome-content">
            <span className="reset-eyebrow">
              <ShieldCheck size={16} />
              ACCOUNT SECURITY
            </span>

            <h1>
              A fresh start.
              <br />
              A stronger password.
            </h1>

            <p>
              Your account deserves protection. Create a strong password to
              keep your personal information and opportunities secure.
            </p>

            <div className="reset-security-note">
              <div className="reset-security-icon">
                <LockKeyhole size={22} />
              </div>

              <div>
                <strong>Keep your account protected</strong>
                <span>
                  Choose a password that is difficult for others to guess.
                </span>
              </div>
            </div>

            <div className="reset-security-note">
              <div className="reset-security-icon">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <strong>You're almost there</strong>
                <span>
                  Complete this step to continue your Abijob journey.
                </span>
              </div>
            </div>
          </div>

          <div className="reset-welcome-footer">
            ABIA'S PEOPLE. ABIA'S POSSIBILITIES.
          </div>
        </div>

        <div className="reset-form-side">
          <div className="reset-card">
            <div className="reset-icon">
              <LockKeyhole size={32} />
            </div>

            {recoveryStatus === "checking" ? (
              <div className="reset-form-heading">
                <span className="reset-card-label">
                  PASSWORD RECOVERY
                </span>

                <h2>Checking your link...</h2>

                <p className="reset-description">
                  Please wait while we verify your password recovery link.
                </p>
              </div>
            ) : recoveryStatus === "invalid" ? (
              <div className="reset-form-heading">
                <span className="reset-card-label">
                  PASSWORD RECOVERY
                </span>

                <h2>Reset link unavailable</h2>

                <p className="reset-description">
                  This password reset link may have expired, already been
                  used, or could not be verified. Request a new link to continue.
                </p>

                <Link
                  href="/forgot-password"
                  className="reset-submit-button"
                >
                  Request a new reset link
                </Link>

                <Link href="/login" className="reset-back-link">
                  <ArrowLeft size={17} />
                  Back to login
                </Link>
              </div>
            ) : passwordUpdated ? (
              <div className="reset-success">
                <div className="reset-icon">
                  <CheckCircle2 size={32} />
                </div>

                <span className="reset-card-label">
                  PASSWORD UPDATED
                </span>

                <h2>Your account is secure.</h2>

                <p className="reset-description">
                  Your password has been changed successfully. You can now
                  sign in using your new password.
                </p>

                <Link
                  href="/login"
                  className="reset-submit-button"
                >
                  Continue to login
                </Link>
              </div>
            ) : (
              <>
                <span className="reset-card-label">
                  PASSWORD RECOVERY
                </span>

                <h2>Reset your password</h2>

                <p className="reset-description">
                  Enter your new password below. Make sure it is strong and
                  easy for you to remember.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="reset-field">
                    <label htmlFor="new-password">
                      New password
                    </label>

                    <div className="reset-input-wrap">
                      <LockKeyhole
                        size={18}
                        className="reset-input-icon"
                      />

                      <input
                        id="new-password"
                        name="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setMessage("");
                        }}
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />

                      <button
                        type="button"
                        className="reset-eye-button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <small>Use at least 8 characters.</small>
                  </div>

                  <div className="reset-field">
                    <label htmlFor="confirm-password">
                      Confirm new password
                    </label>

                    <div className="reset-input-wrap">
                      <LockKeyhole
                        size={18}
                        className="reset-input-icon"
                      />

                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setMessage("");
                        }}
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />

                      <button
                        type="button"
                        className="reset-eye-button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="reset-password-rules">
                    <strong>Password requirements</strong>

                    <p>
                      <CheckCircle2 size={15} />
                      At least 8 characters
                    </p>

                    <p>
                      <CheckCircle2 size={15} />
                      Both password fields must match
                    </p>
                  </div>

                  {message && (
                    <div
                      className={`reset-message reset-message-${messageType}`}
                      role="alert"
                      aria-live="polite"
                    >
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="reset-submit-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating password..." : "Reset password"}
                  </button>
                </form>

                <Link href="/login" className="reset-back-link">
                  <ArrowLeft size={17} />
                  Back to login
                </Link>

                <p className="reset-register">
                  Need an account?{" "}
                  <Link href="/register">Create one</Link>
                </p>
              </>
            )}
          </div>

          <p className="reset-bottom-note">
            © {currentYear ?? ""} Abijob. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}
