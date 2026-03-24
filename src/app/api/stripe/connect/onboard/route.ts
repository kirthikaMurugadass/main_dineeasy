import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: restaurant, error: restError } = await admin
      .from("restaurants")
      .select("id, stripe_account_id")
      .eq("owner_id", user.id)
      .single();

    if (restError) {
      // Missing column (migration not applied)
      if ((restError as any)?.code === "42703") {
        return NextResponse.json(
          {
            error:
              "Stripe Connect is not set up in the database yet. Apply the migration that adds `restaurants.stripe_account_id`, then retry.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const stripe = getStripeServer();
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const connectCountry = process.env.STRIPE_CONNECT_COUNTRY || "IN";

    let accountId = (restaurant as any)?.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: connectCountry,
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          restaurantId: (restaurant as any).id,
          ownerId: user.id,
        },
      });
      accountId = account.id;

      const { error: updateError } = await admin
        .from("restaurants")
        .update({ stripe_account_id: accountId } as any)
        .eq("id", (restaurant as any).id);

      if (updateError) {
        if ((updateError as any)?.code === "42703") {
          return NextResponse.json(
            {
              error:
                "Stripe Connect is not set up in the database yet. Apply the migration that adds `restaurants.stripe_account_id`, then retry.",
            },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { error: "Failed to enable online payments" },
          { status: 500 },
        );
      }
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${origin}/admin/connect`,
      return_url: `${origin}/admin?stripe=onboarded`,
    });

    return NextResponse.json({ url: link.url, accountId });
  } catch (err) {
    console.error("connect onboard error:", err);
    return NextResponse.json(
      { error: "Failed to start Stripe onboarding" },
      { status: 500 },
    );
  }
}

