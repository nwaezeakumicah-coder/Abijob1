
import Link from "next/link";
import Logo from "./Logo";
import "./Footer.css";

const footerLinks = {
  platform: [
    { label: "Find Jobs", href: "/jobs" },
    { label: "Find Professionals", href: "/professionals" },
    { label: "For Employers", href: "/employers" },
    { label: "Abi Hub", href: "/hub" },
  ],
  account: [
    { label: "Create an Account", href: "/register" },
    { label: "Log In", href: "/login" },
    { label: "Job Seeker", href: "/register/job-seeker" },
    { label: "Skilled Professional", href: "/register/professional" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Help & Support", href: "/support" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Community Guidelines", href: "/guidelines" },
    { label: "Safety & Reporting", href: "/safety" },
  ],
};

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">

        <div className="footer-brand">
          <Logo light size="medium" />

          <p className="footer-description">
            Connecting Abia's talent with opportunities.
            Discover jobs, showcase your skills, and grow
            your business with Abi Job.
          </p>

          <p className="footer-location">
            Proudly connecting opportunities across Abia State, Nigeria.
          </p>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          {footerLinks.platform.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h3>Your Account</h3>
          {footerLinks.account.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h3>Company</h3>
          {footerLinks.company.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h3>Legal & Safety</h3>
          {footerLinks.legal.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

      </div>

      <div className="footer-bottom">
        <p>
       © 2026 Abi Job. All rights reserved.
        </p>

        <p className="footer-bottom-tagline">
          OPPORTUNITY STARTS HERE.
        </p>
      </div>
    </footer>
  );
}
