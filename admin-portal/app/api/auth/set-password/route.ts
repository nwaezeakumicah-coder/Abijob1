
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Reject cross-origin password setup requests.
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const password =
      typeof body.password === "string" ? body.password : "";

    if (password.length < 12 || password.length > 128) {
      return NextResponse.json(
        { error: "Your password must contain between 12 and 128 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Your invitation session is invalid or has expired. Open your invitation link again." },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Your email address has not been verified. Please use your invitation link." },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    // The invitation must belong to this exact authenticated user.
    const { data: invitation, error: invitationError } =
      await adminClient
        .from("platform_admins")
        .select("id, email, role, status, auth_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (invitationError) {
      console.error("Invitation lookup failed:", invitationError);

      return NextResponse.json(
        { error: "Unable to verify your administrator invitation." },
        { status: 500 }
      );
    }

    if (
      !invitation ||
      invitation.email?.toLowerCase() !== user.email.toLowerCase() ||
      invitation.auth_user_id !== user.id ||
      invitation.status !== "invited" ||
      invitation.role === "super_admin"
    ) {
      return NextResponse.json(
        { error: "This account does not have a valid pending administrator invitation." },
        { status: 403 }
      );
    }

    // Read existing trusted metadata so unrelated fields are preserved.
    const {
      data: authUserResult,
      error: getAuthUserError,
    } = await adminClient.auth.admin.getUserById(user.id);

    if (getAuthUserError || !authUserResult.user) {
      console.error("Unable to retrieve invited Auth user:", getAuthUserError);

      return NextResponse.json(
        { error: "Unable to verify your account. Please try again." },
        { status: 500 }
      );
    }

    const existingMetadata =
      authUserResult.user.app_metadata ?? {};

    // Set the password and a server-controlled completion marker.
    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(user.id, {
        password,
        app_metadata: {
          ...existingMetadata,
          admin_password_setup_complete: true,
        },
      });

    if (updateError) {
      console.error("Administrator password setup failed:", updateError);

      return NextResponse.json(
        { error: "Unable to set your password. Please try again." },
        { status: 500 }
      );
    }

    // Activate only after password setup has succeeded.
    const { error: activationError } =
      await adminClient.rpc("activate_invited_platform_admin", {
        p_auth_user_id: user.id,
      });

    if (activationError) {
      console.error(
        "Administrator invitation activation failed:",
        activationError
      );

      return NextResponse.json(
        {
          error: "Your password was saved, but account activation could not be completed. Please try again.",
        },
        { status: 500 }
      );
    }

    // Confirm that the database now recognises this account as active.
    const { data: activatedAdmin, error: verificationError } =
      await adminClient
        .from("platform_admins")
        .select("id, status")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (
      verificationError ||
      !activatedAdmin ||
      activatedAdmin.status !== "active"
    ) {
      console.error(
        "Administrator activation verification failed:",
        verificationError
      );

      return NextResponse.json(
        { error: "Your account activation could not be verified. Please contact the Super Admin." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been created and your administrator account is active.",
    });
  } catch (error) {
    console.error("Password setup endpoint failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
