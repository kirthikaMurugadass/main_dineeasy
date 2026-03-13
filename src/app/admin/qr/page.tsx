"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, Printer, Copy, Check, Store } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { FadeIn, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { getSubdomainUrl } from "@/lib/subdomain";
import { generateQRWithLogoPNG, generateQRWithLogoSVG } from "@/lib/qr-with-logo";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/subscription-context";

export default function QRPage() {
  const { t } = useI18n();
  const qrT = t.qr;
  const router = useRouter();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [bookTableQrDataUrl, setBookTableQrDataUrl] = useState("");
  const [qrColor, setQrColor] = useState("#3E2723");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);
  const [bookTableCopied, setBookTableCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const proUpgradeMessage =
    qrT?.pro?.bookingQrRequired ||
    "Upgrade to Pro to enable Table Booking QR.";

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        router.push("/admin/onboarding");
        return;
      }

      // Fetch menu for this restaurant
      const { data: menu } = await supabase
        .from("menus")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .limit(1)
        .maybeSingle();

      setRestaurantName(restaurant.name);
      setRestaurantSlug(restaurant.slug);
      // Add cache-busting to logo URL to ensure fresh image
      const logoUrlWithCache = restaurant.logo_url 
        ? `${restaurant.logo_url}?t=${Date.now()}` 
        : null;
      setLogoUrl(logoUrlWithCache);
      setMenuId(menu?.id || null);
      setLoading(false);
    }
    load();
  }, [router]);

  const getQrUrl = useCallback(() => {
    if (!restaurantSlug) return "";
    return getSubdomainUrl(restaurantSlug, menuId || undefined);
  }, [restaurantSlug, menuId]);

  const getBookTableQrUrl = useCallback(() => {
    if (!restaurantSlug) return "";
    const appUrl = typeof window !== "undefined" 
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_SITE_URL || "https://dineeasy.app";
    return `${appUrl.replace(/\/$/, "")}/r/${restaurantSlug}/book-table`;
  }, [restaurantSlug]);

  const generateQR = useCallback(async () => {
    const url = getQrUrl();
    if (!url) return;

    try {
      // Fetch latest logo URL to ensure we have the most recent version
      let currentLogoUrl = logoUrl;
      if (restaurantSlug) {
        const supabase = createClient();
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("logo_url")
          .eq("slug", restaurantSlug)
          .single();
        if (restaurant?.logo_url) {
          // Add cache-busting to ensure fresh logo
          currentLogoUrl = `${restaurant.logo_url}?t=${Date.now()}`;
        }
      }

      const dataUrl = await generateQRWithLogoPNG({
        url,
        logoUrl: currentLogoUrl,
        width: 1024,
        margin: 2,
        qrColor,
        bgColor,
        logoSize: 0.22, // 22% of QR size
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
      toast.error(qrT?.toasts?.generateError || "Failed to generate QR code");
    }
  }, [getQrUrl, logoUrl, qrColor, bgColor, restaurantSlug]);

  const generateBookTableQR = useCallback(async () => {
    const url = getBookTableQrUrl();
    if (!url) return;

    try {
      let currentLogoUrl = logoUrl;
      if (restaurantSlug) {
        const supabase = createClient();
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("logo_url")
          .eq("slug", restaurantSlug)
          .single();
        if (restaurant?.logo_url) {
          currentLogoUrl = `${restaurant.logo_url}?t=${Date.now()}`;
        }
      }

      const dataUrl = await generateQRWithLogoPNG({
        url,
        logoUrl: currentLogoUrl,
        width: 1024,
        margin: 2,
        qrColor,
        bgColor,
        logoSize: 0.22,
        errorCorrectionLevel: "H",
      });
      setBookTableQrDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
      toast.error(
        qrT?.toasts?.generateBookTableError ||
          "Failed to generate Book Table QR code"
      );
    }
  }, [getBookTableQrUrl, logoUrl, qrColor, bgColor, restaurantSlug]);

  useEffect(() => {
    if (!loading && restaurantSlug) {
      generateQR();
      if (isPro) {
        generateBookTableQR();
      } else {
        setBookTableQrDataUrl("");
      }
    }
  }, [generateQR, generateBookTableQR, isPro, loading, restaurantSlug, logoUrl]);

  // Keep both QR outputs visually consistent by regenerating Book Table QR
  // whenever the shared QR style colors change.
  useEffect(() => {
    if (!loading && isPro && restaurantSlug) {
      generateBookTableQR();
    }
  }, [qrColor, bgColor, loading, isPro, restaurantSlug, generateBookTableQR]);

  async function copyUrl() {
    const url = getQrUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(qrT?.toasts?.urlCopied || "URL copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyBookTableUrl() {
    if (!isPro) {
      toast.error(proUpgradeMessage);
      return;
    }
    const url = getBookTableQrUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setBookTableCopied(true);
    toast.success(
      qrT?.toasts?.bookTableUrlCopied || "Book Table URL copied!"
    );
    setTimeout(() => setBookTableCopied(false), 2000);
  }

  function downloadPNG() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-menu-${restaurantSlug}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success(
      qrT?.toasts?.menuPngDownloaded || "Menu QR code downloaded as PNG!"
    );
  }

  async function downloadSVG() {
    const url = getQrUrl();
    if (!url) return;

    try {
      const svgString = await generateQRWithLogoSVG({
        url,
        logoUrl,
        width: 1024,
        margin: 2,
        qrColor,
        bgColor,
        logoSize: 0.22,
        errorCorrectionLevel: "H",
      });

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.download = `qr-menu-${restaurantSlug}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success(
        qrT?.toasts?.menuSvgDownloaded || "Menu QR code downloaded as SVG!"
      );
    } catch (err) {
      console.error(err);
      toast.error(qrT?.toasts?.svgGenerateError || "Failed to generate SVG");
    }
  }

  function downloadBookTablePNG() {
    if (!isPro) {
      toast.error(proUpgradeMessage);
      return;
    }
    if (!bookTableQrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-book-table-${restaurantSlug}.png`;
    link.href = bookTableQrDataUrl;
    link.click();
    toast.success(
      qrT?.toasts?.bookTablePngDownloaded ||
        "Book Table QR code downloaded as PNG!"
    );
  }

  async function downloadBookTableSVG() {
    if (!isPro) {
      toast.error(proUpgradeMessage);
      return;
    }
    const url = getBookTableQrUrl();
    if (!url) return;

    try {
      const svgString = await generateQRWithLogoSVG({
        url,
        logoUrl,
        width: 1024,
        margin: 2,
        qrColor,
        bgColor,
        logoSize: 0.22,
        errorCorrectionLevel: "H",
      });

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.download = `qr-book-table-${restaurantSlug}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success(
        qrT?.toasts?.bookTableSvgDownloaded ||
          "Book Table QR code downloaded as SVG!"
      );
    } catch (err) {
      console.error(err);
      toast.error(qrT?.toasts?.svgGenerateError || "Failed to generate SVG");
    }
  }

  function handlePrint() {
    const w = window.open();
    if (w && qrDataUrl) {
      w.document.write(`
        <html>
          <head><title>${qrT?.printTitle || "QR Code"} — ${restaurantName}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif;">
            <img src="${qrDataUrl}" style="width:100%;max-width:500px;" />
            <p style="margin-top:24px;font-size:18px;font-weight:600;color:#333;">${restaurantName}</p>
            <p style="margin-top:4px;font-size:13px;color:#888;">${qrT?.scanToViewMenu || "Scan to view menu"}</p>
          </body>
        </html>
      `);
      w.document.close();
      w.print();
    }
  }

  function handleBookTablePrint() {
    if (!isPro) {
      toast.error(proUpgradeMessage);
      return;
    }
    const w = window.open();
    if (w && bookTableQrDataUrl) {
      w.document.write(`
        <html>
          <head><title>${qrT?.printTitle || "QR Code"} — ${restaurantName}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif;">
            <img src="${bookTableQrDataUrl}" style="width:100%;max-width:500px;" />
            <p style="margin-top:24px;font-size:18px;font-weight:600;color:#333;">${restaurantName}</p>
            <p style="margin-top:4px;font-size:13px;color:#888;">${qrT?.scanToBookTable || "Scan to book a table"}</p>
          </body>
        </html>
      `);
      w.document.close();
      w.print();
    }
  }

  if (loading || subscriptionLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageTitle
          description={qrT?.description || "Your restaurant QR codes"}
        >
          {qrT?.title || "QR Codes"}
        </PageTitle>
      </FadeIn>

      {/* Menu QR Section */}
      <FadeIn delay={0.1}>
        <Card className="mb-8 rounded-2xl border border-border/50 bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
          <CardHeader>
            <CardTitle className="text-lg">
              {qrT?.menuQrCode || "Menu QR Code"}
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="block">
                Share this QR code so customers can instantly open your digital menu.
              </span>
              <span className="block">
                They can browse categories, view prices, and place orders quickly.
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Settings */}
              <div className="space-y-6">
                {/* Restaurant info */}
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                  {logoUrl ? (
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
                      {/* Restaurant logo avatar */}
                      {/* Using plain img to avoid adding Next.js Image in client route */}
                      <img
                        src={logoUrl}
                        alt={restaurantName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-espresso text-warm font-sans font-semibold text-lg">
                      {restaurantName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{restaurantName}</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {getQrUrl() || qrT?.loading || "Loading..."}
                    </p>
                  </div>
                </div>

                {/* QR URL display */}
                <div className="space-y-2">
                  <Label>{qrT?.menuQrCodeUrl || "Menu QR Code URL"}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getQrUrl()}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="icon" onClick={copyUrl}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {menuId
                      ? qrT?.urlDescriptionMenu
                      : qrT?.urlDescription}
                  </p>
                </div>

                {/* Color customization */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{qrT?.qrColor || "QR Color"}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border border-border"
                      />
                      <Input
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{qrT?.background || "Background"}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border border-border"
                      />
                      <Input
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview & Download */}
              <div className="flex flex-col items-center space-y-6">
                {qrDataUrl ? (
                  <HoverScale>
                    <div className="rounded-2xl bg-white p-8 shadow-premium">
                      <img
                        src={qrDataUrl}
                        alt={qrT?.menuQrCode || "Menu QR Code"}
                        className="h-64 w-64"
                      />
                      <p className="mt-3 text-center text-sm font-semibold text-gray-700">
                        {restaurantName}
                      </p>
                      <p className="text-center text-xs text-gray-400">
                        {qrT?.scanToViewMenu || "Scan to view menu"}
                      </p>
                    </div>
                  </HoverScale>
                ) : (
                  <div className="flex h-64 w-64 flex-col items-center justify-center rounded-2xl bg-muted gap-2">
                    <Store size={24} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {qrT?.loading || "Loading..."}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={downloadPNG}
                    className="gap-2 bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                  >
                    <Download size={14} />
                    PNG
                  </Button>
                  <Button
                    onClick={downloadSVG}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download size={14} />
                    <span>SVG</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="gap-2"
                  >
                    <Printer size={14} />
                    <span>{qrT?.printAction || "Print"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Book Table QR Section (Pro only) */}
      <FadeIn delay={0.2}>
        {isPro ? (
          <Card className="rounded-2xl border border-border/50 bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <CardTitle className="text-lg">
                {qrT?.bookTableQrCode || "Book a Table QR Code"}
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                <span className="block">
                  Use this QR code to let customers reserve tables directly from their phones.
                </span>
                <span className="block">
                  It opens your booking flow with date, time, guests, and table selection.
                </span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid items-start gap-8 lg:grid-cols-2">
                {/* Settings */}
                <div className="space-y-6">
                  {/* QR URL display */}
                  <div className="space-y-2">
                    <Label>
                      {qrT?.bookTableQrCodeUrl || "Book Table QR Code URL"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={getBookTableQrUrl()}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" size="icon" onClick={copyBookTableUrl}>
                        {bookTableCopied ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {qrT?.customersScanToBook ||
                        "Customers scan this QR code to book a table"}
                    </p>
                  </div>

                  {/* Color customization (same as Menu QR) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{qrT?.qrColor || "QR Color"}</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={qrColor}
                          onChange={(e) => setQrColor(e.target.value)}
                          className="h-10 w-10 cursor-pointer rounded border border-border"
                        />
                        <Input
                          value={qrColor}
                          onChange={(e) => setQrColor(e.target.value)}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{qrT?.background || "Background"}</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="h-10 w-10 cursor-pointer rounded border border-border"
                        />
                        <Input
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview & Download */}
                <div className="flex flex-col items-center space-y-6 self-start lg:-mt-6">
                  {bookTableQrDataUrl ? (
                    <HoverScale>
                      <div className="rounded-2xl bg-white p-8 shadow-premium">
                        <img
                          src={bookTableQrDataUrl}
                          alt={qrT?.bookTableQrCode || "Book Table QR Code"}
                          className="h-64 w-64"
                        />
                        <p className="mt-3 text-center text-sm font-semibold text-gray-700">
                          {restaurantName}
                        </p>
                        <p className="text-center text-xs text-gray-400">
                          {qrT?.scanToBookTable || "Scan to book a table"}
                        </p>
                      </div>
                    </HoverScale>
                  ) : (
                    <div className="flex h-64 w-64 flex-col items-center justify-center rounded-2xl bg-muted gap-2">
                      <Store size={24} className="text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {qrT?.loading || "Loading..."}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={downloadBookTablePNG}
                      className="gap-2 bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                    >
                      <Download size={14} />
                      PNG
                    </Button>
                    <Button
                      onClick={downloadBookTableSVG}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download size={14} />
                      <span>SVG</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleBookTablePrint}
                      className="gap-2"
                    >
                      <Printer size={14} />
                      <span>{qrT?.printAction || "Print"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border border-border/50 bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <CardTitle className="text-lg">
                {qrT?.bookTableQrCode || "Book a Table QR Code"}
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                <span className="block">
                  Use this QR code to let customers reserve tables directly from their phones.
                </span>
                <span className="block">
                  It opens your booking flow with date, time, guests, and table selection.
                </span>
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{proUpgradeMessage}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/admin/checkout")}
              >
                {qrT?.pro?.upgradeAction || "Upgrade to Pro"}
              </Button>
            </CardContent>
          </Card>
        )}
      </FadeIn>
    </div>
  );
}
