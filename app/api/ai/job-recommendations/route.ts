import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateBaselineMatch, type MatchInput } from "@/lib/ai/job-matching";

type JobRecord = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  description: string | null;
  requirements: string | null;
  skills_required: string[] | string | null;
  experience_level: string | null;
  application_deadline: string | null;
  created_at: string;
};

function asSkills(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    return value.split(/[,;\n|]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in to view your recommendations." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, skills, education, experience, location, headline, about")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Your profile could not be loaded. Please complete your profile and try again." }, { status: 404 });
  }

  if (profile.role !== "job_seeker" && profile.role !== "professional") {
    return NextResponse.json({ error: "Job recommendations are available to job seekers and skilled professionals." }, { status: 403 });
  }

  let skills = asSkills(profile.skills);
  let experienceYears = 0;
  let education = profile.education ?? "";
  let experienceText = profile.experience ?? "";
  let professionalCategory: string | null = null;

  if (profile.role === "professional") {
    const { data: professional } = await supabase
      .from("professional_profiles")
      .select("skills, experience_years, category, bio")
      .eq("user_id", user.id)
      .maybeSingle();

    if (professional) {
      skills = [...new Set([...skills, ...asSkills(professional.skills)])];
      experienceYears = Number(professional.experience_years) || 0;
      professionalCategory = professional.category ?? null;
      experienceText = professional.bio ?? experienceText;
    }
  } else {
    const { data: seeker } = await supabase
      .from("job_seeker_profiles")
      .select("skills, experience_years, education")
      .eq("user_id", user.id)
      .maybeSingle();

    if (seeker) {
      skills = [...new Set([...skills, ...asSkills(seeker.skills)])];
      experienceYears = Number(seeker.experience_years) || 0;
      education = seeker.education ?? education;
    }
  }

  const [{ data: jobs, error: jobsError }, { data: applications, error: applicationsError }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, category, location, description, requirements, skills_required, experience_level, application_deadline, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("job_applications")
      .select("job_id")
      .eq("applicant_id", user.id),
  ]);

  if (jobsError) {
    return NextResponse.json({ error: "Approved opportunities could not be loaded right now." }, { status: 503 });
  }

  const appliedIds = new Set((applicationsError ? [] : applications ?? []).map((row) => row.job_id));
  const today = new Date().toISOString().slice(0, 10);

  const approvedJobs = (jobs ?? []) as JobRecord[];
  const openApprovedJobs = approvedJobs.filter(
    (job) => !job.application_deadline || job.application_deadline >= today
  );
  const appliedOpenJobsCount = openApprovedJobs.filter((job) => appliedIds.has(job.id)).length;
  const recommendations = openApprovedJobs
    .filter((job) => !appliedIds.has(job.id))
    .map((job) => {
      const input: MatchInput = {
        skills,
        experienceYears,
        experienceText,
        education,
        headline: profile.headline,
        about: profile.about,
        location: profile.location,
        professionalCategory,
        job: {
          title: job.title,
          category: job.category,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          skillsRequired: asSkills(job.skills_required),
          experienceLevel: job.experience_level,
        },
      };
      const match = calculateBaselineMatch(input);
      return {
        id: job.id,
        title: job.title,
        category: job.category || "General",
        location: job.location || "Location not specified",
        applicationDeadline: job.application_deadline,
        createdAt: job.created_at,
        matchScore: match.score,
        matchedSkills: match.matchedSkills.slice(0, 4),
        missingSkills: match.missingSkills.slice(0, 3),
        explanation: match.explanation,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return NextResponse.json({
    recommendations,
    source: "abijob_rules",
    openApprovedJobsCount: openApprovedJobs.length,
    appliedOpenJobsCount,
  }, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Vary": "Cookie",
    },
  });
}
