import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if user already exists (case-insensitive)
    const { data: existingUser, error: checkError } = await admin
      .from("users")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return NextResponse.json(
        { error: "Failed to check user existence" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user with normalized email
    const { data: newUser, error: insertError } = await admin
      .from("users")
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
      })
      .select("id, email, created_at")
      .single();

    if (insertError) {
      console.error("Error creating user:", insertError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Also create user in Supabase Auth for session management
    // This ensures compatibility with existing restaurant.owner_id references
    let authUserId: string | null = null;
    try {
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: password, // Supabase will hash this separately
        email_confirm: true, // Auto-confirm email to avoid confirmation step
      });

      if (authError) {
        console.error("Error creating Supabase Auth user:", authError);
        // Don't fail registration if Auth user creation fails
        // The user exists in our custom table, they can still login via our API
      } else if (authUser?.user?.id) {
        authUserId = authUser.user.id;
        
        // Update custom user record with auth_user_id link
        await admin
          .from("users")
          .update({ auth_user_id: authUserId })
          .eq("id", newUser.id);
      }
    } catch (authErr) {
      console.error("Error syncing with Supabase Auth:", authErr);
      // Continue - user is created in custom table
    }

    // Return user data (without password_hash)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
