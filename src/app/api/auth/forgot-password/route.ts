import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendResetPasswordEmail } from "@/lib/email";

type RateEntry = {
  count: number;
  windowStart: number;
};

// In-memory rate limiting (per-IP) for forgot-password endpoint
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateMap = new Map<string, RateEntry>();

function rateLimit(ip: string | null | undefined) {
  if (!ip) return true;
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  if (!rateLimit(ip)) {
    // Generic response to avoid enumeration / leaking rate-limit behavior
    return NextResponse.json(
      { message: "If an account exists for this email, a reset link has been sent." },
      { status: 200 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const email = (body?.email as string | undefined)?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "If an account exists for this email, a reset link has been sent." },
        { status: 200 }
      );
    }

    const admin = createAdminClient();

    // Fallback-safe lookup: some supabase-js versions don't expose getUserByEmail,
    // so we use listUsers and filter by email instead.
    const { data: userList, error: listError } = await (admin as any).auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    } as any);

    if (listError) {
      console.error("Forgot password listUsers error:", listError);
      return NextResponse.json(
        { message: "If an account exists for this email, a reset link has been sent." },
        { status: 200 }
      );
    }

    const user =
      userList?.users?.find(
        (u: any) => u.email && u.email.toLowerCase() === email
      ) ?? null;

    if (!user) {
      // Do not reveal whether the user exists
      return NextResponse.json(
        { message: "If an account exists for this email, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store hashed token in a dedicated table (must exist in Supabase)
    await admin
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const resetLink = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(
      rawToken
    )}`;

    await sendResetPasswordEmail({
      to: email,
      resetLink,
    });

    return NextResponse.json(
      { message: "If an account exists for this email, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return generic message to avoid leakage
    return NextResponse.json(
      { message: "If an account exists for this email, a reset link has been sent." },
      { status: 200 }
    );
  }
}

