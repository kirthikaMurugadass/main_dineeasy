"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "dineeasy-booking-notifications";

interface BookingNotificationContextType {
  bookingNotificationCount: number;
  incrementBookingNotification: () => void;
  resetBookingNotification: () => void;
}

const BookingNotificationContext = createContext<BookingNotificationContextType>({
  bookingNotificationCount: 0,
  incrementBookingNotification: () => {},
  resetBookingNotification: () => {},
});

export function BookingNotificationProvider({
  children,
  restaurantId,
}: {
  children: ReactNode;
  restaurantId: string | null;
}) {
  const [bookingNotificationCount, setBookingNotificationCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const incrementRef = useRef<() => void>();

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const count = parseInt(stored, 10);
        if (!isNaN(count) && count >= 0) {
          setBookingNotificationCount(count);
        }
      } catch {
        // Invalid stored value, ignore
      }
    }
  }, []);

  // Save to localStorage whenever count changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, bookingNotificationCount.toString());
    }
  }, [bookingNotificationCount, mounted]);

  const incrementBookingNotification = useCallback(() => {
    console.log("[BookingNotification] Incrementing notification count");
    setBookingNotificationCount((prev) => {
      const newCount = prev + 1;
      console.log("[BookingNotification] Count updated:", prev, "->", newCount);
      return newCount;
    });
  }, []);

  // Store increment function in ref to avoid re-subscription
  useEffect(() => {
    incrementRef.current = incrementBookingNotification;
  }, [incrementBookingNotification]);

  const resetBookingNotification = useCallback(() => {
    console.log("[BookingNotification] Resetting notification count");
    setBookingNotificationCount(0);
    if (mounted) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [mounted]);

  // Set up Supabase realtime listener for new bookings
  useEffect(() => {
    if (!restaurantId || !mounted) {
      console.log("[BookingNotification] Skipping subscription - restaurantId:", restaurantId, "mounted:", mounted);
      return;
    }

    console.log("[BookingNotification] Setting up realtime subscription for restaurant:", restaurantId);
    const supabase = createClient();

    // Create a unique channel name to avoid conflicts
    const channelName = `booking-notifications-${restaurantId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log("[BookingNotification] New booking received:", payload);
          const newBooking = payload.new as { status?: string; restaurant_id?: string };
          console.log("[BookingNotification] Booking details:", {
            status: newBooking.status,
            restaurant_id: newBooking.restaurant_id,
            expected_restaurant_id: restaurantId,
          });
          
          // Only increment if booking status is "pending" and restaurant matches
          if (newBooking.status === "pending" && newBooking.restaurant_id === restaurantId) {
            console.log("[BookingNotification] Incrementing count for pending booking");
            incrementRef.current?.();
          } else {
            console.log("[BookingNotification] Skipping - status:", newBooking.status, "restaurant match:", newBooking.restaurant_id === restaurantId);
          }
        }
      )
      .subscribe((status) => {
        console.log("[BookingNotification] Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("[BookingNotification] Successfully subscribed to bookings table");
        } else if (status === "CHANNEL_ERROR") {
          console.error("[BookingNotification] Channel subscription error");
        } else if (status === "TIMED_OUT") {
          console.error("[BookingNotification] Subscription timed out");
        } else if (status === "CLOSED") {
          console.log("[BookingNotification] Subscription closed");
        }
      });

    return () => {
      console.log("[BookingNotification] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [restaurantId, mounted]); // Removed incrementBookingNotification from deps to prevent re-subscription

  return (
    <BookingNotificationContext.Provider
      value={{
        bookingNotificationCount,
        incrementBookingNotification,
        resetBookingNotification,
      }}
    >
      {children}
    </BookingNotificationContext.Provider>
  );
}

export const useBookingNotification = () => useContext(BookingNotificationContext);
