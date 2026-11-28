import type { SupabaseClient } from "@supabase/supabase-js";

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = window.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Register a discoverable platform passkey using local biometrics or device screen lock. */
export async function registerPlatformPasskey(supabase: SupabaseClient) {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !navigator.credentials ||
    typeof PublicKeyCredential === "undefined"
  ) {
    throw new Error("Passkeys require a supported browser and a secure HTTPS connection.");
  }

  const platformAvailable =
    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();

  if (!platformAvailable) {
    throw new Error(
      "This device does not have a supported fingerprint, face, or screen-lock authenticator enabled. Enable your device screen lock or use another sign-in method."
    );
  }

  const { data, error } = await supabase.auth.passkey.startRegistration();
  if (error) throw error;
  if (!data) throw new Error("We could not start passkey setup. Please try again.");

  const options = data.options;
  const publicKey: PublicKeyCredentialCreationOptions = {
    ...options,
    challenge: decodeBase64Url(options.challenge),
    user: { ...options.user, id: decodeBase64Url(options.user.id) },
    excludeCredentials: (options.excludeCredentials ?? []).map((credential) => ({
      ...credential,
      id: decodeBase64Url(credential.id),
    })),
    authenticatorSelection: {
      ...options.authenticatorSelection,
      authenticatorAttachment: "platform",
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "required",
    },
  } as unknown as PublicKeyCredentialCreationOptions;

  const created = await navigator.credentials.create({ publicKey });
  if (!(created instanceof PublicKeyCredential)) {
    throw new Error("Your device cancelled passkey setup. Please try again.");
  }

  const response = created.response as AuthenticatorAttestationResponse;
  const credential = {
    id: created.id,
    rawId: encodeBase64Url(created.rawId),
    type: "public-key" as const,
    authenticatorAttachment: created.authenticatorAttachment,
    response: {
      clientDataJSON: encodeBase64Url(response.clientDataJSON),
      attestationObject: encodeBase64Url(response.attestationObject),
      transports: typeof response.getTransports === "function" ? response.getTransports() : [],
    },
    clientExtensionResults: created.getClientExtensionResults(),
  };

  const { data: passkey, error: verifyError } =
    await supabase.auth.passkey.verifyRegistration({
      challengeId: data.challenge_id,
      credential: credential as unknown as Parameters<
        typeof supabase.auth.passkey.verifyRegistration
      >[0]["credential"],
    });

  if (verifyError) throw verifyError;
  return passkey;
}
