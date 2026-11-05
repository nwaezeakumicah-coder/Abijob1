
import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    const { data: admin, error } = await adminClient
      .from("platform_admins")
      .select("role, status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error || !admin || admin.status !== "active") {
      return NextResponse.json(
        { error: "This account is not an active administrator." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      role: admin.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to verify administrator access." },
      { status: 500 }
    );
  }
}
