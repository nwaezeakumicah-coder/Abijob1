
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 12) {
      setError("Your password must contain at least 12 characters.");
      return;
    }

    if (password.length > 128) {
      setError("Your password cannot exceed 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "Unable to complete password setup."
        );
        return;
      }

      setSuccess(
        "Your password has been created. Your administrator account is now active."
      );

      setPassword("");
      setConfirmPassword("");

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="setup-page">
      <section className="setup-card">
        <div className="setup-brand">
          <div className="setup-brand-icon">
            <ShieldCheck size={28} />
          </div>
          <span>ABI JOB ADMINISTRATION</span>
        </div>

        <div className="setup-heading">
          <span className="setup-eyebrow">INVITATION ACCEPTANCE</span>
          <h1>Create your password</h1>
          <p>
            Welcome to the Abi Job administration team. Create a secure
            password to activate your administrator account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="setup-field">
            <label htmlFor="password">Create password</label>

            <div className="setup-input-wrap">
              <LockKeyhole size={18} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter a secure password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                maxLength={128}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="setup-visibility"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="setup-field">
            <label htmlFor="confirm-password">Confirm password</label>

            <div className="setup-input-wrap">
              <LockKeyhole size={18} />

              <input
                id="confirm-password"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                maxLength={128}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="setup-visibility"
                onClick={() =>
                  setShowConfirmation(!showConfirmation)
                }
                aria-label={
                  showConfirmation ? "Hide password" : "Show password"
                }
              >
                {showConfirmation ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="setup-requirement">
            <CheckCircle2 size={16} />
            Use at least 12 characters for a stronger password.
          </div>

          {error && (
            <div className="setup-message setup-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="setup-message setup-success" role="status">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="setup-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="setup-spin" />
                Activating your account...
              </>
            ) : (
              <>
                Create password and activate account
                <ShieldCheck size={18} />
              </>
            )}
          </button>
        </form>

        <div className="setup-security">
          <ShieldCheck size={19} />
          <p>
            Your administrator access is verified securely before
            activation.
          </p>
        </div>

        <footer className="setup-footer">
          <Link href="/login">Return to administrator login</Link>
          <span>© {new Date().getFullYear()} Abi Job</span>
        </footer>
      </section>

      <style jsx>{`
        .setup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #f3f6f2;
          color: #17251d;
        }

        .setup-card {
          width: 100%;
          max-width: 510px;
          padding: 42px;
          background: #ffffff;
          border: 1px solid #e3eae4;
          border-radius: 18px;
          box-shadow: 0 18px 55px rgba(16, 60, 43, 0.08);
        }

        .setup-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #176b45;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .setup-brand-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eaf4ed;
        }

        .setup-heading {
          margin: 34px 0 28px;
        }

        .setup-eyebrow {
          color: #176b45;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .setup-heading h1 {
          margin: 10px 0;
          color: #103c2b;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 800;
        }

        .setup-heading p {
          margin: 0;
          color: #68766d;
          font-size: 14px;
          line-height: 1.7;
        }

        .setup-form {
          display: grid;
          gap: 20px;
        }

        .setup-field {
          display: grid;
          gap: 9px;
        }

        .setup-field label {
          color: #263b2e;
          font-size: 13px;
          font-weight: 700;
        }

        .setup-input-wrap {
          min-height: 54px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 14px;
          border: 1px solid #dce5de;
          border-radius: 9px;
          color: #718078;
          background: #ffffff;
        }

        .setup-input-wrap:focus-within {
          border-color: #176b45;
          box-shadow: 0 0 0 3px rgba(23, 107, 69, 0.09);
        }

        .setup-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #17251d;
          font: inherit;
          font-size: 14px;
        }

        .setup-visibility {
          display: grid;
          place-items: center;
          padding: 5px;
          border: 0;
          background: transparent;
          color: #718078;
          cursor: pointer;
        }

        .setup-requirement {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #607468;
          font-size: 12px;
        }

        .setup-requirement :global(svg) {
          color: #176b45;
          flex-shrink: 0;
        }

        .setup-message {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
        }

        .setup-error {
          color: #a52c2c;
          background: #fff0f0;
          border: 1px solid #f2d0d0;
        }

        .setup-success {
          color: #176b45;
          background: #edf7ef;
          border: 1px solid #d1e8d6;
        }

        .setup-submit {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          border: 0;
          border-radius: 9px;
          background: #176b45;
          color: #ffffff;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .setup-submit:hover:not(:disabled) {
          background: #103c2b;
        }

        .setup-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .setup-spin {
          animation: spin 1s linear infinite;
        }

        .setup-security {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 26px;
          padding: 15px;
          border-radius: 9px;
          background: #f3f7f3;
          color: #176b45;
        }

        .setup-security :global(svg) {
          flex-shrink: 0;
        }

        .setup-security p {
          margin: 0;
          color: #53665a;
          font-size: 12px;
          line-height: 1.6;
        }

        .setup-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #edf0ed;
          color: #839087;
          font-size: 11px;
        }

        .setup-footer a {
          color: #176b45;
          font-weight: 700;
          text-decoration: none;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 520px) {
          .setup-card {
            padding: 28px 22px;
          }

          .setup-heading h1 {
            font-size: 26px;
          }

          .setup-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
