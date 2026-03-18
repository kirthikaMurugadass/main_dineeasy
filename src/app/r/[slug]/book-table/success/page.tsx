"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Download, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReceiptData {
  bookingId: string;
  restaurantName: string;
  restaurantLogoUrl?: string | null;
  status?: "confirmed" | "pending" | "cancelled";
  customerName: string;
  phone?: string;
  email?: string;
  tableName: string;
  guests: string;
  date: string;
  time: string;
}

function safeFilenamePart(input: string) {
  const trimmed = String(input || "").trim();
  const cleaned = trimmed.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
  return cleaned ? cleaned.slice(0, 64) : "unknown";
}

async function loadImageDataUrl(
  url: string
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const format: "PNG" | "JPEG" = blob.type.includes("png") ? "PNG" : "JPEG";
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format };
  } catch {
    return null;
  }
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
  const receiptT = bookingT?.detail;

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

    async function loadRestaurantBranding() {
      const { data } = await supabase
        .from("restaurants")
        .select("name, logo_url")
        .eq("slug", slug)
        .single();
      if (data?.name) {
        setReceipt((prev) => ({
          ...prev,
          restaurantName: data.name,
          restaurantLogoUrl: data.logo_url ?? null,
          bookingId,
        }));
      }
    }

    loadRestaurantBranding();
  }, [bookingId, slug, supabase]);

  const statusMeta = useMemo(() => {
    const status = receipt.status || "pending";
    if (status === "confirmed") {
      return {
        label: flowT?.status?.confirmed || "Confirmed",
        className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };
    }
    if (status === "cancelled") {
      return {
        label: flowT?.status?.cancelled || "Cancelled",
        className: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
      };
    }
    return {
      label: flowT?.status?.pending || "Pending",
      className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }, [flowT?.status?.cancelled, flowT?.status?.confirmed, flowT?.status?.pending, receipt.status]);

  async function handleDownloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    let y = 56;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(receipt.restaurantName || slug, margin, y);

    if (receipt.restaurantLogoUrl) {
      const img = await loadImageDataUrl(receipt.restaurantLogoUrl);
      if (img) {
        const size = 42;
        doc.addImage(img.dataUrl, img.format, pageWidth - margin - size, y - 28, size, size);
      }
    }

    y += 24;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const bookingNumberLabel = flowT?.fields?.reservationId || "Booking ID";
    const bookingDateLabel = flowT?.fields?.date || "Date";
    const bookingTimeLabel = flowT?.fields?.time || "Time";
    const guestsLabel = flowT?.fields?.guests || "Guests";
    const tableLabel = flowT?.fields?.tableNumber || "Table";
    const statusLabel = flowT?.status?.label || "Status";

    const rows: Array<[string, string]> = [
      [bookingNumberLabel, receipt.bookingId || "—"],
      [statusLabel, statusMeta.label],
      [bookingDateLabel, receipt.date || "—"],
      [bookingTimeLabel, receipt.time || "—"],
      [guestsLabel, receipt.guests || "—"],
      [tableLabel, receipt.tableName || "—"],
    ];

    const labelX = margin;
    const valueX = margin + 140;
    const valueWidth = pageWidth - margin - valueX;
    const lineHeight = 14;

    for (const [label, value] of rows) {
      doc.setFont("helvetica", "normal");
      doc.text(`${label}:`, labelX, y);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(String(value || "—"), valueWidth);
      doc.text(lines, valueX, y);
      y += Math.max(lineHeight * lines.length, 16);
      if (y > pageHeight - 140) {
        doc.addPage();
        y = 56;
      }
    }

    y += 6;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    const customerLabel = flowT?.fields?.customerName || "Customer";
    const phoneLabel = flowT?.fields?.phoneNumber || "Phone";
    const emailLabel = flowT?.fields?.email || "Email";

    const customerRows: Array<[string, string]> = [
      [customerLabel, receipt.customerName || "—"],
      [phoneLabel, receipt.phone || "—"],
      [emailLabel, receipt.email || "—"],
    ];

    for (const [label, value] of customerRows) {
      doc.setFont("helvetica", "normal");
      doc.text(`${label}:`, labelX, y);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(String(value || "—"), valueWidth);
      doc.text(lines, valueX, y);
      y += Math.max(lineHeight * lines.length, 16);
      if (y > pageHeight - 100) {
        doc.addPage();
        y = 56;
      }
    }

    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(flowT?.messages?.thankYou || "Thank you for your reservation.", margin, y);

    const cleanId = safeFilenamePart(receipt.bookingId || "booking");
    doc.save(`receipt-booking-${cleanId}.pdf`);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <Card className="rounded-3xl border border-border/60 bg-card shadow-floating">
            <CardContent className="p-5 sm:p-7">
              <div id="receipt-print" className="rounded-2xl">
                {/* Receipt header (matches Order Receipt template) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {receiptT?.infoCardTitle || "Booking Receipt"}
                    </div>
                    <div className="mt-1 truncate text-lg font-bold text-foreground">
                      {receipt.restaurantName || slug}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground break-words whitespace-normal">
                      {flowT?.intro?.restaurantReservation || "Restaurant reservation"}
                    </div>
                  </div>
                  {receipt.restaurantLogoUrl ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      <Image
                        src={receipt.restaurantLogoUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                  ) : null}
                </div>

                <div className="my-5 border-t border-dashed border-border/70" />

                {/* Status + Booking ID */}
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-muted-foreground">
                      {flowT?.fields?.reservationId || "Booking ID"}
                    </div>
                    <div className="mt-1 font-mono font-semibold text-foreground break-words">
                      {receipt.bookingId || "—"}
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="my-5 border-t border-dashed border-border/70" />

                {/* Booking details */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {flowT?.sections?.reservationDetails || "Booking Details"}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0 overflow-hidden">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {flowT?.fields?.date || "Date"}
                      </div>
                      <div className="mt-1 font-semibold text-foreground break-words whitespace-normal leading-tight">
                        {receipt.date || "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0 overflow-hidden">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {flowT?.fields?.time || "Time"}
                      </div>
                      <div className="mt-1 font-semibold text-foreground break-words whitespace-normal leading-tight">
                        {receipt.time || "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0 overflow-hidden">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {flowT?.fields?.guests || "Guests"}
                      </div>
                      <div className="mt-1 font-semibold text-foreground break-words whitespace-normal leading-tight">
                        {receipt.guests || "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0 overflow-hidden">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {flowT?.fields?.tableNumber || "Table"}
                      </div>
                      <div className="mt-1 font-semibold text-foreground break-words whitespace-normal leading-tight">
                        {receipt.tableName || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-5 border-t border-dashed border-border/70" />

                {/* Customer details */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {flowT?.sections?.guestInformation || "Customer Details"}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2 rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0 overflow-hidden">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {flowT?.fields?.customerName || "Name"}
                      </div>
                      <div className="mt-1 font-semibold text-foreground break-words whitespace-normal leading-tight">
                        {receipt.customerName || "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0 overflow-hidden">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {flowT?.fields?.phoneNumber || "Phone"}
                      </div>
                      <div className="mt-1 font-semibold text-foreground break-words whitespace-normal leading-tight">
                        {receipt.phone || "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0 overflow-hidden">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {flowT?.fields?.email || "Email"}
                      </div>
                      <div className="mt-1 font-semibold text-foreground break-words whitespace-normal leading-tight">
                        {receipt.email || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-5 border-t border-dashed border-border/70" />

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                  {flowT?.messages?.thankYou || "Thank you for your reservation."}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" className="rounded-2xl" onClick={handleDownloadPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  {flowT?.actions?.downloadReceipt || "Download Receipt"}
                </Button>
                <Button type="button" className="w-full rounded-2xl" onClick={() => router.push(`/r/${slug}`)}>
                  <Home className="mr-2 h-4 w-4" />
                  {flowT?.actions?.backToHome || "Back to Home"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
