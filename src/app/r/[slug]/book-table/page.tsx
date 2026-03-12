"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Users, Phone, MapPin, User, MessageSquare, CheckCircle2, Loader2, Sun, Moon, Monitor, Globe } from "lucide-react";
import { format, isValid, parse, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/theme-provider";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { LanguageFlag } from "@/components/ui/language-flag";
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
  const { t, language, setLanguage, languages } = useI18n();
  const flowT = t.booking?.publicFlow;
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
        toast.error(flowT?.messages?.restaurantNotFound || "Restaurant not found");
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
  const minDay = startOfDay(new Date());
  const parsedSelectedDate = date ? parse(date, "yyyy-MM-dd", new Date()) : null;
  const selectedDateObj = parsedSelectedDate && isValid(parsedSelectedDate) ? parsedSelectedDate : undefined;
  const formattedDateLabel =
    selectedDateObj ? format(selectedDateObj, "PPP") : (date || "");

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
      toast.error(flowT?.validation?.nameRequired || "Please enter your name");
      return;
    }

    if (!phone.trim()) {
      toast.error(flowT?.validation?.phoneRequired || "Please enter your phone number");
      return;
    }

    // Validate phone number based on selected country
    const phoneValidation = validatePhoneNumber(phone.trim(), phoneCountryCode);
    if (!phoneValidation.valid) {
      setPhoneValidationError(phoneValidation.message || (flowT?.validation?.invalidPhone || "Invalid phone number"));
      toast.error(phoneValidation.message || (flowT?.validation?.invalidPhone || "Invalid phone number"));
      return;
    }
    setPhoneValidationError("");

    if (!email.trim()) {
      toast.error(flowT?.validation?.emailRequired || "Please enter your email");
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(flowT?.validation?.invalidEmail || "Please enter a valid email address");
      return;
    }

    if (!date) {
      toast.error(flowT?.validation?.dateRequired || "Please select a date");
      return;
    }

    if (!time) {
      toast.error(flowT?.validation?.timeRequired || "Please select a time");
      return;
    }

    if (!guestCount) {
      toast.error(flowT?.validation?.guestsRequired || "Please select number of guests");
      return;
    }

    if (!restaurant) {
      toast.error(flowT?.messages?.restaurantInfoMissing || "Restaurant information is missing");
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (selectedDate < todayDate) {
      toast.error(flowT?.validation?.futureDateRequired || "Please select a future date");
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
        error instanceof Error ? error.message : flowT?.messages?.startBookingError || "Failed to start booking"
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
            <CardTitle>
              {flowT?.messages?.onlineBookingUnavailableTitle ||
                "Online bookings are not available"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {flowT?.messages?.onlineBookingUnavailable ||
                "This restaurant does not currently accept online table bookings. Please contact the restaurant directly to make a reservation."}
            </p>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => router.push(`/r/${restaurant.slug}`)}
            >
              {flowT?.actions?.backToMenu || "Back to menu"}
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
        toast.error(flowT?.validation?.dateRequired || "Please select a date");
        return;
      }
      if (!time) {
        toast.error(flowT?.validation?.timeRequired || "Please select a time");
        return;
      }
      if (!guestCount) {
        toast.error(flowT?.validation?.guestsRequired || "Please select number of guests");
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
          <div className="absolute -top-24 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 right-[-140px] h-[560px] w-[560px] rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* Theme toggle – top right */}
        {mounted && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-border/60 bg-card shadow-sm transition duration-200 hover:opacity-80 dark:bg-[#111111] dark:border-[#1f1f1f]"
                  aria-label="Switch language"
                >
                  <Globe className="h-[18px] w-[18px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[10000] min-w-[180px] rounded-xl border border-border/70 bg-background/80 p-1 shadow-lg backdrop-blur-md"
              >
                {languages.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onClick={() => setLanguage(option.code)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      language === option.code
                        ? "bg-accent/90 text-accent-foreground shadow-sm"
                        : "text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <LanguageFlag code={option.code} />
                    {option.label}
                    {language === option.code && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                <p className="text-[11px] text-white/55">
                  {flowT?.intro?.restaurantReservation || "Restaurant reservation"}
                </p>
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
                {flowT?.intro?.premiumDining || "PREMIUM DINING"}
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {flowT?.intro?.headline || "Reserve an Unforgettable Dining Experience"}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                {flowT?.intro?.subheadline ||
                  "Pick a date and time, choose your party size, and we'll help you find the best table for your visit."}
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
                    {flowT?.intro?.findTableTitle || "Find a Table"}
                </CardTitle>
                  <p className="text-sm text-white/70">
                    {flowT?.intro?.findTableSubtitle || "Select your preferred date, time, and guests."}
                  </p>
              </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Date */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white leading-none">
                        {flowT?.fields?.date || "Date"}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="intro-date"
                            type="button"
                            variant="outline"
                            disabled={submitting}
                            className={cn(
                              "relative h-12 w-full justify-start rounded-xl border border-white/10 bg-black/35 pr-4 pl-11 text-left text-sm font-normal text-white shadow-sm transition-all hover:bg-white/5",
                              !date && "text-white/70"
                            )}
                          >
                            <CalendarIcon className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/70" />
                            <span className="truncate">
                              {date ? formattedDateLabel : (flowT?.placeholders?.select || "Select")}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-2">
                          <Calendar
                            mode="single"
                            selected={selectedDateObj}
                            onSelect={(d) => {
                              if (!d) return;
                              setDate(format(d, "yyyy-MM-dd"));
                            }}
                            disabled={(d) => d < minDay}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white leading-none">
                        {flowT?.fields?.time || "Time"}
                      </Label>
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-black/35 px-4 py-0 text-sm text-white shadow-sm transition-all hover:bg-white/5 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20">
                          <SelectValue placeholder={flowT?.placeholders?.select || "Select"} />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          align="start"
                          className="w-(--radix-select-trigger-width) rounded-2xl border border-border/70 shadow-premium"
                        >
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot} className="rounded-lg">
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Guests */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label className="text-sm font-medium text-white leading-none">
                        {flowT?.fields?.guests || "Guests"}
                      </Label>
                      <Select value={guestCount} onValueChange={setGuestCount}>
                        <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-black/35 px-4 py-0 text-sm text-white shadow-sm transition-all hover:bg-white/5 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20">
                          <SelectValue placeholder={flowT?.placeholders?.select || "Select"} />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          align="start"
                          className="w-(--radix-select-trigger-width) rounded-2xl border border-border/70 shadow-premium"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)} className="rounded-lg">
                              {num} {num === 1 ? (t.booking?.labels?.guestSingular || "Guest") : (t.booking?.labels?.guestPlural || "Guests")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                <Button
                    type="button"
                    onClick={handleFindTable}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-base font-semibold shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
                >
                    {flowT?.actions?.findTable || "Find Table"}
                </Button>

                  <p className="text-xs text-white/60">
                    {flowT?.intro?.nextStepHint || "You'll enter your name and contact details in the next step."}
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
                  {flowT?.intro?.premiumDiningTitle || "Premium Dining"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {flowT?.intro?.premiumDiningHeading || "A premium dining moment - curated for you"}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
                  {settings.description ||
                    flowT?.intro?.premiumDiningDescription ||
                    "Enjoy an elevated dining experience with warm hospitality, thoughtfully crafted dishes, and a calm ambience - perfect for celebrations or a quiet evening out."}
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
                    <p className="text-sm font-semibold text-white">{flowT?.sections?.hours || "Hours"}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {(business.openingHours && business.closingHours)
                        ? `Mon–Sun: ${business.openingHours} – ${business.closingHours}`
                        : flowT?.messages?.setOpeningClosingHours || "Set opening and closing hours in Admin Settings"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <MapPin className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{flowT?.sections?.location || "Location"}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {[address.street, address.city, address.state, address.country, address.postalCode]
                        .filter(Boolean)
                        .join(", ") || flowT?.messages?.setAddress || "Set restaurant address in Admin Settings"}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <Phone className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{flowT?.sections?.contact || "Contact"}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {settings.contactPhone || flowT?.messages?.setContactPhone || "Set contact phone in Admin Settings"}
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
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto grid w-full max-w-[95rem] grid-cols-1 gap-4 p-3 pb-24 sm:p-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        {/* Left sidebar (visual only) */}
        <aside className="hidden lg:block">
          <Card className="h-[calc(100vh-2rem)] rounded-3xl border border-border/60 bg-card shadow-soft">
            <CardContent className="flex h-full flex-col gap-5 p-5">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-muted">
                  {restaurant.logo_url ? (
                    <Image
                      src={restaurant.logo_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                      {restaurant.name?.slice(0, 1)?.toUpperCase() || "R"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">
                    {restaurant.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {flowT?.steps?.step1Of4 || "Step 1 of 4"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {flowT?.sections?.visitDetails || "Visit Details"}
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.dateToCome || flowT?.fields?.date || "Date"}</span>
                    <span className="font-semibold text-foreground">{date || "—"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.timeToCome || flowT?.fields?.time || "Time"}</span>
                    <span className="font-semibold text-foreground">{time || "—"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.numberOfGuests || "Guests"}</span>
                    <span className="font-semibold text-foreground">{guestCount || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {flowT?.sections?.guestInformation || "Guest Information"}
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.fullName || "Guest Name"}</span>
                    <span className="max-w-[140px] truncate font-semibold text-foreground">{name || "—"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.phoneNumber || "Phone"}</span>
                    <span className="max-w-[140px] truncate font-semibold text-foreground">{phone || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl"
                  onClick={() => router.push(`/r/${restaurant.slug}`)}
                  type="button"
                >
                  {flowT?.actions?.backToMenu || "Back to menu"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <section className="min-w-0">
          <Card className="rounded-3xl border border-border/60 bg-card shadow-soft">
            <CardContent className="p-5 sm:p-6">
              {/* Top header (POS-style) */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {flowT?.steps?.step1Of4 || "Step 1 of 4"}
                  </div>
                  <h1 className="mt-1 truncate text-2xl font-bold text-foreground sm:text-3xl">
                    {flowT?.steps?.bookYourTable || "Book Your Table"}
                  </h1>
                </div>

                {/* Actions (language / theme) */}
                {mounted && (
                  <div className="flex items-center justify-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 rounded-2xl"
                          aria-label={(t.menu as any)?.public?.switchLanguage || "Switch language"}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 rounded-xl border border-border/70 bg-card p-1 shadow-xl"
                      >
                        {languages.map((option) => (
                          <DropdownMenuItem
                            key={option.code}
                            onClick={() => setLanguage(option.code)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              language === option.code
                                ? "bg-accent text-accent-foreground shadow-sm"
                                : "text-foreground hover:bg-muted/60"
                            )}
                          >
                            <LanguageFlag code={option.code} className="h-4 w-4" />
                            <span className="flex-1 text-left">{option.label}</span>
                            {language === option.code && (
                              <span className="text-primary text-xs">✓</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 rounded-2xl"
                          aria-label={(t.menu as any)?.public?.toggleTheme || "Toggle theme"}
                        >
                          <ThemeIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl border border-border/70 bg-card p-1 shadow-xl"
                      >
                        <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg py-2.5 text-sm">
                          <Sun className="mr-2 h-4 w-4" /> {(t.menu as any)?.public?.themeLight || "Light"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg py-2.5 text-sm">
                          <Moon className="mr-2 h-4 w-4" /> {(t.menu as any)?.public?.themeDark || "Dark"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg py-2.5 text-sm">
                          <Monitor className="mr-2 h-4 w-4" /> {(t.menu as any)?.public?.themeSystem || "System"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="mt-6 space-y-6"
                id="book-table-form"
              >
          {/* Guest Information Card */}
          <Card className="rounded-3xl border border-border/60 bg-background shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 pt-6 pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {flowT?.sections?.guestInformation || "Guest Information"}
              </CardTitle>
            </div>
            <CardContent className="px-6 pt-4 pb-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {(flowT?.fields?.fullName || "Full Name")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={flowT?.placeholders?.fullName || "John Doe"}
                    required
                    disabled={submitting}
                    className="h-12 rounded-2xl border border-border/60 bg-background pl-12 pr-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {(flowT?.fields?.phoneNumber || "Phone Number")} <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3">
                  <Select
                    value={phoneCountryCode}
                    onValueChange={setPhoneCountryCode}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-[200px] h-12 rounded-2xl border border-border/60 bg-background text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20">
                    <SelectValue placeholder={flowT?.placeholders?.selectCountry || "Select country"}>
                        {getCountryByCode(phoneCountryCode) && (
                          <span className="flex items-center gap-2.5">
                            <CountryFlag code={phoneCountryCode} className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm font-medium">
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
                            <span className="flex-1 text-left font-medium text-sm">
                              {country.name}
                            </span>
                            <span className="text-muted-foreground text-sm font-normal">
                              {country.dialCode}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
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
                      className={`h-12 rounded-2xl border bg-background pl-12 pr-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 ${
                        phoneValidationError 
                          ? "border-red-500 focus-visible:border-red-500" 
                          : "border-border/60 focus-visible:border-primary"
                      }`}
                    />
                    {phoneValidationError && (
                      <p className="mt-2 text-xs text-red-500 font-medium">{phoneValidationError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {(flowT?.fields?.email || "Email")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={flowT?.placeholders?.email || "you@example.com"}
                  required
                  disabled={submitting}
                  className="h-12 rounded-2xl border border-border/60 bg-background px-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Visit Details Card */}
          <Card className="rounded-3xl border border-border/60 bg-background shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 pt-6 pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {flowT?.sections?.visitDetails || "Visit Details"}
              </CardTitle>
            </div>
            <CardContent className="px-6 pt-4 pb-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {(flowT?.fields?.dateToCome || "Date to Come")} <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        className={cn(
                          "relative h-12 w-full justify-start rounded-2xl border border-border/60 bg-background pr-4 pl-11 text-left text-sm font-normal shadow-sm transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <span className="truncate">
                          {date ? formattedDateLabel : (flowT?.placeholders?.selectDate || flowT?.placeholders?.select || "Select")}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                      <Calendar
                        mode="single"
                        selected={selectedDateObj}
                        onSelect={(d) => {
                          if (!d) return;
                          setDate(format(d, "yyyy-MM-dd"));
                        }}
                        disabled={(d) => d < minDay}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {(flowT?.fields?.timeToCome || "Time to Come")} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={time} onValueChange={setTime} disabled={submitting}>
                    <SelectTrigger
                      id="time"
                      className="h-12 w-full rounded-2xl border border-border/60 bg-background py-0 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <SelectValue placeholder={flowT?.placeholders?.selectTime || "Select time"} />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      align="start"
                      className="w-(--radix-select-trigger-width) rounded-2xl border border-border/70 shadow-premium"
                    >
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot} className="rounded-lg">
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Guests */}
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="guests" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {(flowT?.fields?.numberOfGuests || "Number of Guests")} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={guestCount} onValueChange={setGuestCount} disabled={submitting}>
                    <SelectTrigger
                      id="guests"
                      className="h-12 w-full rounded-2xl border border-border/60 bg-background py-0 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <SelectValue placeholder={flowT?.placeholders?.select || "Select"} />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      align="start"
                      className="w-(--radix-select-trigger-width) rounded-2xl border border-border/70 shadow-premium"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()} className="rounded-lg">
                          {num} {num === 1 ? (flowT?.labels?.personSingular || "Person") : (flowT?.labels?.personPlural || "Persons")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Special Note */}
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium text-[#1a1a1a] dark:text-[#ffffff]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {(flowT?.fields?.specialNotes || "Special Notes")} <span className="text-xs font-normal text-[#9ca3af]">({flowT?.labels?.optional || "optional"})</span>
                </Label>
                <Textarea
                  id="note"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder={flowT?.placeholders?.specialRequests || "Any special requests or dietary requirements..."}
                  rows={4}
                  disabled={submitting}
                  className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                />
              </div>
            </CardContent>
          </Card>
              </motion.form>
            </CardContent>
          </Card>
        </section>

        {/* Right details panel */}
        <aside className="hidden xl:block">
          <Card className="sticky top-4 rounded-3xl border border-border/60 bg-card shadow-soft">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-foreground">
                {flowT?.sections?.reservationDetails || flowT?.sections?.visitDetails || "Booking Details"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {flowT?.actions?.nextSelectTable || "Next: Select Table"}
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{flowT?.fields?.fullName || "Guest Name"}</span>
                    <span className="max-w-[180px] truncate font-semibold text-foreground">{name || "—"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{flowT?.fields?.numberOfGuests || "Number of Guests"}</span>
                    <span className="font-semibold text-foreground">{guestCount || "—"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{flowT?.fields?.bookingTime || flowT?.fields?.timeToCome || "Booking Time"}</span>
                    <span className="font-semibold text-foreground">
                      {date || "—"} • {time || "—"}
                    </span>
                  </div>
                  {specialNote?.trim() ? (
                    <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {flowT?.fields?.specialRequest || flowT?.fields?.specialNotes || "Special Request"}:
                      </span>{" "}
                      {specialNote}
                    </div>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  form="book-table-form"
                  size="lg"
                  className="w-full rounded-2xl"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {flowT?.actions?.processing || "Processing..."}
                    </>
                  ) : (
                    flowT?.actions?.continueToSelectTable || flowT?.actions?.continue || "Continue"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile/tablet sticky CTA */}
      <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-[95rem] items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {flowT?.actions?.nextSelectTable || "Next: Select Table"}
            </div>
            <div className="text-xs text-muted-foreground">
              {guestCount}{" "}
              {guestCount === "1"
                ? (t.booking?.labels?.guestSingular || "guest")
                : (t.booking?.labels?.guestPlural || "guests")}{" "}
              • {date || "—"} • {time || "—"}
            </div>
          </div>
          <Button
            type="submit"
            form="book-table-form"
            className="rounded-2xl"
            disabled={submitting}
          >
            {flowT?.actions?.continueToSelectTable || flowT?.actions?.continue || "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
