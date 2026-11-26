export type MatchInput = {
  skills: string[];
  experienceYears: number;
  experienceText?: string | null;
  education?: string | null;
  headline?: string | null;
  about?: string | null;
  location?: string | null;
  professionalCategory?: string | null;
  job: {
    title: string;
    category: string | null;
    location: string | null;
    description: string | null;
    requirements: string | null;
    skillsRequired: string[];
    experienceLevel: string | null;
  };
};

export type MatchResult = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  strengths: string[];
  improvementAreas: string[];
  source: "rules" | "gemini";
};

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.flatMap((value) => (value ?? "").split(/[,;\n|]/).map((item) => item.trim()).filter(Boolean)))];
}

export function calculateBaselineMatch(input: MatchInput): MatchResult {
  const applicantSkills = uniqueStrings(input.skills).map(normalize);
  const requiredSkills = uniqueStrings(input.job.skillsRequired).map(normalize);
  const matchedSkills = requiredSkills.filter((required) =>
    applicantSkills.some((skill) => skill === required || skill.includes(required) || required.includes(skill))
  );
  const missingSkills = requiredSkills.filter((required) => !matchedSkills.includes(required));

  const skillScore = requiredSkills.length
    ? (matchedSkills.length / requiredSkills.length) * 60
    : 30;
  const experienceTarget = input.job.experienceLevel?.match(/(\d+)/)?.[1];
  const targetYears = experienceTarget ? Number(experienceTarget) : 0;
  const experienceScore = targetYears
    ? Math.min(input.experienceYears / targetYears, 1) * 15
    : input.experienceYears > 0 ? 12 : 6;
  const applicantLocation = normalize(input.location ?? "");
  const jobLocation = normalize(input.job.location ?? "");
  const locationScore = !applicantLocation || !jobLocation || jobLocation.includes("remote") || applicantLocation === jobLocation || applicantLocation.includes(jobLocation) || jobLocation.includes(applicantLocation) ? 10 : 3;
  const educationScore = input.education?.trim() ? 10 : 4;
  const categoryScore = input.professionalCategory && input.job.category && normalize(input.professionalCategory) === normalize(input.job.category) ? 5 : 2;

  const score = Math.max(0, Math.min(100, Math.round(skillScore + experienceScore + locationScore + educationScore + categoryScore)));
  const strengths = [
    ...(matchedSkills.length ? [`Relevant skills: ${matchedSkills.join(", ")}`] : []),
    ...(input.experienceYears > 0 ? [`${input.experienceYears} year(s) of stated experience`] : []),
    ...(locationScore === 10 ? ["Location appears compatible"] : []),
  ];
  const improvementAreas = [
    ...(missingSkills.length ? [`Consider developing: ${missingSkills.join(", ")}`] : []),
    ...(!input.education?.trim() ? ["Add education or relevant training details to your profile"] : []),
  ];

  return {
    score,
    matchedSkills,
    missingSkills,
    explanation: "This preliminary score is calculated from the profile information currently available. It is not a hiring decision.",
    strengths,
    improvementAreas,
    source: "rules",
  };
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export async function enhanceMatchWithGemini(input: MatchInput, baseline: MatchResult): Promise<MatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return baseline;

  const prompt = {
    task: "Assess job-to-applicant compatibility for career guidance. Do not make a hiring decision. Do not infer protected characteristics. Use only the supplied facts. Return valid JSON only with scoreAdjustment (integer from -10 to 10), explanation (one short paragraph), strengths (array of short strings), improvementAreas (array of short strings), matchedSkills (array of supplied required skill names), and missingSkills (array of supplied required skill names). Do not increase the score for demographic or personal identity information.",
    applicant: {
      skills: input.skills,
      experienceYears: input.experienceYears,
      experienceText: input.experienceText ?? "",
      education: input.education ?? "",
      headline: input.headline ?? "",
      about: input.about ?? "",
      location: input.location ?? "",
      professionalCategory: input.professionalCategory ?? "",
    },
    job: input.job,
    baseline: {
      score: baseline.score,
      matchedSkills: baseline.matchedSkills,
      missingSkills: baseline.missingSkills,
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: JSON.stringify(prompt) }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      }
    );

    if (!response.ok) return baseline;
    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return baseline;

    const parsed = JSON.parse(text) as {
      scoreAdjustment?: number;
      explanation?: string;
      strengths?: string[];
      improvementAreas?: string[];
      matchedSkills?: string[];
      missingSkills?: string[];
    };
    const adjustment = Number.isFinite(parsed.scoreAdjustment)
      ? Math.max(-10, Math.min(10, Math.round(parsed.scoreAdjustment as number)))
      : 0;
    const allowedRequiredSkills = new Set(input.job.skillsRequired.map(normalize));
    const matchedSkills = Array.isArray(parsed.matchedSkills)
      ? parsed.matchedSkills.filter((skill): skill is string => typeof skill === "string" && allowedRequiredSkills.has(normalize(skill))).slice(0, 30)
      : baseline.matchedSkills;
    const missingSkills = Array.isArray(parsed.missingSkills)
      ? parsed.missingSkills.filter((skill): skill is string => typeof skill === "string" && allowedRequiredSkills.has(normalize(skill))).slice(0, 30)
      : baseline.missingSkills;

    return {
      score: Math.max(0, Math.min(100, baseline.score + adjustment)),
      matchedSkills,
      missingSkills,
      explanation: typeof parsed.explanation === "string" ? parsed.explanation.slice(0, 700) : baseline.explanation,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((item): item is string => typeof item === "string").slice(0, 6) : baseline.strengths,
      improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas.filter((item): item is string => typeof item === "string").slice(0, 6) : baseline.improvementAreas,
      source: "gemini",
    };
  } catch {
    return baseline;
  }
}
