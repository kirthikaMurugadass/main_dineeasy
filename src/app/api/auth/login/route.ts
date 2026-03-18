import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy login endpoint disabled. Use supabase.auth.signInWithPassword() from the client.",
    },
    { status: 410 }
  );
}
