"use client";

import { useEffect, useState, useMemo } from "react";
import { Save, Loader2, Upload, Sun, Moon, Monitor, Eye, X, Image as ImageIcon, Palette, Square, AlignLeft, AlignCenter, AlignRight, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { defaultThemeConfig, defaultHeroBannerConfig, defaultTypographyConfig, type ThemeConfig, type HeroBannerConfig, type TypographyConfig } from "@/types/database";

const colorPresets = [
  { name: "Espresso", primary: "#3E2723", accent: "#C6A75E" },
  { name: "Ocean", primary: "#1B3A4B", accent: "#4A9DA8" },
  { name: "Forest", primary: "#2D4A2D", accent: "#8BC34A" },
  { name: "Berry", primary: "#4A1942", accent: "#C850C0" },
  { name: "Midnight", primary: "#1A1A2E", accent: "#E94560" },
  { name: "Terracotta", primary: "#8B4513", accent: "#DAA520" },
];

const fontOptions = [
  { value: "playfair", label: "Playfair Display", googleFont: "Playfair+Display" },
  { value: "poppins", label: "Poppins", googleFont: "Poppins" },
  { value: "inter", label: "Inter", googleFont: "Inter" },
  { value: "dmsans", label: "DM Sans", googleFont: "DM+Sans" },
  { value: "montserrat", label: "Montserrat", googleFont: "Montserrat" },
  { value: "lora", label: "Lora", googleFont: "Lora" },
  { value: "merriweather", label: "Merriweather", googleFont: "Merriweather" },
  { value: "roboto", label: "Roboto", googleFont: "Roboto" },
  { value: "opensans", label: "Open Sans", googleFont: "Open+Sans" },
  { value: "nunito", label: "Nunito", googleFont: "Nunito" },
  { value: "plusjakarta", label: "Plus Jakarta Sans", googleFont: "Plus+Jakarta+Sans" },
];

const typographyPresets = {
  modern: {
    headingFont: "poppins",
    bodyFont: "inter",
    headingWeight: "600" as const,
    bodyWeight: "400" as const,
    heroTitleSize: 4,
    sectionHeadingSize: 2.25,
    categoryTitleSize: 1.375,
    itemNameSize: 1.125,
    itemDescriptionSize: 0.875,
    priceSize: 1.125,
    lineHeight: 1.6,
    letterSpacing: -0.01,
    paragraphSpacing: true,
  },
  elegant: {
    headingFont: "playfair",
    bodyFont: "lora",
    headingWeight: "400" as const,
    bodyWeight: "400" as const,
    heroTitleSize: 5,
    sectionHeadingSize: 2.75,
    categoryTitleSize: 1.5,
    itemNameSize: 1.125,
    itemDescriptionSize: 0.9375,
    priceSize: 1.25,
    lineHeight: 1.75,
    letterSpacing: 0.02,
    paragraphSpacing: true,
  },
  minimal: {
    headingFont: "inter",
    bodyFont: "inter",
    headingWeight: "500" as const,
    bodyWeight: "400" as const,
    heroTitleSize: 3.5,
    sectionHeadingSize: 2,
    categoryTitleSize: 1.25,
    itemNameSize: 1,
    itemDescriptionSize: 0.875,
    priceSize: 1,
    lineHeight: 1.5,
    letterSpacing: 0,
    paragraphSpacing: false,
  },
  classic: {
    headingFont: "merriweather",
    bodyFont: "roboto",
    headingWeight: "700" as const,
    bodyWeight: "400" as const,
    heroTitleSize: 4.5,
    sectionHeadingSize: 2.5,
    categoryTitleSize: 1.5,
    itemNameSize: 1.1,
    itemDescriptionSize: 0.875,
    priceSize: 1.125,
    lineHeight: 1.65,
    letterSpacing: 0,
    paragraphSpacing: true,
  },
  premium: {
    headingFont: "playfair",
    bodyFont: "dmsans",
    headingWeight: "400" as const,
    bodyWeight: "400" as const,
    heroTitleSize: 5.5,
    sectionHeadingSize: 3,
    categoryTitleSize: 1.625,
    itemNameSize: 1.125,
    itemDescriptionSize: 0.9375,
    priceSize: 1.375,
    lineHeight: 1.8,
    letterSpacing: 0.01,
    paragraphSpacing: true,
  },
};

export default function AppearancePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [config, setConfig] = useState<ThemeConfig>(() => ({
    ...defaultThemeConfig,
    typography: defaultTypographyConfig,
  }));
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug, theme_config, logo_url")
        .eq("owner_id", user.id)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);
        setRestaurantName(restaurant.name);
        setRestaurantSlug(restaurant.slug);
        // Add cache-busting to logo URL on load to ensure fresh image
        const logoUrlWithCache = restaurant.logo_url 
          ? `${restaurant.logo_url}?t=${Date.now()}` 
          : null;
        setLogoUrl(logoUrlWithCache);
        const savedConfig = { ...defaultThemeConfig, ...(restaurant.theme_config as ThemeConfig) };
        // Ensure heroBanner config exists with defaults
        if (!savedConfig.heroBanner) {
          savedConfig.heroBanner = defaultHeroBannerConfig;
        } else {
          savedConfig.heroBanner = { ...defaultHeroBannerConfig, ...savedConfig.heroBanner };
        }
        // Ensure typography config exists with defaults
        if (!savedConfig.typography) {
          // If no typography config exists, create one from legacy font fields or defaults
          savedConfig.typography = {
            ...defaultTypographyConfig,
            headingFont: savedConfig.fontHeading || defaultTypographyConfig.headingFont,
            bodyFont: savedConfig.fontBody || defaultTypographyConfig.bodyFont,
          };
        } else {
          // Merge with defaults to ensure all fields exist
          savedConfig.typography = { 
            ...defaultTypographyConfig, 
            ...savedConfig.typography,
            // Ensure headingFont and bodyFont are set even if missing
            headingFont: savedConfig.typography.headingFont || savedConfig.fontHeading || defaultTypographyConfig.headingFont,
            bodyFont: savedConfig.typography.bodyFont || savedConfig.fontBody || defaultTypographyConfig.bodyFont,
          };
        }
        // Ensure typography is always an object, never undefined
        if (!savedConfig.typography) {
          savedConfig.typography = defaultTypographyConfig;
        }
        setConfig(savedConfig);

        // Fetch menu ID for preview
        const { data: menu } = await supabase
          .from("menus")
          .select("id")
          .eq("restaurant_id", restaurant.id)
          .limit(1)
          .maybeSingle();

        setMenuId(menu?.id || null);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Generate preview URL with current config - memoized to update when config changes
  const previewUrl = useMemo(() => {
    if (!restaurantSlug || !menuId) return null;

    const previewConfig = {
      mode: config.mode,
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      fontHeading: config.fontHeading,
      fontBody: config.fontBody,
      showLogo: config.showLogo,
      headerImageUrl: config.headerImageUrl,
      logoUrl: logoUrl, // Include current logo URL in preview config
      heroBanner: config.heroBanner, // Include hero banner config
      typography: config.typography, // Include typography config
    };

    try {
      // Ensure typography is always included and properly structured
      if (!previewConfig.typography) {
        previewConfig.typography = {
          ...defaultTypographyConfig,
          headingFont: config.fontHeading || defaultTypographyConfig.headingFont,
          bodyFont: config.fontBody || defaultTypographyConfig.bodyFont,
        };
      }
      
      const encoded = btoa(JSON.stringify(previewConfig));
      // Add cache-busting timestamp to force iframe refresh
      const timestamp = Date.now();
      const url = `/preview/${restaurantSlug}/${menuId}?config=${encoded}&iframe=true&t=${timestamp}`;
      return url;
    } catch (error) {
      console.error("Error generating preview URL:", error);
      return null;
    }
  }, [
    restaurantSlug, 
    menuId, 
    config.mode, 
    config.primaryColor, 
    config.accentColor, 
    config.fontHeading, 
    config.fontBody, 
    config.showLogo, 
    config.headerImageUrl, 
    config.heroBanner, 
    config.typography?.headingFont,
    config.typography?.bodyFont,
    config.typography?.accentFont,
    config.typography?.headingWeight,
    config.typography?.bodyWeight,
    config.typography?.heroTitleSize,
    config.typography?.sectionHeadingSize,
    config.typography?.categoryTitleSize,
    config.typography?.itemNameSize,
    config.typography?.itemDescriptionSize,
    config.typography?.priceSize,
    config.typography?.lineHeight,
    config.typography?.letterSpacing,
    config.typography?.paragraphSpacing,
    config.typography?.textPrimary,
    config.typography?.textSecondary,
    config.typography?.textMuted,
    config.typography?.readableMode,
    logoUrl
  ]);

  // Reload iframe when preview URL changes (e.g., when colors change)
  useEffect(() => {
    if (previewUrl && !loading) {
      setPreviewLoading(true);
      // The iframe will reload automatically because the key changes
    }
  }, [previewUrl, loading]);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      
      // Ensure typography is included in the config
      const configToSave: ThemeConfig = {
        ...config,
        typography: config.typography || {
          ...defaultTypographyConfig,
          headingFont: config.fontHeading || defaultTypographyConfig.headingFont,
          bodyFont: config.fontBody || defaultTypographyConfig.bodyFont,
        },
      };
      
      // Debug logging
      if (process.env.NODE_ENV === "development") {
        console.log("Saving typography config:", {
          headingFont: configToSave.typography?.headingFont,
          bodyFont: configToSave.typography?.bodyFont,
          fullTypography: configToSave.typography,
        });
      }
      
      const { data, error } = await supabase
        .from("restaurants")
        .update({ theme_config: configToSave as unknown as Record<string, unknown> })
        .eq("id", restaurantId)
        .select("theme_config")
        .single();

      if (error) throw error;

      // Verify the save was successful
      if (process.env.NODE_ENV === "development") {
        console.log("Saved theme_config:", data?.theme_config);
      }

      // Bust cache so public page shows updated appearance immediately
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantSlug, menuId }),
      }).catch(() => {});

      toast.success("Appearance saved!");
    } catch (error: any) {
      console.error("Save error:", error);
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

    // Add cache-busting query parameter to force refresh
    const timestamp = Date.now();
    const publicUrlWithCacheBust = `${publicUrl}?t=${timestamp}`;

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ logo_url: publicUrl })
      .eq("id", restaurantId);

    if (updateError) {
      toast.error("Failed to save logo URL");
      return;
    }

    // Update local state with cache-busted URL to show logo immediately
    setLogoUrl(publicUrlWithCacheBust);

    // Bust cache so public page shows updated logo immediately
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug }),
    }).catch(() => {});

    toast.success("Logo uploaded!");
  }

  async function handleLogoRemove() {
    if (!logoUrl) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("restaurants")
      .update({ logo_url: null })
      .eq("id", restaurantId);

    if (error) {
      toast.error("Failed to remove logo");
      return;
    }

    setLogoUrl(null);

    // Bust cache
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug }),
    }).catch(() => {});

    toast.success("Logo removed!");
  }

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `hero-banners/${restaurantId}.${ext}`;

    const { error } = await supabase.storage.from("public").upload(path, file, {
      upsert: true,
    });

    if (error) {
      toast.error("Failed to upload hero image");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("public").getPublicUrl(path);

    // Add cache-busting query parameter
    const timestamp = Date.now();
    const publicUrlWithCacheBust = `${publicUrl}?t=${timestamp}`;

    // Update hero banner config
    const updatedHeroBanner = {
      ...(config.heroBanner || defaultHeroBannerConfig),
      backgroundImage: publicUrlWithCacheBust,
    };
    setConfig({ ...config, heroBanner: updatedHeroBanner });

    toast.success("Hero image uploaded!");
  }

  async function handleHeroImageRemove() {
    const updatedHeroBanner = {
      ...(config.heroBanner || defaultHeroBannerConfig),
      backgroundImage: null,
    };
    setConfig({ ...config, heroBanner: updatedHeroBanner });
    toast.success("Hero image removed!");
  }

  function updateHeroBanner(updates: Partial<HeroBannerConfig>) {
    setConfig({
      ...config,
      heroBanner: { ...(config.heroBanner || defaultHeroBannerConfig), ...updates },
    });
  }

  function resetHeroBanner() {
    setConfig({
      ...config,
      heroBanner: defaultHeroBannerConfig,
    });
    toast.success("Hero banner reset to defaults");
  }

  function updateTypography(updates: Partial<TypographyConfig>) {
    // Ensure typography always exists with proper defaults
    const currentTypography = config.typography || {
      ...defaultTypographyConfig,
      headingFont: config.fontHeading || defaultTypographyConfig.headingFont,
      bodyFont: config.fontBody || defaultTypographyConfig.bodyFont,
    };
    
    // Create a new typography object to ensure React detects the change
    const newTypography = { 
      ...currentTypography, 
      ...updates,
    };
    
    // Also update legacy font fields if headingFont or bodyFont changed
    const newConfig: ThemeConfig = {
      ...config,
      typography: newTypography,
    };
    
    if (updates.headingFont !== undefined) {
      newConfig.fontHeading = updates.headingFont;
    }
    if (updates.bodyFont !== undefined) {
      newConfig.fontBody = updates.bodyFont;
    }
    
    setConfig(newConfig);
  }

  function applyTypographyPreset(preset: keyof typeof typographyPresets) {
    const presetConfig = typographyPresets[preset];
    setConfig({
      ...config,
      typography: { ...defaultTypographyConfig, ...presetConfig, preset },
    });
    toast.success(`Applied ${preset.charAt(0).toUpperCase() + preset.slice(1)} typography`);
  }

  function resetTypography() {
    setConfig({
      ...config,
      typography: defaultTypographyConfig,
    });
    toast.success("Typography reset to defaults");
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
          <PageTitle description="Customize how your menu looks to customers">
            {t.admin.appearance.title}
          </PageTitle>
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

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left Column: Settings */}
        <div className="space-y-6">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className={`flex items-center gap-2 rounded-lg border p-2 sm:p-2.5 transition-all ${
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

              {logoUrl ? (
                <div className="relative rounded-xl border-2 border-border/50 p-4">
                  <div className="relative mx-auto aspect-video max-w-xs overflow-hidden rounded-lg bg-muted/30">
                    <Image
                      key={logoUrl} // Force re-render when logoUrl changes
                      src={logoUrl}
                      alt="Restaurant logo"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 400px"
                      unoptimized={logoUrl.includes("127.0.0.1") || logoUrl.includes("localhost")}
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                        <span>
                          <Upload size={14} />
                          Replace Logo
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogoRemove}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <X size={14} />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Hero Banner */}
        <FadeIn delay={0.3}>
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Hero Banner</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetHeroBanner}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCw size={14} className="mr-1" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Background Type */}
              <div className="space-y-2">
                <Label className="text-xs">Background Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "image", label: "Image", icon: ImageIcon },
                    { value: "gradient", label: "Gradient", icon: Palette },
                    { value: "solid", label: "Solid", icon: Square },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateHeroBanner({ backgroundType: value })}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                        config.heroBanner?.backgroundType === value
                          ? "border-gold bg-gold/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <Icon size={18} className={config.heroBanner?.backgroundType === value ? "text-gold" : "text-muted-foreground"} />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Image Upload */}
              {config.heroBanner?.backgroundType === "image" && (
                <div className="space-y-3">
                  <Label className="text-xs">Hero Background Image</Label>
                  {config.heroBanner?.backgroundImage ? (
                    <div className="relative rounded-xl border-2 border-border/50 p-4">
                      <div className="relative mx-auto aspect-video max-w-full overflow-hidden rounded-lg bg-muted/30">
                        <Image
                          src={config.heroBanner.backgroundImage}
                          alt="Hero banner"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 600px"
                          unoptimized={config.heroBanner.backgroundImage.includes("127.0.0.1") || config.heroBanner.backgroundImage.includes("localhost")}
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleHeroImageUpload}
                            className="hidden"
                          />
                          <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                            <span>
                              <Upload size={14} />
                              Replace Image
                            </span>
                          </Button>
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleHeroImageRemove}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <X size={14} />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-8">
                      <Upload size={24} className="mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">Upload hero background image</p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Recommended: 16:9 or 3:2 aspect ratio
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Gradient Picker */}
              {config.heroBanner?.backgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.heroBanner?.gradientStart || "#1a1714"}
                          onChange={(e) => updateHeroBanner({ gradientStart: e.target.value })}
                          className="h-9 w-9 cursor-pointer rounded border"
                        />
                        <Input
                          value={config.heroBanner?.gradientStart || "#1a1714"}
                          onChange={(e) => updateHeroBanner({ gradientStart: e.target.value })}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.heroBanner?.gradientEnd || "#3a2f28"}
                          onChange={(e) => updateHeroBanner({ gradientEnd: e.target.value })}
                          className="h-9 w-9 cursor-pointer rounded border"
                        />
                        <Input
                          value={config.heroBanner?.gradientEnd || "#3a2f28"}
                          onChange={(e) => updateHeroBanner({ gradientEnd: e.target.value })}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Direction</Label>
                    <Select
                      value={config.heroBanner?.gradientDirection || "to-b"}
                      onValueChange={(v) => updateHeroBanner({ gradientDirection: v as HeroBannerConfig["gradientDirection"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to-r">To Right</SelectItem>
                        <SelectItem value="to-b">To Bottom</SelectItem>
                        <SelectItem value="to-br">To Bottom Right</SelectItem>
                        <SelectItem value="to-bl">To Bottom Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Solid Color */}
              {config.heroBanner?.backgroundType === "solid" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.heroBanner?.solidColor || "#1a1714"}
                      onChange={(e) => updateHeroBanner({ solidColor: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded border"
                    />
                    <Input
                      value={config.heroBanner?.solidColor || "#1a1714"}
                      onChange={(e) => updateHeroBanner({ solidColor: e.target.value })}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              )}

              {/* Overlay Controls */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">Overlay</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.heroBanner?.overlayColor || "#000000"}
                        onChange={(e) => updateHeroBanner({ overlayColor: e.target.value })}
                        className="h-9 w-9 cursor-pointer rounded border"
                      />
                      <Input
                        value={config.heroBanner?.overlayColor || "#000000"}
                        onChange={(e) => updateHeroBanner({ overlayColor: e.target.value })}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Opacity: {config.heroBanner?.overlayOpacity || 65}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={config.heroBanner?.overlayOpacity || 65}
                      onChange={(e) => updateHeroBanner({ overlayOpacity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Text Customization */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">Text Content</Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={config.heroBanner?.subtitle || ""}
                      onChange={(e) => updateHeroBanner({ subtitle: e.target.value })}
                      placeholder="DELICIOUS & AMAZING"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={config.heroBanner?.title || ""}
                      onChange={(e) => updateHeroBanner({ title: e.target.value })}
                      placeholder="Our Menu"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Alignment</Label>
                      <div className="flex gap-2">
                        {([
                          { value: "left", icon: AlignLeft },
                          { value: "center", icon: AlignCenter },
                          { value: "right", icon: AlignRight },
                        ] as const).map(({ value, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => updateHeroBanner({ textAlign: value })}
                            className={`flex-1 rounded-lg border p-2 transition-all ${
                              config.heroBanner?.textAlign === value
                                ? "border-gold bg-gold/5"
                                : "border-border/50 hover:border-border"
                            }`}
                          >
                            <Icon size={16} className={config.heroBanner?.textAlign === value ? "text-gold mx-auto" : "text-muted-foreground mx-auto"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Font Size: {config.heroBanner?.fontSize || 4.5}rem</Label>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        step="0.5"
                        value={config.heroBanner?.fontSize || 4.5}
                        onChange={(e) => updateHeroBanner({ fontSize: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Weight</Label>
                    <Select
                      value={config.heroBanner?.fontWeight || "300"}
                      onValueChange={(v) => updateHeroBanner({ fontWeight: v as HeroBannerConfig["fontWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light</SelectItem>
                        <SelectItem value="400">Regular</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semi Bold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Call-to-Action Button</Label>
                  <Switch
                    checked={config.heroBanner?.showCta || false}
                    onCheckedChange={(checked) => updateHeroBanner({ showCta: checked })}
                  />
                </div>
                {config.heroBanner?.showCta && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Button Text</Label>
                      <Input
                        value={config.heroBanner?.ctaText || ""}
                        onChange={(e) => updateHeroBanner({ ctaText: e.target.value })}
                        placeholder="Order Now"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Button Link</Label>
                      <Input
                        value={config.heroBanner?.ctaLink || ""}
                        onChange={(e) => updateHeroBanner({ ctaLink: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Button Style</Label>
                      <Select
                        value={config.heroBanner?.ctaStyle || "solid"}
                        onValueChange={(v) => updateHeroBanner({ ctaStyle: v as HeroBannerConfig["ctaStyle"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Typography */}
        <FadeIn delay={0.4}>
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Typography</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetTypography}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCw size={14} className="mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Typography Presets */}
              <div className="space-y-2">
                <Label className="text-xs">Preset Styles</Label>
                <div className="grid grid-cols-5 gap-2">
                  {(["modern", "elegant", "minimal", "classic", "premium"] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyTypographyPreset(preset)}
                      className={`rounded-lg border-2 p-2 text-xs font-medium transition-all ${
                        config.typography?.preset === preset
                          ? "border-gold bg-gold/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      {preset.charAt(0).toUpperCase() + preset.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Families */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">Font Families</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Heading Font</Label>
                    <Select
                      value={config.typography?.headingFont || config.fontHeading || "playfair"}
                      onValueChange={(v) => {
                        updateTypography({ headingFont: v });
                        // Also update legacy fontHeading for backward compatibility
                        setConfig({ ...config, fontHeading: v });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value === "playfair" ? "Playfair Display" : f.label }}>
                              {f.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground" style={{ fontFamily: config.typography?.headingFont === "playfair" ? "Playfair Display" : fontOptions.find(f => f.value === config.typography?.headingFont)?.label }}>
                      Sample: The Quick Brown Fox
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Body Font</Label>
                    <Select
                      value={config.typography?.bodyFont || config.fontBody || "inter"}
                      onValueChange={(v) => {
                        updateTypography({ bodyFont: v });
                        // Also update legacy fontBody for backward compatibility
                        setConfig({ ...config, fontBody: v });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value === "inter" ? "Inter" : f.label }}>
                              {f.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground" style={{ fontFamily: config.typography?.bodyFont === "inter" ? "Inter" : fontOptions.find(f => f.value === config.typography?.bodyFont)?.label }}>
                      Sample: Lorem ipsum dolor sit amet
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Accent Font (Optional)</Label>
                  <Select
                    value={config.typography?.accentFont || "none"}
                    onValueChange={(v) => updateTypography({ accentFont: v === "none" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Same as body font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Same as body font</SelectItem>
                      {fontOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Font Weights */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">Font Weights</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Heading Weight</Label>
                    <Select
                      value={config.typography?.headingWeight || "400"}
                      onValueChange={(v) => updateTypography({ headingWeight: v as TypographyConfig["headingWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light (300)</SelectItem>
                        <SelectItem value="400">Regular (400)</SelectItem>
                        <SelectItem value="500">Medium (500)</SelectItem>
                        <SelectItem value="600">SemiBold (600)</SelectItem>
                        <SelectItem value="700">Bold (700)</SelectItem>
                        <SelectItem value="800">ExtraBold (800)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Body Weight</Label>
                    <Select
                      value={config.typography?.bodyWeight || "400"}
                      onValueChange={(v) => updateTypography({ bodyWeight: v as TypographyConfig["bodyWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light (300)</SelectItem>
                        <SelectItem value="400">Regular (400)</SelectItem>
                        <SelectItem value="500">Medium (500)</SelectItem>
                        <SelectItem value="600">SemiBold (600)</SelectItem>
                        <SelectItem value="700">Bold (700)</SelectItem>
                        <SelectItem value="800">ExtraBold (800)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Font Sizes */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">Font Sizes</Label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Hero Title: {config.typography?.heroTitleSize || 4.5}rem</Label>
                      <Select
                        value={(() => {
                          const heroSize = config.typography?.heroTitleSize || 4.5;
                          if (heroSize <= 3.5) return "compact";
                          if (heroSize >= 5.5) return "spacious";
                          return "balanced";
                        })()}
                        onValueChange={(v) => {
                          if (v === "compact") {
                            updateTypography({ heroTitleSize: 3.5, sectionHeadingSize: 2, categoryTitleSize: 1.25, itemNameSize: 1, itemDescriptionSize: 0.8125, priceSize: 1 });
                          } else if (v === "spacious") {
                            updateTypography({ heroTitleSize: 5.5, sectionHeadingSize: 3, categoryTitleSize: 1.75, itemNameSize: 1.25, itemDescriptionSize: 1, priceSize: 1.375 });
                          } else {
                            updateTypography({ heroTitleSize: 4.5, sectionHeadingSize: 2.5, categoryTitleSize: 1.5, itemNameSize: 1.1, itemDescriptionSize: 0.875, priceSize: 1.125 });
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      step="0.25"
                      value={config.typography?.heroTitleSize || 4.5}
                      onChange={(e) => updateTypography({ heroTitleSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Section Heading: {config.typography?.sectionHeadingSize || 2.5}rem</Label>
                    <input
                      type="range"
                      min="1.5"
                      max="4"
                      step="0.25"
                      value={config.typography?.sectionHeadingSize || 2.5}
                      onChange={(e) => updateTypography({ sectionHeadingSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category Title: {config.typography?.categoryTitleSize || 1.5}rem</Label>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.125"
                      value={config.typography?.categoryTitleSize || 1.5}
                      onChange={(e) => updateTypography({ categoryTitleSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Item Name: {config.typography?.itemNameSize || 1.1}rem</Label>
                    <input
                      type="range"
                      min="0.875"
                      max="1.5"
                      step="0.125"
                      value={config.typography?.itemNameSize || 1.1}
                      onChange={(e) => updateTypography({ itemNameSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Item Description: {config.typography?.itemDescriptionSize || 0.875}rem</Label>
                    <input
                      type="range"
                      min="0.75"
                      max="1.125"
                      step="0.0625"
                      value={config.typography?.itemDescriptionSize || 0.875}
                      onChange={(e) => updateTypography({ itemDescriptionSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Price: {config.typography?.priceSize || 1.125}rem</Label>
                    <input
                      type="range"
                      min="0.875"
                      max="1.5"
                      step="0.125"
                      value={config.typography?.priceSize || 1.125}
                      onChange={(e) => updateTypography({ priceSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Line Height & Spacing */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">Line Height & Spacing</Label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Line Height: {config.typography?.lineHeight || 1.6}x</Label>
                    <input
                      type="range"
                      min="1.2"
                      max="2.2"
                      step="0.1"
                      value={config.typography?.lineHeight || 1.6}
                      onChange={(e) => updateTypography({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Letter Spacing: {config.typography?.letterSpacing || 0}em</Label>
                    <input
                      type="range"
                      min="-0.02"
                      max="0.05"
                      step="0.005"
                      value={config.typography?.letterSpacing || 0}
                      onChange={(e) => updateTypography({ letterSpacing: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Paragraph Spacing</Label>
                    <Switch
                      checked={config.typography?.paragraphSpacing !== false}
                      onCheckedChange={(checked) => updateTypography({ paragraphSpacing: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Text Colors */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">Text Colors (null = auto based on theme)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Primary</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.typography?.textPrimary || "#000000"}
                        onChange={(e) => updateTypography({ textPrimary: e.target.value })}
                        className="h-9 w-9 cursor-pointer rounded border"
                      />
                      <Input
                        value={config.typography?.textPrimary || ""}
                        onChange={(e) => updateTypography({ textPrimary: e.target.value || null })}
                        placeholder="Auto"
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Secondary</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.typography?.textSecondary || "#000000"}
                        onChange={(e) => updateTypography({ textSecondary: e.target.value })}
                        className="h-9 w-9 cursor-pointer rounded border"
                      />
                      <Input
                        value={config.typography?.textSecondary || ""}
                        onChange={(e) => updateTypography({ textSecondary: e.target.value || null })}
                        placeholder="Auto"
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Muted</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.typography?.textMuted || "#000000"}
                        onChange={(e) => updateTypography({ textMuted: e.target.value })}
                        className="h-9 w-9 cursor-pointer rounded border"
                      />
                      <Input
                        value={config.typography?.textMuted || ""}
                        onChange={(e) => updateTypography({ textMuted: e.target.value || null })}
                        placeholder="Auto"
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessibility */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Readable Mode</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Larger fonts, increased spacing for better readability
                    </p>
                  </div>
                  <Switch
                    checked={config.typography?.readableMode || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateTypography({
                          readableMode: true,
                          heroTitleSize: 5,
                          sectionHeadingSize: 2.75,
                          categoryTitleSize: 1.625,
                          itemNameSize: 1.25,
                          itemDescriptionSize: 1,
                          priceSize: 1.25,
                          lineHeight: 1.8,
                        });
                      } else {
                        updateTypography({ readableMode: false });
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        </div>

        {/* Right Column: Live Preview */}
        <FadeIn delay={0.2}>
          <Card className="border-border/50 sticky top-6 h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye size={18} />
                  Live Preview
                </CardTitle>
                {!menuId && (
                  <p className="text-xs text-muted-foreground">
                    Create a menu to see preview
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {menuId && previewUrl ? (
                <div className="relative w-full overflow-hidden rounded-lg border border-border/50 bg-muted/20">
                  {previewLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50">
                      <Loader2 className="h-8 w-8 animate-spin text-gold" />
                    </div>
                  )}
                  {previewError && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-muted/50 p-4">
                      <p className="text-sm font-medium text-destructive mb-2">
                        {previewError}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewError(null);
                          setPreviewLoading(true);
                          // Force iframe reload by updating key
                          const iframe = document.querySelector('iframe[title="Menu Preview"]') as HTMLIFrameElement;
                          if (iframe) {
                            iframe.src = iframe.src;
                          }
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  <div className="relative h-[600px] w-full overflow-auto">
                    <iframe
                      key={`${previewUrl}-${config.typography?.headingFont}-${config.typography?.bodyFont}-${config.typography?.headingWeight}-${config.typography?.bodyWeight}`}
                      src={previewUrl}
                      className="h-full w-full border-0"
                      title="Menu Preview"
                      style={{ 
                        minHeight: "800px",
                        backgroundColor: "transparent",
                      }}
                      onLoad={() => {
                        setPreviewLoading(false);
                        setPreviewError(null);
                      }}
                      onError={() => {
                        setPreviewLoading(false);
                        setPreviewError("Failed to load preview. Please check your menu has categories and items.");
                      }}
                    />
                  </div>
                  <div className="absolute top-2 right-2 rounded-md bg-yellow-500/20 px-2 py-1 z-20">
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                      Live Preview
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20">
                  <Eye size={48} className="mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    No preview available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!menuId
                      ? "Create a menu first to see how it will look"
                      : "Unable to load preview"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
