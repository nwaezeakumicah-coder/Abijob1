
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import "./callback.css";

type PaymentState = "verifying" | "success" | "failed";

type AccountRole = "job_seeker" | "professional" | "employer";

function getBillingRoute(role: AccountRole): string {
  switch (role) {
    case "job_seeker":
      return "/dashboard/subscription";
    case "professional":
      return "/professional/subscription";
    case "employer":
      return "/employer/subscription";
  }
}

function PaystackCallbackContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<PaymentState>("verifying");
  const [message, setMessage] = useState(
    "Please wait while we securely verify your payment."
  );
  const [billingRoute, setBillingRoute] = useState("/subscription");
  const [loginRequired, setLoginRequired] = useState(false);

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) return;

    verificationStarted.current = true;

    async function verifyPayment() {
      const reference =
        searchParams.get("reference") ||
        searchParams.get("trxref");

      if (
        !reference ||
        reference.length < 5 ||
        reference.length > 100
      ) {
        setStatus("failed");
        setMessage(
          "We could not find a valid payment reference. Please check your payment history or contact support."
        );
        return;
      }

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoginRequired(true);
          setStatus("failed");
          setMessage(
            "Your payment reference was received, but you need to log in with the account you used to make this payment before we can verify it."
          );
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError || !profile) {
          setStatus("failed");
          setMessage(
            "We could not identify your account type. Please contact support if you completed payment."
          );
          return;
        }

        const role = profile.role as AccountRole;

        if (
          !["job_seeker", "professional", "employer"].includes(role)
        ) {
          setStatus("failed");
          setMessage("Your account type could not be verified.");
          return;
        }

        const destination = getBillingRoute(role);
        setBillingRoute(destination);

        const response = await fetch(
          "/api/payments/paystack/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reference }),
            cache: "no-store",
          }
        );

        let result: {
          success?: boolean;
          message?: string;
          error?: string;
          alreadyProcessed?: boolean;
        };

        try {
          result = await response.json();
        } catch {
          throw new Error(
            "We could not understand the payment verification response."
          );
        }

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.error ||
              "Payment verification could not be completed."
          );
        }

        setStatus("success");
        setMessage(
          result.alreadyProcessed
            ? "This payment was already verified. Your subscription remains active."
            : "Your payment has been verified successfully. Your subscription is now active."
        );
      } catch (error) {
        console.error("Payment callback error:", error);

        setStatus("failed");
        setMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while verifying your payment. Please contact support if you were charged."
        );
      }
    }

    verifyPayment();
  }, [searchParams]);

  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref");

  const loginNextPath = reference
    ? `/subscription/checkout/callback?reference=${encodeURIComponent(reference)}`
    : "/subscription/checkout/callback";

  const loginUrl =
    `/login?next=${encodeURIComponent(loginNextPath)}`;

  return (
    <main className="payment-callback-page">
      <div className="payment-callback-card">
        <Link href="/" className="payment-callback-logo">
          <img
            src="/image/abijob-logo-green.png"
            alt="Abi Job"
          />
        </Link>

        {status === "verifying" && (
          <div className="payment-callback-icon verifying">
            <Loader2 size={42} className="callback-spinner" />
          </div>
        )}

        {status === "success" && (
          <div className="payment-callback-icon success">
            <CheckCircle2 size={42} />
          </div>
        )}

        {status === "failed" && (
          <div className="payment-callback-icon failed">
            <XCircle size={42} />
          </div>
        )}

        <h1>
          {status === "verifying" && "Verifying Your Payment"}
          {status === "success" && "Payment Successful!"}
          {status === "failed" && "Payment Verification"}
        </h1>

        <p className="payment-callback-message">{message}</p>

        {status === "verifying" && (
          <p className="payment-callback-note">
            Please do not close this page. This may take a few moments.
          </p>
        )}

        {status === "success" && (
          <Link
            href={billingRoute}
            className="payment-callback-button"
          >
            View Subscription
            <ArrowRight size={18} />
          </Link>
        )}

        {status === "failed" && (
          <div className="payment-callback-actions">
            {loginRequired ? (
              <Link
                href={loginUrl}
                className="payment-callback-button"
              >
                Log In to Verify Payment
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                href={billingRoute}
                className="payment-callback-button"
              >
                Check Subscription
                <ArrowRight size={18} />
              </Link>
            )}

            <Link
              href="/support"
              className="payment-callback-secondary"
            >
              Contact Support
            </Link>
          </div>
        )}

        <div className="payment-callback-security">
          <AlertCircle size={15} />
          <span>
            Your payment is verified securely through Paystack.
          </span>
        </div>
      </div>
    </main>
  );
}

export default function PaystackCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="payment-callback-page">
          <div className="payment-callback-card">
            <Loader2
              size={36}
              className="callback-spinner"
            />
            <p>Loading payment verification...</p>
          </div>
        </main>
      }
    >
      <PaystackCallbackContent />
    </Suspense>
  );
}
