
"use server";

import { revalidatePath } from "next/cache";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

async function recordJobAction(
  adminId: string,
  jobId: string,
  action: "job.approve" | "job.reject",
  details: Record<string, string>
) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("admin_audit_logs").insert({
    actor_admin_id: adminId,
    action,
    entity_type: "job",
    entity_id: jobId,
    details,
  });

  if (error) {
    console.error("JOB AUDIT LOG ERROR:", error);

    throw new Error(
      "The job was updated, but its audit log could not be recorded. Contact a system administrator."
    );
  }
}

export async function approveJob(jobId: string) {
  const admin = await getActiveAdmin();

  if (
    !admin.permissions.includes("jobs.review") &&
    !admin.permissions.includes("jobs.manage")
  ) {
    throw new Error("You do not have permission to approve jobs.");
  }

  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
    throw new Error("Invalid job identifier.");
  }

  const supabase = createAdminClient();

  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id, status, title")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchError) {
    console.error("JOB APPROVAL FETCH ERROR:", fetchError);
    throw new Error("Unable to retrieve this job.");
  }

  if (!job) {
    throw new Error("Job not found.");
  }

  if (job.status !== "pending") {
    throw new Error("Only pending jobs can be approved.");
  }

  const now = new Date().toISOString();

  const { data: updatedJob, error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "approved",
      rejection_reason: null,
      published_at: now,
      updated_at: now,
    })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();

  if (updateError || !updatedJob) {
    console.error("JOB APPROVAL UPDATE ERROR:", updateError);
    console.error("JOB APPROVAL UPDATED RECORD:", updatedJob);

    throw new Error(
      updateError?.message ||
        "Job update returned no record. Check the admin terminal."
    );
  }

  await recordJobAction(admin.id, jobId, "job.approve", {
    title: job.title,
    previous_status: "pending",
    new_status: "approved",
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function rejectJob(formData: FormData) {
  const admin = await getActiveAdmin();

  if (
    !admin.permissions.includes("jobs.review") &&
    !admin.permissions.includes("jobs.manage")
  ) {
    throw new Error("You do not have permission to reject jobs.");
  }

  const jobId = String(formData.get("jobId") || "");
  const reason = String(formData.get("reason") || "").trim();

  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
    throw new Error("Invalid job identifier.");
  }

  if (reason.length < 10 || reason.length > 1000) {
    throw new Error(
      "The rejection reason must be between 10 and 1000 characters."
    );
  }

  const supabase = createAdminClient();

  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id, status, title")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchError) {
    console.error("JOB REJECTION FETCH ERROR:", fetchError);
    throw new Error("Unable to retrieve this job.");
  }

  if (!job) {
    throw new Error("Job not found.");
  }

  if (job.status !== "pending") {
    throw new Error("Only pending jobs can be rejected.");
  }

  const { data: updatedJob, error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "rejected",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();

  if (updateError || !updatedJob) {
    console.error("JOB REJECTION UPDATE ERROR:", updateError);
    console.error("JOB REJECTION UPDATED RECORD:", updatedJob);

    throw new Error(
      updateError?.message ||
        "Job update returned no record. Check the admin terminal."
    );
  }

  await recordJobAction(admin.id, jobId, "job.reject", {
    title: job.title,
    previous_status: "pending",
    new_status: "rejected",
    rejection_reason: reason,
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}
