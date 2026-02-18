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
      return NextResponse.json({ error: "Restaurant already exists" }, { status: 409 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create restaurant
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .insert({
        name,
        slug,
        owner_id: user.id,
        theme_config: defaultThemeConfig,
      })
      .select("id, slug")
      .single();

    if (error) {
      // Slug collision
      if (error.code === "23505") {
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
        const { data: retry, error: retryError } = await supabase
          .from("restaurants")
          .insert({
            name,
            slug: uniqueSlug,
            owner_id: user.id,
            theme_config: defaultThemeConfig,
          })
          .select("id, slug")
          .single();

        if (retryError) throw retryError;
        return NextResponse.json(retry);
      }
      throw error;
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
