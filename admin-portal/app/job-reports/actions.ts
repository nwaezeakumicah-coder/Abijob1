"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

export async function reviewJobReport(formData: FormData) {
  const admin = await getActiveAdmin();
  const canReview = ["jobs.review", "jobs.manage", "support.manage"].some(
    (permission) => admin.permissions.includes(permission)
  );

  if (!canReview) {
    redirect("/job-reports?error=You%20do%20not%20have%20permission%20to%20review%20reports.");
  }

  const reportId = String(formData.get("reportId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId) ||
    !["in_review", "resolved", "dismissed"].includes(status) ||
    notes.length > 2000
  ) {
    redirect("/job-reports?error=Invalid%20report%20review%20request.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("admin_review_job_report", {
    p_admin_id: admin.id,
    p_report_id: reportId,
    p_status: status,
    p_admin_notes: notes || null,
  });

  if (error || data !== true) {
    console.error("JOB REPORT REVIEW FAILED:", error);
    redirect("/job-reports?error=The%20report%20could%20not%20be%20updated.");
  }

  revalidatePath("/job-reports");
  revalidatePath("/dashboard");
  redirect("/job-reports?success=Report%20status%20updated.");
}
