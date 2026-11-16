import "server-only";

import { createAdminClient } from "./supabase/admin";

export type JobStatus = "pending" | "approved" | "rejected" | "closed";

export type AdminJob = {
  id: string;
  employer_id: string;
  title: string;
  category: string;
  employment_type: string;
  experience_level: string | null;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  skills_required: string[];
  application_deadline: string | null;
  status: JobStatus;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  workplace_type: string | null;
  contact_email: string | null;
  workplace: string | null;
};

export const ADMIN_JOBS_PAGE_SIZE = 50;

const JOB_COLUMNS = `
  id,
  employer_id,
  title,
  category,
  employment_type,
  experience_level,
  location,
  salary_min,
  salary_max,
  salary_currency,
  description,
  requirements,
  responsibilities,
  benefits,
  skills_required,
  application_deadline,
  status,
  rejection_reason,
  published_at,
  created_at,
  updated_at,
  workplace_type,
  contact_email,
  workplace
`;

const VALID_STATUSES: JobStatus[] = ["pending", "approved", "rejected", "closed"];

export async function getAdminJobs(filters: {
  page?: number;
  search?: string;
  status?: string;
} = {}) {
  const supabase = createAdminClient();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const search = (filters.search ?? "").trim().replace(/[,%()\\%_'"*]/g, " ").replace(/\s+/g, " ").slice(0, 100);
  const status = VALID_STATUSES.includes(filters.status as JobStatus)
    ? (filters.status as JobStatus)
    : null;

  let query = supabase
    .from("jobs")
    .select(JOB_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * ADMIN_JOBS_PAGE_SIZE, page * ADMIN_JOBS_PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);

  if (search) {
    const pattern = `%${search}%`;
    const clauses = [
      `title.ilike.${pattern}`,
      `category.ilike.${pattern}`,
      `location.ilike.${pattern}`,
    ];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search)) {
      clauses.push(`employer_id.eq.${search}`);
    }
    query = query.or(clauses.join(","));
  }

  const [jobsResult, totalResult, ...statusResults] = await Promise.all([
    query,
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    ...VALID_STATUSES.map((value) =>
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", value)
    ),
  ]);

  if (jobsResult.error || totalResult.error || statusResults.some((result) => result.error)) {
    console.error(
      "Admin jobs query failed:",
      jobsResult.error?.message ?? totalResult.error?.message ?? statusResults.find((result) => result.error)?.error?.message
    );
    throw new Error("Unable to load jobs. Please try again.");
  }

  const jobs = (jobsResult.data ?? []) as AdminJob[];
  const counts = {
    total: totalResult.count ?? 0,
    pending: statusResults[0].count ?? 0,
    approved: statusResults[1].count ?? 0,
    rejected: statusResults[2].count ?? 0,
    closed: statusResults[3].count ?? 0,
  };
  const totalFiltered = jobsResult.count ?? 0;

  return {
    jobs,
    counts,
    page,
    pageSize: ADMIN_JOBS_PAGE_SIZE,
    totalFiltered,
    totalPages: Math.max(1, Math.ceil(totalFiltered / ADMIN_JOBS_PAGE_SIZE)),
  };
}
