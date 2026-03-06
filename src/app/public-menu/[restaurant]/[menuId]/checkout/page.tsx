"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { Language } from "@/types/database";
import { LocationPickerMap, type LatLng } from "@/components/checkout/location-picker-map";

function getDisplayTitle(
  titleRecord: Record<Language, string> | undefined,
  lang: Language
): string {
  if (!titleRecord) return "Unknown Item";
  const order: Language[] = [lang, "de", "en", "fr", "it"];
  for (const l of order) {
    const v = titleRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return "Unknown Item";
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ restaurant: string; menuId: string }>;
}) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{
    restaurant: string;
    menuId: string;
  } | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const { items, getTotal, clearCart, restaurantId } = useCartStore();
  const { language } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  // Redirect if cart is empty (only after mount to avoid hydration issues)
  useEffect(() => {
    if (mounted && items.length === 0 && resolvedParams) {
      router.push(
        `/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`
      );
    }
  }, [mounted, items.length, resolvedParams, router]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (orderType === "dine_in" && !tableNumber.trim()) {
      toast.error("Please enter a table number");
      return;
    }

    if (orderType === "takeaway" && !deliveryAddress.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    if (!restaurantId) {
      toast.error("Restaurant information is missing");
      return;
    }

    try {
      // Persist step-1 checkout data for Order Summary page
      const key = `dineeasy-checkout-step1-${resolvedParams?.restaurant}-${resolvedParams?.menuId}`;
      const payload = {
        customerName: customerName.trim(),
        orderType,
        tableNumber: orderType === "dine_in" ? tableNumber.trim() : "",
        deliveryAddress: orderType === "takeaway" ? deliveryAddress.trim() : "",
        phoneNumber: orderType === "takeaway" ? phoneNumber.trim() : "",
        deliveryLocation: orderType === "takeaway" ? deliveryLocation : null,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, JSON.stringify(payload));
      }

      router.push(
        `/public-menu/${resolvedParams?.restaurant}/${resolvedParams?.menuId}/checkout/order-summary`
      );
    } catch (error) {
      console.error("Checkout continue error:", error);
      toast.error("Failed to continue. Please try again.");
    }
  };

  if (!resolvedParams || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Success state
  if (orderSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-3xl font-bold">Order placed successfully!</h1>
          <p className="mb-6 text-muted-foreground">
            Redirecting to menu in a few seconds...
          </p>
          {resolvedParams && (
            <Link
              href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`}
            >
              <Button variant="outline">Return to Menu</Button>
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}/cart`}
          >
            <Button variant="ghost" size="icon" className="mb-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
          <p className="mt-2 text-muted-foreground">
            Please provide your details to complete your order
          </p>
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {item.quantity}x {getDisplayTitle(item.title, language)}
                </span>
                <span className="font-medium">
                  CHF {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold">CHF {total.toFixed(2)}</span>
          </div>
        </motion.div>

        {/* Checkout Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleContinue}
          className="space-y-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6"
        >
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={loading}
            />
          </div>

          {/* Order Type */}
          <div className="space-y-4">
            <Label>
              Order Type <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={orderType}
              onValueChange={(value) => {
                const newOrderType = value as "dine_in" | "takeaway";
                setOrderType(newOrderType);
                // Clear fields when switching order types
                if (newOrderType === "dine_in") {
                  setDeliveryAddress("");
                  setPhoneNumber("");
                  setDeliveryLocation(null);
                } else {
                  setTableNumber("");
                }
              }}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dine_in" id="dine_in" />
                <Label
                  htmlFor="dine_in"
                  className="cursor-pointer font-normal"
                >
                  Dine-in
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="takeaway" id="takeaway" />
                <Label
                  htmlFor="takeaway"
                  className="cursor-pointer font-normal"
                >
                  Takeaway
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Table Number (conditional for dine-in) */}
          {orderType === "dine_in" && (
            <div className="space-y-2">
              <Label htmlFor="tableNumber">
                Table Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tableNumber"
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter table number"
                required={orderType === "dine_in"}
                disabled={loading}
              />
            </div>
          )}

          {/* Delivery Address (conditional for takeaway) */}
          {orderType === "takeaway" && (
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">
                Delivery Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your delivery address"
                required={orderType === "takeaway"}
                disabled={loading}
              />
            </div>
          )}

          {/* Map (conditional for takeaway when address is being entered) */}
          {orderType === "takeaway" && deliveryAddress.trim().length > 0 && (
            <div className="space-y-2">
              <Label>
                Delivery Location{" "}
                <span className="text-muted-foreground">(Select on map)</span>
              </Label>
              <LocationPickerMap
                value={deliveryLocation}
                onChange={setDeliveryLocation}
              />
              <p className="text-xs text-muted-foreground">
                Tap on the map to drop a pin for the delivery location.
              </p>
            </div>
          )}

          {/* Phone Number (conditional for takeaway) */}
          {orderType === "takeaway" && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone Number <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
