"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY_PREFIX = "dineeasy-booking-notifications";

function getStorageKey(restaurantId: string | null) {
  return restaurantId ? `${STORAGE_KEY_PREFIX}:${restaurantId}` : STORAGE_KEY_PREFIX;
}

function isMissingReadMarkerColumn(error: unknown) {
  const message = (error as { message?: string } | null)?.message ?? "";
  return message.includes("last_bookings_seen_at");
}

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
  const [supportsReadMarkers, setSupportsReadMarkers] = useState(true);
  const [pendingReset, setPendingReset] = useState(false);

  const incrementBookingNotification = useCallback(() => {
    setBookingNotificationCount((prev) => {
      const next = prev + 1;
      if (!supportsReadMarkers) {
        localStorage.setItem(getStorageKey(restaurantId), String(next));
      }
      return next;
    });
  }, [supportsReadMarkers, restaurantId]);

  const resetBookingNotification = useCallback(() => {
    setBookingNotificationCount(0);
    if (!restaurantId) {
      setPendingReset(true);
      return;
    }

    if (!supportsReadMarkers) {
      localStorage.removeItem(getStorageKey(restaurantId));
      return;
    }

    const supabase = createClient();
    void supabase
      .from("restaurants")
      .update({ last_bookings_seen_at: new Date().toISOString() })
      .eq("id", restaurantId);
  }, [restaurantId, supportsReadMarkers]);

  const loadInitialUnreadCount = useCallback(async () => {
    if (!restaurantId) {
      setBookingNotificationCount(0);
      return;
    }

    const supabase = createClient();
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("last_bookings_seen_at")
      .eq("id", restaurantId)
      .single();

    if (restaurantError) {
      if (isMissingReadMarkerColumn(restaurantError)) {
        setSupportsReadMarkers(false);
        const stored = localStorage.getItem(getStorageKey(restaurantId));
        if (stored && !Number.isNaN(Number(stored))) {
          setBookingNotificationCount(Number(stored));
          return;
        }
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .eq("status", "pending");
        setBookingNotificationCount(count ?? 0);
        return;
      }
      console.warn("[BookingNotification] Failed to load last_bookings_seen_at", restaurantError);
      setBookingNotificationCount(0);
      return;
    }
    setSupportsReadMarkers(true);

    let query = supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending");

    if (restaurant?.last_bookings_seen_at) {
      query = query.gt("created_at", restaurant.last_bookings_seen_at);
    }

    const { count, error: countError } = await query;
    if (countError) {
      console.warn("[BookingNotification] Failed to load unread booking count", countError);
      setBookingNotificationCount(0);
      return;
    }

    setBookingNotificationCount(count ?? 0);
  }, [restaurantId]);

  useEffect(() => {
    void loadInitialUnreadCount();
  }, [loadInitialUnreadCount]);

  useEffect(() => {
    if (!pendingReset || !restaurantId) return;
    if (!supportsReadMarkers) {
      localStorage.removeItem(getStorageKey(restaurantId));
      setPendingReset(false);
      return;
    }
    const supabase = createClient();
    void (async () => {
      try {
        await supabase
          .from("restaurants")
          .update({ last_bookings_seen_at: new Date().toISOString() })
          .eq("id", restaurantId);
      } finally {
        setPendingReset(false);
      }
    })();
  }, [pendingReset, restaurantId, supportsReadMarkers]);

  // Set up Supabase realtime listener for new bookings
  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`booking-notifications-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const changedBooking = (payload.new ?? payload.old) as { restaurant_id?: string } | undefined;
          if (changedBooking?.restaurant_id !== restaurantId) return;

          if (supportsReadMarkers) {
            void loadInitialUnreadCount();
            return;
          }

          if (payload.eventType === "INSERT") {
            incrementBookingNotification();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, incrementBookingNotification, loadInitialUnreadCount, supportsReadMarkers]);

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
