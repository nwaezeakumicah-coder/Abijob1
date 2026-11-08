
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { authorizeAdminRoute } from "../../../../lib/admin/authorization";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { authorized: false, error: "Authentication required." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    let requestedPath = "/admin";

    try {
      const body = await request.json();

      if (
        body &&
        typeof body.path === "string" &&
        body.path.startsWith("/") &&
        !body.path.startsWith("//")
      ) {
        requestedPath = body.path;
      }
    } catch {
      // Use the default admin dashboard path.
    }

    const result = await authorizeAdminRoute(user.id, requestedPath);

    if (!result.authorized) {
      return NextResponse.json(
        {
          authorized: false,
          error: result.error || "Admin access denied.",
        },
        {
          status: result.status || 403,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        authorized: true,
        adminId: result.adminId,
        role: result.role,
        permissions: result.permissions,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Admin authorization failed:", error);

    return NextResponse.json(
      {
        authorized: false,
        error: "Unable to verify admin access.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
