"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Phone, User, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan_type?: string | null;
  plan_status?: string | null;
}

export default function BookTablePage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDisabled, setBookingDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [specialNote, setSpecialNote] = useState("");

  // Time slots (you can customize these)
  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00"
  ];

  useEffect(() => {
    async function loadRestaurant() {
      const slug = params.slug as string;
      if (!slug) return;

      const supabase = createClient();
      const { data: restaurantData, error } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url, plan_type, plan_status")
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
        phone: phone.trim(),
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
    return (
      <div className="min-h-screen bg-[#FAFAF5]">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 sm:max-w-lg sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-6 text-center"
          >
            <Card className="rounded-2xl border border-[#E4E0D2] bg-gradient-to-b from-white to-[#F7F4EA] shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold text-[#2D3A1A]">
                  Book a Table
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-[#6B7B5A]">
                  Reserve your table in advance for a smooth dining experience.
                  Choose your preferred date, time, and seating capacity before placing your order.
                </p>
                <Button
                  onClick={() => setShowIntro(false)}
                  className="w-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg transition-all hover:shadow-xl"
                  size="lg"
                >
                  Reserve a Table
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Success screen is now handled after table selection / final confirmation

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-6 sm:max-w-lg sm:px-6">
        {/* Step header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9CA88A]">
              Step 1 of 4
            </p>
            <h1 className="text-xl font-semibold text-[#2D3A1A]">Reservation Details</h1>
          </div>
          <div className="rounded-full bg-[#DCFCE7] px-3 py-1 text-[11px] font-medium text-[#166534]">
            {restaurant.name}
          </div>
        </div>

        {/* Booking Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          onSubmit={handleSubmit}
          className="flex-1 space-y-4"
          id="book-table-form"
        >
          <Card className="rounded-2xl border border-[#E4E0D2] bg-gradient-to-b from-white to-[#F7F4EA] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#2D3A1A]">
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-[#6B7B5A]">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA88A]" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    disabled={submitting}
                    className="h-11 rounded-xl border-2 border-[#E4E0D2] bg-white pl-10 text-sm shadow-xs transition-all placeholder:text-[#C0BBA7] focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-[#6B7B5A]">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA88A]" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+41 79 000 00 00"
                    required
                    disabled={submitting}
                    className="h-11 rounded-xl border-2 border-[#E4E0D2] bg-white pl-10 text-sm shadow-xs transition-all placeholder:text-[#C0BBA7] focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-[#6B7B5A]">
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
                  className="h-11 rounded-xl border-2 border-[#E4E0D2] bg-white text-sm shadow-xs transition-all placeholder:text-[#C0BBA7] focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#E4E0D2] bg-gradient-to-b from-white to-[#F7F4EA] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#2D3A1A]">
                Visit Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-medium text-[#6B7B5A]">
                  Date to Come <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA88A]" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    required
                    disabled={submitting}
                    className="h-11 rounded-xl border-2 border-[#E4E0D2] bg-white pl-10 text-sm shadow-xs transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <Label htmlFor="time" className="text-xs font-medium text-[#6B7B5A]">
                  Time to Come <span className="text-red-500">*</span>
                </Label>
                <Select value={time} onValueChange={setTime} disabled={submitting}>
                  <SelectTrigger
                    id="time"
                    className="h-11 rounded-xl border-2 border-[#E4E0D2] bg-white text-sm shadow-xs transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15"
                  >
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Guest Count */}
              <div className="space-y-1.5">
                <Label htmlFor="guests" className="text-xs font-medium text-[#6B7B5A]">
                  Number of Person <span className="text-red-500">*</span>
                </Label>
                <Select value={guestCount} onValueChange={setGuestCount} disabled={submitting}>
                  <SelectTrigger
                    id="guests"
                    className="h-11 rounded-xl border-2 border-[#E4E0D2] bg-white text-sm shadow-xs transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Person" : "Persons"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Special Note */}
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs font-medium text-[#6B7B5A]">
                  Notes (optional)
                </Label>
                <Textarea
                  id="note"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  rows={3}
                  disabled={submitting}
                  className="rounded-xl border-2 border-[#E4E0D2] bg-white text-sm shadow-xs transition-all placeholder:text-[#C0BBA7] focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15"
                />
              </div>
            </CardContent>
          </Card>
        </motion.form>

        {/* Bottom sticky CTA */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#FAFAF5] via-[#FAFAF5]/95 to-transparent pb-4 pt-4">
          <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col gap-2 px-4 sm:max-w-lg sm:px-6">
            <div className="flex items-center justify-between text-[11px] text-[#6B7B5A]">
              <span>Next: Select Table</span>
              <span>
                {guestCount} {guestCount === "1" ? "person" : "persons"}
              </span>
            </div>
            <Button
              type="submit"
              form="book-table-form"
              size="lg"
              className="w-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
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
