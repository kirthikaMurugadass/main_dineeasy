import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const restaurantId = url.searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Missing restaurantId" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("restaurants")
      .select("stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (error || !data) {
      return NextResponse.json({ enabled: false }, { status: 200 });
    }

    const enabled = Boolean((data as any)?.stripe_account_id);
    return NextResponse.json({ enabled }, { status: 200 });
  } catch (err) {
    console.error("payment-status error:", err);
    return NextResponse.json({ enabled: false }, { status: 200 });
  }
}

