import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Login API Route
 * 
 * Authenticates users using bcrypt password comparison
 * - Normalizes email to lowercase before querying
 * - Finds user by email (exact match on normalized email)
 * - Compares plain password with bcrypt hash using bcrypt.compare()
 * - Returns 401 for invalid credentials (security: same message)
 * - Returns user data on success
 * - NO auto-creation of accounts during login
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase BEFORE querying
    // This ensures consistent lookup regardless of input case
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Initialize admin client (bypasses RLS)
    let admin;
    try {
      admin = createAdminClient();
    } catch (adminError: any) {
      console.error("[LOGIN] Failed to create admin client:", adminError);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log(`[LOGIN] Attempting login for email: ${normalizedEmail}`);

    // Find user by email (exact match on normalized email)
    // Using .eq() since email is stored in lowercase (normalized during registration)
    const { data: user, error: fetchError } = await admin
      .from("users")
      .select("id, email, password_hash, auth_user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    // Handle database errors
    if (fetchError) {
      console.error("[LOGIN] Database error:", fetchError);
      
      // Check if table doesn't exist
      if (
        fetchError.message?.includes("relation") ||
        fetchError.message?.includes("does not exist") ||
        fetchError.code === "42P01"
      ) {
        console.error("[LOGIN] Users table not found. Run migrations.");
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
        );
      }

      // Generic error for security (prevent user enumeration)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user exists
    if (!user) {
      console.log(`[LOGIN] User not found: ${normalizedEmail}`);
      // DO NOT create user - return 401
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log(`[LOGIN] User found: ${user.id}`);

    // Validate password_hash exists
    if (!user.password_hash) {
      console.error(`[LOGIN] User ${user.id} has no password_hash`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare plain password with bcrypt hash
    // bcrypt.compare() handles the hashing and comparison automatically
    // DO NOT compare plain text password directly
    let passwordMatch: boolean;
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptError) {
      console.error("[LOGIN] Bcrypt comparison error:", bcryptError);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log(`[LOGIN] Password match: ${passwordMatch} for user: ${user.id}`);

    // Check password match
    if (!passwordMatch) {
      console.log(`[LOGIN] Password mismatch for user: ${user.id}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log(`[LOGIN] Authentication successful for user: ${user.id}`);

    // User authenticated successfully
    // Ensure Supabase Auth user exists for session management
    // Only link existing auth user or find existing one - DO NOT create new accounts
    let authUserId = user.auth_user_id;

    // If no auth_user_id, try to find existing Supabase Auth user
    // DO NOT create new Supabase Auth user during login
    if (!authUserId) {
      try {
        // Try to find existing Supabase Auth user by email
        const { data: existingAuthUsers } = await admin.auth.admin.listUsers();
        const existingUser = existingAuthUsers?.users?.find(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );

        if (existingUser) {
          authUserId = existingUser.id;
          // Update password in Supabase Auth to match our verified password
          await admin.auth.admin.updateUserById(existingUser.id, {
            password: password,
          });
          // Link custom user record with auth_user_id
          await admin
            .from("users")
            .update({ auth_user_id: authUserId })
            .eq("id", user.id);
          console.log(`[LOGIN] Linked existing Supabase Auth user: ${authUserId}`);
        } else {
          // No existing Supabase Auth user found
          // DO NOT create one - user must register first
          console.log(`[LOGIN] No Supabase Auth user found for ${normalizedEmail} - user should register first`);
          // Continue without auth_user_id - user can still use the app
        }
      } catch (authErr) {
        console.error("[LOGIN] Error syncing with Supabase Auth:", authErr);
        // Continue - user is authenticated in our system
      }
    } else {
      // Auth user exists, ensure password is synced
      try {
        await admin.auth.admin.updateUserById(authUserId, {
          password: password,
        });
      } catch (updateErr) {
        // Password update failed, but user exists - log warning and continue
        console.warn("[LOGIN] Failed to sync password in Supabase Auth:", updateErr);
      }
    }

    // Return success response
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
    console.error("[LOGIN] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
