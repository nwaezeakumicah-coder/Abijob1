"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./PasskeySettings.css";

type Passkey = {
  id: string;
  friendly_name?: string | null;
  created_at: string;
  last_used_at?: string | null;
};

export default function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const loadPasskeys = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: requestError } = await supabase.auth.passkey.list();

    if (requestError) {
      setError(true);
      setMessage(requestError.message);
    } else {
      setPasskeys((data ?? []) as Passkey[]);
      setError(false);
      setMessage("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPasskeys();
  }, [loadPasskeys]);

  async function registerPasskey() {
    if (working) return;
    setWorking(true);
    setMessage("");
    setError(false);

    try {
      const supabase = createClient();
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
    const { error: updateError } = await createClient().auth.passkey.update({
      passkeyId: passkey.id,
      friendlyName: friendlyName.trim().slice(0, 120),
    });

    if (updateError) {
      setError(true);
      setMessage(updateError.message);
    } else {
      setMessage("Passkey name updated.");
      await loadPasskeys();
    }
    setWorking(false);
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
    const { error: deleteError } = await createClient().auth.passkey.delete({
      passkeyId: passkey.id,
    });

    if (deleteError) {
      setError(true);
      setMessage(deleteError.message);
    } else {
      setMessage("Passkey removed.");
      await loadPasskeys();
    }
    setWorking(false);
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
        <p className="abj-passkey-muted">Checking your registered passkeys…</p>
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

      <button type="button" className="abj-passkey-add" onClick={() => void registerPasskey()} disabled={working || loading}>
        <Plus size={17} />
        {working ? "Please wait…" : "Add a passkey"}
      </button>
    </section>
  );
}
