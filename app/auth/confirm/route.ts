import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const confirmationUrl = new URL(
    `/api/auth/confirm${requestUrl.search}`,
    requestUrl.origin
  );

  return NextResponse.redirect(confirmationUrl, 307);
}
