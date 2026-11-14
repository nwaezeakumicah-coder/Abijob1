import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_LENGTH = 12000;

type AssistMode = "cv-summary" | "interview-review";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Please sign in to use Abi Job career tools." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !["job_seeker", "professional"].includes(profile.role)) {
      return NextResponse.json({ error: "This career tool is available to Job Seekers and Skilled Professionals." }, { status: 403 });
    }

    const { data: hasAccess, error: accessError } = await supabase.rpc("has_platform_access");
    if (accessError || hasAccess !== true) {
      return NextResponse.json({ error: "An active Abi Job subscription is required to use AI career tools." }, { status: 403 });
    }

    const body = await request.json();
    const mode = body?.mode as AssistMode;
    const context = typeof body?.context === "string" ? body.context.trim() : "";

    if (!["cv-summary", "interview-review"].includes(mode) || !context || context.length > MAX_INPUT_LENGTH) {
      return NextResponse.json({ error: "Please provide valid career information and try again." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI assistance is not configured yet. Abi Job will enable it once the secure AI service key has been added." }, { status: 503 });
    }

    const instructions = mode === "cv-summary"
      ? "You are Abi Job's professional CV writing coach for Nigerian job seekers and skilled professionals. Write a concise, compelling 3-4 sentence professional summary using only facts supplied by the user. Never invent qualifications, years of experience, employers, achievements, metrics or certifications. If experience is limited, emphasize genuine transferable skills and willingness to learn. Return only the summary text."
      : "You are Abi Job's interview coach. Evaluate the candidate's answer to the stated interview question. Give a balanced, practical review with: Overall assessment, What works well, What to improve, A stronger answer structure, and one specific practice tip. Do not invent experience or rewrite the answer with fabricated achievements. Be encouraging but honest. Plain text with short headings.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: mode === "cv-summary" ? 220 : 650,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: context },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);
      console.error("Career AI provider error:", response.status, details?.error?.type || "unknown");
      return NextResponse.json({ error: "The AI coach is temporarily unavailable. Please try again shortly." }, { status: 502 });
    }

    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content;

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "The AI coach returned an empty response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ result: text.trim() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Career AI request failed:", error);
    return NextResponse.json({ error: "We could not complete that request. Please try again." }, { status: 500 });
  }
}
