import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBookingNotificationEmail,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, restaurantId } = await req.json();

    if (!bookingId || !restaurantId) {
      return NextResponse.json(
        { error: "Missing bookingId or restaurantId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch booking
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
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

    // Send email notification to restaurant admin
    await sendBookingNotificationEmail({
      to: ownerEmail,
      restaurantName,
      customerName: booking.customer_name,
      phone: booking.phone,
      email: booking.email,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      guestCount: booking.guest_count,
      specialNote: booking.special_note,
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
