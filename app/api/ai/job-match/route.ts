import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateBaselineMatch, enhanceMatchWithGemini, type MatchInput } from "@/lib/ai/job-matching";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return errorResponse("Please sign in to get your job match.", 401);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 4096) return errorResponse("The request is too large.", 413);

  let body: { jobId?: unknown; aiConsent?: unknown };
  try {
    const rawBody = await request.text();
    if (rawBody.length > 4096) return errorResponse("The request is too large.", 413);
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return errorResponse("A valid request body is required.", 400);
  }

  if (typeof body.jobId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.jobId)) {
    return errorResponse("A valid job ID is required.", 400);
  }

  const [{ data: profile, error: profileError }, { data: job, error: jobError }] = await Promise.all([
    supabase.from("profiles").select("role, skills, education, experience, location, headline, about").eq("id", user.id).maybeSingle(),
    supabase.from("jobs").select("id, title, category, location, description, requirements, skills_required, experience_level, status, application_deadline").eq("id", body.jobId).maybeSingle(),
  ]);

  if (profileError || !profile) return errorResponse("Your profile could not be loaded. Complete your profile and try again.", 404);
  if (!["job_seeker", "professional"].includes(profile.role)) {
    return errorResponse("Job matching is available to job seekers and skilled professionals.", 403);
  }
  if (jobError || !job || job.status !== "approved") return errorResponse("This job is not currently available for matching.", 404);
  if (job.application_deadline && job.application_deadline < new Date().toISOString().slice(0, 10)) {
    return errorResponse("The application deadline for this job has passed.", 410);
  }

  let skills = Array.isArray(profile.skills) ? profile.skills : [];
  let experienceYears = 0;
  let professionalCategory: string | null = null;
  let education = profile.education ?? "";
  let experienceText = profile.experience ?? "";

  if (profile.role === "job_seeker") {
    const { data } = await supabase.from("job_seeker_profiles").select("skills, experience_years, education").eq("user_id", user.id).maybeSingle();
    if (data) {
      skills = [...new Set([...skills, ...(data.skills ?? [])])];
      experienceYears = data.experience_years ?? 0;
      education = data.education ?? education;
    }
  } else {
    const { data } = await supabase.from("professional_profiles").select("skills, experience_years, category, bio").eq("user_id", user.id).maybeSingle();
    if (data) {
      skills = [...new Set([...skills, ...(data.skills ?? [])])];
      experienceYears = data.experience_years ?? 0;
      professionalCategory = data.category ?? null;
      experienceText = data.bio ?? experienceText;
    }
  }

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
      skillsRequired: job.skills_required ?? [],
      experienceLevel: job.experience_level,
    },
  };

  const baseline = calculateBaselineMatch(input);
  let result = baseline;

  // Gemini processing requires explicit opt-in on each request.
  if (body.aiConsent === true) {
    const { data: withinLimit, error: limitError } = await supabase.rpc("consume_ai_match_quota");
    if (limitError || withinLimit !== true) {
      return errorResponse(
        limitError ? "AI matching is temporarily unavailable. Please try again later." : "You have reached the AI matching limit. Try again in one hour.",
        limitError ? 503 : 429
      );
    }
    result = await enhanceMatchWithGemini(input, baseline);
  }

  return NextResponse.json({
    jobId: job.id,
    score: result.score,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    explanation: result.explanation,
    strengths: result.strengths,
    improvementAreas: result.improvementAreas,
    poweredBy: result.source,
    aiDataNotice: body.aiConsent === true
      ? "With your consent, Abijob sent your skills, experience years, professional category, and the job title/category/required skills to Google Gemini to improve this match. Names, contact details, free-text biography, education, and precise locations are not sent."
      : "This match used Abijob's rules-based calculation. No profile data was sent to Google Gemini.",
    disclaimer: "This is an informational compatibility estimate, not a hiring decision or guarantee.",
  }, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Vary": "Cookie",
    },
  });
}
