
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import "./Header.css";

const navigation = [
  { label: "Find Jobs", href: "/jobs" },
  { label: "Find Professionals", href: "/professionals" },
  { label: "For Employers", href: "/employers" },
  { label: "Abi Hub", href: "/hub" },
  { label: "About Us", href: "/about" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="header-container">

        <div className="header-brand">
          <Logo size="medium" />
        </div>

        {/* Desktop Navigation */}
        <nav
          className="desktop-navigation"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="header-nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="header-actions">
          <Link href="/login" className="header-login">
            Log in
          </Link>

          <Link href="/register" className="header-register">
            Get started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-navigation"
        className={`mobile-navigation ${
          menuOpen ? "mobile-navigation--open" : ""
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav-link"
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-navigation-actions">
            <Link
              href="/login"
              className="mobile-login"
              onClick={closeMenu}
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="mobile-register"
              onClick={closeMenu}
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
