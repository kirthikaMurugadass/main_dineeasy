import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    // Use admin client for restaurant creation to bypass RLS if needed
    // This ensures restaurant creation works even if RLS policies aren't perfect
    const adminClient = createAdminClient();

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if user already has a restaurant (use regular client for this)
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

    // Create restaurant with QR URL using admin client to ensure it works
    // Admin client bypasses RLS, but we still validate owner_id = user.id
    const { data: restaurant, error } = await adminClient
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

        const { data: retry, error: retryError } = await adminClient
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
        
        // Auto-create menu for the restaurant using admin client
        const { error: menuError2 } = await adminClient
          .from("menus")
          .insert({
            restaurant_id: retry.id,
            slug: "menu",
            is_active: true,
          })
          .select("id")
          .single();
        
        if (menuError2) {
          console.error("Menu creation error (retry):", menuError2);
        }
        
        return NextResponse.json(retry);
      }
      throw error;
    }

    // Auto-create menu for the restaurant using admin client
    const { data: menu, error: menuError } = await adminClient
      .from("menus")
      .insert({
        restaurant_id: restaurant.id,
        slug: "menu",
        is_active: true,
      })
      .select("id")
      .single();

    if (menuError) {
      console.error("Menu creation error:", menuError);
      // Restaurant was created but menu failed - still return success
      // Menu can be created later
      return NextResponse.json({
        ...restaurant,
        warning: "Restaurant created but menu creation failed. You can create a menu manually.",
      });
    }

    return NextResponse.json(restaurant);
  } catch (error: any) {
    console.error("Setup error:", error);
    
    // Return detailed error for debugging
    const errorMessage = error?.message || "Unknown error";
    const errorCode = error?.code || "UNKNOWN";
    const errorDetails = error?.details || null;
    const errorHint = error?.hint || null;
    
    console.error("Error details:", {
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      hint: errorHint,
    });
    
    // In production, return generic message but log details
    return NextResponse.json(
      { 
        error: "Setup failed",
        // Include error code in development for debugging
        ...(process.env.NODE_ENV === "development" && {
          details: {
            message: errorMessage,
            code: errorCode,
            details: errorDetails,
            hint: errorHint,
          },
        }),
      },
      { status: 500 }
    );
  }
}
