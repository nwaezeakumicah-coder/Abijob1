
"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { createClient } from "../../../lib/supabase/client";
import {
  User,
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import "./professional.css";

export default function ProfessionalRegistrationPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    category: "",
    skill: "",
    experience: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (isSubmitting) return;

    if (formData.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!formData.terms) {
      setError("Please accept the Terms and Conditions.");
      return;
    }

    const experienceYears: Record<string, number> = {
      "Less than 1 year": 0,
      "1–2 years": 1,
      "3–5 years": 3,
      "6–10 years": 6,
      "Above 10 years": 11,
    };

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const email = formData.email.trim();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              role: "professional",
              full_name: formData.fullName.trim(),
              phone: formData.phone.trim(),
              location: formData.location,
              category: formData.category,
              skills: [formData.skill.trim()],
              experience_years:
                experienceYears[formData.experience],
              service_area: formData.location,
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error(
          "Supabase did not return a user account. Please try again."
        );
      }

      if (data.session) {
        setMessage(
          "Your Professional account has been created successfully. Redirecting to your dashboard..."
        );

        router.replace("/professional/dashboard");
        router.refresh();
        return;
      }

      setMessage(
        "Your account has been created. Please check your email and follow the confirmation link before logging in."
      );

      router.push(
        `/verify-email?email=${encodeURIComponent(email)}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not create your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="professional-registration-page">
        <div className="professional-registration-wrapper">

          {/* LEFT INTRODUCTION PANEL */}
          <section className="professional-intro-panel">
            <Link
              href="/"
              className="professional-brand"
              aria-label="Abi Job home"
            >
              <Image
                src="/images/abijob-logo-white.png"
                alt="Abi Job"
                width={180}
                height={65}
                priority
                className="professional-brand-logo"
              />
            </Link>

            <div className="professional-intro-content">
              <span className="professional-eyebrow">
                SKILLED PROFESSIONALS & ARTISANS
              </span>

              <h1>
                Let your skills
                <br />
                open new doors.
              </h1>

              <p>
                Your talent deserves recognition. Create your
                professional profile, showcase your experience,
                and connect with people and businesses looking
                for your services.
              </p>

              <div className="professional-benefits">

                <div className="professional-benefit">
                  <span className="professional-benefit-icon">
                    <CheckCircle2 size={21} />
                  </span>

                  <div>
                    <strong>Showcase your skills</strong>
                    <p>Present your expertise and experience.</p>
                  </div>
                </div>

                <div className="professional-benefit">
                  <span className="professional-benefit-icon">
                    <CheckCircle2 size={21} />
                  </span>

                  <div>
                    <strong>Connect with employers</strong>
                    <p>Get discovered by potential clients.</p>
                  </div>
                </div>

                <div className="professional-benefit">
                  <span className="professional-benefit-icon">
                    <CheckCircle2 size={21} />
                  </span>

                  <div>
                    <strong>Grow your opportunities</strong>
                    <p>Find work opportunities across Abia State.</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="professional-intro-bottom">
              <span>OPPORTUNITY STARTS HERE.</span>
              <span>ABI JOB © 2026</span>
            </div>
          </section>

          {/* RIGHT REGISTRATION FORM */}
          <section className="professional-form-panel">

            <div className="professional-form-heading">
              <span className="professional-form-label">
                CREATE YOUR ACCOUNT
              </span>

              <h2>Professional registration</h2>

              <p>
                Complete the information below to create your
                Skilled Professional & Artisan account.
              </p>
            </div>

            <form
              className="professional-registration-form"
              onSubmit={handleSubmit}
            >

              <div className="professional-form-section-title">
                <span>01</span>
                <h3>Personal information</h3>
              </div>

              <div className="professional-field">
                <label htmlFor="fullName">Full name</label>

                <div className="professional-input-wrapper">
                  <User size={19} />

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="professional-form-grid">

                <div className="professional-field">
                  <label htmlFor="email">Email address</label>

                  <div className="professional-input-wrapper">
                    <Mail size={19} />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="professional-field">
                  <label htmlFor="phone">Phone number</label>

                  <div className="professional-input-wrapper">
                    <Phone size={19} />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="08012345678"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

              </div>

              <div className="professional-field">
                <label htmlFor="location">Location in Abia State</label>

                <div className="professional-input-wrapper">
                  <MapPin size={19} />

                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your LGA</option>
                    <option value="Aba North">Aba North</option>
                    <option value="Aba South">Aba South</option>
                    <option value="Arochukwu">Arochukwu</option>
                    <option value="Bende">Bende</option>
                    <option value="Ikwuano">Ikwuano</option>
                    <option value="Isiala Ngwa North">Isiala Ngwa North</option>
                    <option value="Isiala Ngwa South">Isiala Ngwa South</option>
                    <option value="Isuikwuato">Isuikwuato</option>
                    <option value="Obi Ngwa">Obi Ngwa</option>
                    <option value="Ohafia">Ohafia</option>
                    <option value="Osisioma Ngwa">Osisioma Ngwa</option>
                    <option value="Ugwunagbo">Ugwunagbo</option>
                    <option value="Ukwa East">Ukwa East</option>
                    <option value="Ukwa West">Ukwa West</option>
                    <option value="Umuahia North">Umuahia North</option>
                    <option value="Umuahia South">Umuahia South</option>
                    <option value="Umu Nneochi">Umu Nneochi</option>
                  </select>
                </div>
              </div>

              <div className="professional-form-divider" />

              <div className="professional-form-section-title">
                <span>02</span>
                <h3>Professional information</h3>
              </div>

              <div className="professional-field">
                <label htmlFor="category">Professional category</label>

                <div className="professional-input-wrapper">
                  <BriefcaseBusiness size={19} />

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose your category</option>
                    <option value="Technology">Technology & IT</option>
                    <option value="Fashion">Fashion & Tailoring</option>
                    <option value="Beauty">Beauty & Personal Care</option>
                    <option value="Construction">Construction & Building</option>
                    <option value="Electrical">Electrical Services</option>
                    <option value="Mechanical">Mechanical Services</option>
                    <option value="Automobile">Automobile & Repairs</option>
                    <option value="Welding">Welding & Fabrication</option>
                    <option value="Carpentry">Carpentry & Furniture</option>
                    <option value="Photography">Photography & Media</option>
                    <option value="Graphics">Graphics & Creative Design</option>
                    <option value="Catering">Catering & Food Services</option>
                    <option value="Education">Education & Training</option>
                    <option value="Healthcare">Healthcare Services</option>
                    <option value="Cleaning">Cleaning & Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="professional-field">
                <label htmlFor="skill">Specific skill or service</label>

                <div className="professional-input-wrapper">
                  <BriefcaseBusiness size={19} />

                  <input
                    id="skill"
                    name="skill"
                    type="text"
                    placeholder="e.g. Barber, Fashion Designer, Plumber"
                    value={formData.skill}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="professional-field">
                <label htmlFor="experience">Years of experience</label>

                <div className="professional-input-wrapper">
                  <BriefcaseBusiness size={19} />

                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select experience</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1–2 years">1–2 years</option>
                    <option value="3–5 years">3–5 years</option>
                    <option value="6–10 years">6–10 years</option>
                    <option value="Above 10 years">Above 10 years</option>
                  </select>
                </div>
                <small>
                  Your selected range is stored using its minimum number
                  of years.
                </small>
              </div>

              <div className="professional-form-divider" />

              <div className="professional-form-section-title">
                <span>03</span>
                <h3>Account security</h3>
              </div>

              <div className="professional-field">
                <label htmlFor="password">Create password</label>

                <div className="professional-input-wrapper">
                  <Lock size={19} />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />

                  <button
                    type="button"
                    className="professional-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div className="professional-field">
                <label htmlFor="confirmPassword">Confirm password</label>

                <div className="professional-input-wrapper">
                  <Lock size={19} />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="professional-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <label className="professional-terms">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                />

                <span>
                  I agree to Abi Job's{" "}
                  <Link href="/terms">Terms and Conditions</Link>{" "}
                  and{" "}
                  <Link href="/privacy">Privacy Policy</Link>.
                </span>
              </label>

              {error && (
                <div
                  className="professional-message professional-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  className="professional-message professional-success"
                  role="status"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="professional-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Creating your account..."
                  : "Create professional account"}
                {!isSubmitting && <ArrowRight size={19} />}
              </button>

              <p className="professional-login-prompt">
                Already have an account?{" "}
                <Link href="/login">Log in</Link>
              </p>

            </form>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
