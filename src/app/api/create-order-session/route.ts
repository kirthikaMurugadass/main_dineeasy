import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcCommissionPaise } from "@/lib/stripe/commission";

export const runtime = "nodejs";

type IncomingItem = {
  name: string;
  price: number;
  quantity: number;
};

type PendingOrderPayload = {
  restaurantId: string;
  customerName: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber: number | null;
  deliveryAddress: string | null;
  phoneNumber: string | null;
  items: Array<{ itemId: string; quantity: number; price: number }>;
  restaurantSlug: string;
  menuId: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const items = (body.items ?? null) as IncomingItem[] | null;
    const restaurantId = (body.restaurantId ?? null) as string | null;
    const restaurantSlug = (body.restaurantSlug ?? null) as string | null;
    const menuId = (body.menuId ?? null) as string | null;
    const pendingOrder = (body.pendingOrder ?? null) as PendingOrderPayload | null;
    const restaurantStripeAccountId = (body.restaurantStripeAccountId ?? null) as
      | string
      | null;
    const currencyRaw = (body.currency ?? "chf") as string;
    const currency = String(currencyRaw || "chf").toLowerCase();
    const cancelPathRaw = (body.cancelPath ?? null) as string | null;
    const cancelPath =
      cancelPathRaw && String(cancelPathRaw).startsWith("/")
        ? String(cancelPathRaw)
        : null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing items" }, { status: 400 });
    }

    if (!restaurantId && !restaurantStripeAccountId) {
      return NextResponse.json(
        { error: "Missing restaurant identifier" },
        { status: 400 },
      );
    }

    for (const it of items) {
      if (!it?.name || typeof it.price !== "number" || typeof it.quantity !== "number") {
        return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
      }
      if (it.quantity < 1) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
      if (it.price < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
    }

    // Resolve destination Stripe Connect account (prefer lookup by restaurantId)
    let destination = restaurantStripeAccountId;
    if (!destination && restaurantId) {
      const admin = createAdminClient();
      const { data: restaurant, error } = await admin
        .from("restaurants")
        .select("stripe_account_id")
        .eq("id", restaurantId)
        .single();
      if (error) {
        if ((error as any)?.code === "42703") {
          return NextResponse.json(
            {
              error:
                "Stripe Connect is not set up in the database yet. Apply the migration that adds `restaurants.stripe_account_id`, then retry.",
            },
            { status: 409 },
          );
        }
      }
      if (error || !restaurant) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }
      destination = (restaurant as any)?.stripe_account_id ?? null;
    }

    // If destination is missing, still allow Stripe Checkout (platform-only) so Card payments work.
    // This keeps existing order logic intact and enables payments even before Connect onboarding.

    const stripe = getStripeServer();
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;

    const totalPaise = items.reduce(
      (sum, it) => sum + Math.round(it.price * 100) * it.quantity,
      0,
    );
    const commissionPaise = calcCommissionPaise(totalPaise);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((it) => ({
        price_data: {
          currency,
          product_data: { name: it.name },
          unit_amount: Math.round(it.price * 100),
        },
        quantity: it.quantity,
      })),
      ...(destination
        ? {
            payment_intent_data: {
              ...(commissionPaise > 0 ? { application_fee_amount: commissionPaise } : {}),
              transfer_data: { destination },
            },
          }
        : {}),
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}${
        restaurantSlug ? `&restaurant=${encodeURIComponent(restaurantSlug)}` : ""
      }${menuId ? `&menuId=${encodeURIComponent(menuId)}` : ""}`,
      cancel_url: `${origin}${cancelPath || "/cancel"}`,
      metadata: {
        source: "order",
      },
    });

    // Persist pending order server-side keyed by session_id (so redirects never lose it)
    try {
      if (pendingOrder) {
        const admin = createAdminClient();
        await admin
          .from("order_payment_sessions")
          .upsert(
            {
              session_id: session.id,
              payload: pendingOrder as any,
            } as any,
            { onConflict: "session_id" },
          );
      }
    } catch (e) {
      // Don't block checkout if persistence fails; we'll still try localStorage fallback.
      console.error("Failed to persist order_payment_sessions:", e);
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("create-order-session error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe session" },
      { status: 500 },
    );
  }
}

