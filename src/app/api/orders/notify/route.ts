import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface OrderItem {
  item_title?: Record<string, string>;
  quantity: number;
  price: number;
}

interface OrderData {
  id: string;
  customer_name: string;
  order_type: "dine_in" | "takeaway";
  table_number: number | null;
  items: OrderItem[];
  total: number;
  restaurant_name?: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!resend) {
      console.warn("RESEND_API_KEY not configured, skipping email notification");
      return NextResponse.json({ success: true, skipped: true });
    }

    const { orderId, restaurantId } = await req.json();

    if (!orderId || !restaurantId) {
      return NextResponse.json(
        { error: "Missing orderId or restaurantId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, customer_name, order_type, table_number, restaurant_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Fetch order items
    const { data: orderItemsData, error: itemsError } = await admin
      .from("order_items")
      .select("item_id, quantity, price")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    // Fetch translations for menu items
    const itemIds = orderItemsData?.map((oi) => oi.item_id).filter(Boolean) ?? [];
    const translationMap = new Map<string, string>();
    
    if (itemIds.length > 0) {
      const { data: translations } = await admin
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

    // Fetch restaurant to get owner email
    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("name, owner_id")
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      console.error("Error fetching restaurant:", restaurantError);
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Fetch owner email
    const { data: ownerData, error: ownerError } = await admin.auth.admin.getUserById(
      restaurant.owner_id
    );

    if (ownerError || !ownerData?.user?.email) {
      console.error("Error fetching owner email:", ownerError);
      return NextResponse.json(
        { error: "Owner email not found" },
        { status: 404 }
      );
    }

    const ownerEmail = ownerData.user.email;
    const restaurantName = restaurant.name;

    // Calculate total and format items list
    const items = orderItemsData || [];
    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    function getItemTitle(itemId: string): string {
      return translationMap.get(itemId) || "Unknown Item";
    }

    const itemsList = items
      .map(
        (item) =>
          `  • ${item.quantity}x ${getItemTitle(item.item_id)} - CHF ${(Number(item.price) * item.quantity).toFixed(2)}`
      )
      .join("\n");

    // Send email
    await resend.emails.send({
      from: emailFrom,
      to: ownerEmail,
      subject: `New Order Received - ${restaurantName}`,
      html: `
        <div style="background-color:#f5f5f7;padding:32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
            <tr>
              <td style="padding:24px 24px 8px 24px;text-align:center;">
                <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;background:#111827;color:#f9fafb;font-weight:600;font-size:18px;">
                  D
                </div>
                <div style="margin-top:12px;font-size:20px;font-weight:600;color:#111827;">DineEasy</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0 24px;">
                <h1 style="margin:0 0 8px 0;font-size:20px;line-height:1.3;font-weight:600;color:#111827;">
                  New Order Received
                </h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                  You have received a new order for <strong>${restaurantName}</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 20px 24px;">
                <div style="background:#f9fafb;border-radius:12px;padding:16px;">
                  <div style="margin-bottom:12px;">
                    <strong style="color:#111827;">Customer Name:</strong>
                    <span style="color:#4b5563;margin-left:8px;">${order.customer_name}</span>
                  </div>
                  <div style="margin-bottom:12px;">
                    <strong style="color:#111827;">Order Type:</strong>
                    <span style="color:#4b5563;margin-left:8px;">${order.order_type === "dine_in" ? "Dine-in" : "Takeaway"}</span>
                  </div>
                  ${order.table_number ? `
                  <div style="margin-bottom:12px;">
                    <strong style="color:#111827;">Table Number:</strong>
                    <span style="color:#4b5563;margin-left:8px;">${order.table_number}</span>
                  </div>
                  ` : ""}
                  <div style="margin-bottom:12px;">
                    <strong style="color:#111827;">Items:</strong>
                    <pre style="margin:8px 0 0 0;font-family:inherit;font-size:13px;line-height:1.6;color:#4b5563;white-space:pre-wrap;">${itemsList}</pre>
                  </div>
                  <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
                    <strong style="color:#111827;font-size:16px;">Total Amount:</strong>
                    <span style="color:#111827;font-size:18px;font-weight:600;margin-left:8px;">CHF ${total.toFixed(2)}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;text-align:center;">
                <a
                  href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/orders"
                  style="
                    display:inline-block;
                    padding:10px 22px;
                    border-radius:999px;
                    background:#111827;
                    color:#f9fafb;
                    font-size:14px;
                    font-weight:600;
                    text-decoration:none;
                    letter-spacing:0.03em;
                  "
                >
                  View Order in Dashboard
                </a>
              </td>
            </tr>
          </table>
        </div>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email notification error:", error);
    // Don't fail the request if email fails
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
