import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Registration API Route
 * 
 * Creates new user accounts with bcrypt password hashing
 * - Normalizes email to lowercase before saving
 * - Checks for existing users (case-insensitive)
 * - Enforces unique constraint at database level
 * - Hashes password ONCE using bcrypt
 * - Stores only hashed password in database
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

    // Normalize email to lowercase BEFORE any operations
    const normalizedEmail = email.toLowerCase().trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    // Initialize admin client (bypasses RLS)
    let admin;
    try {
      admin = createAdminClient();
    } catch (adminError: any) {
      console.error("[REGISTER] Failed to create admin client:", adminError);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log(`[REGISTER] Attempting registration for email: ${normalizedEmail}`);

    // Check if user already exists (case-insensitive check)
    // Using normalized email for consistent lookup
    const { data: existingUser, error: checkError } = await admin
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error("[REGISTER] Error checking existing user:", checkError);
      
      // Check if table doesn't exist
      if (
        checkError.message?.includes("relation") ||
        checkError.message?.includes("does not exist") ||
        checkError.code === "42P01"
      ) {
        console.error("[REGISTER] Users table not found. Run migrations.");
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to check user existence" },
        { status: 500 }
      );
    }

    // Explicit check: if user exists, return error
    if (existingUser) {
      console.log(`[REGISTER] User already exists: ${normalizedEmail} (ID: ${existingUser.id})`);
      return NextResponse.json(
        { error: "Account already exists" },
        { status: 409 }
      );
    }

    // Hash password ONCE using bcrypt
    // bcrypt.hash() automatically generates salt and hashes the password
    const saltRounds = 10;
    let passwordHash: string;
    
    try {
      passwordHash = await bcrypt.hash(password, saltRounds);
      console.log(`[REGISTER] Password hashed successfully`);
    } catch (hashError) {
      console.error("[REGISTER] Error hashing password:", hashError);
      return NextResponse.json(
        { error: "Failed to process password" },
        { status: 500 }
      );
    }

    // Insert user with normalized email and hashed password
    // Database has UNIQUE constraint on email field - will prevent duplicates at DB level
    console.log(`[REGISTER] Creating user with email: ${normalizedEmail}`);
    
    const { data: newUser, error: insertError } = await admin
      .from("users")
      .insert({
        email: normalizedEmail, // Always lowercase
        password_hash: passwordHash, // Only hashed password stored
      })
      .select("id, email, created_at")
      .single();

    if (insertError) {
      console.error("[REGISTER] Error creating user:", insertError);
      
      // Handle unique constraint violation (PostgreSQL error code 23505)
      // This is a safety net - should not happen if check above worked correctly
      if (insertError.code === "23505" || insertError.message?.includes("unique") || insertError.message?.includes("duplicate")) {
        console.log(`[REGISTER] Duplicate email detected at DB level: ${normalizedEmail}`);
        return NextResponse.json(
          { error: "Account already exists" },
          { status: 409 }
        );
      }
      
      // Check if table doesn't exist
      if (
        insertError.message?.includes("relation") ||
        insertError.message?.includes("does not exist") ||
        insertError.code === "42P01"
      ) {
        console.error("[REGISTER] Users table not found. Run migrations.");
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    if (!newUser) {
      console.error("[REGISTER] User creation returned no data");
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    console.log(`[REGISTER] User created successfully: ${newUser.id} with email: ${newUser.email}`);

    // Create Supabase Auth user for session management
    // This ensures compatibility with existing restaurant.owner_id references
    let authUserId: string | null = null;
    try {
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: password, // Supabase will hash this separately for its own auth system
        email_confirm: true, // Auto-confirm to avoid confirmation step
      });

      if (authError) {
        console.error("[REGISTER] Error creating Supabase Auth user:", authError);
        // Don't fail registration - user exists in our custom table
        // They can still login via our API
      } else if (authUser?.user?.id) {
        authUserId = authUser.user.id;
        console.log(`[REGISTER] Supabase Auth user created: ${authUserId}`);
        
        // Link custom user record with auth_user_id
        await admin
          .from("users")
          .update({ auth_user_id: authUserId })
          .eq("id", newUser.id);
      }
    } catch (authErr) {
      console.error("[REGISTER] Error syncing with Supabase Auth:", authErr);
      // Continue - user is created in custom table and can login
    }

    // Return success response (without password_hash)
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
    console.error("[REGISTER] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
