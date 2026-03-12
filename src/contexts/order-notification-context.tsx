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

const STORAGE_KEY_PREFIX = "dineeasy-order-notifications";

function getStorageKey(restaurantId: string | null) {
  return restaurantId ? `${STORAGE_KEY_PREFIX}:${restaurantId}` : STORAGE_KEY_PREFIX;
}

function isMissingReadMarkerColumn(error: unknown) {
  const message = (error as { message?: string } | null)?.message ?? "";
  return message.includes("last_orders_seen_at");
}

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
  const [supportsReadMarkers, setSupportsReadMarkers] = useState(true);
  const [pendingReset, setPendingReset] = useState(false);

  const incrementNotification = useCallback(() => {
    setNotificationCount((prev) => {
      const next = prev + 1;
      if (!supportsReadMarkers) {
        localStorage.setItem(getStorageKey(restaurantId), String(next));
      }
      return next;
    });
  }, [supportsReadMarkers, restaurantId]);

  const resetNotification = useCallback(() => {
    setNotificationCount(0);
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
      .update({ last_orders_seen_at: new Date().toISOString() })
      .eq("id", restaurantId);
  }, [restaurantId, supportsReadMarkers]);

  const loadInitialUnreadCount = useCallback(async () => {
    if (!restaurantId) {
      setNotificationCount(0);
      return;
    }

    const supabase = createClient();
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("last_orders_seen_at")
      .eq("id", restaurantId)
      .single();

    if (restaurantError) {
      if (isMissingReadMarkerColumn(restaurantError)) {
        setSupportsReadMarkers(false);
        const stored = localStorage.getItem(getStorageKey(restaurantId));
        if (stored && !Number.isNaN(Number(stored))) {
          setNotificationCount(Number(stored));
          return;
        }
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .eq("status", "pending");
        setNotificationCount(count ?? 0);
        return;
      }
      console.warn("[OrderNotification] Failed to load last_orders_seen_at", restaurantError);
      setNotificationCount(0);
      return;
    }
    setSupportsReadMarkers(true);

    let query = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending");

    if (restaurant?.last_orders_seen_at) {
      query = query.gt("created_at", restaurant.last_orders_seen_at);
    }

    const { count, error: countError } = await query;
    if (countError) {
      console.warn("[OrderNotification] Failed to load unread order count", countError);
      setNotificationCount(0);
      return;
    }

    setNotificationCount(count ?? 0);
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
          .update({ last_orders_seen_at: new Date().toISOString() })
          .eq("id", restaurantId);
      } finally {
        setPendingReset(false);
      }
    })();
  }, [pendingReset, restaurantId, supportsReadMarkers]);

  // Set up Supabase realtime listener for new orders
  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`order-notifications-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const changedOrder = (payload.new ?? payload.old) as { restaurant_id?: string } | undefined;
          if (changedOrder?.restaurant_id !== restaurantId) return;

          if (supportsReadMarkers) {
            void loadInitialUnreadCount();
            return;
          }

          if (payload.eventType === "INSERT") {
            incrementNotification();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, incrementNotification, loadInitialUnreadCount, supportsReadMarkers]);

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
