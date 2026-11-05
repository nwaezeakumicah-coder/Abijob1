
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
    formData.get("employerId") ||
      formData.get("userId") ||
      ""
  ).trim();
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function recordEmployerAction(
  adminId: string,
  employerId: string,
  action: "employer.approve" | "employer.reject",
  details: Record<string, string>
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("admin_audit_logs")
    .insert({
      actor_admin_id: adminId,
      action,
      entity_type: "employer",
      entity_id: employerId,
      details,
    });

  if (error) {
    console.error("EMPLOYER AUDIT LOG ERROR:", error);
    return false;
  }

  return true;
}

export async function approveEmployer(formData: FormData) {
  const admin = await verifyEmployerPermission();
  const employerId = getEmployerId(formData);

  if (!isValidUUID(employerId)) {
    returnWithError("Invalid employer account identifier.");
  }

  const supabase = createAdminClient();

  const { data: employer, error: fetchError } = await supabase
    .from("employer_profiles")
    .select("user_id, business_name, verification_status")
    .eq("user_id", employerId)
    .maybeSingle();

  if (fetchError || !employer) {
    console.error("EMPLOYER APPROVAL FETCH ERROR:", fetchError);
    returnWithError("Employer account not found.");
  }

  if (employer.verification_status !== "pending") {
    returnWithError("Only pending employers can be approved.");
  }

  const verifiedAt = new Date().toISOString();

  const { data: updatedEmployer, error: updateError } = await supabase
    .from("employer_profiles")
    .update({
      verification_status: "approved",
      verified_at: verifiedAt,
      verified_by: admin.id,
    })
    .eq("user_id", employerId)
    .eq("verification_status", "pending")
    .select("user_id, verified_at, verified_by")
    .maybeSingle();

  if (updateError || !updatedEmployer) {
    console.error("EMPLOYER APPROVAL UPDATE ERROR:", updateError);

    returnWithError(
      updateError?.message || "Unable to approve this employer."
    );
  }

  const auditSaved = await recordEmployerAction(
    admin.id,
    employerId,
    "employer.approve",
    {
      business_name: employer.business_name ?? "Unnamed business",
      previous_status: "pending",
      new_status: "approved",
      verified_at: verifiedAt,
      verification_type: "employer",
    }
  );

  if (!auditSaved) {
    revalidatePath("/employers");
    revalidatePath("/verifications");
    revalidatePath("/dashboard");

    redirect(
      "/employers?warning=" +
        encodeURIComponent(
          "Employer approved and verification badge activated, but the audit log could not be saved. Please report this to the system administrator."
        )
    );
  }

  returnWithSuccess(
    "Employer approved successfully. The Verified badge is now active."
  );
}

export async function rejectEmployer(formData: FormData) {
  const admin = await verifyEmployerPermission();
  const employerId = getEmployerId(formData);
  const reason = String(formData.get("reason") || "").trim();

  if (!isValidUUID(employerId)) {
    returnWithError("Invalid employer account identifier.");
  }

  if (reason.length < 10 || reason.length > 1000) {
    returnWithError(
      "Please provide a rejection reason between 10 and 1000 characters."
    );
  }

  const supabase = createAdminClient();

  const { data: employer, error: fetchError } = await supabase
    .from("employer_profiles")
    .select("user_id, business_name, verification_status")
    .eq("user_id", employerId)
    .maybeSingle();

  if (fetchError || !employer) {
    console.error("EMPLOYER REJECTION FETCH ERROR:", fetchError);
    returnWithError("Employer account not found.");
  }

  if (employer.verification_status !== "pending") {
    returnWithError("Only pending employers can be rejected.");
  }

  const { data: updatedEmployer, error: updateError } = await supabase
    .from("employer_profiles")
    .update({
      verification_status: "rejected",
      verified_at: null,
      verified_by: null,
    })
    .eq("user_id", employerId)
    .eq("verification_status", "pending")
    .select("user_id")
    .maybeSingle();

  if (updateError || !updatedEmployer) {
    console.error("EMPLOYER REJECTION UPDATE ERROR:", updateError);

    returnWithError(
      updateError?.message || "Unable to reject this employer."
    );
  }

  const auditSaved = await recordEmployerAction(
    admin.id,
    employerId,
    "employer.reject",
    {
      business_name: employer.business_name ?? "Unnamed business",
      previous_status: "pending",
      new_status: "rejected",
      rejection_reason: reason,
    }
  );

  if (!auditSaved) {
    revalidatePath("/employers");
    revalidatePath("/verifications");

    redirect(
      "/employers?warning=" +
        encodeURIComponent(
          "Employer rejected, but the audit log could not be saved. Please report this to the system administrator."
        )
    );
  }

  returnWithSuccess("Employer verification rejected.");
}
