"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Table2, Users, Calendar, Clock, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    async function init() {
      if (!slug) return;

      // Load step 1 data
      const key = `dineeasy-book-table-step1-${slug}`;
      let parsed: BookingStepData | null = null;
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem(key);
        if (!raw) {
          toast.error("Please start your booking again.");
          router.push(`/r/${slug}/book-table`);
          return;
        }
        try {
          parsed = JSON.parse(raw) as BookingStepData;
        } catch {
          toast.error("Invalid booking data. Please start again.");
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
          toast.error("Restaurant not found");
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
          toast.error("Failed to load tables");
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
        toast.error("Failed to load table selection");
        setLoading(false);
      }
    }

    init();
    // we intentionally ignore supabase in deps since it's memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const getStatusForTable = (tableId: string): TableStatus => {
    if (selectedTableId === tableId) return "selected";
    if (bookedTableIds.has(tableId)) return "booked"; // Occupied
    if (lockedTableIds.has(tableId)) return "locked"; // Reserved
    return "available";
  };

  const getStatusColor = (status: TableStatus) => {
    if (status === "selected") return "bg-[#22C55E] border-[#22C55E] text-white";
    if (status === "booked") return "bg-white border-[#F97316] text-[#2D3A1A]"; // Orange - Occupied
    if (status === "locked") return "bg-white border-[#3B82F6] text-[#2D3A1A]"; // Blue - Reserved
    return "bg-white border-[#22C55E] text-[#2D3A1A]"; // Green - Available
  };

  const getStatusDotColor = (status: TableStatus) => {
    if (status === "selected") return "bg-[#22C55E]";
    if (status === "booked") return "bg-[#F97316]"; // Orange - Occupied
    if (status === "locked") return "bg-[#3B82F6]"; // Blue - Reserved
    return "bg-[#22C55E]"; // Green - Available
  };

  const handleTableClick = async (tableId: string) => {
    if (!stepData) return;

    const status = getStatusForTable(tableId);
    if (status === "booked") {
      toast.error("This table is already booked for the selected time.");
      return;
    }
    if (status === "locked" && selectedTableId !== tableId) {
      toast.error("This table is temporarily held by another guest.");
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
        toast.error("Failed to select table. Please try again.");
        return;
      }

      setSelectedTableId(tableId);
      toast.success("Table selected. Please confirm your booking.");
    } catch (error) {
      console.error("Table selection error:", error);
      toast.error("Failed to select table.");
    }
  };

  const handleConfirm = async () => {
    if (!restaurant || !stepData) return;
    if (!selectedTableId) {
      toast.error("Please select a table to continue.");
      return;
    }

    // Check if lock is still valid
    try {
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
        toast.error("Could not verify table lock. Please try again.");
        setSubmitting(false);
        return;
      }

      if (!locks || locks.length === 0) {
        toast.error("Your table hold has expired. Please select a table again.");
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
        throw new Error(data.error || "Failed to create booking");
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

      toast.success("Booking request sent! We will confirm shortly.");
      setSuccess(true);
    } catch (error) {
      console.error("Final booking error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to confirm booking"
      );
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

  if (!restaurant || !stepData) {
    return null;
  }

  if (bookingDisabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md">
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
              className="w-full"
              onClick={() => router.push(`/r/${slug}`)}
            >
              Back to menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF5] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-md rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-b from-white to-[#F5F2E8] p-8 text-center shadow-xl"
        >
          {/* Simple confetti dots */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-4 left-10 h-2 w-2 rounded-full bg-[#22C55E]"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            <motion.div
              className="absolute top-4 right-8 h-2 w-2 rounded-full bg-[#FACC15]"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
            <motion.div
              className="absolute bottom-6 left-6 h-2 w-2 rounded-full bg-[#F97316]"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 240, damping: 16 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] shadow-md"
          >
            <CheckCircle2 className="h-9 w-9" />
          </motion.div>
          <h1 className="mb-1 text-xl font-semibold text-[#1F2933]">
            Table Booked Successfully!
          </h1>
          <p className="mb-6 text-sm text-[#6B7B5A]">
            Your table reservation has been confirmed.
          </p>

          {stepData && (
            <div className="mb-6 space-y-4 rounded-2xl bg-white/90 p-6 text-left text-sm shadow-inner">
              <div className="space-y-3">
                {/* Table Number */}
                <div className="border-b border-[#E4E0D2] pb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A] mb-1">Table Number</p>
                  <p className="text-lg font-bold text-[#2D3A1A]">
                    {selectedTableId
                      ? tables.find((t) => t.id === selectedTableId)?.table_name ?? "N/A"
                      : "N/A"}
                  </p>
                </div>

                {/* Order Details */}
                <div className="border-b border-[#E4E0D2] pb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A] mb-2">Order Details</p>
                  <div className="space-y-1">
                    <p className="text-sm text-[#2D3A1A]">
                      <span className="font-medium">Customer:</span> {stepData.customerName}
                    </p>
                    <p className="text-sm text-[#6B7B5A]">
                      <span className="font-medium">Guests:</span> {stepData.guestCount}{" "}
                      {stepData.guestCount === 1 ? "person" : "persons"}
                    </p>
                    {bookingData?.id && (
                      <p className="text-sm text-[#6B7B5A]">
                        <span className="font-medium">Reservation ID:</span> {bookingData.id ?? bookingData.bookingId ?? "—"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking Time */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A] mb-1">Booking Time</p>
                  <p className="text-base font-semibold text-[#2D3A1A]">
                    {stepData.bookingDate} at {stepData.bookingTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              className="w-full rounded-full border-[#D6D2C4]/70 bg-white/80 hover:bg-[#E8E4D9]/80 sm:w-auto"
              onClick={() => router.push(`/r/${restaurant.slug}`)}
            >
              Back to Home
            </Button>
            <Button
              className="w-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-md hover:shadow-lg sm:w-auto"
              onClick={() => router.push(`/r/${restaurant.slug}`)}
            >
              View Reservation
            </Button>
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
      <div className="min-h-screen bg-[#FAFAF5]">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-32 pt-6 sm:px-6 lg:px-8">
          {/* Step header */}
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUiStep("select")}
                className="h-9 w-9 rounded-full border border-[#D6D2C4]/60 text-[#6B7B5A] hover:bg-[#E8E4D9]/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9CA88A]">
                  Step 3 of 4
                </p>
                <h1 className="text-2xl font-semibold text-[#2D3A1A]">Order Summary</h1>
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <Card className="rounded-2xl border border-[#D6D2C4]/60 bg-gradient-to-b from-white to-[#F7F4EA] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3A1A]">Reservation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selected Table */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A]">Selected Table</p>
                  <p className="text-xl font-bold text-[#2D3A1A]">{selectedTable?.table_name || "N/A"}</p>
                </div>

                {/* Customer Information */}
                <div className="space-y-2 border-t border-[#E4E0D2] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A]">Customer Information</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-[#2D3A1A]">{stepData.customerName}</p>
                    <p className="text-[#6B7B5A]">{stepData.phone}</p>
                    {stepData.email && <p className="text-[#6B7B5A]">{stepData.email}</p>}
                  </div>
                </div>

                {/* Reservation Info */}
                <div className="space-y-2 border-t border-[#E4E0D2] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A]">Reservation Info</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-[#6B7B5A]">
                      <span className="font-medium text-[#2D3A1A]">Date:</span> {stepData.bookingDate}
                    </p>
                    <p className="text-[#6B7B5A]">
                      <span className="font-medium text-[#2D3A1A]">Time:</span> {stepData.bookingTime}
                    </p>
                    <p className="text-[#6B7B5A]">
                      <span className="font-medium text-[#2D3A1A]">Guests:</span> {stepData.guestCount}{" "}
                      {stepData.guestCount === 1 ? "person" : "persons"}
                    </p>
                  </div>
                </div>

                {/* Ordered Items (UI placeholder) */}
                <div className="space-y-2 border-t border-[#E4E0D2] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A]">Ordered Items</p>
                  <div className="rounded-xl bg-[#F7F4EA] p-3 text-sm text-[#6B7B5A]">
                    Table reservation fee
                  </div>
                </div>

                {/* Billing Section */}
                <div className="space-y-3 border-t border-[#E4E0D2] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9CA88A]">Billing</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-[#6B7B5A]">
                      <span>Subtotal</span>
                      <span className="font-medium text-[#2D3A1A]">CHF {basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#6B7B5A]">
                      <span>Tax (10%)</span>
                      <span className="font-medium text-[#2D3A1A]">CHF {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#E4E0D2] pt-2 text-lg font-bold text-[#2D3A1A]">
                      <span>Total Price</span>
                      <span className="text-[#22C55E]">CHF {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Confirm Order button */}
          <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#FAFAF5] via-[#FAFAF5]/95 to-transparent pb-4 pt-6">
            <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={submitting || !selectedTableId}
                className="w-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg transition-all hover:shadow-xl hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-60 disabled:cursor-not-allowed h-12 text-base font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table Selection Step
  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-32 pt-6 sm:px-6 lg:px-8">
        {/* Step header */}
        <div className="mb-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/r/${restaurant.slug}/book-table`)}
              className="h-9 w-9 rounded-full border border-[#D6D2C4]/60 text-[#6B7B5A] hover:bg-[#E8E4D9]/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9CA88A]">
                Step 2 of 4
              </p>
              <h1 className="text-2xl font-semibold text-[#2D3A1A]">Book a Table</h1>
            </div>
          </div>
          <p className="ml-12 flex flex-wrap items-center gap-3 text-sm text-[#6B7B5A]">
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
              {stepData.guestCount} {stepData.guestCount === 1 ? "guest" : "guests"}
            </span>
          </p>
        </div>

        {/* Table grid */}
        <div className="mb-8 flex-1">
          {tables.length === 0 ? (
            <Card className="rounded-2xl border border-[#D6D2C4]/60 bg-gradient-to-b from-white to-[#F7F4EA] shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-[#6B7B5A]">
                  No tables configured yet. Please contact the restaurant.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mx-auto w-full max-w-2xl">
              <div className="grid grid-cols-4 gap-2">
                {[...tables]
                  .sort((a, b) => {
                    const aMatch = a.table_name.match(/T-(\d+)/i);
                    const bMatch = b.table_name.match(/T-(\d+)/i);
                    if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
                    return a.table_name.localeCompare(b.table_name, undefined, {
                      numeric: true,
                      sensitivity: "base",
                    });
                  })
                  .map((table) => {
                    const status = getStatusForTable(table.id);
                    const isDisabled =
                      status === "booked" ||
                      (status === "locked" && selectedTableId !== table.id);
                    const statusColor = getStatusColor(status);
                    const dotColor = getStatusDotColor(status);

                    return (
                      <motion.button
                        key={table.id}
                        type="button"
                        whileHover={!isDisabled ? { y: -2, scale: 1.01 } : {}}
                        whileTap={!isDisabled ? { scale: 0.98 } : {}}
                        onClick={() => handleTableClick(table.id)}
                        disabled={isDisabled || submitting}
                        className={`relative flex h-20 flex-col items-center justify-center rounded-md border-2 px-1 py-1 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/50 disabled:cursor-not-allowed disabled:opacity-50 ${statusColor} ${
                          status === "selected"
                            ? "ring-2 ring-[#22C55E] ring-offset-2"
                            : ""
                        }`}
                      >
                        {status === "selected" && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-lg"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </motion.div>
                        )}
                        {/* Table number at top */}
                        <div
                          className={`text-[13px] font-bold ${
                            status === "selected" ? "text-white" : "text-[#2D3A1A]"
                          }`}
                        >
                          {table.table_name}
                        </div>
                        {/* Status dot under table number */}
                        <div className={`mt-1 h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        {/* Capacity text at bottom */}
                        <div
                          className={`mt-auto text-[10px] font-medium leading-tight ${
                            status === "selected" ? "text-white/90" : "text-[#6B7B5A]"
                          }`}
                        >
                          Capacity: {table.capacity}{" "}
                          {table.capacity === 1 ? "Person" : "Persons"}
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-[#D6D2C4]/60 bg-gradient-to-b from-white to-[#F7F4EA] px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
            <span className="text-sm text-[#6B7B5A]">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#F97316]" />
            <span className="text-sm text-[#6B7B5A]">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
            <span className="text-sm text-[#6B7B5A]">Reserved</span>
          </div>
        </div>

        {/* Continue button */}
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#FAFAF5] via-[#FAFAF5]/95 to-transparent pb-4 pt-6">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <Button
              type="button"
              onClick={() => {
                if (!selectedTableId) {
                  toast.error("Please select a table to continue.");
                  return;
                }
                setUiStep("summary");
              }}
              disabled={!selectedTableId || submitting}
              className="w-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg transition-all hover:shadow-xl hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-60 disabled:cursor-not-allowed h-12 text-base font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

