"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";

function returnWithError(message: string): never {
  redirect(`/employers?error=${encodeURIComponent(message)}`);
}

function returnWithSuccess(message: string): never {
  revalidatePath("/employers");
  revalidatePath("/verifications");
  revalidatePath("/dashboard");

  redirect(`/employers?success=${encodeURIComponent(message)}`);
}

async function verifyEmployerPermission() {
  const admin = await getActiveAdmin();

  if (!admin.permissions.includes("employers.manage")) {
    returnWithError(
      "You do not have permission to manage employer verification."
    );
  }

  return admin;
}

function getEmployerId(formData: FormData): string {
  return String(
    formData.get("employerId") || formData.get("userId") || ""
  ).trim();
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function reviewEmployer(
  employerId: string,
  decision: "approved" | "rejected",
  reason: string | null
) {
  const admin = await verifyEmployerPermission();

  if (!isValidUUID(employerId)) {
    returnWithError("Invalid employer account identifier.");
  }

  const supabase = createAdminClient();

  // The database function locks the employer row, rechecks the active
  // administrator permission, updates the status and writes the audit log
  // in one transaction. An audit failure therefore rolls back the change.
  const { data, error } = await supabase.rpc("admin_review_employer", {
    p_admin_id: admin.id,
    p_employer_id: employerId,
    p_decision: decision,
    p_reason: reason,
  });

  if (error || data !== true) {
    console.error("EMPLOYER REVIEW FAILED:", error);

    const message =
      error?.code === "40001"
        ? "This employer has already been reviewed. Refresh the page."
        : error?.code === "42501"
          ? "Your administrator permission is no longer active."
          : "Unable to complete employer verification. No change was saved.";

    returnWithError(message);
  }

  returnWithSuccess(
    decision === "approved"
      ? "Employer approved successfully. The Verified badge is now active."
      : "Employer verification rejected."
  );
}

export async function approveEmployer(formData: FormData) {
  const employerId = getEmployerId(formData);
  await reviewEmployer(employerId, "approved", null);
}

export async function rejectEmployer(formData: FormData) {
  const employerId = getEmployerId(formData);
  const reason = String(formData.get("reason") || "").trim();

  if (reason.length < 10 || reason.length > 1000) {
    returnWithError(
      "Please provide a rejection reason between 10 and 1000 characters."
    );
  }

  await reviewEmployer(employerId, "rejected", reason);
}
