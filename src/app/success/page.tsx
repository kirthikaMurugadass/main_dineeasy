"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cart-store";

type SuccessType = "order" | "pro" | null;

type PendingOrderPayload = {
  restaurantId: string;
  customerName: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber: number | null;
  deliveryAddress: string | null;
  phoneNumber: string | null;
  items: Array<{ itemId: string; quantity: number; price: number }>;
  restaurantSlug: string;
  menuId: string;
};

const PENDING_ORDER_KEY = "dineeasy-pending-order";

export default function SuccessPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const type = (sp.get("type") as SuccessType) ?? null;
  const [working, setWorking] = useState(true);

  const cart = useCartStore();

  function redirectBackToCheckout(pending?: Partial<PendingOrderPayload> | null) {
    const restaurantSlug = pending?.restaurantSlug;
    const menuId = pending?.menuId;
    if (restaurantSlug && menuId) {
      router.replace(
        `/public-menu/${encodeURIComponent(restaurantSlug)}/${encodeURIComponent(menuId)}/checkout`,
      );
      return;
    }
    router.replace("/");
  }

  const info = useMemo(() => {
    if (type === "pro") return "Finalizing your Pro upgrade…";
    if (type === "order") return "Confirming your order…";
    return "Processing…";
  }, [type]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (type === "pro") {
          // Trigger existing Pro upgrade logic (do not change how plan is stored)
          const res = await fetch("/api/subscription/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ billingCycle: "monthly" }),
            credentials: "same-origin",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || "Failed to activate Pro");
          toast.success("Pro plan activated.");
          router.replace("/admin");
          return;
        }

        if (type === "order") {
          const raw =
            typeof window !== "undefined"
              ? window.sessionStorage.getItem(PENDING_ORDER_KEY)
              : null;
          if (!raw) {
            toast.error("Missing pending order details. Please place the order again.");
            redirectBackToCheckout(null);
            return;
          }
          const pending = JSON.parse(raw) as PendingOrderPayload;
          if (
            !pending?.restaurantId ||
            !pending?.customerName?.trim() ||
            !pending?.orderType ||
            !pending?.items?.length
          ) {
            toast.error("Invalid pending order. Please place the order again.");
            redirectBackToCheckout(pending);
            return;
          }

          if (pending.orderType === "dine_in" && (!pending.tableNumber || pending.tableNumber < 1)) {
            toast.error("Missing table number. Please place the order again.");
            redirectBackToCheckout(pending);
            return;
          }

          if (pending.orderType === "delivery" && !pending.deliveryAddress?.trim()) {
            toast.error("Missing delivery address. Please place the order again.");
            redirectBackToCheckout(pending);
            return;
          }

          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              restaurantId: pending.restaurantId,
              customerName: pending.customerName,
              orderType: pending.orderType,
              tableNumber: pending.tableNumber,
              deliveryAddress: pending.deliveryAddress,
              phoneNumber: pending.phoneNumber,
              items: pending.items,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data?.error || "Failed to confirm order. Please place the order again.");
            redirectBackToCheckout(pending);
            return;
          }

          // Clear cart only after order is actually created
          cart.clearCart();
          window.sessionStorage.removeItem(PENDING_ORDER_KEY);

          const orderId = (data?.orderId as string | undefined) ?? null;
          if (orderId) {
            router.replace(
              `/public-menu/${encodeURIComponent(pending.restaurantSlug)}/${encodeURIComponent(
                pending.menuId,
              )}/checkout/success?orderId=${encodeURIComponent(orderId)}`,
            );
            return;
          }

          router.replace(
            `/public-menu/${encodeURIComponent(pending.restaurantSlug)}/${encodeURIComponent(
              pending.menuId,
            )}`,
          );
          return;
        }

        router.replace("/");
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Something went wrong");
        // Don't send users to the payment cancel page for app errors.
        if (type === "order") {
          try {
            const raw =
              typeof window !== "undefined"
                ? window.sessionStorage.getItem(PENDING_ORDER_KEY)
                : null;
            const pending = raw ? (JSON.parse(raw) as PendingOrderPayload) : null;
            redirectBackToCheckout(pending);
            return;
          } catch {
            router.replace("/");
            return;
          }
        }
        router.replace("/");
      } finally {
        if (!cancelled) setWorking(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router, type, cart]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        {working && <Loader2 className="h-5 w-5 animate-spin" />}
        <span className="text-sm">{info}</span>
      </div>
    </div>
  );
}

