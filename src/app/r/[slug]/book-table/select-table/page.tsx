"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, Search, Table2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  plan_type?: string | null;
  plan_status?: string | null;
}

interface RestaurantTable {
  id: string;
  table_name: string;
  capacity: number;
  is_active: boolean;
}

interface BookingLock {
  id: string;
  table_id: string;
  booking_date: string;
  booking_time: string;
  locked_until: string;
  session_id: string;
}

interface BookingStepData {
  restaurantId: string;
  customerName: string;
  phone: string;
  email: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
  specialNote: string | null;
}

type TableStatus = "available" | "locked" | "booked" | "selected";

export default function SelectTablePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const flowT = t.booking?.publicFlow;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const confirmOnceRef = useRef(false);
  const [stepData, setStepData] = useState<BookingStepData | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [bookedTableIds, setBookedTableIds] = useState<Set<string>>(new Set());
  const [lockedTableIds, setLockedTableIds] = useState<Set<string>>(new Set());
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingDisabled, setBookingDisabled] = useState(false);
  const [activeFloor, setActiveFloor] = useState<"ground" | "first" | "second" | "rooftop">("ground");
  const [uiStep, setUiStep] = useState<"select" | "summary">("select");
  const [bookingData, setBookingData] = useState<any | null>(null);
  const [query, setQuery] = useState("");

  const slug = params.slug as string;

  // Generate or read session id for this browser/session
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

  const supabase = useMemo(() => createClient(), []);

  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => {
      const aMatch = a.table_name.match(/T-(\\d+)/i);
      const bMatch = b.table_name.match(/T-(\\d+)/i);
      if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
      return a.table_name.localeCompare(b.table_name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [tables]);

  const filteredTables = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedTables;
    return sortedTables.filter((t) => {
      const name = (t.table_name || "").toLowerCase();
      const cap = String(t.capacity ?? "");
      return name.includes(q) || cap.includes(q);
    });
  }, [query, sortedTables]);

  useEffect(() => {
    async function init() {
      if (!slug) return;

      // Load step 1 data
      const key = `dineeasy-book-table-step1-${slug}`;
      let parsed: BookingStepData | null = null;
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem(key);
        if (!raw) {
          toast.error(flowT?.messages?.startBookingAgain || "Please start your booking again.");
          router.push(`/r/${slug}/book-table`);
          return;
        }
        try {
          parsed = JSON.parse(raw) as BookingStepData;
        } catch {
          toast.error(flowT?.messages?.invalidBookingData || "Invalid booking data. Please start again.");
          router.push(`/r/${slug}/book-table`);
          return;
        }
      }

      setStepData(parsed);

      try {
        setLoading(true);

        // Fetch restaurant and subscription plan
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id, name, slug, plan_type, plan_status")
          .eq("slug", slug)
          .single();

        if (restaurantError || !restaurantData) {
          toast.error(flowT?.messages?.restaurantNotFound || "Restaurant not found");
          router.push("/");
          return;
        }

        const planType = restaurantData.plan_type ?? "free";
        const planStatus = restaurantData.plan_status ?? "active";

        if (planType !== "pro" || planStatus !== "active") {
          setBookingDisabled(true);
          setRestaurant(restaurantData);
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        // Fetch tables
        const { data: tablesData, error: tablesError } = await supabase
          .from("restaurant_tables")
          .select("id, table_name, capacity, is_active")
          .eq("restaurant_id", restaurantData.id)
          .eq("is_active", true)
          .order("table_name");

        if (tablesError) {
          console.error("Error loading tables:", tablesError);
          toast.error(flowT?.messages?.failedLoadTables || "Failed to load tables");
          return;
        }

        setTables(tablesData || []);

        if (!parsed) return;

        const { bookingDate, bookingTime } = parsed;

        // Fetch existing bookings for selected date/time
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("table_id, booking_date, booking_time, status")
          .eq("restaurant_id", restaurantData.id)
          .eq("booking_date", bookingDate)
          .eq("booking_time", bookingTime)
          .in("status", ["pending", "confirmed"]);

        if (bookingsError) {
          console.error("Error loading bookings:", bookingsError);
        } else {
          const bookedIds = new Set<string>();
          (bookingsData || []).forEach((b) => {
            if (b.table_id) bookedIds.add(b.table_id as string);
          });
          setBookedTableIds(bookedIds);
        }

        // Fetch active locks
        const nowIso = new Date().toISOString();
        const { data: locksData, error: locksError } = await supabase
          .from("table_locks")
          .select("id, table_id, booking_date, booking_time, locked_until, session_id")
          .eq("booking_date", bookingDate)
          .eq("booking_time", bookingTime)
          .gt("locked_until", nowIso);

        if (locksError) {
          console.error("Error loading locks:", locksError);
        } else {
          const lockedIds = new Set<string>();
          (locksData || []).forEach((l) => {
            lockedIds.add(l.table_id);
            if (l.session_id === sessionId) {
              setSelectedTableId(l.table_id);
            }
          });
          setLockedTableIds(lockedIds);
        }

        // Setup realtime listeners for locks and bookings
        const channelLocks = supabase
          .channel(`table-locks-${restaurantData.id}-${bookingDate}-${bookingTime}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "table_locks",
              filter: `booking_date=eq.${bookingDate},booking_time=eq.${bookingTime}`,
            },
            (payload) => {
              const newLock = payload.new as BookingLock | null;
              const oldLock = payload.old as BookingLock | null;
              setLockedTableIds((prev) => {
                const next = new Set(prev);
                if (payload.eventType === "INSERT" && newLock) {
                  if (new Date(newLock.locked_until) > new Date()) {
                    next.add(newLock.table_id);
                    if (newLock.session_id === sessionId) {
                      setSelectedTableId(newLock.table_id);
                    }
                  }
                } else if (payload.eventType === "DELETE" && oldLock) {
                  next.delete(oldLock.table_id);
                  if (oldLock.session_id === sessionId && selectedTableId === oldLock.table_id) {
                    setSelectedTableId(null);
                  }
                } else if (payload.eventType === "UPDATE" && newLock) {
                  if (new Date(newLock.locked_until) > new Date()) {
                    next.add(newLock.table_id);
                  } else {
                    next.delete(newLock.table_id);
                  }
                }
                return next;
              });
            }
          )
          .subscribe();

        const channelBookings = supabase
          .channel(`table-bookings-${restaurantData.id}-${bookingDate}-${bookingTime}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "bookings",
              filter: `restaurant_id=eq.${restaurantData.id},booking_date=eq.${bookingDate},booking_time=eq.${bookingTime}`,
            },
            (payload) => {
              const newBooking = payload.new as { table_id?: string | null } | null;
              if (newBooking?.table_id) {
                setBookedTableIds((prev) => {
                  const next = new Set(prev);
                  next.add(newBooking.table_id as string);
                  return next;
                });
              }
            }
          )
          .subscribe();

        setLoading(false);

        return () => {
          supabase.removeChannel(channelLocks);
          supabase.removeChannel(channelBookings);
        };
      } catch (error) {
        console.error("Select table init error:", error);
        toast.error(flowT?.messages?.failedLoadTableSelection || "Failed to load table selection");
        setLoading(false);
      }
    }

    init();
    // we intentionally ignore supabase in deps since it's memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const getStatusForTable = (tableId: string): TableStatus => {
    if (selectedTableId === tableId) return "selected";
    if (bookedTableIds.has(tableId)) return "booked";
    if (lockedTableIds.has(tableId)) return "locked";
    return "available";
  };

  const getStatusColor = (status: TableStatus) => {
    if (status === "selected") return "bg-primary border-primary text-primary-foreground";
    // Treat both booked + locked as the same "Reserved" state in UI.
    if (status === "booked" || status === "locked") return "bg-white border-[#3B82F6] text-[#2D3A1A]";
    return "bg-white border-primary text-[#2D3A1A]"; // Green - Available
  };

  const getStatusDotColor = (status: TableStatus) => {
    if (status === "selected") return "bg-primary";
    if (status === "booked" || status === "locked") return "bg-[#3B82F6]";
    return "bg-primary"; // Green - Available
  };

  const handleTableClick = async (tableId: string) => {
    if (!stepData) return;

    const status = getStatusForTable(tableId);
    if (status === "booked") {
      toast.error(flowT?.messages?.tableAlreadyBooked || "This table is already booked for the selected time.");
      return;
    }
    if (status === "locked" && selectedTableId !== tableId) {
      toast.error(flowT?.messages?.tableHeldByAnother || "This table is temporarily held by another guest.");
      return;
    }

    try {
      // Clear existing locks for this session/date/time
      await supabase
        .from("table_locks")
        .delete()
        .eq("session_id", sessionId)
        .eq("booking_date", stepData.bookingDate)
        .eq("booking_time", stepData.bookingTime);

      const lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error } = await supabase.from("table_locks").insert({
        table_id: tableId,
        booking_date: stepData.bookingDate,
        booking_time: stepData.bookingTime,
        locked_until: lockedUntil,
        session_id: sessionId,
      });

      if (error) {
        console.error("Error creating lock:", error);
        toast.error(flowT?.messages?.failedSelectTableRetry || "Failed to select table. Please try again.");
        return;
      }

      setSelectedTableId(tableId);
      toast.success(flowT?.messages?.tableSelectedConfirmBooking || "Table selected. Please confirm your booking.");
    } catch (error) {
      console.error("Table selection error:", error);
      toast.error(flowT?.messages?.failedSelectTable || "Failed to select table.");
    }
  };

  const handleConfirm = async () => {
    if (!restaurant || !stepData) return;
    if (confirmOnceRef.current || submitting) return;
    if (!selectedTableId) {
      toast.error(flowT?.validation?.selectTableRequired || "Please select a table to continue.");
      return;
    }

    // Check if lock is still valid
    let confirmed = false;
    try {
      confirmOnceRef.current = true;
      setSubmitting(true);
      const nowIso = new Date().toISOString();
      const { data: locks, error: lockError } = await supabase
        .from("table_locks")
        .select("*")
        .eq("table_id", selectedTableId)
        .eq("booking_date", stepData.bookingDate)
        .eq("booking_time", stepData.bookingTime)
        .eq("session_id", sessionId)
        .gt("locked_until", nowIso)
        .limit(1);

      if (lockError) {
        console.error("Error verifying lock:", lockError);
        toast.error(flowT?.messages?.lockVerifyError || "Could not verify table lock. Please try again.");
        setSubmitting(false);
        return;
      }

      if (!locks || locks.length === 0) {
        toast.error(flowT?.messages?.tableHoldExpired || "Your table hold has expired. Please select a table again.");
        setSelectedTableId(null);
        setSubmitting(false);
        return;
      }

      // Create booking via API
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          customerName: stepData.customerName,
          phone: stepData.phone,
          email: stepData.email,
          bookingDate: stepData.bookingDate,
          bookingTime: stepData.bookingTime,
          guestCount: stepData.guestCount,
          specialNote: stepData.specialNote,
          tableId: selectedTableId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Final booking API error:", data);
        throw new Error(data.error || flowT?.messages?.failedCreateBooking || "Failed to create booking");
      }

      setBookingData(data);

      // Clear lock(s) for this session
      await supabase
        .from("table_locks")
        .delete()
        .eq("session_id", sessionId)
        .eq("booking_date", stepData.bookingDate)
        .eq("booking_time", stepData.bookingTime);

      // Clear step1 data
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`dineeasy-book-table-step1-${slug}`);
      }

      toast.success(flowT?.messages?.bookingRequestSent || "Booking request sent! We will confirm shortly.");
      setSuccess(true);
      confirmed = true;
      
      // Auto-close success modal after 5 seconds
      setTimeout(() => {
        router.push(`/r/${restaurant?.slug}`);
      }, 5000);
    } catch (error) {
      console.error("Final booking error:", error);
      toast.error(
        error instanceof Error ? error.message : flowT?.messages?.failedConfirmBooking || "Failed to confirm booking"
      );
    } finally {
      // If we didn't reach success state, re-enable and allow retry.
      if (!confirmed) {
        confirmOnceRef.current = false;
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!restaurant || !stepData) {
    return null;
  }

  if (bookingDisabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{flowT?.messages?.onlineBookingUnavailableTitle || "Online bookings are not available"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {flowT?.messages?.onlineBookingUnavailable ||
                "This restaurant does not currently accept online table bookings. Please contact the restaurant directly to make a reservation."}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/r/${slug}`)}
            >
              {flowT?.actions?.backToMenu || "Back to menu"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    // Generate confetti particles
    const confettiColors = ["#16a34a", "#FACC15", "#F97316", "#3B82F6", "#A855F7", "#EC4899"];
    const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: confettiColors[i % confettiColors.length],
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
      rotation: Math.random() * 360,
    }));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAFAF5]/95 backdrop-blur-md p-4 dark:bg-[#000000]/95">
        {/* Enhanced Confetti Animation */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute h-3 w-3 rounded-sm"
              style={{
                backgroundColor: particle.color,
                left: `${particle.x}%`,
                top: "-10px",
              }}
              initial={{
                y: -20,
                opacity: 0,
                rotate: 0,
                scale: 0.8,
              }}
              animate={{
                y: typeof window !== "undefined" ? window.innerHeight + 100 : 800,
                opacity: [0, 1, 1, 0],
                rotate: particle.rotation + 720,
                scale: [0.8, 1, 1, 0.8],
                x: [
                  0,
                  (Math.random() - 0.5) * 200,
                  (Math.random() - 0.5) * 300,
                  (Math.random() - 0.5) * 400,
                ],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-[#D6D2C4]/60 bg-white p-10 text-center shadow-2xl dark:border-[#1f1f1f] dark:bg-[#000000] overflow-hidden"
        >
          {/* Decorative background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/5" />

          <div className="relative z-10">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#9CA88A] dark:text-[#9ca3af]">
              {flowT?.steps?.step4Of4 || "Step 4 of 4"}
            </p>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 240, damping: 16 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-2 text-3xl font-bold text-[#1F2933] dark:text-white mb-3"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {flowT?.steps?.tableBookedSuccess || "Table Booked Successfully! 🎉"}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 text-base text-[#6B7B5A] dark:text-[#9ca3af]"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {flowT?.messages?.reservationConfirmed || "Your table reservation has been confirmed."}
            </motion.p>

          {stepData && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 space-y-4 rounded-2xl bg-white/90 p-6 text-left text-sm shadow-inner dark:bg-[#0a0a0a] dark:border dark:border-[#1f1f1f]"
            >
              <div className="space-y-3">
                {/* Table Number */}
                <div className="border-b border-[#E4E0D2] dark:border-[#1f1f1f] pb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A] dark:text-[#9ca3af] mb-1">{flowT?.fields?.tableNumber || "Table Number"}</p>
                  <p className="text-lg font-bold text-[#2D3A1A] dark:text-[#ffffff]">
                    {selectedTableId
                      ? tables.find((t) => t.id === selectedTableId)?.table_name ?? (flowT?.labels?.notAvailable || "N/A")
                      : (flowT?.labels?.notAvailable || "N/A")}
                  </p>
                </div>

                {/* Order Details */}
                <div className="border-b border-[#E4E0D2] dark:border-[#1f1f1f] pb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A] dark:text-[#9ca3af] mb-2">{flowT?.sections?.orderDetails || "Order Details"}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-[#2D3A1A] dark:text-[#ffffff]">
                      <span className="font-medium">{flowT?.fields?.customerName || "Customer"}:</span> {stepData.customerName}
                    </p>
                    <p className="text-sm text-[#6B7B5A] dark:text-[#9ca3af]">
                      <span className="font-medium">{flowT?.fields?.guests || "Guests"}:</span> {stepData.guestCount}{" "}
                      {stepData.guestCount === 1 ? (flowT?.labels?.personSingular || "person") : (flowT?.labels?.personPlural || "persons")}
                    </p>
                    {bookingData?.id && (
                      <p className="text-sm text-[#6B7B5A] dark:text-[#9ca3af]">
                        <span className="font-medium">{flowT?.fields?.reservationId || "Reservation ID"}:</span> {bookingData.id ?? bookingData.bookingId ?? "—"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking Time */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A] dark:text-[#9ca3af] mb-1">{flowT?.fields?.bookingTime || "Booking Time"}</p>
                  <p className="text-base font-semibold text-[#2D3A1A] dark:text-[#ffffff]">
                    {stepData.bookingDate} {flowT?.labels?.at || "at"} {stepData.bookingTime}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              className="w-full rounded-full border-[#D6D2C4]/70 bg-white/80 hover:bg-[#E8E4D9]/80 sm:w-auto"
              onClick={() => router.push(`/r/${restaurant.slug}`)}
            >
              {flowT?.actions?.backToHome || "Back to Home"}
            </Button>
            <Button
              className="w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg sm:w-auto"
              onClick={() => router.push(`/r/${restaurant.slug}`)}
            >
              {flowT?.actions?.viewReservation || "View Reservation"}
            </Button>
          </div>
        </div>
      </motion.div>
      </div>
    );
  }

  // Order Summary Step
  if (uiStep === "summary") {
    const selectedTable = tables.find((t) => t.id === selectedTableId);
    const basePrice = stepData.guestCount * 10; // UI-only estimate
    const tax = Math.round(basePrice * 0.1);
    const total = basePrice + tax;

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto grid w-full max-w-[95rem] grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px]">
          {/* Left sidebar (visual only) */}
          <aside className="hidden lg:block">
            <Card className="h-[calc(100vh-2rem)] rounded-3xl border border-border/60 bg-card shadow-soft">
              <CardContent className="flex h-full flex-col gap-5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Table2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-foreground">
                      {restaurant?.name || (flowT?.steps?.bookATable || "Book a Table")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flowT?.steps?.step3Of4 || "Step 3 of 4"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                    {flowT?.sections?.reservationInfo || "Reservation Info"}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{flowT?.fields?.date || "Date"}</span>
                      <span className="font-semibold text-foreground">{stepData.bookingDate}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">{flowT?.fields?.time || "Time"}</span>
                      <span className="font-semibold text-foreground">{stepData.bookingTime}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">{flowT?.fields?.guests || "Guests"}</span>
                      <span className="font-semibold text-foreground">{stepData.guestCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl"
                    onClick={() => setUiStep("select")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {flowT?.actions?.back || "Back"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Center */}
          <section className="min-w-0">
            <Card className="rounded-3xl border border-border/60 bg-card shadow-soft">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUiStep("select")}
                      className="h-10 w-10 rounded-2xl border border-border/60"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {flowT?.steps?.step3Of4 || "Step 3 of 4"}
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {flowT?.steps?.orderSummary || "Order Summary"}
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={(flowT?.placeholders as any)?.searchTable || "Search table..."}
                      className="h-11 rounded-2xl pl-10 text-sm"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredTables.map((table) => {
                    const status = getStatusForTable(table.id);
                    const isDisabled =
                      status === "booked" ||
                      (status === "locked" && selectedTableId !== table.id);

                    const badge = {
                      available: "bg-primary/10 text-primary border-primary/20",
                      selected: "bg-primary text-primary-foreground border-primary/40",
                      locked: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400",
                      booked: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400",
                    }[status];

                    const label =
                      status === "selected"
                        ? (flowT?.status?.selected || "Selected")
                        : status === "available"
                          ? (flowT?.status?.available || "Available")
                          : status === "locked"
                            ? (flowT?.status?.reserved || "Reserved")
                            : (flowT?.status?.reserved || "Reserved");

                    return (
                      <motion.button
                        key={table.id}
                        type="button"
                        whileHover={!isDisabled ? { y: -2 } : {}}
                        whileTap={!isDisabled ? { scale: 0.99 } : {}}
                        onClick={() => handleTableClick(table.id)}
                        disabled={isDisabled || submitting}
                        className={cn(
                          "group w-full rounded-3xl border border-border/60 bg-background p-4 text-left shadow-soft transition hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
                          status === "selected" && "border-primary/30 bg-primary/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-bold text-foreground">
                              {table.table_name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {flowT?.fields?.capacity || "Capacity"}:{" "}
                                <span className="font-semibold text-foreground">{table.capacity}</span>
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                              badge
                            )}
                          >
                            {label}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {flowT?.fields?.table || "Table"}
                          </span>
                          <span className="text-xs font-semibold text-primary">
                            {flowT?.actions?.bookTable || "Book Table"}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Right panel (desktop) */}
          <aside className="hidden xl:block">
            <Card className="sticky top-4 rounded-3xl border border-border/60 bg-card shadow-soft">
              <CardContent className="p-5">
                <div className="text-sm font-semibold text-foreground">
                  {flowT?.sections?.reservationDetails || "Reservation Details"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {flowT?.steps?.step3Of4 || "Step 3 of 4"}
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {flowT?.fields?.selectedTable || "Selected Table"}
                    </div>
                    <div className="mt-2 text-lg font-bold text-foreground">
                      {selectedTable?.table_name || "—"}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {flowT?.fields?.capacity || "Capacity"}:{" "}
                      <span className="font-semibold text-foreground">
                        {selectedTable?.capacity ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{flowT?.fields?.guestName || "Guest Name"}</span>
                      <span className="font-semibold text-foreground">{stepData.customerName}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">{flowT?.fields?.guests || "Number of Guests"}</span>
                      <span className="font-semibold text-foreground">{stepData.guestCount}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">{flowT?.fields?.bookingTime || "Booking Time"}</span>
                      <span className="font-semibold text-foreground">
                        {stepData.bookingDate} • {stepData.bookingTime}
                      </span>
                    </div>
                    {stepData.specialNote ? (
                      <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {flowT?.fields?.specialRequest || "Special Request"}:
                        </span>{" "}
                        {stepData.specialNote}
                      </div>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting || !selectedTableId}
                    className="w-full rounded-2xl"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {flowT?.actions?.processing || "Processing..."}
                      </>
                    ) : (
                      flowT?.actions?.confirmBooking || "Confirm Booking"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Mobile bottom action */}
        <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex max-w-[95rem] items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {flowT?.fields?.selectedTable || "Selected Table"}:{" "}
                <span className="font-bold">{selectedTable?.table_name || "—"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {stepData.bookingDate} • {stepData.bookingTime} • {stepData.guestCount}{" "}
                {stepData.guestCount === 1 ? (t.booking?.labels?.guestSingular || "guest") : (t.booking?.labels?.guestPlural || "guests")}
              </div>
            </div>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !selectedTableId}
              className="rounded-2xl"
            >
              {flowT?.actions?.confirmBooking || "Confirm Booking"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Table Selection Step
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid w-full max-w-[95rem] grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        {/* Left sidebar (visual only) */}
        <aside className="hidden lg:block">
          <Card className="h-[calc(100vh-2rem)] rounded-3xl border border-border/60 bg-card shadow-soft">
            <CardContent className="flex h-full flex-col gap-5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Table2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">{restaurant?.name}</div>
                  <div className="text-xs text-muted-foreground">{flowT?.steps?.step2Of4 || "Step 2 of 4"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {flowT?.sections?.reservationInfo || "Reservation Info"}
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.date || "Date"}</span>
                    <span className="font-semibold text-foreground">{stepData.bookingDate}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.time || "Time"}</span>
                    <span className="font-semibold text-foreground">{stepData.bookingTime}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.guests || "Guests"}</span>
                    <span className="font-semibold text-foreground">{stepData.guestCount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {flowT?.status?.label || "Status"}
                </div>
                <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{flowT?.status?.available || "Available"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">{flowT?.status?.reserved || "Reserved"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-2xl"
                  onClick={() => router.push(`/r/${restaurant.slug}/book-table`)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {flowT?.actions?.back || "Back"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center grid */}
        <section className="min-w-0">
          <Card className="rounded-3xl border border-border/60 bg-card shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/r/${restaurant.slug}/book-table`)}
                    className="h-10 w-10 rounded-2xl border border-border/60"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {flowT?.steps?.step2Of4 || "Step 2 of 4"}
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {flowT?.steps?.bookATable || "Book a Table"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {stepData.bookingDate}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {stepData.bookingTime}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {stepData.guestCount}{" "}
                        {stepData.guestCount === 1 ? (t.booking?.labels?.guestSingular || "guest") : (t.booking?.labels?.guestPlural || "guests")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={(flowT?.placeholders as any)?.searchTable || "Search table..."}
                    className="h-11 rounded-2xl pl-10 text-sm"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="mt-6">
                {filteredTables.length === 0 ? (
                  <div className="rounded-3xl border border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                    {flowT?.messages?.noTablesConfigured || "No tables configured yet. Please contact the restaurant."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredTables.map((table) => {
                      const status = getStatusForTable(table.id);
                      const isDisabled =
                        status === "booked" ||
                        (status === "locked" && selectedTableId !== table.id);

                      const badge = {
                        available: "bg-primary/10 text-primary border-primary/20",
                        selected: "bg-primary text-primary-foreground border-primary/40",
                        locked: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400",
                      booked: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400",
                      }[status];

                      const label =
                        status === "selected"
                          ? (flowT?.status?.selected || "Selected")
                          : status === "available"
                            ? (flowT?.status?.available || "Available")
                            : status === "locked"
                              ? (flowT?.status?.reserved || "Reserved")
                            : (flowT?.status?.reserved || "Reserved");

                      return (
                        <motion.button
                          key={table.id}
                          type="button"
                          whileHover={!isDisabled ? { y: -2 } : {}}
                          whileTap={!isDisabled ? { scale: 0.99 } : {}}
                          onClick={() => handleTableClick(table.id)}
                          disabled={isDisabled || submitting}
                          className={cn(
                            "group w-full rounded-3xl border border-border/60 bg-background p-4 text-left shadow-soft transition hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
                            status === "selected" && "border-primary/30 bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-base font-bold text-foreground">
                                {table.table_name}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                  {flowT?.fields?.capacity || "Capacity"}:{" "}
                                  <span className="font-semibold text-foreground">{table.capacity}</span>
                                </span>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                                badge
                              )}
                            >
                              {label}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {flowT?.fields?.table || "Table"}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                              {flowT?.actions?.bookTable || "Book Table"}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right details panel */}
        <aside className="hidden xl:block">
          <Card className="sticky top-4 rounded-3xl border border-border/60 bg-card shadow-soft">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-foreground">
                {flowT?.sections?.reservationDetails || "Reservation Details"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {flowT?.steps?.step2Of4 || "Step 2 of 4"}
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {flowT?.fields?.selectedTable || "Selected Table"}
                  </div>
                  <div className="mt-2 text-lg font-bold text-foreground">
                    {tables.find((t) => t.id === selectedTableId)?.table_name || "—"}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {flowT?.fields?.capacity || "Capacity"}:{" "}
                    <span className="font-semibold text-foreground">
                      {tables.find((t) => t.id === selectedTableId)?.capacity ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.guestName || "Guest Name"}</span>
                    <span className="font-semibold text-foreground">{stepData.customerName}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.guests || "Number of Guests"}</span>
                    <span className="font-semibold text-foreground">{stepData.guestCount}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{flowT?.fields?.bookingTime || "Booking Time"}</span>
                    <span className="font-semibold text-foreground">
                      {stepData.bookingDate} • {stepData.bookingTime}
                    </span>
                  </div>
                  {stepData.specialNote ? (
                    <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {flowT?.fields?.specialRequest || "Special Request"}:
                      </span>{" "}
                      {stepData.specialNote}
                    </div>
                  ) : null}
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    if (!selectedTableId) {
                      toast.error(flowT?.validation?.selectTableRequired || "Please select a table to continue.");
                      return;
                    }
                    setUiStep("summary");
                  }}
                  disabled={!selectedTableId || submitting}
                  className="w-full rounded-2xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {flowT?.actions?.processing || "Processing..."}
                    </>
                  ) : (
                    flowT?.actions?.continue || "Continue"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile bottom continue */}
      <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-[95rem] items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {flowT?.fields?.selectedTable || "Selected Table"}:{" "}
              <span className="font-bold">
                {tables.find((t) => t.id === selectedTableId)?.table_name || "—"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {stepData.bookingDate} • {stepData.bookingTime} • {stepData.guestCount}{" "}
              {stepData.guestCount === 1 ? (t.booking?.labels?.guestSingular || "guest") : (t.booking?.labels?.guestPlural || "guests")}
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              if (!selectedTableId) {
                toast.error(flowT?.validation?.selectTableRequired || "Please select a table to continue.");
                return;
              }
              setUiStep("summary");
            }}
            disabled={!selectedTableId || submitting}
            className="rounded-2xl"
          >
            {flowT?.actions?.continue || "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

