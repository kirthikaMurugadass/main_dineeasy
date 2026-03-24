import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const sessionId = (body?.session_id ?? body?.sessionId ?? null) as string | null;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    return NextResponse.json({ paid }, { status: 200 });
  } catch (err) {
    console.error("verify-payment error:", err);
    return NextResponse.json(
      { paid: false, error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}

