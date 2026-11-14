import Image from "next/image";
import LoginForm from "./LoginForm";
import "./login.css";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <Image
            src="/images/abijob-logo-white.png"
            alt="Abijob"
            width={210}
            height={75}
            priority
            className="login-brand-logo"
          />

          <div className="login-brand-message">
            <span className="login-eyebrow">ADMINISTRATION PORTAL</span>

            <h1>
              Managing opportunities.
              <br />
              Building a stronger workforce.
            </h1>

            <p>
              A secure administration platform for managing employment
              opportunities, professionals, employers and platform operations
              across Abia State.
            </p>
          </div>

          <div className="login-brand-footer">
            <span>ABIJOB</span>
            <span>OPPORTUNITY STARTS HERE</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-mobile-logo">
            <Image
              src="/images/abijob-logo-green.png"
              alt="Abijob"
              width={165}
              height={60}
              priority
            />
          </div>

          <div className="login-heading">
            <span className="login-eyebrow">SECURE ACCESS</span>
            <h2>Welcome back</h2>
            <p>Sign in to your Abijob administration account.</p>
          </div>

          <LoginForm />

          <div className="login-security-note">
            <span className="login-security-icon">⌑</span>
            <div>
              <strong>Protected administrator access</strong>
              <p>
                Access is restricted to authorised and active administrators.
                All account permissions are verified securely.
              </p>
            </div>
          </div>

          <footer className="login-copyright">
            © {new Date().getFullYear()} Abijob. Administration Portal.
          </footer>
        </div>
      </section>
    </main>
  );
}