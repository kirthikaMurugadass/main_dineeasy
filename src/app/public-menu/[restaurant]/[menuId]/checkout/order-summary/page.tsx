"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cart-store";
import { useI18n } from "@/lib/i18n/context";
import type { Language } from "@/types/database";

type Step1Data = {
  customerName: string;
  orderType: "dine_in" | "takeaway";
  tableNumber?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  deliveryLocation?: { lat: number; lng: number } | null;
};

function getDisplayTitle(
  titleRecord: Record<Language, string> | undefined,
  lang: Language,
  fallback = "Unknown Item"
): string {
  if (!titleRecord) return fallback;
  const order: Language[] = [lang, "de", "en", "fr", "it"];
  for (const l of order) {
    const v = titleRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return fallback;
}

export default function CheckoutOrderSummaryPage({
  params,
}: {
  params: Promise<{ restaurant: string; menuId: string }>;
}) {
  const router = useRouter();
  const { t, language } = useI18n();
  const summaryT = (t.order as any)?.public?.summary;
  const { items, getTotal, clearCart, restaurantId } = useCartStore();

  const [resolvedParams, setResolvedParams] = useState<{
    restaurant: string;
    menuId: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step1, setStep1] = useState<Step1Data | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  // Load step-1 checkout data from sessionStorage
  useEffect(() => {
    if (!mounted || !resolvedParams) return;
    const key = `dineeasy-checkout-step1-${resolvedParams.restaurant}-${resolvedParams.menuId}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      router.push(
        `/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}/checkout`
      );
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Step1Data;
      setStep1(parsed);
    } catch {
      sessionStorage.removeItem(key);
      router.push(
        `/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}/checkout`
      );
    }
  }, [mounted, resolvedParams, router]);

  // Redirect if cart empty
  useEffect(() => {
    if (mounted && items.length === 0 && resolvedParams) {
      router.push(`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`);
    }
  }, [mounted, items.length, resolvedParams, router]);

  const total = getTotal();

  const prettyOrderType = useMemo(() => {
    if (!step1) return "—";
    return step1.orderType === "dine_in"
      ? (summaryT?.orderTypes?.dineIn || "Dine-in")
      : (summaryT?.orderTypes?.takeaway || "Takeaway");
  }, [step1, summaryT?.orderTypes?.dineIn, summaryT?.orderTypes?.takeaway]);

  async function handlePlaceOrder() {
    if (!resolvedParams || !step1) return;
    if (!restaurantId) {
      toast.error(summaryT?.messages?.restaurantInfoMissing || "Restaurant information is missing");
      return;
    }
    if (!step1.customerName?.trim()) {
      toast.error(summaryT?.messages?.missingCustomerName || "Missing customer name. Please go back.");
      return;
    }

    setSubmitting(true);
    try {
      const locationSuffix =
        step1.orderType === "takeaway" && step1.deliveryLocation
          ? ` (Location: ${step1.deliveryLocation.lat.toFixed(5)}, ${step1.deliveryLocation.lng.toFixed(5)})`
          : "";

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          customerName: step1.customerName.trim(),
          orderType: step1.orderType,
          tableNumber:
            step1.orderType === "dine_in"
              ? parseInt(step1.tableNumber || "", 10)
              : null,
          deliveryAddress:
            step1.orderType === "takeaway"
              ? `${(step1.deliveryAddress || "").trim()}${locationSuffix}`
              : null,
          phoneNumber:
            step1.orderType === "takeaway"
              ? (step1.phoneNumber?.trim() || null)
              : null,
          items: items.map((item) => ({
            itemId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || summaryT?.messages?.failedPlaceOrder || "Failed to place order");
      }

      toast.success(summaryT?.toasts?.orderPlaced || "Order Placed Successfully");
      clearCart();
      setSuccess(true);

      // Cleanup step data
      const key = `dineeasy-checkout-step1-${resolvedParams.restaurant}-${resolvedParams.menuId}`;
      sessionStorage.removeItem(key);

      setTimeout(() => {
        router.push(`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`);
      }, 2500);
    } catch (err) {
      console.error("Order error:", err);
      toast.error(err instanceof Error ? err.message : summaryT?.messages?.failedPlaceOrder || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!resolvedParams || !mounted || !step1) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-3xl font-bold">{summaryT?.success?.title || "Order Placed Successfully"}</h1>
          <p className="mb-6 text-muted-foreground">
            {summaryT?.success?.description || "Redirecting back to the menu..."}
          </p>
          <Link href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`}>
            <Button variant="outline">{summaryT?.actions?.returnToMenu || "Return to Menu"}</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}/checkout`}>
            <Button variant="ghost" size="icon" className="mb-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold sm:text-3xl">{summaryT?.title || "Order Summary"}</h1>
          <p className="mt-2 text-muted-foreground">
            {summaryT?.description || "Review your details before placing the order"}
          </p>
        </div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6"
        >
          <div className="grid gap-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">{summaryT?.fields?.customerName || "Customer Name"}</span>
              <span className="font-semibold">{step1.customerName}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">{summaryT?.fields?.orderType || "Order Type"}</span>
              <span className="font-semibold">{prettyOrderType}</span>
            </div>

            {step1.orderType === "dine_in" && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground">{summaryT?.fields?.tableNumber || "Table Number"}</span>
                <span className="font-semibold">{step1.tableNumber || "—"}</span>
              </div>
            )}

            {step1.orderType === "takeaway" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">{summaryT?.fields?.address || "Address"}</span>
                  <span className="max-w-full break-words text-right font-semibold">{step1.deliveryAddress || "—"}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {summaryT?.fields?.mapLocation || "Map Location"}
                  </span>
                  <span className="font-semibold">
                    {step1.deliveryLocation
                      ? `${step1.deliveryLocation.lat.toFixed(5)}, ${step1.deliveryLocation.lng.toFixed(5)}`
                      : "—"}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Ordered items + total (keep calculation same) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">{summaryT?.sections?.orderedItems || "Ordered Items"}</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}x {getDisplayTitle(item.title, language, t.order?.labels?.unknownItem || "Unknown Item")}
                </span>
                <span className="font-medium">
                  {(t.menu?.currency || "CHF")} {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-lg font-semibold">{summaryT?.fields?.totalAmount || "Total Amount"}</span>
            <span className="text-xl font-bold">{(t.menu?.currency || "CHF")} {total.toFixed(2)}</span>
          </div>
        </motion.div>

        {/* Place Order */}
        <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {summaryT?.actions?.placingOrder || "Placing Order..."}
              </>
            ) : (
              summaryT?.actions?.placeOrder || "Place Order"
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}

