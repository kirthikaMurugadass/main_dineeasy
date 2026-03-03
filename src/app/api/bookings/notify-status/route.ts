import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, newStatus } = await req.json();

    if (!bookingId || !newStatus) {
      return NextResponse.json(
        { error: "Missing bookingId or newStatus" },
        { status: 400 }
      );
    }

    if (newStatus !== "confirmed" && newStatus !== "cancelled") {
      return NextResponse.json(
        { success: true, skipped: true, message: "No email needed for this status" },
        { status: 200 }
      );
    }

    const admin = createAdminClient();

    // Fetch booking (including email and restaurant_id)
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Status email - booking fetch error:", bookingError);
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.email) {
      console.warn("Status email requested but booking has no email", { bookingId });
      return NextResponse.json(
        { success: true, skipped: true, message: "Booking has no email, skipping customer email" },
        { status: 200 }
      );
    }

    // Fetch restaurant for name
    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("name")
      .eq("id", booking.restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      console.error("Status email - restaurant fetch error:", restaurantError);
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const to = booking.email as string;
    const restaurantName = restaurant.name as string;
    const customerName = booking.customer_name as string;
    const bookingDate = booking.booking_date as string;
    const bookingTime = booking.booking_time as string;
    const guestCount = booking.guest_count as number;

    if (newStatus === "confirmed") {
      await sendBookingConfirmationEmail({
        to,
        restaurantName,
        customerName,
        bookingDate,
        bookingTime,
        guestCount,
      });
    } else if (newStatus === "cancelled") {
      await sendBookingCancellationEmail({
        to,
        restaurantName,
        customerName,
        bookingDate,
        bookingTime,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Status update email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
