import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy register endpoint disabled. Use supabase.auth.signUp() from the client.",
    },
    { status: 410 }
  );
}
