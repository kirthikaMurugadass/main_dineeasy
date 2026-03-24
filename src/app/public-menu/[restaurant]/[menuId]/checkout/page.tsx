"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, MapPin, Wallet, CreditCard, QrCode } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Language } from "@/types/database";
import { LocationPickerMap, type LatLng } from "@/components/checkout/location-picker-map";
import { cn } from "@/lib/utils";
import { redirectToCheckoutSession } from "@/lib/stripe/redirect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCode } from "react-qrcode-logo";
import {
  countryCodes,
  getCountryByCode,
  validatePhoneNumber,
  type CountryCode,
} from "@/lib/data/country-codes";
import { CountryFlag } from "@/components/ui/country-flag";

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
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("CH");
  const [phoneValidationError, setPhoneValidationError] = useState<string>("");
  const [deliveryLocation, setDeliveryLocation] = useState<LatLng | null>(null);
  const [locationDetails, setLocationDetails] = useState<{
    state?: string;
    country?: string;
  } | null>(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { items, getTotal, clearCart, restaurantId } = useCartStore();
  const { t, language } = useI18n();
  const checkoutT = (t.order as any)?.public?.checkout;
  const posT = (t.order as any)?.public?.pos;
  const currency = t.menu?.currency || "CHF";
  const [payment, setPayment] = useState<"cash" | "card" | "qr">("cash");
  const celebrateT = checkoutT?.celebration;
  const [qrOpen, setQrOpen] = useState(false);

  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [celebrateOrderId, setCelebrateOrderId] = useState<string | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  async function placeOrderCashOrQr() {
    if (!restaurantId) {
      toast.error(checkoutT?.messages?.restaurantInfoMissing || "Restaurant information is missing");
      return;
    }
    if (!resolvedParams) return;

    const locationSuffix =
      orderType === "delivery" && deliveryLocation
        ? ` (Location: ${deliveryLocation.lat.toFixed(5)}, ${deliveryLocation.lng.toFixed(5)})`
        : "";

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        customerName: customerName.trim(),
        orderType,
        tableNumber: orderType === "dine_in" ? parseInt(tableNumber || "", 10) : null,
        deliveryAddress:
          orderType === "delivery"
            ? `${deliveryAddress.trim()}${locationSuffix}`
            : null,
        phoneNumber:
          orderType === "delivery"
            ? `${getCountryByCode(phoneCountryCode)?.dialCode || ""}${phoneNumber.trim()}`
            : null,
        items: items.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        // Payment method is UI-only for now (no API changes)
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || checkoutT?.messages?.failedPlaceOrder || "Failed to place order");
    }

    const placedOrderId = (data?.orderId as string | undefined) ?? null;

    // Persist receipt snapshot for the success page (no API changes)
    if (typeof window !== "undefined" && placedOrderId) {
      const key = `dineeasy-order-receipt-${placedOrderId}`;
      const createdAt = new Date().toISOString();
      const subtotal = getTotal();
      const tax = 0;
      const totalAmount = subtotal + tax;
      const snapshot = {
        orderId: placedOrderId,
        createdAt,
        orderType,
        tableNumber: orderType === "dine_in" ? tableNumber.trim() : "",
        deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : "",
        phoneNumber:
          orderType === "delivery"
            ? `${getCountryByCode(phoneCountryCode)?.dialCode || ""}${phoneNumber.trim()}`
            : "",
        paymentMethod: payment,
        items: items.map((it) => ({
          id: it.id,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
        })),
        subtotal,
        tax,
        totalAmount,
      };
      sessionStorage.setItem(key, JSON.stringify(snapshot));
    }

    clearCart();
    setCelebrateOrderId(placedOrderId);
    setCelebrateOpen(true);
  }

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  // Redirect if cart is empty (only after mount to avoid hydration issues)
  useEffect(() => {
    if (mounted && items.length === 0 && resolvedParams && !celebrateOpen) {
      router.push(
        `/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`
      );
    }
  }, [mounted, items.length, resolvedParams, router, celebrateOpen]);

  useEffect(() => {
    if (!celebrateOpen) return;
    if (typeof window === "undefined") return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const durationMs = 3200;
    const endAt = Date.now() + durationMs;
    setConfettiVisible(true);

    // Use canvas-confetti for smoother, more realistic SaaS-style confetti.
    import("canvas-confetti")
      .then((mod) => {
        if (cancelled) return;
        const confetti = (mod as any).default ?? mod;
        const fire = confetti.create(canvas, { resize: true, useWorker: true });

        const colors = [
          "#fbbf24", // yellow
          "#22c55e", // green
          "#a78bfa", // purple
          "#ef4444", // red
          "#f97316", // orange
        ];

        // Full-screen birthday celebration burst (center + top spread)
        fire({
          particleCount: 160,
          angle: 90,
          spread: 360,
          startVelocity: 52,
          gravity: 1.05,
          ticks: 260,
          scalar: 0.95,
          origin: { x: 0.5, y: 0.45 },
          colors,
        });

        // Top line bursts to fill the full width.
        const topOrigins = [0.1, 0.3, 0.5, 0.7, 0.9];
        for (const x of topOrigins) {
          fire({
            particleCount: 46,
            angle: 90,
            spread: 85,
            startVelocity: 48,
            gravity: 1.12,
            ticks: 240,
            scalar: 0.9,
            origin: { x, y: 0.05 },
            colors,
          });
        }

        // A couple of softer follow-up bursts for a modern feel (2–3s total).
        (function frame() {
          if (cancelled) return;
          const timeLeft = endAt - Date.now();
          if (timeLeft <= 0) {
            try {
              fire.reset();
            } catch {
              // ignore
            }
            setConfettiVisible(false);
            return;
          }

          // Gentle full-screen follow-up bursts for ~3s.
          if (Math.random() < 0.22) {
            fire({
              particleCount: 22,
              angle: 90,
              spread: 100,
              startVelocity: 32,
              gravity: 1.1,
              ticks: 220,
              scalar: 0.85,
              origin: { x: Math.random(), y: 0.02 },
              colors,
            });
          }

          requestAnimationFrame(frame);
        })();
      })
      .catch(() => {
        // If confetti fails to load, skip animation (no functional impact).
        setConfettiVisible(false);
      });

    return () => {
      cancelled = true;
      setConfettiVisible(false);
    };
  }, [celebrateOpen]);



  // Geocode address when it changes
  const geocodeAddress = useCallback(
    async (address: string) => {
      if (!address.trim() || orderType !== "delivery") {
        setDeliveryLocation(null);
        setLocationDetails(null);
        return;
      }

      setGeocodingLoading(true);
      try {
        // Use Nominatim (OpenStreetMap) geocoding API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}&limit=1&addressdetails=1`,
          {
            headers: {
              "User-Agent": "DineEasy/1.0",
            },
          }
        );

        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);

          if (!isNaN(lat) && !isNaN(lng)) {
            const newLocation: LatLng = { lat, lng };
            setDeliveryLocation(newLocation);

            // Extract location details
            const addressParts = result.address || {};
            setLocationDetails({
              state: addressParts.state || addressParts.region || undefined,
              country: addressParts.country || undefined,
            });
          }
        } else {
          setDeliveryLocation(null);
          setLocationDetails(null);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        // Don't show error to user, just don't update location
        setDeliveryLocation(null);
        setLocationDetails(null);
      } finally {
        setGeocodingLoading(false);
      }
    },
    [orderType]
  );

  // Debounced geocoding when address changes
  useEffect(() => {
    if (orderType !== "delivery" || !deliveryAddress.trim()) {
      setDeliveryLocation(null);
      setLocationDetails(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      geocodeAddress(deliveryAddress);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [deliveryAddress, orderType, geocodeAddress]);

  // Validate phone number when it changes
  useEffect(() => {
    if (orderType !== "delivery") {
      setPhoneValidationError("");
      return;
    }

    if (!phoneNumber.trim()) {
      setPhoneValidationError("");
      return;
    }

    const validation = validatePhoneNumber(phoneNumber, phoneCountryCode);
    if (!validation.valid) {
      setPhoneValidationError(validation.message || (checkoutT?.validation?.invalidPhone || "Invalid phone number"));
    } else {
      setPhoneValidationError("");
    }
  }, [phoneNumber, phoneCountryCode, orderType]);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerName.trim()) {
      toast.error(checkoutT?.validation?.nameRequired || "Please enter your name");
      return;
    }

    if (orderType === "dine_in" && !tableNumber.trim()) {
      toast.error(checkoutT?.validation?.tableNumberRequired || "Please enter a table number");
      return;
    }

    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast.error(checkoutT?.validation?.deliveryAddressRequired || "Please enter your delivery address");
      return;
    }

    if (
      orderType === "delivery" &&
      phoneNumber.trim() &&
      phoneValidationError
    ) {
      toast.error(phoneValidationError);
      return;
    }

    if (!restaurantId) {
      toast.error(checkoutT?.messages?.restaurantInfoMissing || "Restaurant information is missing");
      return;
    }

    if (!resolvedParams) return;

    // Stripe Checkout handles card entry for online payments (Card/QR)

    setLoading(true);
    try {
      // For Card/QR: redirect to Stripe Checkout BEFORE creating the order.
      if (payment === "card") {
        if (!resolvedParams) return;

        const orderPayload = {
          restaurantId,
          customerName: customerName.trim(),
          orderType,
          tableNumber: orderType === "dine_in" ? parseInt(tableNumber || "", 10) : null,
          deliveryAddress:
            orderType === "delivery"
              ? `${deliveryAddress.trim()}${
                  orderType === "delivery" && deliveryLocation
                    ? ` (Location: ${deliveryLocation.lat.toFixed(5)}, ${deliveryLocation.lng.toFixed(5)})`
                    : ""
                }`
              : null,
          phoneNumber:
            orderType === "delivery"
              ? `${getCountryByCode(phoneCountryCode)?.dialCode || ""}${phoneNumber.trim()}`
              : null,
          items: items.map((item) => ({
            itemId: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          restaurantSlug: resolvedParams.restaurant,
          menuId: resolvedParams.menuId,
        };

        // Persist pending order for /success?type=order (no changes to existing order API)
        if (typeof window !== "undefined") {
          const raw = JSON.stringify(orderPayload);
          window.sessionStorage.setItem("dineeasy-pending-order", raw);
          // Also store in localStorage so it survives full redirects (Stripe) more reliably.
          window.localStorage.setItem("dineeasy-pending-order", raw);
        }

        const sessionRes = await fetch("/api/create-order-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            restaurantSlug: resolvedParams.restaurant,
            menuId: resolvedParams.menuId,
            pendingOrder: orderPayload,
            items: items.map((item) => ({
              name: getDisplayTitle(item.title, language, t.order?.labels?.unknownItem || "Unknown Item"),
              price: item.price,
              quantity: item.quantity,
            })),
            currency,
            cancelPath: `/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`,
          }),
        });
        const sessionData = await sessionRes.json().catch(() => ({}));
        if (!sessionRes.ok) {
          // Don't throw in event handler (causes Next.js error overlay). Show a toast instead.
          toast.error(sessionData?.error || "Failed to start payment");
          return;
        }
        await redirectToCheckoutSession({
          sessionId: sessionData.sessionId as string,
          url: (sessionData.url as string | undefined) ?? null,
        });
        return;
      }

      // Cash or QR demo payment confirms order immediately
      await placeOrderCashOrQr();

    } catch (error) {
      console.error("Order error:", error);
      toast.error(
        error instanceof Error ? error.message : checkoutT?.messages?.failedPlaceOrder || "Failed to place order"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!resolvedParams || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const subtotal = getTotal();
  const tax = 0;
  const totalAmount = subtotal + tax;

  const receiptHref =
    celebrateOrderId && resolvedParams
      ? `/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}/checkout/success?orderId=${encodeURIComponent(
          celebrateOrderId
        )}`
      : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Celebration modal */}
        {celebrateOpen && (
          <div
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Full-screen confetti layer */}
            <canvas
              ref={confettiCanvasRef}
              style={{ width: "100vw", height: "100vh" }}
              className={cn(
                "pointer-events-none fixed top-0 left-0 right-0 bottom-0 h-[100vh] w-[100vw] z-[9999] transition-opacity duration-200",
                confettiVisible ? "opacity-100" : "opacity-0"
              )}
            />

            <motion.div
              className="relative z-[10000] w-full max-w-lg rounded-3xl border border-border/60 bg-background p-6 shadow-floating sm:p-8"
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-2xl" />

              <motion.div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-soft"
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1.06, 1] }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </motion.div>
              <h2 className="mt-4 text-center text-2xl font-bold text-foreground">
                {celebrateT?.title || "Order Successful!"}
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {celebrateT?.message || "Your order has been placed successfully."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  className="rounded-2xl"
                  onClick={() => {
                    if (receiptHref) router.push(receiptHref);
                  }}
                  disabled={!receiptHref}
                >
                  {celebrateT?.viewReceipt || "View Receipt"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    router.push(`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`);
                  }}
                >
                  {celebrateT?.backToMenu || "Back to Menu"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`}
          >
            <Button variant="ghost" size="icon" className="mb-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold sm:text-3xl">{checkoutT?.title || "Checkout"}</h1>
          <p className="mt-2 text-muted-foreground">
            {checkoutT?.description || "Please provide your details to complete your order"}
          </p>
        </div>

        {/* Single Card Checkout (details + items + totals + payment + confirm) */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleConfirmOrder}
          className="space-y-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold">
            {checkoutT?.sections?.orderSummary || "Order Summary"}
          </h2>

          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">
              {(checkoutT?.fields?.yourName || "Your Name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={checkoutT?.placeholders?.yourName || "Enter your name"}
              required
              disabled={loading}
            />
          </div>

          {/* Order Type */}
          <div className="space-y-4">
            <Label>
              {(checkoutT?.fields?.orderType || "Order Type")} <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={orderType}
              onValueChange={(value) => {
                const newOrderType = value as "dine_in" | "takeaway" | "delivery";
                setOrderType(newOrderType);
                // Clear fields when switching order types
                if (newOrderType === "dine_in") {
                  setDeliveryAddress("");
                  setPhoneNumber("");
                  setPhoneValidationError("");
                  setDeliveryLocation(null);
                  setLocationDetails(null);
                } else if (newOrderType === "takeaway") {
                  setDeliveryAddress("");
                  setPhoneNumber("");
                  setPhoneValidationError("");
                  setDeliveryLocation(null);
                  setLocationDetails(null);
                  setTableNumber("");
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
                  {checkoutT?.orderTypes?.dineIn || "Dine-in"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="takeaway" id="takeaway" />
                <Label
                  htmlFor="takeaway"
                  className="cursor-pointer font-normal"
                >
                  {checkoutT?.orderTypes?.takeaway || "Takeaway"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label
                  htmlFor="delivery"
                  className="cursor-pointer font-normal"
                >
                  {checkoutT?.orderTypes?.delivery || "Delivery"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Table Number (conditional for dine-in) */}
          {orderType === "dine_in" && (
            <div className="space-y-2">
              <Label htmlFor="tableNumber">
                {(checkoutT?.fields?.tableNumber || "Table Number")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tableNumber"
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder={checkoutT?.placeholders?.tableNumber || "Enter table number"}
                required={orderType === "dine_in"}
                disabled={loading}
              />
            </div>
          )}

          {/* Delivery Address (conditional for delivery) */}
          {orderType === "delivery" && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Label htmlFor="deliveryAddress">
                {(checkoutT?.fields?.deliveryAddress || "Delivery Address")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={checkoutT?.placeholders?.deliveryAddress || "Enter your delivery address"}
                required={orderType === "delivery"}
                disabled={loading}
              />
            </motion.div>
          )}

          {/* Map Preview (conditional for delivery when address is entered) */}
          {orderType === "delivery" && deliveryAddress.trim().length > 0 && (
            <div className="space-y-2">
              <Label>
                {(checkoutT?.fields?.deliveryLocation || "Delivery Location")}{" "}
                <span className="text-muted-foreground">
                  {geocodingLoading
                    ? `(${checkoutT?.labels?.detectingLocation || "Detecting location..."})`
                    : `(${checkoutT?.labels?.autoDetected || "Auto-detected"})`}
                </span>
              </Label>
              {deliveryLocation ? (
                <>
                  <LocationPickerMap
                    value={deliveryLocation}
                    onChange={setDeliveryLocation}
                  />
                  {locationDetails && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {locationDetails.state && (
                        <span className="text-muted-foreground">
                          {(checkoutT?.fields?.state || "State")}: <span className="font-medium text-foreground">{locationDetails.state}</span>
                        </span>
                      )}
                      {locationDetails.country && (
                        <span className="text-muted-foreground">
                          {locationDetails.state && "• "}{(checkoutT?.fields?.country || "Country")}:{" "}
                          <span className="font-medium text-foreground">{locationDetails.country}</span>
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {checkoutT?.messages?.adjustPin || "Tap on the map to adjust the delivery location pin."}
                  </p>
                </>
              ) : geocodingLoading ? (
                <div className="flex h-56 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    {checkoutT?.messages?.enterValidAddress || "Enter a valid address to see the map preview"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Phone Number (optional; shown for delivery) */}
          {orderType === "delivery" && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                {(checkoutT?.fields?.phoneNumber || "Phone Number")}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={phoneCountryCode}
                  onValueChange={setPhoneCountryCode}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={checkoutT?.placeholders?.selectCountry || "Select country"}>
                      {getCountryByCode(phoneCountryCode) && (
                        <span className="flex items-center gap-2">
                          <CountryFlag
                            code={phoneCountryCode}
                            className="flex-shrink-0"
                          />
                          <span className="text-sm font-medium">
                            {getCountryByCode(phoneCountryCode)?.dialCode}
                          </span>
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] w-[280px]">
                    {countryCodes.map((country) => (
                      <SelectItem 
                        key={country.code} 
                        value={country.code}
                        className="cursor-pointer py-2.5"
                      >
                        <span className="flex items-center gap-2.5 w-full">
                          <CountryFlag
                            code={country.code}
                          />
                          <span className="flex-1 text-left font-medium text-sm">
                            {country.name}
                          </span>
                          <span className="text-muted-foreground text-sm font-normal">
                            ({country.dialCode})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, "");
                      setPhoneNumber(value);
                    }}
                    placeholder={checkoutT?.placeholders?.phoneNumber || "Enter phone number"}
                    disabled={loading}
                    className={
                      phoneValidationError
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {phoneValidationError && (
                    <p className="mt-1 text-xs text-destructive">
                      {phoneValidationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cart items */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {(checkoutT?.sections?.items || (t.menu as any)?.public?.items || "Items")}
            </div>
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {item.quantity}x{" "}
                    {getDisplayTitle(item.title, language, t.order?.labels?.unknownItem || "Unknown Item")}
                  </span>
                  <span className="shrink-0 font-medium text-foreground">
                    {currency} {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{posT?.subtotal || "Sub Total"}</span>
              <span className="font-semibold text-foreground">{currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{posT?.tax || "Tax"}</span>
              <span className="font-semibold text-foreground">{currency} {tax.toFixed(2)}</span>
            </div>
            <div className="mt-3 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {posT?.totalAmount || "Total Amount"}
                </span>
                <span className="text-lg font-bold text-foreground">
                  {currency} {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods (moved here) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {posT?.paymentMethods || "Payment"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={payment === "cash" ? "default" : "outline"}
                className="h-10 rounded-2xl"
                onClick={() => setPayment("cash")}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {posT?.payment?.cash || "Cash"}
              </Button>
              <Button
                type="button"
                variant={payment === "card" ? "default" : "outline"}
                className="h-10 rounded-2xl"
                onClick={() => setPayment("card")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {posT?.payment?.card || "Card"}
              </Button>
              <Button
                type="button"
                variant={payment === "qr" ? "default" : "outline"}
                className="h-10 rounded-2xl"
                onClick={() => {
                  setPayment("qr");
                  setQrOpen(true);
                }}
              >
                <QrCode className="mr-2 h-4 w-4" />
                {posT?.payment?.qr || "QR"}
              </Button>
            </div>
          </div>

          {/* Confirm order */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {(t.order as any)?.public?.summary?.actions?.placingOrder || checkoutT?.actions?.pleaseWait || "Please wait..."}
              </>
            ) : (
              payment === "card"
                ? (checkoutT?.actions?.payNow || "Pay Now")
                : (posT?.placeOrder || (t.order as any)?.public?.summary?.actions?.placeOrder || "Place Order")
            )}
          </Button>
        </motion.form>
      </div>

      {/* QR demo modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan to Pay (Demo)</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-xl border border-border/60 bg-white p-3">
              <QRCode
                value={`DineEasy Demo Payment | ${resolvedParams?.restaurant ?? ""} | ${Date.now()}`}
                size={180}
                qrStyle="squares"
                eyeRadius={6}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              This is a demo QR. Scan to Pay (Demo), then click “I Have Paid” to confirm your order.
            </p>
            <Button
              type="button"
              className="w-full rounded-xl"
              onClick={async () => {
                if (loading) return;
                setQrOpen(false);
                setLoading(true);
                try {
                  await placeOrderCashOrQr();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to place order");
                } finally {
                  setLoading(false);
                }
              }}
            >
              I Have Paid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
