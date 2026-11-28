/**
 * Abijob's baseline password policy for the Supabase Free plan.
 *
 * Supabase's built-in leaked-password screening is Pro-only. This local
 * policy improves password strength but is not a substitute for server-side
 * leaked-password screening or Auth-level password rules.
 */
export function getPasswordPolicyError(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 128) return "Use no more than 128 characters.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add at least one symbol (for example !, @ or #).";
  return null;
}

export const PASSWORD_POLICY_HINT =
  "Use 12+ characters with uppercase and lowercase letters, a number and a symbol.";
