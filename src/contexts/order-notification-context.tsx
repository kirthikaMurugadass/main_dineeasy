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

interface OrderNotificationContextType {
  notificationCount: number;
  incrementNotification: () => void;
  resetNotification: () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType>({
  notificationCount: 0,
  incrementNotification: () => {},
  resetNotification: () => {},
});

export function OrderNotificationProvider({
  children,
  restaurantId,
}: {
  children: ReactNode;
  restaurantId: string | null;
}) {
  const [notificationCount, setNotificationCount] = useState(0);
  const incrementRef = useRef<() => void>();
  const lastSeenRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const recomputeCount = useCallback(async (supabase: ReturnType<typeof createClient>, rid: string) => {
    const lastSeen = lastSeenRef.current;
    if (!lastSeen) return;
    const { count } = await supabase
      .from("orders")
      .select("id", { head: true, count: "exact" })
      .eq("restaurant_id", rid)
      .gt("created_at", lastSeen);
    setNotificationCount(count ?? 0);
  }, []);

  const incrementNotification = useCallback(() => {
    setNotificationCount((prev) => {
      const newCount = prev + 1;
      return newCount;
    });
  }, []);

  // Store increment function in ref to avoid re-subscription
  useEffect(() => {
    incrementRef.current = incrementNotification;
  }, [incrementNotification]);

  const resetNotification = useCallback(() => {
    setNotificationCount(0);
    if (!restaurantId) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      const now = new Date().toISOString();
      lastSeenRef.current = now;
      await supabase
        .from("admin_notification_state")
        .upsert(
          {
            user_id: user.id,
            restaurant_id: restaurantId,
            last_seen_orders_at: now,
          },
          { onConflict: "user_id,restaurant_id" }
        );
    });
  }, [restaurantId]);

  // Load last-seen and initial count from DB
  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: row } = await supabase
          .from("admin_notification_state")
          .select("last_seen_orders_at")
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurantId)
          .maybeSingle();

        let lastSeen = row?.last_seen_orders_at as string | undefined;
        if (!lastSeen) {
          // First time: initialize last-seen to now (so badge reflects "new" items going forward)
          lastSeen = new Date().toISOString();
          await supabase.from("admin_notification_state").insert({
            user_id: user.id,
            restaurant_id: restaurantId,
            last_seen_orders_at: lastSeen,
            last_seen_bookings_at: lastSeen,
          });
        }

        if (cancelled) return;
        lastSeenRef.current = lastSeen;
        await recomputeCount(supabase, restaurantId);

        // Poll fallback (covers missed realtime events)
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => {
          recomputeCount(supabase, restaurantId).catch(() => {});
        }, 12000);
      } catch {
        // If notification-state table isn't available yet, still allow realtime increments
        lastSeenRef.current = lastSeenRef.current ?? new Date().toISOString();
      }
    })();

    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [restaurantId, recomputeCount]);

  // Refresh count on tab focus
  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();
    const onFocus = () => {
      recomputeCount(supabase, restaurantId).catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [restaurantId, recomputeCount]);

  // Set up Supabase realtime listener for new orders
  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const supabase = createClient();

    // Create a unique channel name to avoid conflicts
    const channelName = `order-notifications-${restaurantId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const newOrder = payload.new as { restaurant_id?: string; created_at?: string };
          if (newOrder.restaurant_id === restaurantId) {
            const lastSeen = lastSeenRef.current;
            if (!lastSeen || !newOrder.created_at || newOrder.created_at > lastSeen) {
              incrementRef.current?.();
            }
          }
        }
      )
      .subscribe((status) => {
        // ignore noisy statuses
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]); // Removed incrementNotification from deps to prevent re-subscription

  return (
    <OrderNotificationContext.Provider
      value={{
        notificationCount,
        incrementNotification,
        resetNotification,
      }}
    >
      {children}
    </OrderNotificationContext.Provider>
  );
}

export const useOrderNotification = () => useContext(OrderNotificationContext);
