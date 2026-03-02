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

export default function QRPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrColor, setQrColor] = useState("#3E2723");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

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
      toast.error("Failed to generate QR code");
    }
  }, [getQrUrl, logoUrl, qrColor, bgColor, restaurantSlug]);

  useEffect(() => {
    if (!loading && restaurantSlug) {
      generateQR();
    }
  }, [generateQR, loading, restaurantSlug, logoUrl]);

  async function copyUrl() {
    const url = getQrUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPNG() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${restaurantSlug}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR code downloaded as PNG!");
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
      link.download = `qr-${restaurantSlug}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success("QR code downloaded as SVG!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate SVG");
    }
  }

  function handlePrint() {
    const w = window.open();
    if (w && qrDataUrl) {
      w.document.write(`
        <html>
          <head><title>QR Code — ${restaurantName}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif;">
            <img src="${qrDataUrl}" style="width:100%;max-width:500px;" />
            <p style="margin-top:24px;font-size:18px;font-weight:600;color:#333;">${restaurantName}</p>
            <p style="margin-top:4px;font-size:13px;color:#888;">Scan to view our digital menu</p>
          </body>
        </html>
      `);
      w.document.close();
      w.print();
    }
  }

  if (loading) {
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
          description={t.admin.qr.description}
        >
          {t.admin.qr.title}
        </PageTitle>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Settings */}
        <FadeIn delay={0.1}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.qr.settings}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Restaurant info */}
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-espresso text-warm font-sans font-semibold text-lg">
                  {restaurantName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{restaurantName}</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {getQrUrl() || t.admin.qr.loading}
                  </p>
                </div>
              </div>

              {/* QR URL display */}
              <div className="space-y-2">
                <Label>{t.admin.qr.qrCodeUrl}</Label>
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
                    ? t.admin.qr.urlDescriptionMenu
                    : t.admin.qr.urlDescription}
                </p>
              </div>

              {/* Color customization */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.admin.qr.qrColor}</Label>
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
                  <Label>{t.admin.qr.background}</Label>
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
            </CardContent>
          </Card>
        </FadeIn>

        {/* Preview & Download */}
        <FadeIn delay={0.2}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.qr.preview}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {qrDataUrl ? (
                <HoverScale>
                  <div className="rounded-2xl bg-white p-8 shadow-premium">
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      className="h-64 w-64"
                    />
                    <p className="mt-3 text-center text-sm font-semibold text-gray-700">
                      {restaurantName}
                    </p>
                    <p className="text-center text-xs text-gray-400">
                      {t.menu.language}
                    </p>
                  </div>
                </HoverScale>
              ) : (
                <div className="flex h-64 w-64 flex-col items-center justify-center rounded-2xl bg-muted gap-2">
                  <Store size={24} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t.admin.qr.loading}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={downloadPNG}
                  className="gap-2 bg-espresso text-warm hover:bg-espresso/90 dark:bg-espresso dark:text-slate-900 dark:hover:bg-espresso/90"
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
                  <span>Print</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
