import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Legacy auth callback route - kept for backward compatibility
 * This route is no longer used with Email + Password authentication
 * but kept to handle any old magic link callbacks gracefully
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/admin`);
    }
  }

  // Redirect to new auth login page
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
