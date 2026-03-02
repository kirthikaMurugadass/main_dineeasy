import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

// Cache for 60 seconds (using Next.js cache headers instead)
export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get restaurant ID
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const restaurantId = restaurant.id;

    // Get today's date range (start of day to end of day in UTC)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // 1. Total Orders Count
    const { count: totalOrders, error: totalError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId);

    if (totalError) {
      throw totalError;
    }

    // 2. Today's Orders Count
    const { count: todayOrders, error: todayError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", todayEnd.toISOString());

    if (todayError) {
      throw todayError;
    }

    // 3. Most Ordered Items (Top 5)
    // First, get all order IDs for this restaurant
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id")
      .eq("restaurant_id", restaurantId);

    const orderIds = ordersData?.map((o) => o.id) ?? [];

    // Then get order items for these orders
    let orderItemsData: { item_id: string; quantity: number }[] = [];
    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("item_id, quantity")
        .in("order_id", orderIds);

      if (itemsError) {
        throw itemsError;
      }
      orderItemsData = itemsData ?? [];
    }

    // Group by item_id and sum quantities
    const itemQuantities = new Map<string, number>();
    orderItemsData?.forEach((item) => {
      const current = itemQuantities.get(item.item_id) || 0;
      itemQuantities.set(item.item_id, current + item.quantity);
    });

    // Get top 5 items
    const topItems = Array.from(itemQuantities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([itemId, quantity]) => ({ item_id: itemId, total_quantity: quantity }));

    // Fetch translations for these items
    const itemIds = topItems.map((item) => item.item_id);
    const translationMap = new Map<string, string>();

    if (itemIds.length > 0) {
      const { data: translations } = await supabase
        .from("translations")
        .select("entity_id, language, title")
        .eq("entity_type", "menu_item")
        .in("entity_id", itemIds);

      translations?.forEach((tr) => {
        // Prefer English, fallback to any available language
        if (!translationMap.has(tr.entity_id) || tr.language === "en") {
          translationMap.set(tr.entity_id, tr.title);
        }
      });
    }

    // Combine with item names
    const mostOrderedItems = topItems.map((item) => ({
      item_id: item.item_id,
      item_name: translationMap.get(item.item_id) || "Unknown Item",
      total_quantity: item.total_quantity,
    }));

    return NextResponse.json({
      totalOrders: totalOrders || 0,
      todayOrders: todayOrders || 0,
      mostOrderedItems,
    });
  } catch (error: any) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error.message },
      { status: 500 }
    );
  }
}
