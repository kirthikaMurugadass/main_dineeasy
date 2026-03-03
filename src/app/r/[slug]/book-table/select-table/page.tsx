"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
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
    if (bookedTableIds.has(tableId)) return "booked";
    if (lockedTableIds.has(tableId)) return "locked";
    return "available";
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-3xl font-bold">Booking Request Sent!</h1>
          <p className="mb-6 text-muted-foreground">
            We will confirm your reservation shortly.
          </p>
          <Button onClick={() => router.push(`/r/${restaurant.slug}`)}>
            Return to Menu
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-1">
            Step 2 of 2
          </p>
          <h1 className="text-2xl font-bold">Select Your Table</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {restaurant.name} — {stepData.bookingDate} at {stepData.bookingTime} •{" "}
            {stepData.guestCount} {stepData.guestCount === 1 ? "guest" : "guests"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Tables</CardTitle>
          </CardHeader>
          <CardContent>
            {tables.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tables configured yet. Please contact the restaurant.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {tables.map((table) => {
                  const status = getStatusForTable(table.id);
                  const isDisabled = status === "booked" || (status === "locked" && selectedTableId !== table.id);
                  const bgClass =
                    status === "booked"
                      ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                      : status === "locked"
                      ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : status === "selected"
                      ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      : "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300";

                  const label =
                    status === "booked"
                      ? "Booked"
                      : status === "locked"
                      ? "Held"
                      : status === "selected"
                      ? "Selected"
                      : "Available";

                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => handleTableClick(table.id)}
                      disabled={isDisabled || submitting}
                      className={`flex flex-col items-start justify-between rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${bgClass} disabled:opacity-60`}
                    >
                      <span className="font-semibold">{table.table_name}</span>
                      <span className="text-xs opacity-80">
                        Capacity: {table.capacity}
                      </span>
                      <span className="mt-1 text-[11px] font-medium uppercase tracking-wide">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/r/${restaurant.slug}/book-table`)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={submitting || !selectedTableId}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

