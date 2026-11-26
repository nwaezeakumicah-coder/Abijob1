import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateBaselineMatch, type MatchInput } from "@/lib/ai/job-matching";

type JobRecord = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  skills_required: string[] | null;
  experience_level: string | null;
  status: string;
};

type ApplicationRecord = {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  applicant_name: string | null;
  applicant_title: string | null;
  applicant_experience: string | null;
  applicant_skills: string | null;
  applicant_location: string | null;
};

type ApplicantProfile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  skills: string[] | null;
  experience: string | null;
  location: string | null;
  avatar_url: string | null;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
  });
}

function splitSkills(...values: Array<string | string[] | null | undefined>): string[] {
  const all = values.flatMap((value) => {
    if (Array.isArray(value)) return value;
    return (value ?? "").split(/[,;\n|]/);
  });
  return [...new Set(all.map((skill) => skill.trim()).filter(Boolean))].slice(0, 60);
}

function getExperienceYears(value: string | null | undefined): number {
  if (!value) return 0;
  const match = value.match(/(\d{1,2})(?:\s*\+)?\s*(?:years?|yrs?)/i)
    ?? value.match(/(?:^|\D)(\d{1,2})(?:\D|$)/);
  if (!match) return 0;
  return Math.max(0, Math.min(60, Number(match[1]) || 0));
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return errorResponse("Please sign in to view candidate matches.", 401);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) return errorResponse("Your account profile could not be loaded.", 404);
  if (profile.role !== "employer") return errorResponse("Candidate matching is available to employer accounts only.", 403);

  const requestedJobId = request.nextUrl.searchParams.get("jobId");
  if (requestedJobId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedJobId)) {
    return errorResponse("A valid job ID is required.", 400);
  }

  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, category, location, skills_required, experience_level, status")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  if (requestedJobId) jobsQuery = jobsQuery.eq("id", requestedJobId);

  const { data: jobData, error: jobsError } = await jobsQuery;
  if (jobsError) return errorResponse("Your vacancies could not be loaded. Please try again.", 500);

  const jobs = (jobData ?? []) as JobRecord[];
  if (!jobs.length) {
    return NextResponse.json({ jobs: [], candidates: [], totalApplications: 0 }, {
      headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
    });
  }

  const jobIds = jobs.map((job) => job.id);
  const { data: applicationData, error: applicationsError } = await supabase
    .from("job_applications")
    .select("id, job_id, applicant_id, status, created_at, applicant_name, applicant_title, applicant_experience, applicant_skills, applicant_location")
    .in("job_id", jobIds)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false })
    .limit(500);

  if (applicationsError) return errorResponse("Applicant records could not be loaded. Please try again.", 500);

  const applications = (applicationData ?? []) as ApplicationRecord[];
  if (!applications.length) {
    return NextResponse.json({
      jobs: jobs.map(({ id, title, status }) => ({ id, title, status })),
      candidates: [],
      totalApplications: 0,
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
    });
  }

  const applicantIds = [...new Set(applications.map((application) => application.applicant_id))];
  const { data: profileData, error: applicantProfilesError } = await supabase.rpc(
    "get_employer_applicant_profiles",
    { p_applicant_ids: applicantIds }
  );

  if (applicantProfilesError) {
    return errorResponse("Secure applicant profile details could not be loaded. Please try again.", 500);
  }

  const profileMap = new Map<string, ApplicantProfile>(
    ((profileData ?? []) as ApplicantProfile[]).map((item) => [item.id, item])
  );
  const jobMap = new Map(jobs.map((job) => [job.id, job]));

  const candidates = applications.flatMap((application) => {
    const job = jobMap.get(application.job_id);
    if (!job) return [];

    const applicant = profileMap.get(application.applicant_id);
    const experienceText = application.applicant_experience || applicant?.experience || "";
    const skills = splitSkills(application.applicant_skills, applicant?.skills);
    const input: MatchInput = {
      skills,
      experienceYears: getExperienceYears(experienceText),
      experienceText,
      headline: application.applicant_title || applicant?.headline || "",
      location: application.applicant_location || applicant?.location || "",
      professionalCategory: null,
      education: null,
      job: {
        title: job.title,
        category: job.category,
        location: job.location,
        description: null,
        requirements: null,
        skillsRequired: job.skills_required ?? [],
        experienceLevel: job.experience_level,
      },
    };

    const match = calculateBaselineMatch(input);
    return [{
      applicationId: application.id,
      jobId: job.id,
      jobTitle: job.title,
      applicantName: application.applicant_name?.trim() || applicant?.full_name?.trim() || "Abijob Applicant",
      headline: application.applicant_title?.trim() || applicant?.headline || "",
      avatarPath: applicant?.avatar_url || null,
      status: application.status,
      appliedAt: application.created_at,
      experience: experienceText,
      experienceYears: input.experienceYears,
      location: application.applicant_location || applicant?.location || "",
      skills,
      score: match.score,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      strengths: match.strengths,
      improvementAreas: match.improvementAreas,
      explanation: "Preliminary compatibility estimate based on the applicant information available in Abijob. It is not a hiring decision.",
    }];
  }).sort((a, b) => b.score - a.score || new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

  return NextResponse.json({
    jobs: jobs.map(({ id, title, status }) => ({ id, title, status })),
    candidates,
    totalApplications: applications.length,
  }, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}
