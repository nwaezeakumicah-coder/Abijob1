import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  try {
    const supabase = await createClient();

    const code = request.nextUrl.searchParams.get("code");
    const tokenHash = request.nextUrl.searchParams.get("token_hash");
    const type = request.nextUrl.searchParams.get("type");

    let authenticationError = false;

    if (code) {
      const { error } =
        await supabase.auth.exchangeCodeForSession(code);

      authenticationError = Boolean(error);
    } else if (tokenHash && type) {
      const allowedTypes: EmailOtpType[] = [
        "invite",
        "magiclink",
        "signup",
        "recovery",
        "email",
        "email_change",
      ];

      if (!allowedTypes.includes(type as EmailOtpType)) {
        authenticationError = true;
      } else {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });

        authenticationError = Boolean(error);
      }
    } else {
      authenticationError = true;
    }

    if (authenticationError) {
      loginUrl.searchParams.set(
        "error",
        "authentication-failed"
      );

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(
      new URL("/auth/complete", request.url)
    );
  } catch (error) {
    console.error("Admin authentication callback failed:", error);

    loginUrl.searchParams.set(
      "error",
      "authentication-failed"
    );

    return NextResponse.redirect(loginUrl);
  }
}