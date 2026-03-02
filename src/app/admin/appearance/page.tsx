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
  const { t, language } = useI18n();
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
      // Add cache-busting timestamp and language for preview sync
      const timestamp = Date.now();
      const url = `/preview/${restaurantSlug}/${menuId}?config=${encoded}&iframe=true&lang=${language}&t=${timestamp}`;
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
    logoUrl,
    language
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

      toast.success(t.admin.appearance.saved);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(t.admin.appearance.error);
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
      toast.error(t.admin.appearance.logoUploadError);
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
      toast.error(t.admin.appearance.logoUrlError);
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

    toast.success(t.admin.appearance.logoUploaded);
  }

  async function handleLogoRemove() {
    if (!logoUrl) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("restaurants")
      .update({ logo_url: null })
      .eq("id", restaurantId);

    if (error) {
      toast.error(t.admin.appearance.logoRemoveError);
      return;
    }

    setLogoUrl(null);

    // Bust cache
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug }),
    }).catch(() => {});

    toast.success(t.admin.appearance.logoRemoved);
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
      toast.error(t.admin.appearance.heroUploadError);
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

    toast.success(t.admin.appearance.heroUploaded);
  }

  async function handleHeroImageRemove() {
    const updatedHeroBanner = {
      ...(config.heroBanner || defaultHeroBannerConfig),
      backgroundImage: null,
    };
    setConfig({ ...config, heroBanner: updatedHeroBanner });
    toast.success(t.admin.appearance.heroRemoved);
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
    toast.success(t.admin.appearance.heroReset);
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
    toast.success(t.admin.appearance.typographyApplied.replace("{preset}", t.admin.appearance[preset]));
  }

  function resetTypography() {
    setConfig({
      ...config,
      typography: defaultTypographyConfig,
    });
    toast.success(t.admin.appearance.typographyReset);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8 overflow-x-hidden">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <PageTitle description={t.admin.appearance.description}>
            {t.admin.appearance.title}
          </PageTitle>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-espresso text-warm hover:bg-espresso/90 dark:bg-espresso dark:text-slate-900 dark:hover:bg-espresso/90 w-full sm:w-auto justify-center"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t.admin.appearance.save}
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          {/* Theme mode */}
          <FadeIn delay={0.1}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.appearance.theme}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: "light", labelKey: "themeLight", icon: Sun },
                  { value: "dark", labelKey: "themeDark", icon: Moon },
                  { value: "auto", labelKey: "themeAuto", icon: Monitor },
                ] as const).map(({ value, labelKey, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setConfig({ ...config, mode: value })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      config.mode === value
                        ? "border-gold bg-gold/5"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <Icon size={20} className={config.mode === value ? "text-gold" : "text-muted-foreground dark:text-muted-foreground"} />
                    <span className="text-xs font-medium text-foreground dark:text-foreground">{t.admin.appearance[labelKey]}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                    <span className="text-xs text-foreground dark:text-foreground">{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.admin.appearance.primary}</Label>
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
                  <Label className="text-xs">{t.admin.appearance.accent}</Label>
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Switch
                  checked={config.showLogo}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, showLogo: checked })
                  }
                />
                <Label className="text-sm">{t.admin.appearance.showLogoOnMenu}</Label>
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
                          {t.admin.appearance.replaceLogo}
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
                      {t.admin.appearance.remove}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-8">
                  <Upload size={24} className="mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">{t.admin.appearance.uploadLogo}</p>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>{t.admin.appearance.chooseFile}</span>
                    </Button>
                  </label>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {t.admin.appearance.logoSizeHint}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <CardTitle className="text-lg">{t.admin.appearance.heroBanner}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetHeroBanner}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCw size={14} className="mr-1" />
                  {t.admin.appearance.reset}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Background Type */}
              <div className="space-y-2">
                <Label className="text-xs">{t.admin.appearance.backgroundType}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([
                    { value: "image", labelKey: "image", icon: ImageIcon },
                    { value: "gradient", labelKey: "gradient", icon: Palette },
                    { value: "solid", labelKey: "solid", icon: Square },
                  ] as const).map(({ value, labelKey, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateHeroBanner({ backgroundType: value })}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                        config.heroBanner?.backgroundType === value
                          ? "border-gold bg-gold/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <Icon size={18} className={config.heroBanner?.backgroundType === value ? "text-gold" : "text-muted-foreground dark:text-muted-foreground"} />
                      <span className="text-xs font-medium text-foreground dark:text-foreground">{t.admin.appearance[labelKey]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Image Upload */}
              {config.heroBanner?.backgroundType === "image" && (
                <div className="space-y-3">
                  <Label className="text-xs">{t.admin.appearance.heroBackgroundImage}</Label>
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
                              {t.admin.appearance.replaceImage}
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
                          {t.admin.appearance.remove}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-8">
                      <Upload size={24} className="mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">{t.admin.appearance.uploadHeroImage}</p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span>{t.admin.appearance.chooseFile}</span>
                        </Button>
                      </label>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {t.admin.appearance.heroAspectHint}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Gradient Picker */}
              {config.heroBanner?.backgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t.admin.appearance.startColor}</Label>
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
                      <Label className="text-xs">{t.admin.appearance.endColor}</Label>
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
                    <Label className="text-xs">{t.admin.appearance.direction}</Label>
                    <Select
                      value={config.heroBanner?.gradientDirection || "to-b"}
                      onValueChange={(v) => updateHeroBanner({ gradientDirection: v as HeroBannerConfig["gradientDirection"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to-r">{t.admin.appearance.toRight}</SelectItem>
                        <SelectItem value="to-b">{t.admin.appearance.toBottom}</SelectItem>
                        <SelectItem value="to-br">{t.admin.appearance.toBottomRight}</SelectItem>
                        <SelectItem value="to-bl">{t.admin.appearance.toBottomLeft}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Solid Color */}
              {config.heroBanner?.backgroundType === "solid" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.admin.appearance.backgroundColor}</Label>
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
                <Label className="text-xs">{t.admin.appearance.overlay}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.color}</Label>
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
                    <Label className="text-xs">{t.admin.appearance.opacity}: {config.heroBanner?.overlayOpacity || 65}%</Label>
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
                <Label className="text-xs">{t.admin.appearance.textContent}</Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.subtitle}</Label>
                    <Input
                      value={config.heroBanner?.subtitle || ""}
                      onChange={(e) => updateHeroBanner({ subtitle: e.target.value })}
                      placeholder="DELICIOUS & AMAZING"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.bannerTitle}</Label>
                    <Input
                      value={config.heroBanner?.title || ""}
                      onChange={(e) => updateHeroBanner({ title: e.target.value })}
                      placeholder="Our Menu"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t.admin.appearance.alignment}</Label>
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
                      <Label className="text-xs">{t.admin.appearance.fontSize}: {config.heroBanner?.fontSize || 4.5}rem</Label>
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
                    <Label className="text-xs">{t.admin.appearance.fontWeight}</Label>
                    <Select
                      value={config.heroBanner?.fontWeight || "300"}
                      onValueChange={(v) => updateHeroBanner({ fontWeight: v as HeroBannerConfig["fontWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">{t.admin.appearance.fontWeightLight}</SelectItem>
                        <SelectItem value="400">{t.admin.appearance.fontWeightRegular}</SelectItem>
                        <SelectItem value="500">{t.admin.appearance.fontWeightMedium}</SelectItem>
                        <SelectItem value="600">{t.admin.appearance.fontWeightSemiBold}</SelectItem>
                        <SelectItem value="700">{t.admin.appearance.fontWeightBold}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <Label className="text-xs">{t.admin.appearance.ctaButton}</Label>
                  <Switch
                    checked={config.heroBanner?.showCta || false}
                    onCheckedChange={(checked) => updateHeroBanner({ showCta: checked })}
                  />
                </div>
                {config.heroBanner?.showCta && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t.admin.appearance.buttonText}</Label>
                      <Input
                        value={config.heroBanner?.ctaText || ""}
                        onChange={(e) => updateHeroBanner({ ctaText: e.target.value })}
                        placeholder="Order Now"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t.admin.appearance.buttonLink}</Label>
                      <Input
                        value={config.heroBanner?.ctaLink || ""}
                        onChange={(e) => updateHeroBanner({ ctaLink: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t.admin.appearance.buttonStyle}</Label>
                      <Select
                        value={config.heroBanner?.ctaStyle || "solid"}
                        onValueChange={(v) => updateHeroBanner({ ctaStyle: v as HeroBannerConfig["ctaStyle"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">{t.admin.appearance.solidStyle}</SelectItem>
                          <SelectItem value="outline">{t.admin.appearance.outline}</SelectItem>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <CardTitle className="text-lg">{t.admin.appearance.advancedTypography}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetTypography}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCw size={14} className="mr-1" />
                    {t.admin.appearance.reset}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Typography Presets */}
              <div className="space-y-2">
                <Label className="text-xs">{t.admin.appearance.presetStyles}</Label>
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
                      {t.admin.appearance[preset]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Families */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">{t.admin.appearance.fontFamilies}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.headingFont}</Label>
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
                    <Label className="text-xs">{t.admin.appearance.bodyFont}</Label>
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
                  <Label className="text-xs">{t.admin.appearance.accentFont}</Label>
                  <Select
                    value={config.typography?.accentFont || "none"}
                    onValueChange={(v) => updateTypography({ accentFont: v === "none" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.admin.appearance.sameAsBody} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t.admin.appearance.sameAsBody}</SelectItem>
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
                <Label className="text-xs">{t.admin.appearance.fontWeights}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.headingWeight}</Label>
                    <Select
                      value={config.typography?.headingWeight || "400"}
                      onValueChange={(v) => updateTypography({ headingWeight: v as TypographyConfig["headingWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">{t.admin.appearance.light300}</SelectItem>
                        <SelectItem value="400">{t.admin.appearance.regular400}</SelectItem>
                        <SelectItem value="500">{t.admin.appearance.medium500}</SelectItem>
                        <SelectItem value="600">{t.admin.appearance.semiBold600}</SelectItem>
                        <SelectItem value="700">{t.admin.appearance.bold700}</SelectItem>
                        <SelectItem value="800">{t.admin.appearance.extraBold800}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.bodyWeight}</Label>
                    <Select
                      value={config.typography?.bodyWeight || "400"}
                      onValueChange={(v) => updateTypography({ bodyWeight: v as TypographyConfig["bodyWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">{t.admin.appearance.light300}</SelectItem>
                        <SelectItem value="400">{t.admin.appearance.regular400}</SelectItem>
                        <SelectItem value="500">{t.admin.appearance.medium500}</SelectItem>
                        <SelectItem value="600">{t.admin.appearance.semiBold600}</SelectItem>
                        <SelectItem value="700">{t.admin.appearance.bold700}</SelectItem>
                        <SelectItem value="800">{t.admin.appearance.extraBold800}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Font Sizes */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">{t.admin.appearance.fontSizes}</Label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                  image.png                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <Label className="text-xs">{t.admin.appearance.heroTitle}: {config.typography?.heroTitleSize || 4.5}rem</Label>
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
                          <SelectItem value="compact">{t.admin.appearance.compact}</SelectItem>
                          <SelectItem value="balanced">{t.admin.appearance.balanced}</SelectItem>
                          <SelectItem value="spacious">{t.admin.appearance.spacious}</SelectItem>
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
                    <Label className="text-xs">{t.admin.appearance.sectionHeading}: {config.typography?.sectionHeadingSize || 2.5}rem</Label>
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
                    <Label className="text-xs">{t.admin.appearance.categoryTitle}: {config.typography?.categoryTitleSize || 1.5}rem</Label>
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
                    <Label className="text-xs">{t.admin.appearance.itemName}: {config.typography?.itemNameSize || 1.1}rem</Label>
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
                    <Label className="text-xs">{t.admin.appearance.itemDescription}: {config.typography?.itemDescriptionSize || 0.875}rem</Label>
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
                    <Label className="text-xs">{t.admin.appearance.price}: {config.typography?.priceSize || 1.125}rem</Label>
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
                <Label className="text-xs">{t.admin.appearance.lineHeightSpacing}</Label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.lineHeight}: {config.typography?.lineHeight || 1.6}x</Label>
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
                    <Label className="text-xs">{t.admin.appearance.letterSpacing}: {config.typography?.letterSpacing || 0}em</Label>
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <Label className="text-xs">{t.admin.appearance.paragraphSpacing}</Label>
                    <Switch
                      checked={config.typography?.paragraphSpacing !== false}
                      onCheckedChange={(checked) => updateTypography({ paragraphSpacing: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Text Colors */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">{t.admin.appearance.textColors} ({t.admin.appearance.textColorsHint})</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t.admin.appearance.primary}</Label>
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
                    <Label className="text-xs">{t.admin.appearance.secondary}</Label>
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
                    <Label className="text-xs">{t.admin.appearance.muted}</Label>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="space-y-0.5">
                    <Label className="text-xs">{t.admin.appearance.readableMode}</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t.admin.appearance.readableModeDesc}
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
          {/* Sticky only on large screens to avoid clipping on mobile */}
          <Card className="border-border/50 lg:sticky lg:top-6 h-fit w-full max-w-full overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye size={18} />
                  {t.admin.appearance.livePreview}
                </CardTitle>
                {!menuId && (
                  <p className="text-xs text-muted-foreground">
                    {t.admin.appearance.createMenuToPreview}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 overflow-x-hidden">
              {menuId && previewUrl ? (
                <div className="flex justify-center">
                  <div className="relative w-full max-w-full sm:max-w-[420px] overflow-hidden rounded-lg border border-border/50 bg-muted/20">
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
                          {t.admin.appearance.retry}
                        </Button>
                      </div>
                    )}
                    {/* Simple responsive preview container */}
                    <div className="relative py-4">
                      <div className="relative mx-auto w-full max-w-[420px] aspect-[9/16] overflow-hidden rounded-[32px] shadow-lg bg-background">
                        <iframe
                          key={`${previewUrl}-${language}-${config.typography?.headingFont}-${config.typography?.bodyFont}-${config.typography?.headingWeight}-${config.typography?.bodyWeight}`}
                          src={previewUrl}
                          className="block w-full h-full border-0 rounded-[32px]"
                          title="Menu Preview"
                          style={{
                            backgroundColor: "transparent",
                          }}
                          onLoad={() => {
                            setPreviewLoading(false);
                            setPreviewError(null);
                          }}
                          onError={() => {
                            setPreviewLoading(false);
                            setPreviewError(t.admin.appearance.previewLoadError);
                          }}
                        />
                        <div className="absolute top-3 right-4 rounded-md bg-yellow-500/20 px-2 py-1 z-20">
                          <p className="text-[10px] font-medium text-yellow-700 dark:text-yellow-300">
                            {t.admin.appearance.livePreview}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20">
                  <Eye size={48} className="mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t.admin.appearance.noPreviewAvailable}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!menuId
                      ? t.admin.appearance.createMenuFirst
                      : t.admin.appearance.unableToLoadPreview}
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
