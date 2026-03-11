"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, MapPin } from "lucide-react";
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
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
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
  const [orderSuccess, setOrderSuccess] = useState(false);
  const { items, getTotal, clearCart, restaurantId } = useCartStore();
  const { t, language } = useI18n();
  const checkoutT = (t.order as any)?.public?.checkout;

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

  // Geocode address when it changes
  const geocodeAddress = useCallback(
    async (address: string) => {
      if (!address.trim() || orderType !== "takeaway") {
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
    if (orderType !== "takeaway" || !deliveryAddress.trim()) {
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
    if (orderType !== "takeaway") {
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

  const handleContinue = async (e: React.FormEvent) => {
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

    if (orderType === "takeaway" && !deliveryAddress.trim()) {
      toast.error(checkoutT?.validation?.deliveryAddressRequired || "Please enter a delivery address");
      return;
    }

    if (orderType === "takeaway" && !phoneNumber.trim()) {
      toast.error(checkoutT?.validation?.phoneRequired || "Please enter your phone number");
      return;
    }

    if (
      orderType === "takeaway" &&
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

    try {
      // Persist step-1 checkout data for Order Summary page
      const key = `dineeasy-checkout-step1-${resolvedParams?.restaurant}-${resolvedParams?.menuId}`;
      const payload = {
        customerName: customerName.trim(),
        orderType,
        tableNumber: orderType === "dine_in" ? tableNumber.trim() : "",
        deliveryAddress: orderType === "takeaway" ? deliveryAddress.trim() : "",
        phoneNumber:
          orderType === "takeaway"
            ? `${getCountryByCode(phoneCountryCode)?.dialCode || ""}${phoneNumber.trim()}`
            : "",
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
      toast.error(checkoutT?.messages?.continueFailed || "Failed to continue. Please try again.");
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
          <h1 className="mb-2 text-3xl font-bold">{checkoutT?.success?.title || "Order placed successfully!"}</h1>
          <p className="mb-6 text-muted-foreground">
            {checkoutT?.success?.description || "Redirecting to menu in a few seconds..."}
          </p>
          {resolvedParams && (
            <Link
              href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`}
            >
              <Button variant="outline">{checkoutT?.actions?.returnToMenu || "Return to Menu"}</Button>
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
          <h1 className="text-2xl font-bold sm:text-3xl">{checkoutT?.title || "Checkout"}</h1>
          <p className="mt-2 text-muted-foreground">
            {checkoutT?.description || "Please provide your details to complete your order"}
          </p>
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">{checkoutT?.sections?.orderSummary || "Order Summary"}</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {item.quantity}x {getDisplayTitle(item.title, language, t.order?.labels?.unknownItem || "Unknown Item")}
                </span>
                <span className="font-medium">
                  {(t.menu?.currency || "CHF")} {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-lg font-semibold">{checkoutT?.fields?.total || "Total"}</span>
            <span className="text-xl font-bold">{(t.menu?.currency || "CHF")} {total.toFixed(2)}</span>
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
                const newOrderType = value as "dine_in" | "takeaway";
                setOrderType(newOrderType);
                // Clear fields when switching order types
                if (newOrderType === "dine_in") {
                  setDeliveryAddress("");
                  setPhoneNumber("");
                  setPhoneValidationError("");
                  setDeliveryLocation(null);
                  setLocationDetails(null);
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

          {/* Delivery Address (conditional for takeaway) */}
          {orderType === "takeaway" && (
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">
                {(checkoutT?.fields?.deliveryAddress || "Delivery Address")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={checkoutT?.placeholders?.deliveryAddress || "Enter your delivery address"}
                required={orderType === "takeaway"}
                disabled={loading}
              />
            </div>
          )}

          {/* Map Preview (conditional for takeaway when address is entered) */}
          {orderType === "takeaway" && deliveryAddress.trim().length > 0 && (
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

          {/* Phone Number (conditional for takeaway) */}
          {orderType === "takeaway" && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                {(checkoutT?.fields?.phoneNumber || "Phone Number")} <span className="text-destructive">*</span>
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
                    required={orderType === "takeaway"}
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
                {checkoutT?.actions?.pleaseWait || "Please wait..."}
              </>
            ) : (
              checkoutT?.actions?.continue || "Continue"
            )}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
