"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Clock, CheckCircle, XCircle, Calendar, MoreVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useBookingNotification } from "@/contexts/booking-notification-context";

interface Booking {
  id: string;
  email: string | null;
  customer_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
  special_note: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { resetBookingNotification } = useBookingNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("today");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadBookings = useCallback(async (currentRestaurantId: string) => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch bookings
      let query = supabase
        .from("bookings")
        .select("*")
        .eq("restaurant_id", currentRestaurantId)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });

      // Apply filters
      if (statusFilter === "today") {
        const today = new Date().toISOString().split("T")[0];
        query = query.eq("booking_date", today);
      } else if (statusFilter === "upcoming") {
        const today = new Date().toISOString().split("T")[0];
        query = query.gte("booking_date", today);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Date filter
      if (dateFilter) {
        query = query.eq("booking_date", dateFilter);
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        throw bookingsError;
      }

      setBookings(bookingsData || []);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      const errorMessage = error?.message || "Failed to load bookings";
      toast.error(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    setMounted(true);
    // Reset booking notification count when page is opened
    resetBookingNotification();
  }, [resetBookingNotification]);

  useEffect(() => {
    async function init() {
      if (!mounted) return;
      
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      await loadBookings(restaurant.id);

      // Set up realtime subscription
      const channel = supabase
        .channel("bookings-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `restaurant_id=eq.${restaurant.id}`,
          },
          () => {
            loadBookings(restaurant.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    if (mounted) {
      init();
    }
  }, [mounted, loadBookings, router]);

  useEffect(() => {
    if (restaurantId) {
      loadBookings(restaurantId);
    }
  }, [statusFilter, dateFilter, restaurantId, loadBookings]);

  async function updateBookingStatus(bookingId: string, newStatus: Booking["status"]) {
    const current = bookings.find((b) => b.id === bookingId);
    if (!current || current.status === newStatus) {
      return;
    }

    setUpdatingStatus(bookingId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking status updated");

      // Optimistically update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      // Trigger backend email notification for customer if needed
      if (newStatus === "confirmed" || newStatus === "cancelled") {
        fetch("/api/bookings/notify-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            newStatus,
          }),
        }).catch((err) => {
          console.error("Failed to send status update email from list page:", err);
        });
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    } finally {
      setUpdatingStatus(null);
    }
  }

  function getStatusIcon(status: Booking["status"]) {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
    }
  }

  function getStatusColor(status: Booking["status"]) {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatTime(timeString: string) {
    return timeString;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>Bookings</PageTitle>
        {mounted && (
          <div className="flex gap-3">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
              placeholder="Filter by date"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bookings.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No bookings found</p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <FadeIn key={booking.id} delay={index * 0.05}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {booking.customer_name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1.5 ${getStatusColor(booking.status)}`}
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
                        </span>
                        <span>{booking.guest_count} {booking.guest_count === 1 ? "Guest" : "Guests"}</span>
                        <span>{booking.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={updatingStatus === booking.id}
                          >
                            {updatingStatus === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {booking.status !== "confirmed" && (
                            <DropdownMenuItem
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                            >
                              Confirm
                            </DropdownMenuItem>
                          )}
                          {booking.status !== "cancelled" && (
                            <DropdownMenuItem
                              onClick={() => updateBookingStatus(booking.id, "cancelled")}
                            >
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {booking.status !== "completed" && (
                            <DropdownMenuItem
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                            >
                              Mark Completed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                {booking.special_note && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> {booking.special_note}
                    </p>
                  </CardContent>
                )}
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
