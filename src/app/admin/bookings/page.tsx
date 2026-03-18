"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Clock, CheckCircle, XCircle, Calendar, MoreVertical, Eye, CalendarIcon, ChevronLeft, ChevronRight, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
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
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useBookingNotification } from "@/contexts/booking-notification-context";
import { useSubscription } from "@/contexts/subscription-context";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  email: string | null;
  customer_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
  table_number: number | null;
  special_note: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { resetBookingNotification } = useBookingNotification();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

      // Date filter (applied first)
      if (selectedDate) {
        query = query.eq("booking_date", selectedDate);
      }

      // Status filters are handled in the component after fetching

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        throw bookingsError;
      }

      let filteredBookings = bookingsData || [];

      // Search filter by customer name
      if (searchQuery.trim()) {
        filteredBookings = filteredBookings.filter((booking) =>
          booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setBookings(filteredBookings);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      const errorMessage =
        error?.message || t.booking?.messages?.loadError || "Failed to load bookings";
      toast.error(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedDate, searchQuery, t.booking]);

  useEffect(() => {
    setMounted(true);
    resetBookingNotification();
  }, [resetBookingNotification]);

  useEffect(() => {
    if (!subscriptionLoading && !isPro) {
      // Route-level protection: redirect Free plan users away from bookings
      toast.error(t.booking?.messages?.proOnly || "Bookings are available on the Pro plan.");
      router.replace("/admin");
    }
  }, [isPro, subscriptionLoading, router, t.booking]);

  useEffect(() => {
    async function init() {
      if (!isPro) return;
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

    if (mounted && isPro) {
      init();
    }
  }, [mounted, isPro, loadBookings, router]);

  useEffect(() => {
    if (restaurantId && isPro) {
      loadBookings(restaurantId);
    }
  }, [statusFilter, selectedDate, searchQuery, restaurantId, isPro, loadBookings]);

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

      toast.success(t.booking?.toasts?.statusUpdated || "Booking status updated");

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
      toast.error(
        t.booking?.toasts?.statusUpdateError || "Failed to update booking status"
      );
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

  function getStatusBadgeColor(status: Booking["status"]) {
    switch (status) {
      case "completed":
        return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary dark:border-primary/30";
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
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
        return "bg-primary/10 text-primary dark:text-primary border-primary/20";
    }
  }

  function formatBookingDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language || "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatTime(timeString: string) {
    return timeString;
  }

  function getAvatarInitial(name: string) {
    return name.charAt(0).toUpperCase();
  }

  function handleTabChange(tab: string) {
    setStatusFilter(tab);
    setCurrentPage(1);
  }

  function getActiveTab() {
    return statusFilter;
  }

  // Filter bookings based on status
  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "today") {
      const today = new Date().toISOString().split("T")[0];
      return booking.booking_date === today;
    }
    if (statusFilter === "upcoming") {
      const today = new Date().toISOString().split("T")[0];
      return booking.booking_date >= today;
    }
    return booking.status === statusFilter;
  });

  // Pagination
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const paginatedBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const tableSummary = {
    reserved: filteredBookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed" || b.status === "completed"
    ).length,
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (!isPro) {
    return null;
  }

  return (
    <div className="space-y-6 dark:bg-[#000000]">
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
            <Calendar className="h-5 w-5 text-primary dark:text-primary" />
          </div>
          <div>
            <PageTitle className="dark:text-[#ffffff]">
              {t.booking?.title || "Bookings"}
            </PageTitle>
            <p className="text-sm text-[#6B7B5A] dark:text-[#9ca3af] mt-0.5">
              {t.booking?.description || "Manage table bookings and reservations"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs and Date Filter */}
      <Card className="gap-0 rounded-2xl border border-[#D6D2C4]/50 bg-card py-0 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Desktop tab navigation */}
            <div className="hidden items-center gap-2 overflow-x-auto pb-1 sm:flex">
              <button
                onClick={() => handleTabChange("all")}
                className={cn(
                  "rounded-xl px-3.5 py-1 text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "all"
                    ? "bg-primary text-white shadow-md dark:bg-primary"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#1a1a1a] dark:text-[#bfbfbf] dark:hover:bg-[#262626]"
                )}
              >
                {t.booking?.tabs?.all || "All Bookings"}
              </button>
              <button
                onClick={() => handleTabChange("today")}
                className={cn(
                  "rounded-xl px-3.5 py-1 text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "today"
                    ? "bg-primary text-white shadow-md dark:bg-primary"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                {t.booking?.tabs?.today || "Today"}
              </button>
              <button
                onClick={() => handleTabChange("upcoming")}
                className={cn(
                  "rounded-xl px-3.5 py-1 text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "upcoming"
                    ? "bg-primary text-white shadow-md dark:bg-primary"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                {t.booking?.tabs?.upcoming || "Upcoming"}
              </button>
              <button
                onClick={() => handleTabChange("pending")}
                className={cn(
                  "rounded-xl px-3.5 py-1 text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "pending"
                    ? "bg-primary text-white shadow-md dark:bg-primary"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                {t.booking?.tabs?.pending || "Pending"}
              </button>
              <button
                onClick={() => handleTabChange("confirmed")}
                className={cn(
                  "rounded-xl px-3.5 py-1 text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "confirmed"
                    ? "bg-primary text-white shadow-md dark:bg-primary"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                {t.booking?.tabs?.confirmed || "Confirmed"}
              </button>
              <button
                onClick={() => handleTabChange("completed")}
                className={cn(
                  "rounded-xl px-3.5 py-1 text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "completed"
                    ? "bg-primary text-white shadow-md dark:bg-primary"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                {t.booking?.tabs?.completed || "Completed"}
              </button>
            </div>

            {/* Mobile filter dropdown */}
            <div className="sm:hidden">
              <Select value={getActiveTab()} onValueChange={handleTabChange}>
                <SelectTrigger className="h-9 w-full rounded-xl border border-border bg-background text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  position="popper"
                  sideOffset={6}
                  className="z-[120] max-h-60 w-[var(--radix-select-trigger-width)] overflow-y-auto"
                >
                  <SelectItem className="min-h-11 px-4 py-3" value="all">{t.booking?.tabs?.all || "All Bookings"}</SelectItem>
                  <SelectItem className="min-h-11 px-4 py-3" value="today">{t.booking?.tabs?.today || "Today"}</SelectItem>
                  <SelectItem className="min-h-11 px-4 py-3" value="upcoming">{t.booking?.tabs?.upcoming || "Upcoming"}</SelectItem>
                  <SelectItem className="min-h-11 px-4 py-3" value="pending">{t.booking?.tabs?.pending || "Pending"}</SelectItem>
                  <SelectItem className="min-h-11 px-4 py-3" value="confirmed">{t.booking?.tabs?.confirmed || "Confirmed"}</SelectItem>
                  <SelectItem className="min-h-11 px-4 py-3" value="completed">{t.booking?.tabs?.completed || "Completed"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Selector and Search */}
            {mounted && (
              <div className="flex w-full items-center gap-2 flex-wrap sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder={
                      t.booking?.filters?.searchPlaceholder ||
                      "Search by customer name..."
                    }
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 pl-10 text-sm text-foreground shadow-sm transition-all hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-[#0f0f0f] dark:text-[#ffffff] dark:placeholder:text-[#8a8a8a] sm:w-[200px]"
                  />
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7B5A] dark:text-[#bfbfbf]" />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6B7B5A] dark:text-[#bfbfbf]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-9 rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm transition-all hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-[#0f0f0f] dark:text-[#ffffff] dark:placeholder:text-[#8a8a8a]"
                  />
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDate("");
                        setCurrentPage(1);
                      }}
                      className="text-xs text-[#6B7B5A] hover:text-[#2D3A1A] dark:text-[#bfbfbf] dark:hover:text-[#ffffff]"
                    >
                      {t.booking?.filters?.clear || "Clear"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Table status summary */}
          <div className="mt-3 grid grid-cols-1 gap-2">
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {t.booking?.summary?.tableReserved || "Table Reserved"}
                </span>
                <span className="text-base font-bold text-foreground">{tableSummary.reserved}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <FadeIn>
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-white shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-[#6B7B5A] dark:text-[#9ca3af]">
                {t.booking?.messages?.noBookings || "No bookings yet"}
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-white shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D6D2C4]/30 dark:border-[#262626] dark:bg-[#1a1a1a]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#bfbfbf]">
                      {t.booking?.tableHeaders?.bookingId || "Booking ID"}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      {t.booking?.tableHeaders?.customer || "Customer Name"}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      {t.booking?.tableHeaders?.table || "Table"}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      {t.booking?.tableHeaders?.dateTime || "Date & Time"}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      {t.booking?.tableHeaders?.guests || "Guests"}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      {t.booking?.tableHeaders?.status || "Status"}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      {t.booking?.tableHeaders?.actions || "Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6D2C4]/20 dark:divide-y-0 dark:border-[#262626] dark:bg-[#111111]">
                  {paginatedBookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="transition-colors hover:bg-[#E8E4D9]/30 dark:hover:bg-[#1a1a1a] dark:border-b dark:border-[#262626]"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-[#2D3A1A] dark:text-[#ffffff]">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-md shrink-0">
                            {getAvatarInitial(booking.customer_name)}
                          </div>
                          <span className="text-sm font-semibold text-[#2D3A1A] dark:text-[#ffffff]">
                            {booking.customer_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#6B7B5A] dark:text-[#9ca3af]">
                          {booking.table_number
                            ? `${t.booking?.labels?.tableLabel || "Table"} ${
                                booking.table_number
                              }`
                            : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-[#2D3A1A] dark:text-[#ffffff] font-medium">
                            {formatBookingDate(booking.booking_date)}
                          </span>
                          <span className="text-xs text-[#6B7B5A] dark:text-[#9ca3af]">
                            {formatTime(booking.booking_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#6B7B5A] dark:text-[#9ca3af]">
                          {booking.guest_count}{" "}
                          {booking.guest_count === 1
                            ? t.booking?.labels?.guestSingular || "Guest"
                            : t.booking?.labels?.guestPlural || "Guests"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`flex w-fit items-center gap-1.5 border ${getStatusBadgeColor(booking.status)}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">
                            {booking.status === "pending"
                              ? t.booking?.status?.pending || "Pending"
                              : booking.status === "confirmed"
                              ? t.booking?.status?.confirmed || "Confirmed"
                              : booking.status === "cancelled"
                              ? t.booking?.status?.cancelled || "Cancelled"
                              : t.booking?.status?.completed || "Completed"}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/bookings/${booking.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-border bg-background/60 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm transition-all dark:bg-[#1a1a1a] dark:text-primary"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={updatingStatus === booking.id}
                                className="rounded-xl hover:bg-[#E8E4D9]/50 dark:hover:bg-[#1a1a1a]"
                              >
                                {updatingStatus === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : (
                                  <MoreVertical className="h-4 w-4 text-[#6B7B5A] dark:text-[#bfbfbf]" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-[#D6D2C4]/50 dark:border-[#262626] dark:bg-[#111111]">
                              {booking.status !== "confirmed" && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                  className="rounded-lg"
                                >
                                  {t.booking?.actions?.confirm || "Confirm"}
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                  className="rounded-lg"
                                >
                                  {t.booking?.actions?.cancel || "Cancel"}
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "completed")}
                                  className="rounded-lg"
                                >
                                  {t.booking?.actions?.markCompleted || "Mark Completed"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-[#D6D2C4]/30 px-6 py-4 dark:border-[#262626]">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6B7B5A] dark:text-[#9ca3af]">
                    {t.booking?.pagination?.showing || "Showing"}{" "}
                    {indexOfFirstBooking + 1}{" "}
                    {t.booking?.pagination?.to || "to"}{" "}
                    {Math.min(indexOfLastBooking, filteredBookings.length)}{" "}
                    {t.booking?.pagination?.of || "of"}{" "}
                    {filteredBookings.length}{" "}
                    {t.booking?.pagination?.bookings || "bookings"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-xl border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 disabled:opacity-50 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-[#ffffff] dark:hover:bg-[#262626]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.booking?.pagination?.previous || "Previous"}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => paginate(pageNum)}
                            className={cn(
                              "rounded-xl",
                              currentPage === pageNum
                                ? "bg-primary text-white shadow-md dark:bg-primary"
                                : "border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-[#ffffff] dark:hover:bg-[#262626]"
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-xl border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 disabled:opacity-50 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-[#ffffff] dark:hover:bg-[#262626]"
                    >
                      {t.booking?.pagination?.next || "Next"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
