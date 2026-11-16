import "server-only";

import { createAdminClient } from "./supabase/admin";

const PAGE_SIZE = 50;
const AUTH_SCAN_PAGE_SIZE = 1000;
const MAX_AUTH_SCAN_PAGES = 50;

export type UserCategory =
  | "job_seeker"
  | "professional"
  | "employer"
  | "no_profile";

export type UserAccountStatus =
  | "active"
  | "unverified"
  | "suspended"
  | "deleted";

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

type UserFilters = {
  search?: string;
  category?: UserCategory | "all";
  status?: UserAccountStatus | "all";
};

function getAccountStatus(user: AdminUser): UserAccountStatus {
  if (user.deletedAt) return "deleted";
  if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) return "suspended";
  if (!user.emailConfirmedAt) return "unverified";
  return "active";
}

async function mapAuthUsers(
  supabase: ReturnType<typeof createAdminClient>,
  authUsers: Awaited<ReturnType<ReturnType<typeof createAdminClient>["auth"]["admin"]["listUsers"]>>["data"]["users"]
): Promise<AdminUser[]> {
  const userIds = authUsers.map((user) => user.id);
  if (userIds.length === 0) return [];

  const [seekersResult, professionalsResult, employersResult] = await Promise.all([
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

  if (seekersResult.error || professionalsResult.error || employersResult.error) {
    console.error("ADMIN USER PROFILE LOOKUP ERROR:", {
      seekers: seekersResult.error,
      professionals: professionalsResult.error,
      employers: employersResult.error,
    });
    throw new Error("Unable to retrieve user profile information.");
  }

  const seekerProfiles = new Map((seekersResult.data ?? []).map((profile) => [profile.user_id, profile]));
  const professionalProfiles = new Map((professionalsResult.data ?? []).map((profile) => [profile.user_id, profile]));
  const employerProfiles = new Map((employersResult.data ?? []).map((profile) => [profile.user_id, profile]));

  return authUsers.map((user) => {
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
      profileDetail = professional.service_area || "Service area not provided";
    } else if (employer) {
      category = "employer";
      profileLabel = employer.business_name || "Employer";
      profileDetail = employer.business_type || "Business type not provided";
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
}

function matchesFilters(user: AdminUser, filters: Required<UserFilters>) {
  const categoryMatches = filters.category === "all" || user.category === filters.category;
  const statusMatches = filters.status === "all" || getAccountStatus(user) === filters.status;
  const search = filters.search.toLowerCase();
  const searchMatches = !search || [
    user.email,
    user.phone ?? "",
    user.profileLabel,
    user.profileDetail,
  ].join(" ").toLowerCase().includes(search);

  return categoryMatches && statusMatches && searchMatches;
}

export async function getAdminUsers(page = 1, filters: UserFilters = {}) {
  const supabase = createAdminClient();
  const safePage = Math.max(1, Math.floor(page));
  const normalizedFilters: Required<UserFilters> = {
    search: (filters.search ?? "").trim().slice(0, 120),
    category: filters.category ?? "all",
    status: filters.status ?? "all",
  };

  const shouldSearchAllAccounts =
    normalizedFilters.search.length > 0 ||
    normalizedFilters.category !== "all" ||
    normalizedFilters.status !== "all";

  if (!shouldSearchAllAccounts) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: safePage,
      perPage: PAGE_SIZE,
    });

    if (error) {
      console.error("AUTH USERS ERROR:", error);
      throw new Error("Unable to retrieve platform accounts.");
    }

    return {
      users: await mapAuthUsers(supabase, data.users),
      page: safePage,
      hasNextPage: data.users.length === PAGE_SIZE,
      searchLimitReached: false,
    };
  }

  // Search/filter mode scans Auth in bounded batches so results are global,
  // not restricted to whichever 50 accounts happen to be on the current page.
  const firstRequiredResult = (safePage - 1) * PAGE_SIZE;
  const requiredMatches = firstRequiredResult + PAGE_SIZE + 1;
  const matchingUsers: AdminUser[] = [];
  let authPage = 1;
  let exhaustedAuthUsers = false;
  let searchLimitReached = false;

  while (authPage <= MAX_AUTH_SCAN_PAGES && matchingUsers.length < requiredMatches) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: authPage,
      perPage: AUTH_SCAN_PAGE_SIZE,
    });

    if (error) {
      console.error("AUTH USER SEARCH ERROR:", error);
      throw new Error("Unable to search platform accounts.");
    }

    const authUsers = data.users ?? [];
    if (authUsers.length === 0) {
      exhaustedAuthUsers = true;
      break;
    }

    const mappedUsers = await mapAuthUsers(supabase, authUsers);
    matchingUsers.push(...mappedUsers.filter((user) => matchesFilters(user, normalizedFilters)));

    if (authUsers.length < AUTH_SCAN_PAGE_SIZE) {
      exhaustedAuthUsers = true;
      break;
    }

    authPage += 1;
  }

  if (!exhaustedAuthUsers && authPage > MAX_AUTH_SCAN_PAGES) {
    searchLimitReached = true;
  }

  return {
    users: matchingUsers.slice(firstRequiredResult, firstRequiredResult + PAGE_SIZE),
    page: safePage,
    hasNextPage:
      matchingUsers.length > firstRequiredResult + PAGE_SIZE || searchLimitReached,
    searchLimitReached,
  };
}
