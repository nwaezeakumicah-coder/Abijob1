"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveAdmin } from "../../../lib/admin-auth";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function reviewProfessionalVerification(formData: FormData) {
  const admin = await getActiveAdmin();
  const allowed = ["verifications.review", "verifications.manage"].some((key) => admin.permissions.includes(key));
  if (!allowed) redirect("/verifications/professionals?error=Access%20denied");

  const requestId = String(formData.get("requestId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
      || !["approved", "rejected"].includes(status) || notes.length > 2000) {
    redirect("/verifications/professionals?error=Invalid%20review%20request");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("admin_review_professional_verification", {
    p_admin_id: admin.id,
    p_request_id: requestId,
    p_status: status,
    p_admin_notes: notes || null,
  });
  if (error || data !== true) {
    console.error("PROFESSIONAL VERIFICATION REVIEW FAILED:", error);
    redirect("/verifications/professionals?error=Unable%20to%20update%20this%20request");
  }
  revalidatePath("/verifications/professionals");
  revalidatePath("/verifications");
  redirect("/verifications/professionals?success=Verification%20decision%20saved");
}
