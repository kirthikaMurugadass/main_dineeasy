"use client";

import { useEffect, useState } from "react";
import type { Language, PublicMenu, PublicRestaurantData } from "@/types/database";
import { useI18n } from "@/lib/i18n/context";
import { useCartStore } from "@/lib/stores/cart-store";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PosDashboard } from "@/components/menu/pos-dashboard";

type ViewData =
  | PublicMenu
  | (PublicRestaurantData & { menu?: { id: string; slug: string } });

interface Props {
  data: ViewData;
  restaurantId?: string;
  menuId?: string;
  /** When provided (e.g. from preview iframe), use this language and sync with I18n context */
  initialLang?: Language;
}

export function PublicMenuView({ data, restaurantId, menuId, initialLang }: Props) {
  const { t, language, setLanguage } = useI18n();
  const menuPublicT = (t.menu as any)?.public;

  const initialPlanType = (data as any)?.restaurant?.plan_type ?? "free";
  const initialPlanStatus = (data as any)?.restaurant?.plan_status ?? "active";
  const [isProPlan, setIsProPlan] = useState(
    initialPlanType === "pro" && initialPlanStatus === "active"
  );
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);

  const { setRestaurant } = useCartStore();

  // Set restaurant info in cart store when component mounts
  useEffect(() => {
    if (restaurantId && menuId && data.restaurant.slug) {
      setRestaurant(restaurantId, data.restaurant.slug, menuId);
    }
  }, [restaurantId, menuId, data.restaurant.slug, setRestaurant]);

  // Subscribe to restaurant plan changes for realtime gating (ordering enabled only for Pro)
  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("restaurants")
      .select("plan_type, plan_status")
      .eq("id", restaurantId)
      .single()
      .then(({ data: latest }) => {
        if (cancelled || !latest) return;
        const planType = (latest as any).plan_type ?? initialPlanType;
        const planStatus = (latest as any).plan_status ?? initialPlanStatus;
        setIsProPlan(planType === "pro" && (planStatus ?? "active") === "active");
      });

    const channel = supabase
      .channel(`public-restaurant-plan-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurants",
          filter: `id=eq.${restaurantId}`,
        },
        (payload) => {
          const next = payload.new as { plan_type?: string | null; plan_status?: string | null };
          const planType = next?.plan_type ?? initialPlanType;
          const planStatus = next?.plan_status ?? initialPlanStatus;
          setIsProPlan(planType === "pro" && (planStatus ?? "active") === "active");
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [restaurantId, initialPlanType, initialPlanStatus]);

  // Preview mode: force language from URL into the shared i18n context
  useEffect(() => {
    if (initialLang && initialLang !== language) {
      setLanguage(initialLang);
    }
  }, [initialLang, language, setLanguage]);

  const ordersEnabled = !!restaurantId && !!menuId && isProPlan;

  return (
    <>
      <PosDashboard
        data={data}
        restaurantId={restaurantId}
        menuId={menuId}
        ordersEnabled={ordersEnabled}
        onOrderingDisabled={() => setOrdersModalOpen(true)}
      />

      <Dialog open={ordersModalOpen} onOpenChange={setOrdersModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {menuPublicT?.orderingNotAvailableTitle || "Ordering not available"}
            </DialogTitle>
            <DialogDescription>
              {menuPublicT?.orderingNotAvailableDescription ||
                "Online ordering is available only in the Pro plan. You can still view the full menu."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
