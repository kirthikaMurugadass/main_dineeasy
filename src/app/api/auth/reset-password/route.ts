import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = (body?.token as string | undefined)?.trim();
    const newPassword = (body?.password as string | undefined) ?? "";

    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Invalid token or password." }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const admin = createAdminClient();

    const nowIso = new Date().toISOString();

    const { data: records, error: lookupError } = await admin
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lookupError || !records || records.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
    }

    const record = records[0];

    if (record.used_at) {
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
    }

    if (record.expires_at && record.expires_at <= nowIso) {
      return NextResponse.json({ error: "This reset link has expired." }, { status: 400 });
    }

    // Update password using Supabase admin API
    const { error: updateError } = await admin.auth.admin.updateUserById(record.user_id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
    }

    // Mark token as used
    await admin
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}

