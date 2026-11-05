
import "server-only";

import { createAdminClient } from "./supabase/admin";

const PAGE_SIZE = 50;

export type UserCategory =
  | "job_seeker"
  | "professional"
  | "employer"
  | "no_profile";

export type AdminUser = {
  id: string;
  email: string;
  phone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
  deletedAt: string | null;
  category: UserCategory;
  profileLabel: string;
  profileDetail: string;
};

export async function getAdminUsers(page = 1) {
  const supabase = createAdminClient();

  const safePage = Math.max(1, Math.floor(page));

  // Retrieve registered accounts from Supabase Authentication.
  const { data, error } = await supabase.auth.admin.listUsers({
    page: safePage,
    perPage: PAGE_SIZE,
  });

  if (error) {
    console.error("AUTH USERS ERROR:", error);
    throw new Error("Unable to retrieve platform accounts.");
  }

  const authUsers = data.users;
  const userIds = authUsers.map((user) => user.id);

  if (userIds.length === 0) {
    return {
      users: [] as AdminUser[],
      page: safePage,
      hasNextPage: false,
    };
  }

  // Retrieve the three profile categories.
  const [seekersResult, professionalsResult, employersResult] =
    await Promise.all([
      supabase
        .from("job_seeker_profiles")
        .select("user_id, headline, skills, experience_years")
        .in("user_id", userIds),

      supabase
        .from("professional_profiles")
        .select("user_id, category, skills, experience_years, service_area")
        .in("user_id", userIds),

      supabase
        .from("employer_profiles")
        .select("user_id, business_name, business_type, verification_status")
        .in("user_id", userIds),
    ]);

  // Log the actual Supabase errors for diagnosis.
  if (seekersResult.error) {
    console.error("JOB SEEKER PROFILE ERROR:", seekersResult.error);
  }

  if (professionalsResult.error) {
    console.error("PROFESSIONAL PROFILE ERROR:", professionalsResult.error);
  }

  if (employersResult.error) {
    console.error("EMPLOYER PROFILE ERROR:", employersResult.error);
  }

  if (
    seekersResult.error ||
    professionalsResult.error ||
    employersResult.error
  ) {
    throw new Error(
      "Unable to retrieve user profile information. Check the admin terminal for details."
    );
  }

  // Match profiles to their authentication accounts.
  const seekerProfiles = new Map(
    (seekersResult.data ?? []).map((profile) => [
      profile.user_id,
      profile,
    ])
  );

  const professionalProfiles = new Map(
    (professionalsResult.data ?? []).map((profile) => [
      profile.user_id,
      profile,
    ])
  );

  const employerProfiles = new Map(
    (employersResult.data ?? []).map((profile) => [
      profile.user_id,
      profile,
    ])
  );

  // Build the directory records.
  const users: AdminUser[] = authUsers.map((user) => {
    const seeker = seekerProfiles.get(user.id);
    const professional = professionalProfiles.get(user.id);
    const employer = employerProfiles.get(user.id);

    let category: UserCategory = "no_profile";
    let profileLabel = "No profile found";
    let profileDetail = "Account has no matching profile record";

    if (seeker) {
      category = "job_seeker";
      profileLabel = seeker.headline || "Job seeker";
      profileDetail = `${seeker.experience_years} years of experience`;
    } else if (professional) {
      category = "professional";
      profileLabel = professional.category || "Skilled professional";
      profileDetail =
        professional.service_area || "Service area not provided";
    } else if (employer) {
      category = "employer";
      profileLabel = employer.business_name || "Employer";
      profileDetail =
        employer.business_type || "Business type not provided";
    }

    return {
      id: user.id,
      email: user.email ?? "No email address",
      phone: user.phone ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      emailConfirmedAt: user.email_confirmed_at ?? null,
      bannedUntil: user.banned_until ?? null,
      deletedAt: user.deleted_at ?? null,
      category,
      profileLabel,
      profileDetail,
    };
  });

  return {
    users,
    page: safePage,
    hasNextPage: authUsers.length === PAGE_SIZE,
  };
}
