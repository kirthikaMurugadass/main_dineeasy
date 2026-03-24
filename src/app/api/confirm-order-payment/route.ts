import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PendingOrderPayload = {
  restaurantId: string;
  customerName: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber: number | null;
  deliveryAddress: string | null;
  phoneNumber: string | null;
  items: Array<{
    itemId: string;
    title?: Record<string, string>;
    quantity: number;
    price: number;
  }>;
  restaurantSlug: string;
  menuId: string;
};

type ReceiptSnapshot = {
  orderId: string;
  createdAt: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  paymentMethod: "cash" | "card" | "qr";
  items: Array<{
    id: string;
    title: Record<string, string>;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const sessionId = (body?.session_id ?? body?.sessionId ?? null) as string | null;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ paid: false }, { status: 200 });
    }

    const admin = createAdminClient();

    const { data: rec, error: recError } = await admin
      .from("order_payment_sessions")
      .select("session_id, payload, order_id")
      .eq("session_id", sessionId)
      .single();

    if (recError || !rec) {
      return NextResponse.json(
        { paid: true, error: "Missing pending order for this payment session" },
        { status: 409 },
      );
    }

    const existingOrderId = (rec as any)?.order_id as string | null;
    const payload = (rec as any)?.payload as PendingOrderPayload | null;

    const menuHref =
      payload?.restaurantSlug && payload?.menuId
        ? `/public-menu/${encodeURIComponent(payload.restaurantSlug)}/${encodeURIComponent(payload.menuId)}`
        : "/";

    if (existingOrderId) {
      let createdAt = new Date().toISOString();
      try {
        const { data: o } = await admin
          .from("orders")
          .select("created_at")
          .eq("id", existingOrderId)
          .single();
        if ((o as any)?.created_at) createdAt = String((o as any).created_at);
      } catch {
        // ignore
      }

      const receiptSnapshot: ReceiptSnapshot | null = payload
        ? {
            orderId: existingOrderId,
            createdAt,
            orderType: payload.orderType,
            tableNumber: payload.tableNumber != null ? String(payload.tableNumber) : undefined,
            deliveryAddress: payload.deliveryAddress ?? undefined,
            phoneNumber: payload.phoneNumber ?? undefined,
            paymentMethod: "card",
            items: payload.items.map((it) => ({
              id: it.itemId,
              title: it.title ?? {},
              price: it.price,
              quantity: it.quantity,
            })),
            subtotal: payload.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
            tax: 0,
            totalAmount: payload.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
          }
        : null;

      return NextResponse.json(
        { paid: true, orderId: existingOrderId, menuHref, receiptSnapshot },
        { status: 200 },
      );
    }

    if (!payload?.restaurantId || !payload?.customerName?.trim() || !payload?.items?.length) {
      return NextResponse.json(
        { paid: true, error: "Order details missing. Please place the order again.", menuHref },
        { status: 409 },
      );
    }

    // Create order (reuse same logic as /api/orders without modifying that endpoint)
    const orderType = payload.orderType;
    const orderTypeForDb = orderType === "delivery" ? "takeaway" : orderType;

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("id, plan_type, plan_status")
      .eq("id", payload.restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { paid: true, error: "Restaurant not found", menuHref },
        { status: 404 },
      );
    }

    const planType = (restaurant as any)?.plan_type ?? "free";
    const planStatus = (restaurant as any)?.plan_status ?? "active";
    if (planType !== "pro" || planStatus !== "active") {
      return NextResponse.json(
        { paid: true, error: "Ordering is available only in Pro plan.", menuHref },
        { status: 403 },
      );
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        restaurant_id: payload.restaurantId,
        customer_name: payload.customerName.trim(),
        order_type: orderTypeForDb,
        table_number: orderTypeForDb === "dine_in" ? payload.tableNumber : null,
        delivery_address: orderType === "delivery" ? payload.deliveryAddress : null,
        phone_number: orderType === "delivery" ? (payload.phoneNumber?.trim() || null) : null,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { paid: true, error: "Failed to create order", menuHref },
        { status: 500 },
      );
    }

    const orderItems = payload.items.map((item) => ({
      order_id: (order as any).id,
      item_id: item.itemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await admin.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      await admin.from("orders").delete().eq("id", (order as any).id);
      return NextResponse.json(
        { paid: true, error: "Failed to create order items", menuHref },
        { status: 500 },
      );
    }

    // Mark session as consumed
    await admin
      .from("order_payment_sessions")
      .update({ order_id: (order as any).id } as any)
      .eq("session_id", sessionId);

    const createdAt = String((order as any)?.created_at ?? new Date().toISOString());
    const subtotal = payload.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const receiptSnapshot: ReceiptSnapshot = {
      orderId: (order as any).id,
      createdAt,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber != null ? String(payload.tableNumber) : undefined,
      deliveryAddress: payload.deliveryAddress ?? undefined,
      phoneNumber: payload.phoneNumber ?? undefined,
      paymentMethod: "card",
      items: payload.items.map((it) => ({
        id: it.itemId,
        title: it.title ?? {},
        price: it.price,
        quantity: it.quantity,
      })),
      subtotal,
      tax: 0,
      totalAmount: subtotal,
    };

    return NextResponse.json(
      { paid: true, orderId: (order as any).id, menuHref, receiptSnapshot },
      { status: 200 },
    );
  } catch (err) {
    console.error("confirm-order-payment error:", err);
    return NextResponse.json(
      { error: "Failed to confirm order payment" },
      { status: 500 },
    );
  }
}

