"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Upload, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { defaultThemeConfig, type ThemeConfig } from "@/types/database";

const colorPresets = [
  { name: "Espresso", primary: "#3E2723", accent: "#C6A75E" },
  { name: "Ocean", primary: "#1B3A4B", accent: "#4A9DA8" },
  { name: "Forest", primary: "#2D4A2D", accent: "#8BC34A" },
  { name: "Berry", primary: "#4A1942", accent: "#C850C0" },
  { name: "Midnight", primary: "#1A1A2E", accent: "#E94560" },
  { name: "Terracotta", primary: "#8B4513", accent: "#DAA520" },
];

const fontOptions = [
  { value: "playfair", label: "Playfair Display" },
  { value: "georgia", label: "Georgia" },
  { value: "merriweather", label: "Merriweather" },
];

const bodyFontOptions = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "opensans", label: "Open Sans" },
];

export default function AppearancePage() {
  const { t } = useI18n();
  const [config, setConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [saving, setSaving] = useState(false);
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
        .select("id, name, slug, theme_config")
        .eq("owner_id", user.id)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);
        setRestaurantName(restaurant.name);
        setRestaurantSlug(restaurant.slug);
        setConfig({ ...defaultThemeConfig, ...(restaurant.theme_config as ThemeConfig) });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurants")
        .update({ theme_config: config as unknown as Record<string, unknown> })
        .eq("id", restaurantId);

      if (error) throw error;

      // Bust cache so public page shows updated appearance immediately
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantSlug }),
      }).catch(() => {});

      toast.success("Appearance saved!");
    } catch {
      toast.error("Failed to save appearance");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `logos/${restaurantId}.${ext}`;

    const { error } = await supabase.storage.from("public").upload(path, file, {
      upsert: true,
    });

    if (error) {
      toast.error("Failed to upload logo");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("public").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ logo_url: publicUrl })
      .eq("id", restaurantId);

    if (updateError) {
      toast.error("Failed to save logo URL");
      return;
    }

    // Bust cache so public page shows updated logo immediately
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug }),
    }).catch(() => {});

    toast.success("Logo uploaded!");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">{t.admin.appearance.title}</h1>
            <p className="mt-1 text-muted-foreground">
              Customize how your menu looks to customers
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-espresso text-warm hover:bg-espresso/90"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Theme mode */}
        <FadeIn delay={0.1}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.appearance.theme}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "auto", label: "Auto", icon: Monitor },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setConfig({ ...config, mode: value })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      config.mode === value
                        ? "border-gold bg-gold/5"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <Icon size={20} className={config.mode === value ? "text-gold" : "text-muted-foreground"} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Colors */}
        <FadeIn delay={0.15}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.appearance.colors}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() =>
                      setConfig({
                        ...config,
                        primaryColor: preset.primary,
                        accentColor: preset.accent,
                      })
                    }
                    className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all ${
                      config.primaryColor === preset.primary
                        ? "border-gold bg-gold/5"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="flex gap-1">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom colors */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, primaryColor: e.target.value })
                      }
                      className="h-9 w-9 cursor-pointer rounded border"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, primaryColor: e.target.value })
                      }
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Accent</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) =>
                        setConfig({ ...config, accentColor: e.target.value })
                      }
                      className="h-9 w-9 cursor-pointer rounded border"
                    />
                    <Input
                      value={config.accentColor}
                      onChange={(e) =>
                        setConfig({ ...config, accentColor: e.target.value })
                      }
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Typography */}
        <FadeIn delay={0.2}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.appearance.typography}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Heading Font</Label>
                <Select
                  value={config.fontHeading}
                  onValueChange={(v) => setConfig({ ...config, fontHeading: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Body Font</Label>
                <Select
                  value={config.fontBody}
                  onValueChange={(v) => setConfig({ ...config, fontBody: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyFontOptions.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-border/50 p-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <h3 className="font-serif text-xl font-bold mb-1">Heading Font Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Body text preview — CHF <span className="font-mono">12.50</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Logo */}
        <FadeIn delay={0.25}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.appearance.logo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={config.showLogo}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, showLogo: checked })
                  }
                />
                <Label className="text-sm">Show logo on menu</Label>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-8">
                <Upload size={24} className="mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">Upload your logo</p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  PNG, JPG, SVG up to 2MB
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
