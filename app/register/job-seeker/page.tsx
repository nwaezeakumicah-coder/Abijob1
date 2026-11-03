
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { createClient } from "../../../lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  CheckCircle2,
  UserRound,
  Mail,
  Phone,
  MapPin,
  LockKeyhole,
} from "lucide-react";
import "./job-seeker.css";

export default function JobSeekerRegistrationPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(
      formData.get("confirmPassword") || ""
    );

    if (password.length < 8) {
      setIsSuccess(false);
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setIsSuccess(false);
      setMessage("Your passwords do not match. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            role: "job_seeker",
            full_name: fullName,
            phone,
            location,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Supabase did not return a user account. Please try again."
        );
      }

      if (data.session) {
        setIsSuccess(true);
        setMessage(
          "Your Job Seeker account has been created successfully. Redirecting to your dashboard..."
        );

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setIsSuccess(true);
      setMessage(
        "Your account has been created. Please check your email and follow the confirmation link."
      );

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setIsSuccess(false);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "We could not create your account. Please try again.";

      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="js-register-page">
        <div className="js-register-container">
          <Link href="/register" className="js-back-link">
            <ArrowLeft size={17} />
            Back to account types
          </Link>

          <div className="js-register-layout">
            <section className="js-register-intro">
              <div className="js-intro-icon">
                <BriefcaseBusiness size={30} />
              </div>

              <span className="js-eyebrow">
                JOB SEEKER ACCOUNT
              </span>

              <h1>
                Your next opportunity
                <span> starts here.</span>
              </h1>

              <p>
                Create your Abi Job account to discover opportunities
                across Abia State, connect with employers and take the
                next step in your career.
              </p>

              <div className="js-benefits">
                <div>
                  <CheckCircle2 size={19} />
                  <span>Discover relevant job opportunities</span>
                </div>

                <div>
                  <CheckCircle2 size={19} />
                  <span>Build your professional profile</span>
                </div>

                <div>
                  <CheckCircle2 size={19} />
                  <span>Prepare your CV and career journey</span>
                </div>
              </div>

              <div className="js-intro-note">
                <strong>One account. More opportunities.</strong>
                <span>
                  Join a growing community of job seekers and employers
                  across Abia State.
                </span>
              </div>
            </section>

            <section className="js-form-card">
              <div className="js-form-heading">
                <span>LET'S GET YOU STARTED</span>
                <h2>Create your account</h2>
                <p>
                  Enter your details below to begin your registration.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="js-register-form">
                <div className="js-field">
                  <label htmlFor="fullName">Full name</label>
                  <div className="js-input-wrap">
                    <UserRound size={18} />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="js-field">
                  <label htmlFor="email">Email address</label>
                  <div className="js-input-wrap">
                    <Mail size={18} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="js-field">
                  <label htmlFor="phone">Phone number</label>
                  <div className="js-input-wrap">
                    <Phone size={18} />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="e.g. 08012345678"
                      autoComplete="tel"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="js-field">
                  <label htmlFor="location">Location in Abia State</label>
                  <div className="js-input-wrap">
                    <MapPin size={18} />
                    <select
                      id="location"
                      name="location"
                      defaultValue=""
                      required
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>
                        Select your location
                      </option>
                      <option value="Aba">Aba</option>
                      <option value="Umuahia">Umuahia</option>
                      <option value="Arochukwu">Arochukwu</option>
                      <option value="Bende">Bende</option>
                      <option value="Ikwuano">Ikwuano</option>
                      <option value="Isiala Ngwa North">
                        Isiala Ngwa North
                      </option>
                      <option value="Isiala Ngwa South">
                        Isiala Ngwa South
                      </option>
                      <option value="Isuikwuato">Isuikwuato</option>
                      <option value="Obingwa">Obingwa</option>
                      <option value="Ohafia">Ohafia</option>
                      <option value="Osisioma">Osisioma</option>
                      <option value="Ugwunagbo">Ugwunagbo</option>
                      <option value="Ukwa East">Ukwa East</option>
                      <option value="Ukwa West">Ukwa West</option>
                      <option value="Umu Nneochi">Umu Nneochi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="js-field">
                  <label htmlFor="password">Create password</label>
                  <div className="js-input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="js-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      disabled={isSubmitting}
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

                <div className="js-field">
                  <label htmlFor="confirmPassword">
                    Confirm password
                  </label>
                  <div className="js-input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="js-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {message && (
                  <div
                    className={`js-form-message ${
                      isSuccess ? "success" : "error"
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {message}
                  </div>
                )}

                <label className="js-terms">
                  <input
                    type="checkbox"
                    name="terms"
                    required
                    disabled={isSubmitting}
                  />
                  <span>
                    I agree to Abi Job's{" "}
                    <Link href="/terms" target="_blank">
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  className="js-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Creating your account..."
                    : "Create Job Seeker Account"}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </form>

              <p className="js-login-prompt">
                Already have an account?{" "}
                <Link href="/login">Log in</Link>
              </p>

              <p className="js-account-note">
                Your registration details are securely submitted to Abi
                Job's authentication service.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
