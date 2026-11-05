
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

export async function getAdminJobs() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(`
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
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin jobs query failed:", error.message);
    throw new Error("Unable to load jobs. Please try again.");
  }

  const jobs = (data ?? []) as AdminJob[];

  return {
    jobs,
    counts: {
      total: jobs.length,
      pending: jobs.filter((job) => job.status === "pending").length,
      approved: jobs.filter((job) => job.status === "approved").length,
      rejected: jobs.filter((job) => job.status === "rejected").length,
      closed: jobs.filter((job) => job.status === "closed").length,
    },
  };
}
