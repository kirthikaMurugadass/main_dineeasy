import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Simulated Pro checkout: insert payment + subscription, UPDATE existing restaurant only.
 * - Gets logged-in user, fetches existing restaurant by owner_id.
 * - Updates restaurants: plan_type, billing_cycle, plan_status (no INSERT).
 * No real Stripe — for demo only.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const billingCycle = body.billingCycle as string | undefined;
    const validCycle = billingCycle === "annual" ? "annual" : "monthly";

    // Use admin client to resolve restaurant by owner_id so we don't depend on
    // RLS/session in this route (avoids "Restaurant not found" when cookies differ)
    const admin = createAdminClient();
    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      // Don't select plan columns here; some DBs may not have them yet.
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (restaurantError) {
      console.error("Restaurant lookup error:", restaurantError);
      return NextResponse.json(
        { error: "Could not load restaurant" },
        { status: 500 }
      );
    }

    if (!restaurant) {
      return NextResponse.json(
        { error: "Create your restaurant first in the dashboard, then try upgrading again." },
        { status: 404 }
      );
    }

    const amount = validCycle === "annual" ? 9999 : 999;

    const { error: payError } = await admin.from("payments").insert({
      restaurant_id: restaurant.id,
      amount,
      status: "success",
    });

    if (payError) {
      console.error("Payment insert error:", payError);
      // If the table doesn't exist, guide the developer to apply migrations.
      if (
        (payError as any)?.code === "42P01" ||
        (payError as any)?.code === "PGRST205"
      ) {
        return NextResponse.json(
          {
            error:
              "Database is missing the `payments` table. Apply the Supabase migrations (recommended) or run the SQL from `complete_database_schema.sql` (section 7.11), then retry.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Payment recording failed" },
        { status: 500 }
      );
    }

    const expiresAt = new Date();
    if (validCycle === "annual") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { error: subError } = await admin.from("subscriptions").insert({
      restaurant_id: restaurant.id,
      plan_type: "pro",
      billing_cycle: validCycle,
      status: "active",
      expires_at: expiresAt.toISOString(),
    });

    if (subError) {
      console.error("Subscription insert error:", subError);
      if (
        (subError as any)?.code === "42P01" ||
        (subError as any)?.code === "PGRST205"
      ) {
        return NextResponse.json(
          {
            error:
              "Database is missing the `subscriptions` table. Apply the Supabase migrations (recommended) or run the SQL from `complete_database_schema.sql` (section 7.11), then retry.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Subscription creation failed" },
        { status: 500 }
      );
    }

    // UPDATE existing restaurant only — never create a new one
    const { error: updateError } = await admin
      .from("restaurants")
      .update({
        plan_type: "pro",
        billing_cycle: validCycle,
        plan_status: "active",
      })
      .eq("id", restaurant.id);

    if (updateError) {
      console.error("Restaurant update error:", updateError);
      if ((updateError as any)?.code === "42703") {
        return NextResponse.json(
          {
            error:
              "Database is missing plan columns on restaurants. Run this SQL in Supabase SQL editor:\n\nALTER TABLE restaurants\n  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free',\n  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,\n  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active';",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Plan activation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan_type: "pro",
      billing_cycle: validCycle,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
