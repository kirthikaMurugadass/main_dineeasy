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

const STORAGE_KEY = "dineeasy-order-notifications";

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
          setNotificationCount(count);
        }
      } catch {
        // Invalid stored value, ignore
      }
    }
  }, []);

  // Save to localStorage whenever count changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, notificationCount.toString());
    }
  }, [notificationCount, mounted]);

  const incrementNotification = useCallback(() => {
    console.log("[OrderNotification] Incrementing notification count");
    setNotificationCount((prev) => {
      const newCount = prev + 1;
      console.log("[OrderNotification] Count updated:", prev, "->", newCount);
      return newCount;
    });
  }, []);

  // Store increment function in ref to avoid re-subscription
  useEffect(() => {
    incrementRef.current = incrementNotification;
  }, [incrementNotification]);

  const resetNotification = useCallback(() => {
    console.log("[OrderNotification] Resetting notification count");
    setNotificationCount(0);
    if (mounted) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [mounted]);

  // Set up Supabase realtime listener for new orders
  useEffect(() => {
    if (!restaurantId || !mounted) {
      console.log("[OrderNotification] Skipping subscription - restaurantId:", restaurantId, "mounted:", mounted);
      return;
    }

    console.log("[OrderNotification] Setting up realtime subscription for restaurant:", restaurantId);
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
          console.log("[OrderNotification] New order received:", payload);
          const newOrder = payload.new as { status?: string; restaurant_id?: string };
          console.log("[OrderNotification] Order details:", {
            status: newOrder.status,
            restaurant_id: newOrder.restaurant_id,
            expected_restaurant_id: restaurantId,
          });
          
          // Only increment if order status is "pending" and restaurant matches
          if (newOrder.status === "pending" && newOrder.restaurant_id === restaurantId) {
            console.log("[OrderNotification] Incrementing count for pending order");
            incrementRef.current?.();
          } else {
            console.log("[OrderNotification] Skipping - status:", newOrder.status, "restaurant match:", newOrder.restaurant_id === restaurantId);
          }
        }
      )
      .subscribe((status) => {
        console.log("[OrderNotification] Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("[OrderNotification] Successfully subscribed to orders table");
        } else if (status === "CHANNEL_ERROR") {
          console.error("[OrderNotification] Channel subscription error");
        } else if (status === "TIMED_OUT") {
          console.error("[OrderNotification] Subscription timed out");
        } else if (status === "CLOSED") {
          console.log("[OrderNotification] Subscription closed");
        }
      });

    return () => {
      console.log("[OrderNotification] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [restaurantId, mounted]); // Removed incrementNotification from deps to prevent re-subscription

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
