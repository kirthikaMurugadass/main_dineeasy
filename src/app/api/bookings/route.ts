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
      phone,
      email,
      bookingDate,
      bookingTime,
      guestCount,
      specialNote,
      tableId,
    } = body;

    // Validation
    if (!restaurantId || !customerName || !phone || !email || !bookingDate || !bookingTime || !guestCount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (guestCount < 1 || guestCount > 10) {
      return NextResponse.json(
        { error: "Guest count must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailValue = (email as string | undefined)?.trim() || "";
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return NextResponse.json(
        { error: "Booking date cannot be in the past" },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(bookingTime)) {
      return NextResponse.json(
        { error: "Invalid time format" },
        { status: 400 }
      );
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

    // Create booking (optionally with table_id for multi-step flow)
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        restaurant_id: restaurantId,
        customer_name: customerName.trim(),
        phone: (phone as string | undefined)?.trim() || "",
        email: emailValue,
        booking_date: bookingDate,
        booking_time: bookingTime,
        guest_count: guestCount,
        special_note: (specialNote as string | undefined)?.trim() || null,
        table_id: tableId || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Booking creation error - Full error object:", JSON.stringify(bookingError, null, 2));
      console.error("Booking creation error - Error message:", bookingError?.message);
      console.error("Booking creation error - Error code:", bookingError?.code);
      console.error("Booking creation error - Error details:", bookingError?.details);
      console.error("Booking creation error - Error hint:", bookingError?.hint);
      
      // Provide more specific error message
      const errorMessage = bookingError?.message || bookingError?.details || "Failed to create booking";
      const errorCode = bookingError?.code || "";
      const errorHint = bookingError?.hint || "";
      
      // Check if it's a column error (migration not run)
      if (
        (errorMessage && (errorMessage.includes("column") || errorMessage.includes("does not exist"))) ||
        errorCode === "42703" ||
        (errorHint && errorHint.includes("column"))
      ) {
        return NextResponse.json(
          { error: "Database migration required. Please run migration 20250101000003_add_email_to_bookings.sql to add email column to bookings table." },
          { status: 500 }
        );
      }
      
      // Check for NOT NULL constraint violation
      if (errorMessage.includes("null value") || errorCode === "23502") {
        return NextResponse.json(
          { error: "Email is required. Please provide a valid email address." },
          { status: 400 }
        );
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { 
          error: errorMessage || "Failed to create booking",
          details: errorHint || undefined,
          code: errorCode || undefined
        },
        { status: 500 }
      );
    }

    // Send admin email notification asynchronously using relative URL (same host)
    fetch("/api/bookings/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        restaurantId,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error("Booking notify API returned non-OK status:", res.status);
        } else {
          console.log("Booking notify API called successfully for booking", booking.id);
        }
      })
      .catch((err) => {
        console.error("Failed to call /api/bookings/notify:", err);
      });

    return NextResponse.json(
      {
        success: true,
        bookingId: booking.id,
        message: "Booking request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
