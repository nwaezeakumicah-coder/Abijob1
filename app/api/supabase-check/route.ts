import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Supabase environment variables are missing.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`,
      {
        method: "GET",
        headers: {
          apikey: publishableKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Supabase responded, but the connection check failed.",
          status: response.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Abi Job is communicating with Supabase successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Could not reach Supabase. Check your Project URL and internet connection.",
      },
      { status: 500 }
    );
  }
}