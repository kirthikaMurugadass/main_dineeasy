"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Home } from "lucide-react";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReceiptData {
  bookingId: string;
  restaurantName: string;
  customerName: string;
  tableName: string;
  guests: string;
  date: string;
  time: string;
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "N/A";
  const supabase = useMemo(() => createClient(), []);
  const { t } = useI18n();
  const bookingT = t.booking;
  const flowT = t.booking?.publicFlow;

  const [receipt, setReceipt] = useState<ReceiptData>({
    bookingId,
    restaurantName: "DineEasy Restaurant",
    customerName: "-",
    tableName: "-",
    guests: "-",
    date: "-",
    time: "-",
  });

  useEffect(() => {
    const fire = () => {
      confetti({ particleCount: 90, spread: 90, origin: { y: 0.62 }, zIndex: 9999 });
      confetti({ particleCount: 50, angle: 60, spread: 65, origin: { x: 0.08, y: 0.68 }, zIndex: 9999 });
      confetti({ particleCount: 50, angle: 120, spread: 65, origin: { x: 0.92, y: 0.68 }, zIndex: 9999 });
    };
    fire();
    const timer = setTimeout(fire, 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const key = `dineeasy-booking-receipt-${slug}`;
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
    if (raw) {
      try {
        setReceipt(JSON.parse(raw) as ReceiptData);
        return;
      } catch {
        // Ignore parse errors and use fallback.
      }
    }

    async function loadRestaurantName() {
      const { data } = await supabase
        .from("restaurants")
        .select("name")
        .eq("slug", slug)
        .single();
      if (data?.name) {
        setReceipt((prev) => ({ ...prev, restaurantName: data.name, bookingId }));
      }
    }

    loadRestaurantName();
  }, [bookingId, slug, supabase]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(bookingT?.detail?.infoCardTitle || "Booking Receipt", 20, 24);
    doc.setFontSize(12);

    const rows: Array<[string, string]> = [
      [flowT?.fields?.restaurant || "Restaurant", receipt.restaurantName],
      [flowT?.fields?.customerName || "Customer", receipt.customerName],
      [flowT?.fields?.tableNumber || "Table", receipt.tableName],
      [flowT?.fields?.guests || "Guests", receipt.guests],
      [flowT?.fields?.date || "Date", receipt.date],
      [flowT?.fields?.time || "Time", receipt.time],
      [flowT?.fields?.reservationId || "Booking ID", receipt.bookingId],
    ];

    let y = 40;
    rows.forEach(([label, value]) => {
      doc.text(`${label}: ${value || "-"}`, 20, y);
      y += 9;
    });

    const cleanId = (receipt.bookingId || "booking").replace(/[^a-zA-Z0-9-_]/g, "");
    doc.save(`booking-receipt-${cleanId}.pdf`);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_58%)]" />

      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-border/60 bg-card/90 p-6 text-center shadow-xl backdrop-blur-sm sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {flowT?.steps?.tableBookedSuccess || "Booking Successful!"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {flowT?.messages?.reservationConfirmed || "Your table has been reserved."}
        </p>

        <Card className="mt-6 rounded-2xl border border-border/70 text-left shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">{bookingT?.detail?.infoCardTitle || "Booking Receipt"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm sm:text-base">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.restaurant || "Restaurant"}</span><span className="font-semibold text-right">{receipt.restaurantName}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.tableNumber || "Table"}</span><span className="font-semibold">{receipt.tableName}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.guests || "Guests"}</span><span className="font-semibold">{receipt.guests}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.date || "Date"}</span><span className="font-semibold">{receipt.date}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">{flowT?.fields?.time || "Time"}</span><span className="font-semibold">{receipt.time}</span></div>
            <div className="flex items-center justify-between border-t border-border/60 pt-2"><span className="text-muted-foreground">{flowT?.fields?.reservationId || "Booking ID"}</span><span className="font-semibold">#{receipt.bookingId}</span></div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="h-11 rounded-full px-6" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            {flowT?.actions?.downloadReceipt || "Download Receipt"}
          </Button>
          <Button className="h-11 rounded-full px-6" variant="outline" onClick={() => router.push(`/r/${slug}/book-table`)}>
            <Home className="mr-2 h-4 w-4" />
            {flowT?.actions?.backToHome || "Back to Home"}
          </Button>
        </div>
      </div>
    </div>
  );
}
