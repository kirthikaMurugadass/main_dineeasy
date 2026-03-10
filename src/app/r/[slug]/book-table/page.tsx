"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Phone, MapPin, User, MessageSquare, CheckCircle2, Loader2, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/theme-provider";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  countryCodes,
  getCountryByCode,
  validatePhoneNumber,
  type CountryCode,
} from "@/lib/data/country-codes";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan_type?: string | null;
  plan_status?: string | null;
  theme_config?: any | null;
}

export default function BookTablePage() {
  const params = useParams();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || (theme === "system" ? "light" : theme);
  const ThemeIcon = currentTheme === "light" ? Sun : currentTheme === "dark" ? Moon : Monitor;
  const [mounted, setMounted] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDisabled, setBookingDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("CH");
  const [phoneValidationError, setPhoneValidationError] = useState<string>("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [specialNote, setSpecialNote] = useState("");

  const settings = (restaurant?.theme_config ?? {})?.settings ?? {};
  const heroImageUrl: string =
    (restaurant?.theme_config ?? {})?.headerImageUrl ||
    (restaurant?.theme_config ?? {})?.heroBanner?.backgroundImage ||
    "/images/hero.jpg";
  const business = settings.business ?? {};
  const address = settings.address ?? {};
  const cuisineType = settings.cuisineType ?? settings.cuisine ?? null;

  // Time slots (you can customize these)
  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00"
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadRestaurant() {
      const slug = params.slug as string;
      if (!slug) return;

      const supabase = createClient();
      const { data: restaurantData, error } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url, plan_type, plan_status, theme_config")
        .eq("slug", slug)
        .single();

      if (error || !restaurantData) {
        toast.error("Restaurant not found");
        router.push("/");
        return;
      }

      const planType = restaurantData.plan_type ?? "free";
      const planStatus = restaurantData.plan_status ?? "active";

      if (planType !== "pro" || planStatus !== "active") {
        setBookingDisabled(true);
      }

      setRestaurant(restaurantData);
      setLoading(false);
    }

    loadRestaurant();
  }, [params.slug, router]);

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];

  // Real-time phone validation
  useEffect(() => {
    if (phone.trim() && phoneCountryCode) {
      const validation = validatePhoneNumber(phone.trim(), phoneCountryCode);
      if (!validation.valid) {
        setPhoneValidationError(validation.message || "");
      } else {
        setPhoneValidationError("");
      }
    } else {
      setPhoneValidationError("");
    }
  }, [phone, phoneCountryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    // Validate phone number based on selected country
    const phoneValidation = validatePhoneNumber(phone.trim(), phoneCountryCode);
    if (!phoneValidation.valid) {
      setPhoneValidationError(phoneValidation.message || "Invalid phone number");
      toast.error(phoneValidation.message || "Invalid phone number");
      return;
    }
    setPhoneValidationError("");

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!date) {
      toast.error("Please select a date");
      return;
    }

    if (!time) {
      toast.error("Please select a time");
      return;
    }

    if (!guestCount) {
      toast.error("Please select number of guests");
      return;
    }

    if (!restaurant) {
      toast.error("Restaurant information is missing");
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (selectedDate < todayDate) {
      toast.error("Please select a future date");
      return;
    }

    setSubmitting(true);

    try {
      // Persist step 1 data in sessionStorage for multi-step flow
      const key = `dineeasy-book-table-step1-${restaurant.slug}`;
      const payload = {
        restaurantId: restaurant.id,
        customerName: name.trim(),
        phone: `${getCountryByCode(phoneCountryCode)?.dialCode || ""}${phone.trim()}`,
        email: email.trim(),
        bookingDate: date,
        bookingTime: time,
        guestCount: parseInt(guestCount),
        specialNote: specialNote.trim() || null,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, JSON.stringify(payload));
      }

      // Redirect to table selection step
      router.push(`/r/${restaurant.slug}/book-table/select-table`);
    } catch (error) {
      console.error("Booking step 1 error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start booking"
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  if (bookingDisabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Online bookings are not available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This restaurant does not currently accept online table bookings.
              Please contact the restaurant directly to make a reservation.
            </p>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => router.push(`/r/${restaurant.slug}`)}
            >
              Back to menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // QR Scan Intro Page - shown before reservation form
  if (showIntro) {
    const handleFindTable = () => {
      if (!date) {
        toast.error("Please select a date");
        return;
      }
      if (!time) {
        toast.error("Please select a time");
        return;
      }
      if (!guestCount) {
        toast.error("Please select number of guests");
        return;
      }
      setShowIntro(false);
    };

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#000000] font-sans">
        {/* Immersive hero background */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={heroImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized={
              heroImageUrl.includes("127.0.0.1") || heroImageUrl.includes("localhost")
            }
          />
          {/* Premium overlay (keeps text readable) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/90" />
          {/* Subtle ambient glow */}
          <div className="absolute -top-24 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#22C55E]/10 blur-3xl" />
          <div className="absolute -bottom-40 right-[-140px] h-[560px] w-[560px] rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* Theme toggle – top right */}
        {mounted && (
          <div className="fixed top-4 right-4 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-border/60 bg-card shadow-sm transition duration-200 hover:opacity-80 dark:bg-[#111111] dark:border-[#1f1f1f]"
                  aria-label="Toggle theme"
                >
                  <ThemeIcon className="h-[18px] w-[18px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[10000] min-w-[140px] rounded-xl border border-border bg-popover p-1 shadow-lg"
              >
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="rounded-lg py-2.5 text-foreground"
                >
                  <Sun className="mr-3 h-[18px] w-[18px]" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="rounded-lg py-2.5 text-foreground"
                >
                  <Moon className="mr-3 h-[18px] w-[18px]" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="rounded-lg py-2.5 text-foreground"
                >
                  <Monitor className="mr-3 h-[18px] w-[18px]" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-10">
          {/* Top restaurant label */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {restaurant.logo_url ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur">
                  <Image
                    src={restaurant.logo_url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white backdrop-blur">
                  {restaurant.name.charAt(0)}
                </div>
              )}
              <div className="leading-tight">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                  {restaurant.name}
                </p>
                <p className="text-[11px] text-white/55">Restaurant reservation</p>
              </div>
            </div>
          </motion.div>

          {/* Hero + booking card */}
          <div className="mt-12 grid flex-1 items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                PREMIUM DINING
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Reserve an Unforgettable Dining Experience
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Pick a date and time, choose your party size, and we’ll help you find the best table for your visit.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
              className="mx-auto w-full max-w-xl"
            >
              <Card className="overflow-hidden rounded-[20px] border border-white/12 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold text-white">
                    Find a Table
                </CardTitle>
                  <p className="text-sm text-white/70">
                    Select your preferred date, time, and guests.
                  </p>
              </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Date */}
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-sm font-medium text-white leading-none">
                        Date
                      </Label>
                      <div className="relative">
                        {/* Hide native indicator (we render our own icon), but keep input behavior */}
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={today}
                          className={[
                            "h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 pr-12 text-sm text-white shadow-sm transition-all",
                            "focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20",
                            "[&::-webkit-calendar-picker-indicator]:opacity-0",
                            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                          ].join(" ")}
                        />
                        <Calendar className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/70" />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-sm font-medium text-white leading-none">
                        Time
                      </Label>
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger className="flex h-12 items-center justify-between rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white shadow-sm transition-all hover:bg-white/5 focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot} className="rounded-lg">
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Guests */}
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-sm font-medium text-white leading-none">
                        Guests
                      </Label>
                      <Select value={guestCount} onValueChange={setGuestCount}>
                        <SelectTrigger className="flex h-12 items-center justify-between rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white shadow-sm transition-all hover:bg-white/5 focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)} className="rounded-lg">
                              {num} {num === 1 ? "Guest" : "Guests"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                <Button
                    type="button"
                    onClick={handleFindTable}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-base font-semibold shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
                >
                    Find Table
                </Button>

                  <p className="text-xs text-white/60">
                    You’ll enter your name and contact details in the next step.
                  </p>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* THE EXPERIENCE (single clean card) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-12"
          >
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur-xl sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  Premium Dining
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  A premium dining moment — curated for you
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
                  {settings.description ||
                    "Enjoy an elevated dining experience with warm hospitality, thoughtfully crafted dishes, and a calm ambience — perfect for celebrations or a quiet evening out."}
                </p>
              </div>

              <div className="mt-6 h-px w-full bg-white/10" />

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {/* Hours */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <Clock className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Hours</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {(business.openingHours && business.closingHours)
                        ? `Mon–Sun: ${business.openingHours} – ${business.closingHours}`
                        : "Set opening & closing hours in Admin Settings"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <MapPin className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Location</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {[address.street, address.city, address.state, address.country, address.postalCode]
                        .filter(Boolean)
                        .join(", ") || "Set restaurant address in Admin Settings"}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <Phone className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Contact</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {settings.contactPhone || "Set contact phone in Admin Settings"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Success screen is now handled after table selection / final confirmation

  return (
    <div className="min-h-screen bg-[#FAFAF5] dark:bg-[#000000] font-sans">
      {/* Theme toggle – top right */}
      {mounted && (
        <div className="fixed top-4 right-4 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-border/60 bg-card shadow-sm transition duration-200 hover:opacity-80 dark:bg-[#111111] dark:border-[#1f1f1f]"
                aria-label="Toggle theme"
              >
                <ThemeIcon className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-[10000] min-w-[140px] rounded-xl border border-border bg-popover p-1 shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="rounded-lg py-2.5 text-foreground"
              >
                <Sun className="mr-3 h-[18px] w-[18px]" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="rounded-lg py-2.5 text-foreground"
              >
                <Moon className="mr-3 h-[18px] w-[18px]" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="rounded-lg py-2.5 text-foreground"
              >
                <Monitor className="mr-3 h-[18px] w-[18px]" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
        {/* Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
          <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA88A] dark:text-[#9ca3af] mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Step 1 of 4
            </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Book Your Table
              </h1>
          </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#DCFCE7] dark:bg-[#22c55e]/10 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-sm font-medium text-[#166534] dark:text-[#22c55e]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {restaurant.name}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Booking Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          onSubmit={handleSubmit}
          className="flex-1 space-y-6"
          id="book-table-form"
        >
          {/* Guest Information Card */}
          <Card className="rounded-2xl border border-[#E4E0D2] bg-white shadow-lg dark:border-[#1f1f1f] dark:bg-[#000000] overflow-hidden">
            <div className="bg-gradient-to-r from-[#22C55E]/5 via-transparent to-transparent dark:from-[#22C55E]/5 px-6 pt-6 pb-2">
              <CardTitle className="text-lg font-semibold text-[#1a1a1a] dark:text-white flex items-center gap-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                <User className="h-5 w-5 text-[#22C55E]" />
                Guest Information
              </CardTitle>
            </div>
            <CardContent className="px-6 pt-4 pb-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA88A] dark:text-[#6b7280]" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    disabled={submitting}
                    className="h-12 rounded-xl border-2 border-[#E4E0D2] bg-white pl-12 pr-4 text-sm font-normal shadow-sm transition-all placeholder:text-[#9ca3af] focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white dark:placeholder:text-[#6b7280]"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3">
                  <Select
                    value={phoneCountryCode}
                    onValueChange={setPhoneCountryCode}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-[200px] h-12 rounded-xl border-2 border-[#E4E0D2] bg-white text-sm font-normal shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white">
                      <SelectValue placeholder="Select country">
                        {getCountryByCode(phoneCountryCode) && (
                          <span className="flex items-center gap-2.5">
                            <CountryFlag code={phoneCountryCode} className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm font-medium" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                              {getCountryByCode(phoneCountryCode)?.dialCode}
                            </span>
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] w-[300px] rounded-xl">
                      {countryCodes.map((country) => (
                        <SelectItem 
                          key={country.code} 
                          value={country.code}
                          className="cursor-pointer py-3 rounded-lg"
                        >
                          <span className="flex items-center gap-3 w-full">
                            <CountryFlag code={country.code} className="h-5 w-5 flex-shrink-0" />
                            <span className="flex-1 text-left font-medium text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                              {country.name}
                            </span>
                            <span className="text-muted-foreground text-sm font-normal" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                              {country.dialCode}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA88A] dark:text-[#6b7280]" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneValidationError("");
                      }}
                      placeholder={getCountryByCode(phoneCountryCode)?.validation.message.replace(/.*must be/, "").trim() || "Enter phone number"}
                    required
                    disabled={submitting}
                      className={`h-12 rounded-xl border-2 bg-white pl-12 pr-4 text-sm font-normal shadow-sm transition-all placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:bg-[#0f0f0f] dark:text-white dark:placeholder:text-[#6b7280] ${
                        phoneValidationError 
                          ? "border-red-500 focus-visible:border-red-500 dark:border-red-500" 
                          : "border-[#E4E0D2] focus-visible:border-[#22C55E] dark:border-[#1f1f1f] dark:focus-visible:border-[#22C55E]"
                      }`}
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    />
                    {phoneValidationError && (
                      <p className="mt-2 text-xs text-red-500 font-medium" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{phoneValidationError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={submitting}
                  className="h-12 rounded-xl border-2 border-[#E4E0D2] bg-white px-4 text-sm font-normal shadow-sm transition-all placeholder:text-[#9ca3af] focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white dark:placeholder:text-[#6b7280]"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visit Details Card */}
          <Card className="rounded-2xl border border-[#E4E0D2] bg-white shadow-lg dark:border-[#1f1f1f] dark:bg-[#000000] overflow-hidden">
            <div className="bg-gradient-to-r from-[#22C55E]/5 via-transparent to-transparent dark:from-[#22C55E]/5 px-6 pt-6 pb-2">
              <CardTitle className="text-lg font-semibold text-[#1a1a1a] dark:text-white flex items-center gap-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                <Calendar className="h-5 w-5 text-[#22C55E]" />
                Visit Details
              </CardTitle>
            </div>
            <CardContent className="px-6 pt-4 pb-6 space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Date to Come <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA88A] dark:text-[#6b7280]" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    required
                    disabled={submitting}
                    className="h-12 rounded-xl border-2 border-[#E4E0D2] bg-white pl-12 pr-4 text-sm font-normal shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  />
                </div>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Time to Come <span className="text-red-500">*</span>
                </Label>
                <Select value={time} onValueChange={setTime} disabled={submitting}>
                  <SelectTrigger
                    id="time"
                    className="h-12 rounded-xl border-2 border-[#E4E0D2] bg-white text-sm font-normal shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                  >
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot} className="rounded-lg">
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Guest Count */}
              <div className="space-y-2">
                <Label htmlFor="guests" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Number of Guests <span className="text-red-500">*</span>
                </Label>
                <Select value={guestCount} onValueChange={setGuestCount} disabled={submitting}>
                  <SelectTrigger
                    id="guests"
                    className="h-12 rounded-xl border-2 border-[#E4E0D2] bg-white text-sm font-normal shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()} className="rounded-lg">
                        {num} {num === 1 ? "Person" : "Persons"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Special Note */}
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Special Notes <span className="text-xs font-normal text-[#9ca3af]">(optional)</span>
                </Label>
                <Textarea
                  id="note"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  rows={4}
                  disabled={submitting}
                  className="rounded-xl border-2 border-[#E4E0D2] bg-white px-4 py-3 text-sm font-normal shadow-sm transition-all placeholder:text-[#9ca3af] focus-visible:border-[#22C55E] focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white dark:placeholder:text-[#6b7280] resize-none"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.form>

        {/* Bottom sticky CTA */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#FAFAF5] via-[#FAFAF5]/95 to-transparent pb-6 pt-6 dark:from-[#000000] dark:via-[#000000] dark:to-transparent">
          <div className="pointer-events-auto mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 sm:px-6">
            <div className="flex items-center justify-between text-xs text-[#6B7B5A] dark:text-[#9ca3af] px-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              <span className="font-medium">Next: Select Table</span>
              <span className="font-medium">
                {guestCount} {guestCount === "1" ? "guest" : "guests"}
              </span>
            </div>
            <Button
              type="submit"
              form="book-table-form"
              size="lg"
              className="w-full h-14 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-semibold text-base shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={submitting}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Select Table"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
