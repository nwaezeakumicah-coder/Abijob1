import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminMfaForm from "./AdminMfaForm";
import "./mfa.css";

// Authentication and admin membership are request-specific; do not prerender this page.
export const instant = false;

type AdminMfaPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminMfaPage({ searchParams }: AdminMfaPageProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: admin, error: adminError } = await adminClient
    .from("platform_admins")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (adminError || !admin || admin.status !== "active") {
    await supabase.auth.signOut();
    redirect("/login?error=admin_access_denied");
  }

  const params = await searchParams;
  const candidate = params.next ?? "/admin";
  const nextPath =
    candidate.startsWith("/admin/") &&
    !candidate.startsWith("/admin/mfa")
      ? candidate
      : "/admin";

  return (
    <main className="admin-mfa-page">
      <section className="admin-mfa-card">
        <div className="admin-mfa-brand">a.</div>
        <span className="admin-mfa-eyebrow">ABI JOB ADMINISTRATION</span>
        <h1>Secure your administrator session</h1>
        <p className="admin-mfa-intro">
          Complete authenticator verification before entering the protected
          administration workspace.
        </p>
        <AdminMfaForm nextPath={nextPath} />
        <p className="admin-mfa-footnote">
          Your authenticator code is verified by Supabase and is never stored
          by Abi Job.
        </p>
      </section>
    </main>
  );
}
