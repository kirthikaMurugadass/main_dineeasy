"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Language } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReceiptItem = {
  id: string;
  title: Record<string, string>;
  price: number;
  quantity: number;
};

type ReceiptSnapshot = {
  orderId: string;
  createdAt: string; // ISO string
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  paymentMethod: "cash" | "card" | "qr";
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
};

function getDisplayTitle(
  titleRecord: Record<Language, string> | undefined,
  lang: Language,
  fallback = "—"
): string {
  if (!titleRecord) return fallback;
  const order: Language[] = [lang, "de", "en", "fr", "it"];
  for (const l of order) {
    const v = titleRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return fallback;
}

function formatMoney(currency: string, value: number) {
  return `${currency} ${value.toFixed(2)}`;
}

function safeFilenamePart(input: string) {
  const trimmed = String(input || "").trim();
  const cleaned = trimmed.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
  return cleaned ? cleaned.slice(0, 64) : "unknown";
}

async function loadImageDataUrl(url: string): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
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

export function OrderSuccessReceipt({
  restaurantSlug,
  menuId,
  orderId,
  restaurantName,
  restaurantLogoUrl,
}: {
  restaurantSlug: string;
  menuId: string;
  orderId: string | null;
  restaurantName: string;
  restaurantLogoUrl: string | null;
}) {
  const { t, language } = useI18n();

  const receiptT = (t.order as any)?.public?.receipt;
  const checkoutT = (t.order as any)?.public?.checkout;
  const posT = (t.order as any)?.public?.pos;
  const summaryT = (t.order as any)?.public?.summary;
  const currency = t.menu?.currency || "CHF";

  const [snapshot, setSnapshot] = useState<ReceiptSnapshot | null>(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const key = `dineeasy-order-receipt-${orderId}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ReceiptSnapshot;
      setSnapshot(parsed);
    } catch {
      // ignore invalid snapshot
    }
  }, [orderId]);

  const createdLabel = useMemo(() => {
    if (!snapshot?.createdAt) return "—";
    try {
      return new Intl.DateTimeFormat(language || "en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(snapshot.createdAt));
    } catch {
      return snapshot.createdAt;
    }
  }, [snapshot?.createdAt, language]);

  const orderTypeLabel = useMemo(() => {
    if (!snapshot) return "—";
    if (snapshot.orderType === "dine_in") {
      return summaryT?.orderTypes?.dineIn || checkoutT?.orderTypes?.dineIn || "Dine-in";
    }
    if (snapshot.orderType === "delivery") {
      return summaryT?.orderTypes?.delivery || checkoutT?.orderTypes?.delivery || "Delivery";
    }
    return summaryT?.orderTypes?.takeaway || checkoutT?.orderTypes?.takeaway || "Takeaway";
  }, [
    snapshot,
    summaryT?.orderTypes?.dineIn,
    summaryT?.orderTypes?.takeaway,
    summaryT?.orderTypes?.delivery,
    checkoutT?.orderTypes?.dineIn,
    checkoutT?.orderTypes?.takeaway,
    checkoutT?.orderTypes?.delivery,
  ]);

  const paymentLabel = useMemo(() => {
    if (!snapshot) return "—";
    const method = snapshot.paymentMethod;
    if (method === "cash") return posT?.payment?.cash || "Cash";
    if (method === "card") return posT?.payment?.card || "Card";
    return posT?.payment?.qr || "QR";
  }, [snapshot, posT?.payment?.cash, posT?.payment?.card, posT?.payment?.qr]);

  async function handleDownloadPdf() {
    if (!snapshot || !orderId) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 44;
      let y = 56;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(restaurantName || restaurantSlug, margin, y);

      if (restaurantLogoUrl) {
        const img = await loadImageDataUrl(restaurantLogoUrl);
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

      const orderNumberLabel = receiptT?.orderNumberLabel || "Order Number";
      const orderDateLabel = receiptT?.orderDateLabel || "Order Date";
      const orderTypeLabelText = receiptT?.orderTypeLabel || "Order Type";
      const tableNumberLabel = receiptT?.tableNumberLabel || "Table Number";
      const paymentMethodLabel = receiptT?.paymentMethodLabel || "Payment Method";

      doc.text(`${orderNumberLabel}:`, margin, y);
      doc.setFont("helvetica", "bold");
      doc.text(String(orderId), margin + 120, y);
      doc.setFont("helvetica", "normal");
      y += 16;

      doc.text(`${orderDateLabel}:`, margin, y);
      doc.text(String(createdLabel), margin + 120, y);
      y += 16;

      doc.text(`${orderTypeLabelText}:`, margin, y);
      doc.text(String(orderTypeLabel), margin + 120, y);
      y += 16;

      if (snapshot.orderType === "dine_in") {
        doc.text(`${tableNumberLabel}:`, margin, y);
        doc.text(String(snapshot.tableNumber || "—"), margin + 120, y);
        y += 16;
      }

      y += 6;
      doc.setDrawColor(220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;

      // Items header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const nameHeader = receiptT?.itemsHeader?.name || "Item";
      const qtyHeader = receiptT?.itemsHeader?.qty || "Qty";
      const priceHeader = receiptT?.itemsHeader?.price || "Price";
      doc.text(String(nameHeader).toUpperCase(), margin, y);
      doc.text(String(qtyHeader).toUpperCase(), pageWidth - margin - 110, y, { align: "right" });
      doc.text(String(priceHeader).toUpperCase(), pageWidth - margin, y, { align: "right" });
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const nameWidth = pageWidth - margin * 2 - 140;
      for (const it of snapshot.items) {
        const title = getDisplayTitle(it.title as any, language as Language, t.order?.labels?.unknownItem || "Unknown Item");
        const lines = doc.splitTextToSize(title, nameWidth);
        const lineHeight = 14;

        doc.text(lines, margin, y);
        doc.text(String(it.quantity), pageWidth - margin - 110, y, { align: "right" });
        doc.text(formatMoney(currency, it.price * it.quantity), pageWidth - margin, y, { align: "right" });

        y += Math.max(lineHeight * lines.length, 16);
        if (y > doc.internal.pageSize.getHeight() - 120) {
          doc.addPage();
          y = 56;
        }
      }

      y += 6;
      doc.setDrawColor(220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;

      // Totals
      doc.setFont("helvetica", "normal");
      doc.text(posT?.subtotal || "Sub Total", margin, y);
      doc.text(formatMoney(currency, snapshot.subtotal ?? 0), pageWidth - margin, y, { align: "right" });
      y += 16;
      doc.text(posT?.tax || "Tax", margin, y);
      doc.text(formatMoney(currency, snapshot.tax ?? 0), pageWidth - margin, y, { align: "right" });
      y += 18;

      doc.setFont("helvetica", "bold");
      doc.text(posT?.totalAmount || "Total Amount", margin, y);
      doc.text(formatMoney(currency, snapshot.totalAmount ?? 0), pageWidth - margin, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 22;

      doc.text(`${paymentMethodLabel}:`, margin, y);
      doc.text(String(paymentLabel), pageWidth - margin, y, { align: "right" });

      const fileOrderPart = safeFilenamePart(String(orderId));
      doc.save(`receipt-order-${fileOrderPart}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  const backHref = `/public-menu/${restaurantSlug}/${menuId}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <Card className="rounded-3xl border border-border/60 bg-card shadow-floating">
            <CardContent className="p-5 sm:p-7">
              <div id="receipt-print" ref={receiptRef} className="rounded-2xl">
                {/* Receipt header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {receiptT?.title || "Receipt"}
                    </div>
                    <div className="mt-1 truncate text-lg font-bold text-foreground">
                      {restaurantName || restaurantSlug}
                    </div>
                  </div>
                  {restaurantLogoUrl ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      <Image
                        src={restaurantLogoUrl}
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

                {/* Order info */}
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {receiptT?.orderNumberLabel || checkoutT?.successModal?.orderNumberLabel || "Order Number"}
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {orderId ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {receiptT?.orderDateLabel || "Order Date"}
                    </span>
                    <span className="font-semibold text-foreground">{createdLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {receiptT?.orderTypeLabel || summaryT?.fields?.orderType || "Order Type"}
                    </span>
                    <span className="font-semibold text-foreground">{orderTypeLabel}</span>
                  </div>
                  {snapshot?.orderType === "dine_in" ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {receiptT?.tableNumberLabel || summaryT?.fields?.tableNumber || "Table Number"}
                      </span>
                      <span className="font-semibold text-foreground">{snapshot.tableNumber || "—"}</span>
                    </div>
                  ) : null}
                </div>

                <div className="my-5 border-t border-dashed border-border/70" />

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="min-w-0 flex-1">{receiptT?.itemsHeader?.name || "Item"}</span>
                    <span className="w-12 text-right">{receiptT?.itemsHeader?.qty || "Qty"}</span>
                    <span className="w-20 text-right">{receiptT?.itemsHeader?.price || "Price"}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(snapshot?.items ?? []).map((it) => (
                      <div key={it.id} className="flex items-start gap-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">
                            {getDisplayTitle(it.title as any, language as Language, t.order?.labels?.unknownItem || "Unknown Item")}
                          </div>
                        </div>
                        <div className="w-12 shrink-0 text-right font-semibold text-foreground">
                          {it.quantity}
                        </div>
                        <div className="w-20 shrink-0 text-right font-semibold text-foreground">
                          {formatMoney(currency, it.price * it.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-5 border-t border-dashed border-border/70" />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{posT?.subtotal || "Sub Total"}</span>
                    <span className="font-semibold text-foreground">
                      {formatMoney(currency, snapshot?.subtotal ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{posT?.tax || "Tax"}</span>
                    <span className="font-semibold text-foreground">
                      {formatMoney(currency, snapshot?.tax ?? 0)}
                    </span>
                  </div>
                  <div className="border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {posT?.totalAmount || "Total Amount"}
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {formatMoney(currency, snapshot?.totalAmount ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="my-5 border-t border-dashed border-border/70" />

                {/* Payment */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {receiptT?.paymentMethodLabel || "Payment Method"}
                  </span>
                  <span className="font-semibold text-foreground">{paymentLabel}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                      onClick={handleDownloadPdf}
                      disabled={!snapshot || downloading}
                >
                      <Download className="mr-2 h-4 w-4" />
                      {receiptT?.downloadReceipt || receiptT?.printReceipt || "Download Receipt"}
                </Button>
                <Link href={backHref}>
                  <Button type="button" className="w-full rounded-2xl">
                    {receiptT?.backToMenu || checkoutT?.actions?.returnToMenu || "Back to Menu"}
                  </Button>
                </Link>
              </div>

              {!snapshot ? (
                <div className={cn("mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground")}>
                  {receiptT?.missingReceipt || "Receipt data is not available. You can still return to the menu."}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

