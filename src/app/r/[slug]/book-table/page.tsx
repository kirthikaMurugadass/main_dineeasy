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
}

export default function BookTablePage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
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
        .select("id, name, slug, logo_url")
        .eq("slug", slug)
        .single();

      if (error || !restaurantData) {
        toast.error("Restaurant not found");
        router.push("/");
        return;
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

  // Success screen is now handled after table selection / final confirmation

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Book a Table</h1>
          <p className="mt-2 text-muted-foreground">
            Reserve your table at {restaurant.name}
          </p>
        </div>

        {/* Booking Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Reservation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="mr-2 inline h-4 w-4" />
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="mr-2 inline h-4 w-4" />
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="mr-2 inline h-4 w-4" />
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                  disabled={submitting}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time">
                  <Clock className="mr-2 inline h-4 w-4" />
                  Time <span className="text-destructive">*</span>
                </Label>
                <Select value={time} onValueChange={setTime} disabled={submitting}>
                  <SelectTrigger id="time">
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
              <div className="space-y-2">
                <Label htmlFor="guests">
                  <Users className="mr-2 inline h-4 w-4" />
                  Number of Guests <span className="text-destructive">*</span>
                </Label>
                <Select value={guestCount} onValueChange={setGuestCount} disabled={submitting}>
                  <SelectTrigger id="guests">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Guest" : "Guests"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Special Note */}
              <div className="space-y-2">
                <Label htmlFor="note">
                  <MessageSquare className="mr-2 inline h-4 w-4" />
                  Special Requests (Optional)
                </Label>
                <Textarea
                  id="note"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  rows={4}
                  disabled={submitting}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Booking Request"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.form>
      </div>
    </div>
  );
}
