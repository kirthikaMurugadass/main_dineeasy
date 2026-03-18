import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  const confirmed = searchParams.get("confirmed") === "1";
  const safeNextPath = next.startsWith("/") ? next : "/";
  const confirmationBase = `${origin}/auth/confirmed?next=${encodeURIComponent(
    safeNextPath
  )}&confirmed=${confirmed ? "1" : "0"}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${confirmationBase}&status=success`);
    }
  }

  return NextResponse.redirect(`${confirmationBase}&status=error`);
}
