"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Clock, CheckCircle, XCircle, Calendar, MoreVertical, Eye, CalendarIcon, ChevronLeft, ChevronRight, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
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
  const { t } = useI18n();
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
      const errorMessage = error?.message || "Failed to load bookings";
      toast.error(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedDate, searchQuery]);

  useEffect(() => {
    setMounted(true);
    resetBookingNotification();
  }, [resetBookingNotification]);

  useEffect(() => {
    if (!subscriptionLoading && !isPro) {
      // Route-level protection: redirect Free plan users away from bookings
      toast.error("Bookings are available on the Pro plan.");
      router.replace("/admin");
    }
  }, [isPro, subscriptionLoading, router]);

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

  function getStatusBadgeColor(status: Booking["status"]) {
    switch (status) {
      case "completed":
        return "bg-[#5B7A2F]/10 text-[#5B7A2F] border-[#5B7A2F]/20 dark:bg-[#7A9E4A]/20 dark:text-[#7A9E4A] dark:border-[#7A9E4A]/30";
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
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    }
  }

  function formatBookingDate(dateString: string) {
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

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (!isPro) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-[#5B7A2F]/20 to-[#5B7A2F]/10 p-2 dark:from-[#7A9E4A]/20 dark:to-[#7A9E4A]/10">
            <Calendar className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
          </div>
          <div>
            <PageTitle>Bookings</PageTitle>
            <p className="text-sm text-[#6B7B5A] dark:text-[#9CA88A] mt-0.5">
              Manage table bookings and reservations
            </p>
          </div>
        </div>
      </div>

      {/* Tabs and Date Filter */}
      <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleTabChange("all")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "all"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                All Bookings
              </button>
              <button
                onClick={() => handleTabChange("today")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "today"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                Today
              </button>
              <button
                onClick={() => handleTabChange("upcoming")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "upcoming"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                Upcoming
              </button>
              <button
                onClick={() => handleTabChange("pending")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "pending"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                Pending
              </button>
              <button
                onClick={() => handleTabChange("confirmed")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "confirmed"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                Confirmed
              </button>
              <button
                onClick={() => handleTabChange("completed")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  getActiveTab() === "completed"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                )}
              >
                Completed
              </button>
            </div>

            {/* Date Selector and Search */}
            {mounted && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by customer name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-[#D6D2C4]/50 bg-white px-3 py-2 pl-10 text-sm text-[#2D3A1A] shadow-sm transition-all hover:border-[#5B7A2F]/50 focus:border-[#5B7A2F] focus:outline-none focus:ring-2 focus:ring-[#5B7A2F]/20 dark:border-[#3D4F2A]/50 dark:bg-[#243019] dark:text-[#E8E4D9] dark:hover:border-[#7A9E4A]/50 dark:focus:border-[#7A9E4A] w-[200px]"
                  />
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7B5A] dark:text-[#9CA88A]" />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6B7B5A] dark:text-[#9CA88A]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-[#D6D2C4]/50 bg-white px-3 py-2 text-sm text-[#2D3A1A] shadow-sm transition-all hover:border-[#5B7A2F]/50 focus:border-[#5B7A2F] focus:outline-none focus:ring-2 focus:ring-[#5B7A2F]/20 dark:border-[#3D4F2A]/50 dark:bg-[#243019] dark:text-[#E8E4D9] dark:hover:border-[#7A9E4A]/50 dark:focus:border-[#7A9E4A]"
                  />
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDate("");
                        setCurrentPage(1);
                      }}
                      className="text-xs text-[#6B7B5A] hover:text-[#2D3A1A] dark:text-[#9CA88A] dark:hover:text-[#E8E4D9]"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#5B7A2F] dark:text-[#7A9E4A]" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <FadeIn>
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-[#6B7B5A] dark:text-[#9CA88A]">No bookings yet</p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D6D2C4]/30 dark:border-[#3D4F2A]/30">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Booking ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Customer Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Table
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Guests
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6D2C4]/20 dark:divide-[#3D4F2A]/20">
                  {paginatedBookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="transition-colors hover:bg-[#E8E4D9]/30 dark:hover:bg-[#2D3A1A]/30"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#5B7A2F] to-[#7A9E4A] text-white font-semibold text-sm shadow-md">
                            {getAvatarInitial(booking.customer_name)}
                          </div>
                          <span className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                            {booking.customer_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#6B7B5A] dark:text-[#9CA88A]">
                          {booking.table_number ? `Table ${booking.table_number}` : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-[#2D3A1A] dark:text-[#E8E4D9] font-medium">
                            {formatBookingDate(booking.booking_date)}
                          </span>
                          <span className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                            {formatTime(booking.booking_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#6B7B5A] dark:text-[#9CA88A]">
                          {booking.guest_count} {booking.guest_count === 1 ? "Guest" : "Guests"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`flex w-fit items-center gap-1.5 border ${getStatusBadgeColor(booking.status)}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/bookings/${booking.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-[#D6D2C4]/50 bg-white/50 text-[#5B7A2F] hover:bg-[#5B7A2F] hover:text-white hover:border-[#5B7A2F] shadow-sm transition-all dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:text-[#7A9E4A] dark:hover:bg-[#7A9E4A] dark:hover:text-[#1A2212]"
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
                                className="rounded-xl hover:bg-[#E8E4D9]/50 dark:hover:bg-[#2D3A1A]/50"
                              >
                                {updatingStatus === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-[#5B7A2F] dark:text-[#7A9E4A]" />
                                ) : (
                                  <MoreVertical className="h-4 w-4 text-[#6B7B5A] dark:text-[#9CA88A]" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-[#D6D2C4]/50 dark:border-[#3D4F2A]/50">
                              {booking.status !== "confirmed" && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                  className="rounded-lg"
                                >
                                  Confirm
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                  className="rounded-lg"
                                >
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "completed")}
                                  className="rounded-lg"
                                >
                                  Mark Completed
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
              <div className="border-t border-[#D6D2C4]/30 px-6 py-4 dark:border-[#3D4F2A]/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6B7B5A] dark:text-[#9CA88A]">
                    Showing {indexOfFirstBooking + 1} to {Math.min(indexOfLastBooking, filteredBookings.length)} of {filteredBookings.length} bookings
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-xl border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 disabled:opacity-50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
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
                                ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                                : "border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
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
                      className="rounded-xl border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 disabled:opacity-50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
                    >
                      Next
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
