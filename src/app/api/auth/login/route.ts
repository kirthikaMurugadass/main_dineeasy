import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const admin = createAdminClient();

    // Find user by email (case-insensitive)
    const { data: user, error: fetchError } = await admin
      .from("users")
      .select("id, email, password_hash, auth_user_id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    // Security: Always return same error message to prevent user enumeration
    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare password with stored hash using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // User authenticated successfully with bcrypt
    // Now ensure Supabase Auth user exists (should have been created during registration)
    let authUserId = user.auth_user_id;

    // If no auth_user_id, try to find or create Supabase Auth user
    if (!authUserId) {
      try {
        // Try to find existing Supabase Auth user by email
        const { data: existingAuthUsers } = await admin.auth.admin.listUsers();
        const existingUser = existingAuthUsers?.users?.find(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );

        if (existingUser) {
          authUserId = existingUser.id;
          // Update password to match our bcrypt-verified password
          await admin.auth.admin.updateUserById(existingUser.id, {
            password: password,
          });
          // Update custom user record with auth_user_id
          await admin
            .from("users")
            .update({ auth_user_id: authUserId })
            .eq("id", user.id);
        } else {
          // Create new Supabase Auth user
          const { data: authUser, error: authError } = await admin.auth.admin.createUser({
            email: normalizedEmail,
            password: password,
            email_confirm: true,
          });

          if (authError || !authUser?.user?.id) {
            console.error("Error creating Supabase Auth user:", authError);
            return NextResponse.json(
              { error: "Failed to create authentication session. Please try registering again." },
              { status: 500 }
            );
          }

          authUserId = authUser.user.id;
          // Update custom user record with auth_user_id
          await admin
            .from("users")
            .update({ auth_user_id: authUserId })
            .eq("id", user.id);
        }
      } catch (authErr) {
        console.error("Error syncing with Supabase Auth:", authErr);
        return NextResponse.json(
          { error: "Failed to create authentication session" },
          { status: 500 }
        );
      }
    } else {
      // Auth user exists, ensure password is synced in Supabase Auth
      // This ensures Supabase Auth password matches our bcrypt-verified password
      try {
        await admin.auth.admin.updateUserById(authUserId, {
          password: password,
        });
      } catch (updateErr) {
        // Password update failed, but user exists - log warning and continue
        console.warn("Failed to sync password in Supabase Auth:", updateErr);
      }
    }

    // Return success - frontend will create Supabase Auth session
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          auth_user_id: authUserId,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
