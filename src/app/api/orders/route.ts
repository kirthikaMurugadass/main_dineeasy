import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      restaurantId,
      customerName,
      orderType,
      tableNumber,
      items,
    } = body;

    // Validation
    if (!restaurantId || !customerName || !orderType || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (orderType !== "dine_in" && orderType !== "takeaway") {
      return NextResponse.json(
        { error: "Invalid order type" },
        { status: 400 }
      );
    }

    if (orderType === "dine_in" && (!tableNumber || tableNumber < 1)) {
      return NextResponse.json(
        { error: "Table number is required for dine-in orders" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1 || !item.price || item.price < 0) {
        return NextResponse.json(
          { error: "Invalid item data" },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();

    // Verify restaurant exists
    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        customer_name: customerName.trim(),
        order_type: orderType,
        table_number: orderType === "dine_in" ? tableNumber : null,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item: { itemId: string; quantity: number; price: number }) => ({
      order_id: order.id,
      item_id: item.itemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      // Try to clean up the order if items insertion fails
      await admin.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Send email notification asynchronously (don't wait for it)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/orders/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        restaurantId,
      }),
    }).catch((err) => {
      console.error("Failed to send order notification email:", err);
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        message: "Order placed successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
