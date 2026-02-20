import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ThemeConfig } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantSlug, themeConfig } = body;

    if (!restaurantSlug || !themeConfig) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify restaurant ownership
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", restaurantSlug)
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found or access denied" },
        { status: 403 }
      );
    }

    // Update theme config
    const { error } = await supabase
      .from("restaurants")
      .update({
        theme_config: themeConfig as unknown as Record<string, unknown>,
      })
      .eq("id", restaurant.id);

    if (error) {
      console.error("Error updating theme config:", error);
      return NextResponse.json(
        { error: "Failed to save appearance" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in appearance save API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
