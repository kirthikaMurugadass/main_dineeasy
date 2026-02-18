"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Download, Printer, Copy, Check, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FadeIn, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface MenuOption {
  id: string;
  slug: string;
  title: string;
}

export default function QRPage() {
  const { t } = useI18n();
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrColor, setQrColor] = useState("#3E2723");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, slug")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) return;
      setRestaurantSlug(restaurant.slug);

      const { data: menuData } = await supabase
        .from("menus")
        .select("id, slug")
        .eq("restaurant_id", restaurant.id);

      if (!menuData) return;

      const menuIds = menuData.map((m) => m.id);
      const { data: translations } = await supabase
        .from("translations")
        .select("entity_id, title")
        .eq("entity_type", "menu")
        .eq("language", "en")
        .in("entity_id", menuIds);

      const titleMap = new Map(
        translations?.map((tr) => [tr.entity_id, tr.title]) ?? []
      );

      setMenus(
        menuData.map((m) => ({
          id: m.id,
          slug: m.slug,
          title: titleMap.get(m.id) ?? m.slug,
        }))
      );

      if (menuData.length > 0) {
        setSelectedMenu(menuData[0].id);
      }
    }
    load();
  }, []);

  const generateQR = useCallback(async () => {
    const menu = menus.find((m) => m.id === selectedMenu);
    if (!menu || !restaurantSlug) return;

    const url = `${window.location.origin}/${restaurantSlug}/${menu.slug}`;

    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 2,
        color: {
          dark: qrColor,
          light: bgColor,
        },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  }, [selectedMenu, restaurantSlug, menus, qrColor, bgColor]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  function getMenuUrl() {
    const menu = menus.find((m) => m.id === selectedMenu);
    if (!menu || !restaurantSlug) return "";
    return `${window.location.origin}/${restaurantSlug}/${menu.slug}`;
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(getMenuUrl());
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPNG() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${restaurantSlug}-${menus.find((m) => m.id === selectedMenu)?.slug}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR code downloaded!");
  }

  async function downloadSVG() {
    const menu = menus.find((m) => m.id === selectedMenu);
    if (!menu || !restaurantSlug) return;

    const url = `${window.location.origin}/${restaurantSlug}/${menu.slug}`;
    const svgString = await QRCode.toString(url, {
      type: "svg",
      width: 1024,
      margin: 2,
      color: {
        dark: qrColor,
        light: bgColor,
      },
      errorCorrectionLevel: "H",
    });

    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `qr-${restaurantSlug}-${menu.slug}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("SVG downloaded!");
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="font-serif text-3xl font-bold">{t.admin.qr.title}</h1>
          <p className="mt-1 text-muted-foreground">
            Generate print-ready QR codes for your digital menus
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Settings */}
        <FadeIn delay={0.1}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Menu selector */}
              <div className="space-y-2">
                <Label>Select Menu</Label>
                <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {menus.map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* URL display */}
              <div className="space-y-2">
                <Label>Menu URL</Label>
                <div className="flex gap-2">
                  <Input value={getMenuUrl()} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyUrl}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>

              {/* Color customization */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>QR Color</Label>
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
                  <Label>Background</Label>
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

              <Button variant="outline" onClick={generateQR} className="gap-2">
                <RefreshCw size={14} />
                Regenerate
              </Button>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Preview & Download */}
        <FadeIn delay={0.2}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
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
                    <p className="mt-3 text-center text-xs font-medium text-gray-500">
                      {menus.find((m) => m.id === selectedMenu)?.title}
                    </p>
                  </div>
                </HoverScale>
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-muted">
                  <p className="text-sm text-muted-foreground">Select a menu</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={downloadPNG} className="gap-2 bg-espresso text-warm hover:bg-espresso/90">
                  <Download size={14} />
                  PNG
                </Button>
                <Button onClick={downloadSVG} variant="outline" className="gap-2">
                  <Download size={14} />
                  SVG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const w = window.open();
                    if (w && qrDataUrl) {
                      w.document.write(`<img src="${qrDataUrl}" style="width:100%;max-width:600px;margin:auto;display:block;" />`);
                      w.document.close();
                      w.print();
                    }
                  }}
                  className="gap-2"
                >
                  <Printer size={14} />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
