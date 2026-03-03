"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

type PlanType = "free" | "pro" | string;

interface SubscriptionState {
  planType: PlanType | null;
  planStatus: string | null;
  billingCycle: string | null;
  loading: boolean;
}

interface SubscriptionContextValue extends SubscriptionState {
  isPro: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  planType: null,
  planStatus: null,
  billingCycle: null,
  loading: true,
  isPro: false,
});

export function SubscriptionProvider({
  restaurantId,
  children,
}: {
  restaurantId: string | null;
  children: ReactNode;
}) {
  const [state, setState] = useState<SubscriptionState>({
    planType: null,
    planStatus: null,
    billingCycle: null,
    loading: true,
  });

  useEffect(() => {
    let isCancelled = false;
    if (!restaurantId) {
      setState({
        planType: null,
        planStatus: null,
        billingCycle: null,
        loading: false,
      });
      return;
    }

    const supabase = createClient();

    async function loadPlan() {
      setState((prev) => ({ ...prev, loading: true }));
      const { data, error } = await supabase
        .from("restaurants")
        .select("plan_type, plan_status, billing_cycle")
        .eq("id", restaurantId)
        .single();

      if (isCancelled) return;

      if (error || !data) {
        // Fallback to free if fields are missing or query fails
        setState({
          planType: "free",
          planStatus: "active",
          billingCycle: null,
          loading: false,
        });
        return;
      }

      setState({
        planType: (data.plan_type as PlanType) ?? "free",
        planStatus: (data.plan_status as string | null) ?? "active",
        billingCycle: (data.billing_cycle as string | null) ?? null,
        loading: false,
      });
    }

    loadPlan();

    const channel = supabase
      .channel(`restaurant-plan-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurants",
          filter: `id=eq.${restaurantId}`,
        },
        (payload) => {
          const next = payload.new as {
            plan_type?: string | null;
            plan_status?: string | null;
            billing_cycle?: string | null;
          };
          setState((prev) => ({
            planType: (next.plan_type as PlanType) ?? prev.planType ?? "free",
            planStatus: next.plan_status ?? prev.planStatus ?? "active",
            billingCycle: next.billing_cycle ?? prev.billingCycle ?? null,
            loading: false,
          }));
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const value: SubscriptionContextValue = useMemo(
    () => ({
      ...state,
      isPro:
        state.planType === "pro" &&
        (state.planStatus === null || state.planStatus === "active"),
    }),
    [state],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

