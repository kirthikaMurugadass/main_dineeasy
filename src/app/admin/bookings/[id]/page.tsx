"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  Users,
  Phone,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

interface Booking {
  id: string;
  email: string | null;
  restaurant_id: string;
  customer_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
  special_note: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const { t } = useI18n();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;

      setLoading(true);
      try {
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

        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .eq("restaurant_id", restaurant.id)
          .single();

        if (bookingError || !bookingData) {
          toast.error("Booking not found");
          router.push("/admin/bookings");
          return;
        }

        setBooking(bookingData);
      } catch (error) {
        console.error("Error loading booking:", error);
        toast.error("Failed to load booking");
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId, router]);

  async function updateBookingStatus(newStatus: Booking["status"]) {
    if (!booking) return;

    // Only send email if status actually changed
    const oldStatus = booking.status;
    if (oldStatus === newStatus) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", booking.id);

      if (error) throw error;

      const updatedBooking = { ...booking, status: newStatus };
      setBooking(updatedBooking);
      toast.success("Booking status updated");

      // Send email notification only when status changes to confirmed or cancelled
      if (newStatus === "confirmed" || newStatus === "cancelled") {
        // Trigger backend email notification (logic stays on the server)
        fetch("/api/bookings/notify-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            newStatus,
          }),
        }).catch((err) => {
          console.error("Failed to send status update email:", err);
        });
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    } finally {
      setUpdatingStatus(false);
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
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Link href="/admin/bookings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Booking not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/bookings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageTitle>Booking Details</PageTitle>
        </div>
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 ${getStatusColor(booking.status)}`}
        >
          {getStatusIcon(booking.status)}
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Information */}
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Name
                </p>
                <p className="text-lg font-semibold">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </p>
                <p className="text-lg font-semibold">{booking.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Booking Date & Time
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(booking.booking_date)} at {booking.booking_time}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Guests
                </p>
                <p className="text-lg font-semibold">
                  {booking.guest_count} {booking.guest_count === 1 ? "Guest" : "Guests"}
                </p>
              </div>
              {booking.special_note && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Special Requests
                  </p>
                  <p className="text-lg font-semibold mt-1">{booking.special_note}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Requested At</p>
                <p className="text-lg font-semibold">{formatDateTime(booking.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="text-sm font-mono text-muted-foreground">{booking.id}</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Status Management */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {booking.status !== "confirmed" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateBookingStatus("confirmed")}
                  disabled={updatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Booking
                </Button>
              )}
              {booking.status !== "cancelled" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateBookingStatus("cancelled")}
                  disabled={updatingStatus}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
              {booking.status !== "completed" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateBookingStatus("completed")}
                  disabled={updatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
