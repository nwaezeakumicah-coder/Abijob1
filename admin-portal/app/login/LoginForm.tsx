
"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  ShieldCheck,
  Mail,
  RefreshCw,
  ArrowRight,
  LockKeyhole,
  ArrowLeft,
  Fingerprint,
} from "lucide-react";

type LoginMode = "super_admin" | "team";
type SuperAdminStep = "email" | "code";

export default function LoginForm() {
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { experimental: { passkey: true } } }
      ),
    []
  );

  const [mode, setMode] = useState<LoginMode>("super_admin");
  const [step, setStep] = useState<SuperAdminStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error"
  );

  function showError(text: string) {
    setMessage(text);
    setMessageType("error");
  }

  function showSuccess(text: string) {
    setMessage(text);
    setMessageType("success");
  }

  async function sendSuperAdminCode(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showError("Enter your Super Admin email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        showError(
          "Unable to send the verification code. Check your email address or try again later."
        );
        return;
      }

      setEmail(normalizedEmail);
      setCode("");
      setStep("code");

      showSuccess(
        "An eight-digit verification code has been sent to your email."
      );
    } catch {
      showError(
        "Unable to send the verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const token = code.replace(/\s/g, "");

    if (!/^\d{8}$/.test(token)) {
      showError(
        "Enter the complete eight-digit code sent to your email."
      );
      return;
    }

    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "email",
      });

      if (verifyError) {
        showError(
          "The code is incorrect or has expired. Request a new code and try again."
        );
        return;
      }

      const roleResponse = await fetch("/api/auth/admin-role", {
        method: "GET",
        cache: "no-store",
      });

      if (!roleResponse.ok) {
        await supabase.auth.signOut();

        showError(
          "This account is not an active administrator."
        );
        return;
      }

      const roleResult = await roleResponse.json();

      if (roleResult.role !== "super_admin") {
        await supabase.auth.signOut();

        showError(
          "This login is reserved for the Super Admin account. Use the Administrator login instead."
        );
        return;
      }

      router.replace("/auth/complete");
      router.refresh();
    } catch {
      showError(
        "Unable to verify your code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showError("Enter your administrator email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/complete`,
        },
      });

      if (error) {
        showError(
          "Unable to send the sign-in link. Check your email address or contact the Super Admin."
        );
        return;
      }

      showSuccess(
        "Sign-in link sent. Check your email inbox and follow the link to continue."
      );
    } catch {
      showError(
        "Unable to send the sign-in link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function returnToEmailStep() {
    setLoading(true);

    try {
      await supabase.auth.signOut();
      setStep("email");
      setCode("");
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskeySignIn() {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;

      const roleResponse = await fetch("/api/auth/admin-role", {
        method: "GET",
        cache: "no-store",
      });

      if (!roleResponse.ok) {
        await supabase.auth.signOut();
        throw new Error("This passkey is not linked to an active administrator account.");
      }

      const roleResult = await roleResponse.json();
      if (!["super_admin", "admin", "moderator", "support_staff"].includes(roleResult.role)) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorised to access the Admin Portal.");
      }

      router.replace("/auth/complete");
      router.refresh();
    } catch (cause) {
      showError(
        cause instanceof Error
          ? cause.message
          : "Passkey verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: LoginMode) {
    setMode(nextMode);
    setStep("email");
    setCode("");
    setMessage("");
  }

  return (
    <div className="login-form">
      <div className="login-mode-selector">
        <button
          type="button"
          className={mode === "super_admin" ? "active" : ""}
          onClick={() => changeMode("super_admin")}
          disabled={loading}
        >
          Super Admin
        </button>

        <button
          type="button"
          className={mode === "team" ? "active" : ""}
          onClick={() => changeMode("team")}
          disabled={loading}
        >
          Administrator
        </button>
      </div>

      {mode === "super_admin" && step === "email" && (
        <form
          className="otp-verification-form"
          onSubmit={sendSuperAdminCode}
        >
          <div className="otp-header">
            <div className="otp-icon">
              <ShieldCheck size={30} strokeWidth={1.8} />
            </div>

            <span className="otp-overline">
              SUPER ADMINISTRATOR
            </span>

            <h3>Email verification</h3>

            <p>
              Enter your registered Super Admin email address.
              We will send you an eight-digit verification code.
            </p>
          </div>

          <div className="otp-input-section">
            <label htmlFor="super-admin-email">
              Email address
            </label>

            <div className="otp-email-card">
              <div className="otp-email-icon">
                <Mail size={20} />
              </div>

              <div>
                <span>REGISTERED EMAIL</span>
                <strong>Enter your administrator email below</strong>
              </div>
            </div>

            <input
              id="super-admin-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <p className="otp-input-hint">
            <LockKeyhole size={14} />
            Your email must belong to an authorised Super Admin account.
          </p>

          <button
            type="submit"
            className="login-submit-button otp-verify-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Sending verification code...
              </>
            ) : (
              <>
                Send verification code
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      )}

      {mode === "super_admin" && step === "code" && (
        <form
          className="otp-verification-form"
          onSubmit={handleVerifyCode}
        >
          <div className="otp-header">
            <div className="otp-icon">
              <Mail size={29} strokeWidth={1.8} />
            </div>

            <span className="otp-overline">
              EMAIL SECURITY CHECK
            </span>

            <h3>Verify your email</h3>

            <p>
              Enter the eight-digit verification code sent to your
              registered email address.
            </p>
          </div>

          <div className="otp-email-card">
            <div className="otp-email-icon">
              <Mail size={20} />
            </div>

            <div>
              <span>CODE SENT TO</span>
              <strong>{email}</strong>
            </div>
          </div>

          <div className="otp-input-section">
            <label htmlFor="super-admin-code">
              Eight-digit verification code
            </label>

            <input
              id="super-admin-code"
              className="otp-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="00000000"
              maxLength={8}
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value.replace(/\D/g, "").slice(0, 8)
                )
              }
              required
            />

            <p className="otp-input-hint">
              <LockKeyhole size={14} />
              Enter the code exactly as it appears in your email.
            </p>
          </div>

          <button
            type="submit"
            className="login-submit-button otp-verify-button"
            disabled={loading || code.length !== 8}
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify and continue
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <div className="otp-actions">
            <button
              type="button"
              className="otp-resend-button"
              onClick={() => sendSuperAdminCode()}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Resend verification code
            </button>

            <button
              type="button"
              className="otp-change-email"
              onClick={returnToEmailStep}
              disabled={loading}
            >
              <ArrowLeft size={15} />
              Use a different email address
            </button>
          </div>
        </form>
      )}

      {mode === "team" && (
        <form onSubmit={handleMagicLink}>
          <div className="login-team-info">
            <h3>Passwordless administrator access</h3>

            <p>
              Enter the email address associated with your administrator
              invitation. We will send you a secure sign-in link.
            </p>
          </div>

          <div className="login-field">
            <label htmlFor="team-admin-email">
              Administrator email
            </label>

            <input
              id="team-admin-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? "Sending sign-in link..." : "Send sign-in link"}
          </button>
        </form>
      )}

      <button
        type="button"
        className="admin-passkey-login"
        onClick={() => void handlePasskeySignIn()}
        disabled={loading}
      >
        <Fingerprint size={18} />
        {loading ? "Verifying passkey…" : "Sign in with fingerprint or passkey"}
      </button>

      {message && (
        <div
          className={`login-message ${messageType}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  );
}
