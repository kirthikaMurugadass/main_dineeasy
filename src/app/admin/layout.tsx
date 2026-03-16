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
import { ScrollToTop } from "@/components/ui/scroll-to-top";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantResolved, setRestaurantResolved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadRestaurantId() {
      try {
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
      } finally {
        setRestaurantResolved(true);
      }
    }
    loadRestaurantId();
  }, []);

  return (
    <SidebarProvider>
      <SubscriptionProvider restaurantId={restaurantId} restaurantResolved={restaurantResolved}>
        <OrderNotificationProvider restaurantId={restaurantId}>
          <BookingNotificationProvider restaurantId={restaurantId}>
            <AdminSidebar />
            <SidebarInset className="relative flex min-h-screen flex-col bg-background dark:bg-[#000000]">
              <AdminTopbar />
              <main className="relative flex-1 overflow-x-hidden px-2 pb-5 pt-2 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-6">
                <div className="relative mx-auto flex h-full w-full max-w-[95rem] flex-col rounded-2xl border border-border/70 bg-card px-3 py-4 shadow-card sm:rounded-3xl sm:px-6 sm:py-6 lg:px-8 lg:py-8 dark:border-[#1f1f1f] dark:bg-[#000000]">
                  <PageTransition>{children}</PageTransition>
                </div>
              </main>
              <ScrollToTop />
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
