
import Image from "next/image";
import {
  LockKeyhole,
  ShieldCheck,
  Fingerprint,
} from "lucide-react";
import LoginForm from "./login/LoginForm";
import "./login/login.css";

export default function AdminLoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="visual-decoration decoration-one" />
        <div className="visual-decoration decoration-two" />

        <div className="visual-content">
          <Image
            src="/images/abijob-logo-white.png"
            alt="Abi Job"
            width={175}
            height={65}
            priority
            className="brand-logo"
          />

          <div className="visual-message">
            <span className="eyebrow">
              <ShieldCheck size={15} />
              SECURE ADMINISTRATION
            </span>

            <h1>
              Managing
              <br />
              opportunities.
              <br />
              <span>Building impact.</span>
            </h1>

            <p>
              The central administration workspace for managing the
              Abi Job employment ecosystem.
            </p>
          </div>

          <div className="visual-footer">
            <span>ABI JOB ADMINISTRATION</span>
            <span>OPPORTUNITY STARTS HERE</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-container">
          <div className="mobile-logo">
            <Image
              src="/images/abijob-logo-white.png"
              alt="Abi Job"
              width={145}
              height={55}
              priority
            />
          </div>

          <div className="login-heading">
            <span className="login-label">
              ADMINISTRATOR ACCESS
            </span>

            <h2>Welcome back.</h2>

            <p>
              Sign in with your authorised administrator account
              to continue.
            </p>
          </div>

          <LoginForm />

          <div className="security-note">
            <LockKeyhole size={17} />

            <div>
              <strong>Protected administrator access</strong>

              <p>
                Only approved and active administrators can access
                this workspace.
              </p>
            </div>
          </div>

          <div className="login-bottom">
            <Fingerprint size={16} />
            <span>
              Abi Job secure administration environment
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
