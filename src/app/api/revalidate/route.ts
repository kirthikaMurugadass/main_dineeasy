import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidateMenuCache } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { menuId, restaurantSlug } = body;

    if (!menuId && !restaurantSlug) {
      return NextResponse.json(
        { error: "Provide menuId or restaurantSlug" },
        { status: 400 }
      );
    }

    let slug = restaurantSlug as string | undefined;

    // If menuId is provided, resolve the restaurant slug from it
    if (menuId && !slug) {
      const supabase = await createClient();

      const { data: menu } = await supabase
        .from("menus")
        .select("restaurant_id")
        .eq("id", menuId)
        .single();

      if (!menu) {
        return NextResponse.json({ error: "Menu not found" }, { status: 404 });
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("slug")
        .eq("id", menu.restaurant_id)
        .single();

      if (!restaurant) {
        return NextResponse.json(
          { error: "Restaurant not found" },
          { status: 404 }
        );
      }

      slug = restaurant.slug;
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Could not determine restaurant slug" },
        { status: 400 }
      );
    }

    // 1. Invalidate Redis cache
    await invalidateMenuCache(slug);

    // 2. Revalidate all public menu routes
    revalidatePath(`/r/${slug}`);
    revalidatePath(`/public-menu/${slug}`);
    revalidatePath(`/public-menu/${slug}`, "page");
    
    // Also revalidate any menu-specific routes
    if (menuId) {
      revalidatePath(`/public-menu/${slug}/${menuId}`);
      revalidatePath(`/public-menu/${slug}/${menuId}`, "page");
    }
    
    // Invalidate all cache patterns for this restaurant (double-check)
    await invalidateMenuCache(slug);

    return NextResponse.json({ revalidated: true, slug });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}
