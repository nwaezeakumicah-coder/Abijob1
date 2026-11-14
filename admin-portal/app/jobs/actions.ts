"use server";

import { revalidatePath } from "next/cache";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function reviewJob(
  jobId: string,
  decision: "approved" | "rejected",
  reason: string | null
) {
  const admin = await getActiveAdmin();

  if (
    !admin.permissions.includes("jobs.review") &&
    !admin.permissions.includes("jobs.manage")
  ) {
    throw new Error("You do not have permission to review jobs.");
  }

  if (!UUID_PATTERN.test(jobId)) {
    throw new Error("Invalid job identifier.");
  }

  const supabase = createAdminClient();

  // The database locks the pending job, rechecks the administrator's
  // active permission, changes its moderation state and writes the audit
  // record in one transaction. Audit failure rolls back publication.
  const { data, error } = await supabase.rpc("admin_review_job", {
    p_admin_id: admin.id,
    p_job_id: jobId,
    p_decision: decision,
    p_reason: reason,
  });

  if (error || data !== true) {
    console.error("JOB REVIEW FAILED:", error);

    if (error?.code === "40001") {
      throw new Error("This job has already been reviewed. Refresh the page.");
    }

    if (error?.code === "42501") {
      throw new Error("Your administrator permission is no longer active.");
    }

    throw new Error(
      "Unable to complete job moderation. No change was saved."
    );
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/verifications");
}

export async function approveJob(jobId: string) {
  await reviewJob(jobId, "approved", null);
}

export async function rejectJob(formData: FormData) {
  const jobId = String(formData.get("jobId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();

  if (!UUID_PATTERN.test(jobId)) {
    throw new Error("Invalid job identifier.");
  }

  if (reason.length < 10 || reason.length > 1000) {
    throw new Error(
      "The rejection reason must be between 10 and 1000 characters."
    );
  }

  await reviewJob(jobId, "rejected", reason);
}
