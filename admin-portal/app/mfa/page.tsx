import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import MfaVerificationForm from "./MfaVerificationForm";
import "./mfa.css";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?error=authentication-required");

  const adminClient = createAdminClient();
  const { data: admin, error: adminError } = await adminClient
    .from("platform_admins")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (adminError || !admin || admin.status !== "active") {
    await supabase.auth.signOut();
    redirect("/login?error=not-authorized");
  }

  return (
    <main className="admin-mfa-page">
      <section className="admin-mfa-card">
        <div className="admin-mfa-brand">a.</div>
        <span className="admin-mfa-eyebrow">ABI JOB ADMINISTRATION</span>
        <h1>Secure your administrator session</h1>
        <p className="admin-mfa-intro">
          Verify with your authenticator before entering the protected
          administration workspace. This extra check is required for every
          administrator account.
        </p>
        <MfaVerificationForm />
        <p className="admin-mfa-footnote">
          Your authenticator code is verified by Supabase and is never stored
          by Abi Job.
        </p>
      </section>
    </main>
  );
}
