"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, KeyRound, Pencil, Plus, ShieldCheck, Trash2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./PasskeySettings.css";

type Passkey = {
  id: string;
  friendly_name?: string | null;
  created_at: string;
  last_used_at?: string | null;
};

type MfaFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type: "totp" | "phone";
  status: string;
  phone?: string;
};

export default function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const loadPasskeys = useCallback(async () => {
    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const supabase = createClient();
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) throw assuranceError;

      if (
        assurance.currentLevel !== "aal2" &&
        assurance.nextLevel === "aal2"
      ) {
        const { data: factorData, error: factorError } =
          await supabase.auth.mfa.listFactors();
        if (factorError) throw factorError;

        const verifiedFactors: MfaFactor[] = [
          ...(factorData.totp ?? [])
            .filter((factor) => factor.status === "verified")
            .map((factor) => ({ ...factor, factor_type: "totp" as const })),
          ...(factorData.phone ?? [])
            .filter((factor) => factor.status === "verified")
            .map((factor) => ({ ...factor, factor_type: "phone" as const })),
        ];

        setFactors(verifiedFactors);
        const defaultFactor = verifiedFactors[0];
        setFactorId((current) =>
          verifiedFactors.some((factor) => factor.id === current)
            ? current
            : defaultFactor?.id ?? ""
        );
        setNeedsMfa(true);
        setPasskeys([]);

        // Keep the step-up check, but remove an unnecessary extra click for
        // users who have exactly one authenticator-app factor.
        if (verifiedFactors.length === 1 && defaultFactor?.factor_type === "totp") {
          const { data: challenge, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId: defaultFactor.id });
          if (challengeError) throw challengeError;
          setChallengeId(challenge.id);
          setMessage("Enter the current code from your authenticator app.");
        }

        setLoading(false);
        return;
      }

      setNeedsMfa(false);
      setFactors([]);
      setChallengeId("");
      const { data, error: requestError } = await supabase.auth.passkey.list();
      if (requestError) throw requestError;
      setPasskeys((data ?? []) as Passkey[]);
    } catch (cause) {
      setError(true);
      setMessage(
        cause instanceof Error
          ? cause.message
          : "We could not check your passkeys. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPasskeys();
  }, [loadPasskeys]);

  async function verifyMfa() {
    if (working || !factorId || !challengeId || !/^\d{6,8}$/.test(verificationCode)) {
      setError(true);
      setMessage("Enter the verification code from your authenticator or phone.");
      return;
    }

    setWorking(true);
    setMessage("");
    setError(false);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode,
      });
      if (verifyError) throw verifyError;

      setVerificationCode("");
      setChallengeId("");
      setMessage("Identity verified. Your secure session is now upgraded.");
      await loadPasskeys();
    } catch (cause) {
      setError(true);
      setMessage(
        cause instanceof Error
          ? cause.message
          : "We could not verify that code. Please try again."
      );
    } finally {
      setWorking(false);
    }
  }

  async function startMfaChallenge() {
    if (working || !factorId) return;
    setWorking(true);
    setMessage("");
    setError(false);

    try {
      const factor = factors.find((item) => item.id === factorId);
      if (!factor) throw new Error("Choose a verified security factor.");

      // Supabase creates a challenge for both factor types. For phone factors
      // this sends the code; for TOTP factors the user reads the current code
      // from their authenticator app.
      const { data: challenge, error: challengeError } =
        await createClient().auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      setChallengeId(challenge.id);
      setMessage(
        factor.factor_type === "phone"
          ? "A verification code has been sent to your registered phone."
          : "Open your authenticator app and enter the current six-digit code."
      );
    } catch (cause) {
      setError(true);
      setMessage(
        cause instanceof Error
          ? cause.message
          : "We could not start the verification step."
      );
    } finally {
      setWorking(false);
    }
  }

  async function registerPasskey() {
    if (working) return;
    setWorking(true);
    setMessage("");
    setError(false);

    try {
      const supabase = createClient();
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== "aal2" && assurance.nextLevel === "aal2") {
        setNeedsMfa(true);
        setMessage("Verify your additional security factor before adding a passkey.");
        await loadPasskeys();
        return;
      }

      const { error: registerError } = await supabase.auth.registerPasskey();
      if (registerError) throw registerError;
      setMessage("Passkey added. You can now use your device's biometric or screen lock to sign in.");
      await loadPasskeys();
    } catch (cause) {
      setError(true);
      setMessage(
        cause instanceof Error
          ? cause.message
          : "We could not register this passkey. Please try again."
      );
    } finally {
      setWorking(false);
    }
  }

  async function renamePasskey(passkey: Passkey) {
    const friendlyName = window.prompt(
      "Give this passkey a name, such as My phone or Work laptop.",
      passkey.friendly_name || "My device"
    );
    if (!friendlyName?.trim()) return;

    setWorking(true);
    setMessage("");
    setError(false);
    try {
      const { error: updateError } = await createClient().auth.passkey.update({
        passkeyId: passkey.id,
        friendlyName: friendlyName.trim().slice(0, 120),
      });
      if (updateError) throw updateError;
      setMessage("Passkey name updated.");
      await loadPasskeys();
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Could not rename passkey.");
    } finally {
      setWorking(false);
    }
  }

  async function removePasskey(passkey: Passkey) {
    if (
      !window.confirm(
        "Remove this passkey? You will no longer be able to use this device to sign in until you add it again."
      )
    ) return;

    setWorking(true);
    setMessage("");
    setError(false);
    try {
      const { error: deleteError } = await createClient().auth.passkey.delete({
        passkeyId: passkey.id,
      });
      if (deleteError) throw deleteError;
      setMessage("Passkey removed.");
      await loadPasskeys();
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Could not remove passkey.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="abj-passkey-card">
      <div className="abj-passkey-heading">
        <div className="abj-passkey-icon"><Fingerprint size={21} /></div>
        <div>
          <h2>Passkey and biometric sign-in</h2>
          <p>Use your fingerprint, Face ID, device PIN or screen lock on a supported device.</p>
        </div>
      </div>

      <div className="abj-passkey-note">
        <ShieldCheck size={17} />
        <span>Abi Job never receives or stores your fingerprint or face data. Your device verifies you locally.</span>
      </div>

      {loading ? (
        <p className="abj-passkey-muted">Checking your security session…</p>
      ) : needsMfa ? (
        <div className="abj-passkey-mfa" aria-labelledby="abj-passkey-mfa-title">
          <div className="abj-passkey-mfa-heading">
            <LockKeyhole size={19} />
            <div>
              <strong id="abj-passkey-mfa-title">Confirm it’s you</strong>
              <p>Enter your existing security code to manage passkeys. This check appears only because you enabled extra account protection.</p>
            </div>
          </div>

          {factors.length ? (
            <>
              {factors.length > 1 && (
                <>
                  <label htmlFor="abj-passkey-factor">Verification method</label>
                  <select
                    id="abj-passkey-factor"
                    value={factorId}
                    onChange={(event) => {
                      setFactorId(event.target.value);
                      setChallengeId("");
                      setVerificationCode("");
                      setMessage("");
                    }}
                    disabled={working}
                  >
                    {factors.map((factor) => (
                      <option key={factor.id} value={factor.id}>
                        {factor.factor_type === "totp"
                          ? `Authenticator app · ${factor.friendly_name || "TOTP"}`
                          : `SMS · ${factor.phone || factor.friendly_name || "Verified phone"}`}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {!challengeId ? (
                <button type="button" className="abj-passkey-add" onClick={() => void startMfaChallenge()} disabled={working || !factorId}>
                  {working ? "Please wait…" : factors.find((factor) => factor.id === factorId)?.factor_type === "phone" ? "Send code" : "Continue"}
                </button>
              ) : (
                <div className="abj-passkey-verify">
                  <label htmlFor="abj-passkey-code">Authenticator code</label>
                  <input
                    id="abj-passkey-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="Enter your code"
                  />
                  <button type="button" className="abj-passkey-add" onClick={() => void verifyMfa()} disabled={working || !verificationCode}>
                    {working ? "Verifying…" : "Verify and continue"}
                  </button>
                  <button type="button" className="abj-passkey-secondary" onClick={() => { setChallengeId(""); setVerificationCode(""); setMessage(""); }} disabled={working}>
                    Choose another method
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="abj-passkey-muted">
              This account requires additional verification, but Supabase did not return a verified MFA factor. Use the account recovery process or contact Abi Job support; do not disable account protection.
            </p>
          )}
        </div>
      ) : passkeys.length ? (
        <div className="abj-passkey-list">
          {passkeys.map((passkey) => (
            <div className="abj-passkey-row" key={passkey.id}>
              <div className="abj-passkey-device">
                <KeyRound size={18} />
                <div>
                  <strong>{passkey.friendly_name || "Registered device"}</strong>
                  <span>Added {new Date(passkey.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="abj-passkey-actions">
                <button type="button" onClick={() => void renamePasskey(passkey)} disabled={working} aria-label="Rename passkey"><Pencil size={16} /></button>
                <button type="button" onClick={() => void removePasskey(passkey)} disabled={working} aria-label="Remove passkey"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="abj-passkey-muted">No passkeys are registered on this account yet.</p>
      )}

      {message && <p className={`abj-passkey-message ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>{message}</p>}

      {!needsMfa && !loading && (
        <button type="button" className="abj-passkey-add" onClick={() => void registerPasskey()} disabled={working}>
          <Plus size={17} />
          {working ? "Please wait…" : "Add a passkey"}
        </button>
      )}
    </section>
  );
}
