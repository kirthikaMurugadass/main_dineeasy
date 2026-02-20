import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { defaultThemeConfig } from "@/types/database";

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
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if user already has a restaurant
    const { data: existing } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Restaurant already exists" },
        { status: 409 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Build the permanent QR URL
    const qrUrl = `/r/${slug}`;

    // Create restaurant with QR URL
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .insert({
        name,
        slug,
        owner_id: user.id,
        theme_config: defaultThemeConfig,
        qr_url: qrUrl,
      })
      .select("id, slug, qr_url")
      .single();

    if (error) {
      // Slug collision — append unique suffix
      if (error.code === "23505") {
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
        const uniqueQrUrl = `/r/${uniqueSlug}`;

        const { data: retry, error: retryError } = await supabase
          .from("restaurants")
          .insert({
            name,
            slug: uniqueSlug,
            owner_id: user.id,
            theme_config: defaultThemeConfig,
            qr_url: uniqueQrUrl,
          })
          .select("id, slug, qr_url")
          .single();

        if (retryError) throw retryError;
        
        // Auto-create menu for the restaurant
        await supabase.from("menus").insert({
          restaurant_id: retry.id,
          slug: "menu",
          is_active: true,
        }).select("id").single();
        
        return NextResponse.json(retry);
      }
      throw error;
    }

    // Auto-create menu for the restaurant
    await supabase.from("menus").insert({
      restaurant_id: restaurant.id,
      slug: "menu",
      is_active: true,
    }).select("id").single();

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
