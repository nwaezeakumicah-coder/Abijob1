
"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import { createClient } from "../../../lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  BriefcaseBusiness,
  UserRound,
  Building2,
} from "lucide-react";
import "./role.css";

const roles: Record<
  string,
  {
    title: string;
    description: string;
    icon: typeof BriefcaseBusiness;
    databaseRole: "job_seeker" | "professional" | "employer";
    dashboard: string;
  }
> = {
  "job-seeker": {
    title: "Create your job seeker account",
    description:
      "Build your profile, discover opportunities and take the next step in your career.",
    icon: BriefcaseBusiness,
    databaseRole: "job_seeker",
    dashboard: "/dashboard",
  },
  professional: {
    title: "Create your professional account",
    description:
      "Showcase your skills, experience and previous work to potential clients.",
    icon: UserRound,
    databaseRole: "professional",
    dashboard: "/professional/dashboard",
  },
  employer: {
    title: "Create your employer account",
    description:
      "Connect with talented people and find the right workers for your business.",
    icon: Building2,
    databaseRole: "employer",
    dashboard: "/employer/dashboard",
  },
};

type RoleRegistrationFormProps = {
  roleKey: string;
};

export default function RoleRegistrationForm({
  roleKey,
}: RoleRegistrationFormProps) {
  const router = useRouter();
  const role = roles[roleKey];

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !role) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");

    const businessName = String(
      formData.get("businessName") || ""
    ).trim();

    const businessType = String(
      formData.get("businessType") || ""
    ).trim();

    const businessAddress = String(
      formData.get("businessAddress") || ""
    ).trim();

    if (password.length < 8) {
      setIsSuccess(false);
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (role.databaseRole === "employer") {
      if (!businessName || !businessType || !businessAddress) {
        setIsSuccess(false);
        setMessage("Please complete all your business information.");
        return;
      }
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
            role: role.databaseRole,
            full_name: fullName,
            phone,
            ...(role.databaseRole === "employer"
              ? {
                  business_name: businessName,
                  business_type: businessType,
                  address: businessAddress,
                }
              : {}),
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
          "Your account has been created successfully. Redirecting to your dashboard..."
        );

        router.replace(role.dashboard);
        router.refresh();
        return;
      }

      setIsSuccess(true);
      setMessage(
        "Your account has been created. Please check your email and follow the confirmation link before logging in."
      );

      router.push(
        `/verify-email?email=${encodeURIComponent(email)}`
      );
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

  if (!role) {
    return (
      <main className="role-register-page">
        <div className="role-register-form-card">
          <Logo size="medium" />

          <h1>Account type not found</h1>

          <p>The registration link may be incorrect.</p>

          <Link href="/register">
            Choose an account type
          </Link>
        </div>
      </main>
    );
  }

  const RoleIcon = role.icon;
  const isEmployer = role.databaseRole === "employer";

  return (
    <main className="role-register-page">
      <div className="role-register-top">
        <Logo size="medium" />

        <Link href="/register" className="role-back-link">
          <ArrowLeft size={17} />
          Change account type
        </Link>
      </div>

      <section className="role-register-layout">
        <div className="role-register-side">
          <span>YOUR NEXT CHAPTER STARTS HERE</span>

          <h1>
            Make your
            <br />
            next move with
            <br />
            <strong>Abijob.</strong>
          </h1>

          <p>
            Join a growing community connecting talent,
            skills and opportunities across Abia State.
          </p>

          <div className="role-register-side-note">
            Your talent. Your ambition. Your opportunity.
          </div>
        </div>

        <div className="role-register-form-card">
          <div className="role-form-heading">
            <div className="role-register-type-icon">
              <RoleIcon size={25} />
            </div>

            <span>CREATE YOUR ACCOUNT</span>

            <h2>{role.title}</h2>

            <p>{role.description}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="fullName">Full name</label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />

            {isEmployer && (
              <>
                <label htmlFor="businessName">Business name</label>

                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  placeholder="Enter your registered or trading name"
                  autoComplete="organization"
                  required
                />

                <label htmlFor="businessType">Business type</label>

                <select
                  id="businessType"
                  name="businessType"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select your business type
                  </option>
                  <option value="Retail and Trading">
                    Retail and Trading
                  </option>
                  <option value="Hospitality and Food Services">
                    Hospitality and Food Services
                  </option>
                  <option value="Manufacturing">
                    Manufacturing
                  </option>
                  <option value="Technology and Digital Services">
                    Technology and Digital Services
                  </option>
                  <option value="Education">
                    Education
                  </option>
                  <option value="Healthcare">
                    Healthcare
                  </option>
                  <option value="Construction and Engineering">
                    Construction and Engineering
                  </option>
                  <option value="Professional Services">
                    Professional Services
                  </option>
                  <option value="Agriculture">
                    Agriculture
                  </option>
                  <option value="Other">Other</option>
                </select>

                <label htmlFor="businessAddress">
                  Business address
                </label>

                <input
                  id="businessAddress"
                  name="businessAddress"
                  type="text"
                  placeholder="Enter your business address"
                  autoComplete="street-address"
                  required
                />
              </>
            )}

            <label htmlFor="email">Email address</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label htmlFor="phone">Phone number</label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              autoComplete="tel"
              required
            />

            <label htmlFor="password">Create password</label>

            <div className="role-password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            <label className="role-terms">
              <input type="checkbox" name="terms" required />

              <span>
                I agree to Abijob's{" "}
                <Link href="/terms" target="_blank">
                  Terms of Service
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
              className="role-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating your account..." : "Create account"}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>

            {message && (
              <p
                className={`role-form-message ${
                  isSuccess ? "success" : "error"
                }`}
                role={isSuccess ? "status" : "alert"}
              >
                {message}
              </p>
            )}
          </form>

          <p className="role-login-prompt">
            Already have an account?{" "}
            <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
