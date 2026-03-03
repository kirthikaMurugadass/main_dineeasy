"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/motion";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { OrderNotificationProvider } from "@/contexts/order-notification-context";
import { BookingNotificationProvider } from "@/contexts/booking-notification-context";
import { createClient } from "@/lib/supabase/client";
import { SubscriptionProvider } from "@/contexts/subscription-context";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadRestaurantId() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);
      }
    }
    loadRestaurantId();
  }, []);

  return (
    <SidebarProvider>
      <SubscriptionProvider restaurantId={restaurantId}>
        <OrderNotificationProvider restaurantId={restaurantId}>
          <BookingNotificationProvider restaurantId={restaurantId}>
            <AdminSidebar />
            <SidebarInset className="relative flex min-h-screen flex-col bg-background">
              <AdminTopbar />
              <main className="relative flex-1 px-3 pb-6 pt-3 sm:px-5 sm:pb-8 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-6 overflow-x-hidden">
                <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col rounded-3xl border border-border/70 bg-card px-4 py-5 shadow-card sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                  <PageTransition>{children}</PageTransition>
                </div>
              </main>
            </SidebarInset>
          </BookingNotificationProvider>
        </OrderNotificationProvider>
      </SubscriptionProvider>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
