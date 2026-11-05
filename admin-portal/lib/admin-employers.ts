
import "server-only";

import { createAdminClient } from "./supabase/admin";

export type EmployerVerificationStatus =
  | "pending"
  | "approved"
  | "rejected";

export type AdminEmployer = {
  userId: string;
  email: string;
  fullName: string;
  accountPhone: string;
  accountLocation: string;
  businessName: string;
  businessType: string;
  description: string;
  address: string;
  website: string;
  businessPhone: string;
  verificationStatus: EmployerVerificationStatus;
  createdAt: string;
};

export async function getAdminEmployers() {
  const supabase = createAdminClient();

  // Retrieve employer business profiles first.
  const { data: businesses, error: businessError } = await supabase
    .from("employer_profiles")
    .select(`
      user_id,
      business_name,
      business_type,
      description,
      address,
      website,
      phone,
      verification_status,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (businessError) {
    console.error("EMPLOYER QUERY ERROR:", businessError);
    throw new Error("Unable to retrieve employer records.");
  }

  const businessProfiles = businesses ?? [];

  if (businessProfiles.length === 0) {
    return {
      employers: [] as AdminEmployer[],
      counts: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    };
  }

  const userIds = businessProfiles.map(
    (business) => business.user_id
  );

  // Retrieve matching platform profiles.
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, location")
    .in("id", userIds);

  if (profileError) {
    console.error("EMPLOYER PROFILE QUERY ERROR:", profileError);
    throw new Error("Unable to retrieve employer account profiles.");
  }

  // Retrieve matching authentication users.
  const authUsers = new Map<
    string,
    { email: string; created_at: string }
  >();

  for (const userId of userIds) {
    const { data, error } =
      await supabase.auth.admin.getUserById(userId);

    if (error) {
      console.error(
        `EMPLOYER AUTH LOOKUP ERROR (${userId}):`,
        error.message
      );
      continue;
    }

    if (data.user) {
      authUsers.set(userId, {
        email: data.user.email ?? "Email unavailable",
        created_at: data.user.created_at,
      });
    }
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile,
    ])
  );

  const employers: AdminEmployer[] = businessProfiles.map(
    (business) => {
      const profile = profileMap.get(business.user_id);
      const authUser = authUsers.get(business.user_id);

      const rawStatus = business.verification_status;

      const verificationStatus: EmployerVerificationStatus =
        rawStatus === "approved" || rawStatus === "rejected"
          ? rawStatus
          : "pending";

      return {
        userId: business.user_id,
        email: authUser?.email ?? "Email unavailable",
        fullName: profile?.full_name ?? "Name not provided",
        accountPhone: profile?.phone ?? "",
        accountLocation: profile?.location ?? "",
        businessName: business.business_name ?? "Unnamed business",
        businessType: business.business_type ?? "Not specified",
        description: business.description ?? "",
        address: business.address ?? "",
        website: business.website ?? "",
        businessPhone: business.phone ?? "",
        verificationStatus,
        createdAt: business.created_at,
      };
    }
  );

  return {
    employers,
    counts: {
      total: employers.length,
      pending: employers.filter(
        (employer) => employer.verificationStatus === "pending"
      ).length,
      approved: employers.filter(
        (employer) => employer.verificationStatus === "approved"
      ).length,
      rejected: employers.filter(
        (employer) => employer.verificationStatus === "rejected"
      ).length,
    },
  };
}
