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

export const ADMIN_EMPLOYERS_PAGE_SIZE = 50;

const VALID_STATUSES: EmployerVerificationStatus[] = [
  "pending",
  "approved",
  "rejected",
];

export async function getAdminEmployers(filters: {
  page?: number;
  search?: string;
  status?: string;
} = {}) {
  const supabase = createAdminClient();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const search = (filters.search ?? "")
    .trim()
    .replace(/[,%()\\*%_'""]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);
  const status = VALID_STATUSES.includes(filters.status as EmployerVerificationStatus)
    ? (filters.status as EmployerVerificationStatus)
    : null;

  let businessQuery = supabase
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
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_EMPLOYERS_PAGE_SIZE, page * ADMIN_EMPLOYERS_PAGE_SIZE - 1);

  if (status) businessQuery = businessQuery.eq("verification_status", status);
  if (search) {
    const pattern = `%${search}%`;
    businessQuery = businessQuery.or([
      `business_name.ilike.${pattern}`,
      `business_type.ilike.${pattern}`,
      `description.ilike.${pattern}`,
      `address.ilike.${pattern}`,
      `website.ilike.${pattern}`,
      `phone.ilike.${pattern}`,
    ].join(","));
  }

  const [businessResult, totalResult, pendingResult, approvedResult, rejectedResult] =
    await Promise.all([
      businessQuery,
      supabase.from("employer_profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("employer_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabase.from("employer_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "approved"),
      supabase.from("employer_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "rejected"),
    ]);

  const countErrors = [totalResult, pendingResult, approvedResult, rejectedResult].find((result) => result.error);
  if (businessResult.error || countErrors) {
    console.error("EMPLOYER DIRECTORY QUERY ERROR:", businessResult.error ?? countErrors?.error);
    throw new Error("Unable to retrieve employer records.");
  }

  const businessProfiles = businessResult.data ?? [];
  const userIds = businessProfiles.map((business) => business.user_id);

  if (userIds.length === 0) {
    return {
      employers: [] as AdminEmployer[],
      counts: {
        total: totalResult.count ?? 0,
        pending: pendingResult.count ?? 0,
        approved: approvedResult.count ?? 0,
        rejected: rejectedResult.count ?? 0,
      },
      page,
      totalFiltered: businessResult.count ?? 0,
      totalPages: Math.max(1, Math.ceil((businessResult.count ?? 0) / ADMIN_EMPLOYERS_PAGE_SIZE)),
    };
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, location")
    .in("id", userIds);

  if (profileError) {
    console.error("EMPLOYER PROFILE QUERY ERROR:", profileError);
    throw new Error("Unable to retrieve employer account profiles.");
  }

  // Resolve Auth identities in batches. This keeps the page at a maximum of
  // 50 records and avoids one Auth request per employer.
  const authUsers = new Map<string, { email: string; created_at: string }>();
  const unresolvedUserIds = new Set(userIds);
  const authPageSize = 1000;
  const maxAuthPages = 20;

  for (let authPage = 1; authPage <= maxAuthPages && unresolvedUserIds.size > 0; authPage += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: authPage,
      perPage: authPageSize,
    });

    if (error) {
      console.error("EMPLOYER AUTH BATCH LOOKUP ERROR:", error.message);
      break;
    }

    const users = data?.users ?? [];
    for (const user of users) {
      if (!unresolvedUserIds.has(user.id)) continue;
      authUsers.set(user.id, {
        email: user.email ?? "Email unavailable",
        created_at: user.created_at,
      });
      unresolvedUserIds.delete(user.id);
    }

    if (users.length < authPageSize) break;
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const employers: AdminEmployer[] = businessProfiles.map((business) => {
    const profile = profileMap.get(business.user_id);
    const authUser = authUsers.get(business.user_id);
    const rawStatus = business.verification_status;
    const verificationStatus: EmployerVerificationStatus =
      rawStatus === "approved" || rawStatus === "rejected" ? rawStatus : "pending";

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
  });

  const totalFiltered = businessResult.count ?? 0;

  return {
    employers,
    counts: {
      total: totalResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      approved: approvedResult.count ?? 0,
      rejected: rejectedResult.count ?? 0,
    },
    page,
    totalFiltered,
    totalPages: Math.max(1, Math.ceil(totalFiltered / ADMIN_EMPLOYERS_PAGE_SIZE)),
  };
}
