"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoaderCircle, ShieldCheck } from "lucide-react";

export default function AdminMfaForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let active = true;
    async function prepareMfa() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.replace("/login");
          return;
        }
        const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const verifiedTotp = (data?.totp ?? []).filter(
          (factor) => factor.status === "verified"
        );
        if (verifiedTotp.length > 0) {
          if (active) {
            setFactorId(verifiedTotp[0].id);
            setIsSetup(false);
          }
          return;
        }
        const { data: enrollment, error: enrollmentError } =
          await supabase.auth.mfa.enroll({
            factorType: "totp",
            friendlyName: "Abi Job Administrator",
          });
        if (enrollmentError) throw enrollmentError;
        if (active) {
          setFactorId(enrollment.id);
          setQrCode(enrollment.totp.qr_code);
          setSecret(enrollment.totp.secret);
          setIsSetup(true);
        }
      } catch (cause) {
        if (active) setError(
          cause instanceof Error ? cause.message :
            "We could not prepare administrator verification."
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void prepareMfa();
    return () => { active = false; };
  }, [router, supabase]);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verifying || !factorId) return;
    const token = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: token,
      });
      if (verifyError) throw verifyError;
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== "aal2") {
        throw new Error("Your administrator session could not be upgraded. Please try again.");
      }
      router.replace(nextPath);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message :
        "The verification code could not be confirmed.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return (
    <div className="admin-mfa-loading">
      <LoaderCircle size={22} className="admin-mfa-spinner" />
      <span>Preparing secure verification…</span>
    </div>
  );
  if (!factorId) return (
    <div className="admin-mfa-error" role="alert">
      {error || "Administrator verification could not be prepared."}
    </div>
  );
  return (
    <form className="admin-mfa-form" onSubmit={verifyCode}>
      <div className="admin-mfa-icon">
        <ShieldCheck size={25} />
      </div>
      {isSetup ? (
        <div className="admin-mfa-enrollment">
          <h2>Set up your authenticator</h2>
          <p>Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter the six-digit code it generates.</p>
          {qrCode ? <img className="admin-mfa-qr" src={qrCode} alt="Authenticator setup QR code" /> : null}
          <span className="admin-mfa-secret-label">Manual setup key</span>
          <code className="admin-mfa-secret">{secret}</code>
        </div>
      ) : (
        <div className="admin-mfa-enrollment">
          <h2>Enter your authenticator code</h2>
          <p>Open your registered authenticator app and enter its current six-digit Abi Job code.</p>
        </div>
      )}
      <label htmlFor="admin-mfa-code">Six-digit verification code</label>
      <input
        id="admin-mfa-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        required
        autoFocus
      />
      {error ? <p className="admin-mfa-error" role="alert">{error}</p> : null}
      <button type="submit" disabled={verifying || !factorId}>
        {verifying ? <><LoaderCircle size={18} className="admin-mfa-spinner" />Verifying…</> : "Verify and continue"}
      </button>
    </form>
  );
}
