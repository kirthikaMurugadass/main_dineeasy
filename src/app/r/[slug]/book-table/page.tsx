"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Loader2,
  MapPin,
  Monitor,
  Moon,
  Phone,
  Sun,
  Table2,
  User,
  Users,
} from "lucide-react";
import { format, isValid, parse, startOfDay } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/theme-provider";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { LanguageFlag } from "@/components/ui/language-flag";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  countryCodes,
  getCountryByCode,
  validatePhoneNumber,
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

interface RestaurantTable {
  id: string;
  table_name: string;
  capacity: number;
  is_active: boolean;
}

interface BookingLock {
  table_id: string;
  session_id: string;
  locked_until: string;
}

type TableStatus = "available" | "occupied" | "selected";

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

export default function BookTablePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = useMemo(() => createClient(), []);
  const { t, language, setLanguage, languages } = useI18n();
  const flowT = t.booking?.publicFlow;
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || (theme === "system" ? "light" : theme);
  const ThemeIcon = currentTheme === "light" ? Sun : currentTheme === "dark" ? Moon : Monitor;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDisabled, setBookingDisabled] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [bookedTableIds, setBookedTableIds] = useState<Set<string>>(new Set());
  const [lockedByOthersTableIds, setLockedByOthersTableIds] = useState<Set<string>>(new Set());
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("CH");
  const [phoneValidationError, setPhoneValidationError] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");

  const sessionId =
    typeof window !== "undefined"
      ? (() => {
          const key = "dineeasy-book-table-session-id";
          const existing = sessionStorage.getItem(key);
          if (existing) return existing;
          const id = crypto.randomUUID();
          sessionStorage.setItem(key, id);
          return id;
        })()
      : "";

  const settings = (restaurant?.theme_config ?? {})?.settings ?? {};
  const heroImageUrl: string =
    (restaurant?.theme_config ?? {})?.headerImageUrl ||
    (restaurant?.theme_config ?? {})?.heroBanner?.backgroundImage ||
    "/images/hero.jpg";
  const business = settings.business ?? {};
  const address = settings.address ?? {};

  const minDay = startOfDay(new Date());
  const parsedSelectedDate = date ? parse(date, "yyyy-MM-dd", new Date()) : null;
  const selectedDateObj = parsedSelectedDate && isValid(parsedSelectedDate) ? parsedSelectedDate : undefined;
  const formattedDateLabel = selectedDateObj ? format(selectedDateObj, "PPP") : (date || "");

  const sortedTables = useMemo(
    () =>
      [...tables].sort((a, b) =>
        a.table_name.localeCompare(b.table_name, undefined, { numeric: true, sensitivity: "base" }),
      ),
    [tables],
  );

  const selectedTable = sortedTables.find((table) => table.id === selectedTableId) || null;
  const guestCountNumber = Number.parseInt(guestCount || "0", 10);
  const isCapacityMatch = (table: RestaurantTable) => table.capacity === guestCountNumber;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadRestaurantAndTables() {
      if (!slug) return;

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

      const { data: tablesData, error: tablesError } = await supabase
        .from("restaurant_tables")
        .select("id, table_name, capacity, is_active")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_active", true)
        .order("table_name");

      if (tablesError) {
        toast.error(flowT?.messages?.failedLoadTables || "Failed to load tables");
      }

      setRestaurant(restaurantData);
      setTables(tablesData || []);
      setLoading(false);
    }

    loadRestaurantAndTables();
  }, [flowT?.messages?.failedLoadTables, flowT?.messages?.restaurantNotFound, router, slug, supabase]);

  useEffect(() => {
    async function refreshAvailability() {
      if (!restaurant?.id || !date || !time || showIntro) {
        setBookedTableIds(new Set());
        setLockedByOthersTableIds(new Set());
        return;
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("table_id")
        .eq("restaurant_id", restaurant.id)
        .eq("booking_date", date)
        .eq("booking_time", time)
        .in("status", ["pending", "confirmed"]);

      const bookedIds = new Set<string>();
      (bookingsData || []).forEach((b) => {
        if (b.table_id) bookedIds.add(b.table_id as string);
      });
      setBookedTableIds(bookedIds);

      const nowIso = new Date().toISOString();
      const { data: locksData } = await supabase
        .from("table_locks")
        .select("table_id, session_id, locked_until")
        .eq("booking_date", date)
        .eq("booking_time", time)
        .gt("locked_until", nowIso);

      const lockedByOthersIds = new Set<string>();
      (locksData as BookingLock[] | null)?.forEach((lock) => {
        if (lock.session_id !== sessionId) {
          lockedByOthersIds.add(lock.table_id);
        }
      });
      setLockedByOthersTableIds(lockedByOthersIds);
    }

    refreshAvailability();
  }, [date, restaurant?.id, sessionId, showIntro, supabase, time]);

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

  useEffect(() => {
    if (!selectedTableId) return;
    const selected = sortedTables.find((table) => table.id === selectedTableId);
    if (selected && !isCapacityMatch(selected)) {
      setSelectedTableId(null);
    }
  }, [guestCount, selectedTableId, sortedTables]);

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

  const getTableStatus = (tableId: string): TableStatus => {
    if (selectedTableId === tableId) return "selected";
    if (bookedTableIds.has(tableId) || lockedByOthersTableIds.has(tableId)) return "occupied";
    return "available";
  };

  const handleSelectTable = async (tableId: string) => {
    if (!restaurant || !date || !time) {
      toast.error("Please select date and time first");
      return;
    }

    const table = sortedTables.find((t) => t.id === tableId);
    if (!table) return;
    if (!isCapacityMatch(table)) {
      toast.error("Selected table capacity does not match the number of guests.");
      return;
    }

    const status = getTableStatus(tableId);
    if (status === "occupied") {
      toast.error("This table is occupied for the selected time");
      return;
    }

    try {
      await supabase
        .from("table_locks")
        .delete()
        .eq("session_id", sessionId)
        .eq("booking_date", date)
        .eq("booking_time", time);

      const lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { error } = await supabase.from("table_locks").insert({
        table_id: tableId,
        booking_date: date,
        booking_time: time,
        locked_until: lockedUntil,
        session_id: sessionId,
      });

      if (error) {
        toast.error(flowT?.messages?.failedSelectTableRetry || "Failed to select table");
        return;
      }

      setSelectedTableId(tableId);
    } catch {
      toast.error(flowT?.messages?.failedSelectTable || "Failed to select table");
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    if (!name.trim()) {
      toast.error(flowT?.validation?.nameRequired || "Please enter your name");
      return;
    }
    if (!phone.trim()) {
      toast.error(flowT?.validation?.phoneRequired || "Please enter your phone number");
      return;
    }
    const phoneValidation = validatePhoneNumber(phone.trim(), phoneCountryCode);
    if (!phoneValidation.valid) {
      setPhoneValidationError(phoneValidation.message || "");
      toast.error(phoneValidation.message || (flowT?.validation?.invalidPhone || "Invalid phone number"));
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
    if (!selectedTableId) {
      toast.error(flowT?.validation?.selectTableRequired || "Please select a table");
      return;
    }
    if (!selectedTable || !isCapacityMatch(selectedTable)) {
      toast.error("Selected table capacity does not match the number of guests.");
      return;
    }

    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const { data: validLocks } = await supabase
        .from("table_locks")
        .select("id")
        .eq("table_id", selectedTableId)
        .eq("booking_date", date)
        .eq("booking_time", time)
        .eq("session_id", sessionId)
        .gt("locked_until", nowIso)
        .limit(1);

      if (!validLocks || validLocks.length === 0) {
        toast.error(flowT?.messages?.tableHoldExpired || "Your selected table hold has expired");
        setSelectedTableId(null);
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          customerName: name.trim(),
          phone: `${getCountryByCode(phoneCountryCode)?.dialCode || ""}${phone.trim()}`,
          email: email.trim(),
          bookingDate: date,
          bookingTime: time,
          guestCount: parseInt(guestCount, 10),
          specialNote: null,
          tableId: selectedTableId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || flowT?.messages?.failedCreateBooking || "Failed to create booking");
      }

      await supabase
        .from("table_locks")
        .delete()
        .eq("session_id", sessionId)
        .eq("booking_date", date)
        .eq("booking_time", time);

      const receipt = {
        bookingId: data.bookingId || data.id || "N/A",
        restaurantName: restaurant.name,
        customerName: name.trim(),
        tableName: selectedTable?.table_name || "N/A",
        guests: guestCount,
        date,
        time,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`dineeasy-booking-receipt-${slug}`, JSON.stringify(receipt));
      }

      router.push(`/r/${slug}/book-table/success?bookingId=${encodeURIComponent(receipt.bookingId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (flowT?.messages?.failedConfirmBooking || "Failed to confirm booking"));
    } finally {
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

  if (!restaurant) return null;

  if (bookingDisabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>{flowT?.messages?.onlineBookingUnavailableTitle || "Online bookings are not available"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {flowT?.messages?.onlineBookingUnavailable ||
                "This restaurant does not currently accept online table bookings. Please contact the restaurant directly."}
            </p>
            <Button variant="outline" className="w-full rounded-full" onClick={() => router.push(`/r/${restaurant.slug}`)}>
              {flowT?.actions?.backToMenu || "Back to menu"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Keep existing landing page layout/design intact.
  if (showIntro) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#000000] font-sans">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={heroImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized={heroImageUrl.includes("127.0.0.1") || heroImageUrl.includes("localhost")}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/90" />
          <div className="absolute -top-24 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 right-[-140px] h-[560px] w-[560px] rounded-full bg-white/5 blur-3xl" />
        </div>

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
              <DropdownMenuContent align="end" className="z-[10000] min-w-[180px] rounded-xl border border-border/70 bg-background/80 p-1 shadow-lg backdrop-blur-md">
                {languages.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onClick={() => setLanguage(option.code)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      language === option.code
                        ? "bg-accent/90 text-accent-foreground shadow-sm"
                        : "text-foreground hover:bg-muted/70",
                    )}
                  >
                    <LanguageFlag code={option.code} />
                    {option.label}
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
              <DropdownMenuContent align="end" className="z-[10000] min-w-[140px] rounded-xl border border-border bg-popover p-1 shadow-lg">
                <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg py-2.5 text-foreground">
                  <Sun className="mr-3 h-[18px] w-[18px]" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg py-2.5 text-foreground">
                  <Moon className="mr-3 h-[18px] w-[18px]" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg py-2.5 text-foreground">
                  <Monitor className="mr-3 h-[18px] w-[18px]" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurant.logo_url ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur">
                  <Image src={restaurant.logo_url} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white backdrop-blur">
                  {restaurant.name.charAt(0)}
                </div>
              )}
              <div className="leading-tight">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">{restaurant.name}</p>
                <p className="text-[11px] text-white/55">{flowT?.intro?.restaurantReservation || "Restaurant reservation"}</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-12 grid flex-1 items-center gap-10 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{flowT?.intro?.premiumDining || "PREMIUM DINING"}</p>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {flowT?.intro?.headline || "Reserve an Unforgettable Dining Experience"}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                {flowT?.intro?.subheadline || "Pick a date and time, choose your party size, and we'll help you find the best table for your visit."}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease: [0.23, 1, 0.32, 1] }} className="mx-auto w-full max-w-xl">
              <Card className="overflow-hidden rounded-[20px] border border-white/12 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold text-white">{flowT?.intro?.findTableTitle || "Find a Table"}</CardTitle>
                  <p className="text-sm text-white/70">{flowT?.intro?.findTableSubtitle || "Select your preferred date, time, and guests."}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="min-w-0">
                      <Label className="mb-2 block h-5 text-sm font-medium leading-5 text-white">{flowT?.fields?.date || "Date"}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="intro-date"
                            type="button"
                            variant="outline"
                            disabled={submitting}
                            className={cn(
                              "relative h-[52px] w-full min-w-0 justify-start rounded-xl border border-white/35 bg-black/20 px-4 pr-11 text-left text-sm font-normal text-white shadow-none transition-all hover:bg-black/25 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
                              !date && "text-white/70",
                            )}
                          >
                            <span className="block w-full truncate text-left leading-none">
                              {date ? formattedDateLabel : (flowT?.placeholders?.select || "Select")}
                            </span>
                            <CalendarIcon className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/70" />
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
                    <div className="min-w-0">
                      <Label className="mb-2 block h-5 text-sm font-medium leading-5 text-white">{flowT?.fields?.time || "Time"}</Label>
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger className="h-[50px] data-[size=default]:h-[50px] w-full min-w-0 justify-between rounded-xl border border-white/35 bg-black/20 px-4 py-0 text-left text-sm font-normal text-white shadow-none transition-all hover:bg-black/25 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 [&>span]:truncate [&>span]:text-left">
                          <SelectValue placeholder={flowT?.placeholders?.select || "Select"} />
                        </SelectTrigger>
                        <SelectContent position="popper" align="start" className="w-(--radix-select-trigger-width) rounded-2xl border border-border/70 shadow-premium">
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot} className="rounded-lg">{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0">
                      <Label className="mb-2 block h-5 text-sm font-medium leading-5 text-white">{flowT?.fields?.guests || "Guests"}</Label>
                      <Select value={guestCount} onValueChange={setGuestCount}>
                        <SelectTrigger className="h-[50px] data-[size=default]:h-[50px] w-full min-w-0 justify-between rounded-xl border border-white/35 bg-black/20 px-4 py-0 text-left text-sm font-normal text-white shadow-none transition-all hover:bg-black/25 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 [&>span]:truncate [&>span]:text-left">
                          <SelectValue placeholder={flowT?.placeholders?.select || "Select"} />
                        </SelectTrigger>
                        <SelectContent position="popper" align="start" className="w-(--radix-select-trigger-width) rounded-2xl border border-border/70 shadow-premium">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)} className="rounded-lg">
                              {num} {num === 1 ? (t.booking?.labels?.guestSingular || "Guest") : (t.booking?.labels?.guestPlural || "Guests")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="button" onClick={handleFindTable} className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-base font-semibold shadow-xl transition-all hover:shadow-2xl">
                    {flowT?.actions?.findTable || "Find Table"}
                  </Button>
                  <p className="text-xs text-white/60">{flowT?.intro?.nextStepHint || "You'll enter your name and contact details in the next step."}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }} className="mt-12">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur-xl sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">{flowT?.intro?.premiumDiningTitle || "Premium Dining"}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{flowT?.intro?.premiumDiningHeading || "A premium dining moment - curated for you"}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
                  {settings.description || flowT?.intro?.premiumDiningDescription || "Enjoy an elevated dining experience with warm hospitality and calm ambience."}
                </p>
              </div>
              <div className="mt-6 h-px w-full bg-white/10" />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
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
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <MapPin className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{flowT?.sections?.location || "Location"}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {[address.street, address.city, address.state, address.country, address.postalCode].filter(Boolean).join(", ") || flowT?.messages?.setAddress || "Set restaurant address in Admin Settings"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <Phone className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{flowT?.sections?.contact || "Contact"}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">{settings.contactPhone || flowT?.messages?.setContactPhone || "Set contact phone in Admin Settings"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <form
        id="booking-form"
        onSubmit={handleConfirmBooking}
        className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]"
      >
        <aside className="hidden xl:block">
          <Card className="sticky top-4 h-[calc(100vh-2rem)] rounded-3xl border border-border/60 bg-card shadow-soft">
            <CardContent className="p-5">
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
                  <p className="truncate text-lg font-semibold text-foreground">{restaurant.name}</p>
                  <p className="text-sm text-muted-foreground">{flowT?.sections?.reservationInfo || "Restaurant Status"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">{flowT?.fields?.tableNumber || "Table Status"}</p>
                <div className="space-y-2 text-sm">
                  <div className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">
                      Green - {flowT?.status?.available || "Available"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">
                      Red - {flowT?.status?.occupied || "Occupied"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                <p className="mb-3 text-sm font-semibold text-foreground">{flowT?.sections?.reservationDetails || "Booking Snapshot"}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.date || "Date"}</span>
                    <span className="font-medium text-foreground">{date || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.time || "Time"}</span>
                    <span className="font-medium text-foreground">{time || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.guests || "Guests"}</span>
                    <span className="font-medium text-foreground">{guestCount || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.selectedTable || "Table"}</span>
                    <span className="font-medium text-foreground">{selectedTable?.table_name || "-"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 rounded-3xl border border-border/60 bg-card p-5 shadow-soft sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t.booking?.detail?.title || "Booking Details"}
          </div>
          <p className="mt-2 text-muted-foreground">
            {flowT?.intro?.subheadline ||
              "Book your table easily and enjoy a comfortable dining experience. Select your preferred table based on availability."}
          </p>

          <Card className="mt-6 rounded-2xl border border-border/60 bg-muted/10">
            <CardContent className="p-5">
              <h3 className="mb-4 text-xl font-semibold">{flowT?.sections?.guestInformation || "Guest Information"}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="customerName">{flowT?.fields?.fullName || "Full Name"}</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="customerName" value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{flowT?.fields?.phoneNumber || "Phone Number"}</Label>
                  <div className="flex h-12 w-full overflow-hidden rounded-xl border border-input bg-transparent shadow-xs">
                    <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                      <SelectTrigger className="h-full w-[30%] min-w-[102px] max-w-[120px] rounded-none border-0 border-r border-input bg-transparent px-3 shadow-none focus:ring-0">
                        <SelectValue>
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">
                            <CountryFlag code={phoneCountryCode} className="h-4 w-4" />
                            <span>{getCountryByCode(phoneCountryCode)?.dialCode}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code}>{country.name} {country.dialCode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-full flex-1 rounded-none border-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  {phoneValidationError ? <p className="text-xs text-red-500">{phoneValidationError}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{flowT?.fields?.email || "Email"}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 rounded-2xl border border-border/60 bg-muted/10">
            <CardContent className="p-5">
              <h3 className="mb-4 text-xl font-semibold">{flowT?.sections?.visitDetails || "Visit Details"}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>{flowT?.fields?.date || "Date"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="h-12 w-full rounded-xl justify-start text-left">
                        <span className="truncate">{date || `${flowT?.placeholders?.select || "Select"} ${flowT?.fields?.date || "date"}`}</span>
                        <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
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
                <div className="space-y-2">
                  <Label>{flowT?.fields?.time || "Time"}</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="h-12 data-[size=default]:h-12 w-full rounded-xl border border-input bg-transparent px-4 shadow-xs">
                      <SelectValue placeholder={flowT?.placeholders?.selectTime || "Select time"} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{flowT?.fields?.numberOfGuests || "Number of Guests"}</Label>
                  <Select value={guestCount} onValueChange={setGuestCount}>
                    <SelectTrigger className="h-12 data-[size=default]:h-12 w-full rounded-xl border border-input bg-transparent px-4 shadow-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          {num} {num === 1 ? (t.booking?.labels?.guestSingular || "Guest") : (t.booking?.labels?.guestPlural || "Guests")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h2 className="text-base font-semibold">{flowT?.actions?.nextSelectTable || "Table Selection"}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-6 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Green - {flowT?.status?.available || "Available"}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Red - {flowT?.status?.occupied || "Occupied"}</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedTables.map((table) => {
                const status = getTableStatus(table.id);
                const mismatch = !isCapacityMatch(table);
                const disabled = status === "occupied" || mismatch || submitting;
                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectTable(table.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all duration-200",
                      status === "available" && "border-primary/30 bg-primary/10 hover:scale-[1.01] hover:bg-primary/15",
                      status === "occupied" && "cursor-not-allowed border-red-300 bg-red-50/70 dark:bg-red-900/20",
                      mismatch && "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
                      status === "selected" && "border-primary bg-primary/20 ring-2 ring-primary/40 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]",
                    )}
                    title={mismatch ? "Guest count does not match table capacity" : undefined}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold">{table.table_name}</p>
                        <p className="text-sm text-muted-foreground">Seating capacity: {table.capacity} seats</p>
                        {mismatch ? (
                          <p className="mt-1 text-xs text-muted-foreground">Guest count does not match table capacity</p>
                        ) : null}
                      </div>
                      <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", status === "occupied" ? "bg-red-500" : "bg-primary")} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 hidden">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="customerName" value={name} onChange={(e) => setName(e.target.value)} className="h-12 pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                  <SelectTrigger className="h-12 w-[130px]">
                    <SelectValue>
                      <span className="inline-flex items-center gap-2">
                        <CountryFlag code={phoneCountryCode} className="h-4 w-4" />
                        <span>{getCountryByCode(phoneCountryCode)?.dialCode}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>{country.name} {country.dialCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1" />
              </div>
              {phoneValidationError ? <p className="text-xs text-red-500">{phoneValidationError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label>Number of Guests</Label>
              <Select value={guestCount} onValueChange={setGuestCount}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={String(num)}>{num} {num === 1 ? "Guest" : "Guests"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-12 w-full justify-start text-left">
                    <span className="truncate">{date || "Select date"}</span>
                    <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
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
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:flex xl:flex-col">
          <h2 className="text-4xl font-semibold">{flowT?.steps?.orderSummary || "Order Summary"}</h2>
          <div className="mt-4 space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Restaurant</span><span className="font-semibold">{restaurant.name}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.customerName || "Customer"}</span><span className="font-semibold">{name || "-"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.date || "Date"}</span><span className="font-semibold">{date || "-"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.time || "Time"}</span><span className="font-semibold">{time || "-"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.guests || "Guests"}</span><span className="font-semibold">{guestCount || "-"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.selectedTable || "Selected Table"}</span><span className="font-semibold">{selectedTable?.table_name || "-"}</span></div>
          </div>
          <Button type="submit" disabled={submitting} className="mt-auto h-10 w-full rounded-full text-base font-semibold">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {flowT?.actions?.processing || "Processing..."}
              </>
            ) : (
              flowT?.actions?.confirmBooking || "Confirm Booking"
            )}
          </Button>
        </aside>
      </form>

      <div className="sticky bottom-0 z-20 mt-3 border-t border-border/60 bg-background/95 py-3 backdrop-blur xl:hidden">
        <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-4">
          <Button type="submit" form="booking-form" className="h-10 w-full text-xs font-semibold" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {flowT?.actions?.processing || "Processing..."}
              </>
            ) : (
              flowT?.actions?.confirmBooking || "Confirm Booking"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
