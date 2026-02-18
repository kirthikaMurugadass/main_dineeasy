import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidateMenuCache } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { menuId } = body;

    if (!menuId) {
      return NextResponse.json({ error: "Missing menuId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the menu and restaurant info
    const { data: menu } = await supabase
      .from("menus")
      .select("slug, restaurant_id")
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
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Invalidate Redis cache
    await invalidateMenuCache(restaurant.slug);

    // Revalidate Next.js ISR page
    revalidatePath(`/${restaurant.slug}/${menu.slug}`);

    return NextResponse.json({ revalidated: true });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
