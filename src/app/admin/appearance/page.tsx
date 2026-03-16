"use client";

import { useEffect, useState, useMemo } from "react";
import { Save, Loader2, Upload, Sun, Moon, Monitor, Eye, X, RotateCw } from "lucide-react";
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
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  defaultThemeConfig,
  defaultHeroBannerConfig,
  defaultTypographyConfig,
  type AppearanceSectionConfig,
  type ThemeConfig,
  type TypographyConfig,
} from "@/types/database";

const colorPresets = [
  { key: "default", primary: "#16A34A", accent: "#16A34A" },
  { key: "espresso", primary: "#3E2723", accent: "#C6A75E" },
  { key: "ocean", primary: "#1B3A4B", accent: "#4A9DA8" },
  { key: "forest", primary: "#2D4A2D", accent: "#8BC34A" },
  { key: "berry", primary: "#4A1942", accent: "#C850C0" },
  { key: "midnight", primary: "#1A1A2E", accent: "#E94560" },
  { key: "terracotta", primary: "#8B4513", accent: "#DAA520" },
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
  const appearanceT = useMemo(
    () => getDictionary(language).admin.appearance as Record<string, any>,
    [language]
  );
  const [appearanceTarget, setAppearanceTarget] = useState<"menu" | "bookTable">("menu");
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
  const sectionMenuLabel = appearanceT.sectionMenu;
  const sectionBookTableLabel = appearanceT.sectionBookTable;

  function getColorPresetLabel(key: string): string {
    switch (key) {
      case "default":
        return appearanceT.presetDefault;
      case "espresso":
        return appearanceT.presetEspresso;
      case "ocean":
        return appearanceT.presetOcean;
      case "forest":
        return appearanceT.presetForest;
      case "berry":
        return appearanceT.presetBerry;
      case "midnight":
        return appearanceT.presetMidnight;
      case "terracotta":
        return appearanceT.presetTerracotta;
      default:
        return key;
    }
  }

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
        // Ensure Book a Table appearance has complete defaults
        const existingBook = (savedConfig.bookTableAppearance || {}) as Partial<AppearanceSectionConfig>;
        savedConfig.bookTableAppearance = {
          ...defaultThemeConfig,
          ...existingBook,
          heroBanner: {
            ...defaultHeroBannerConfig,
            ...(existingBook.heroBanner || {}),
          },
          typography: {
            ...defaultTypographyConfig,
            ...(existingBook.typography || {}),
          },
        };
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

  const activeSectionConfig = useMemo<AppearanceSectionConfig>(() => {
    if (appearanceTarget === "menu") {
      return {
        ...defaultThemeConfig,
        ...config,
      };
    }
    return {
      ...defaultThemeConfig,
      ...(config.bookTableAppearance || {}),
    };
  }, [appearanceTarget, config]);

  function updateActiveSectionConfig(updates: Partial<AppearanceSectionConfig>) {
    if (appearanceTarget === "menu") {
      setConfig((prev) => ({ ...prev, ...updates }));
      return;
    }
    setConfig((prev) => ({
      ...prev,
      bookTableAppearance: {
        ...defaultThemeConfig,
        ...(prev.bookTableAppearance || {}),
        ...updates,
      },
    }));
  }

  // Generate preview URL with current section config
  const previewUrl = useMemo(() => {
    if (!restaurantSlug) return null;

    const previewConfig = {
      mode: activeSectionConfig.mode,
      primaryColor: activeSectionConfig.primaryColor,
      accentColor: activeSectionConfig.accentColor,
      fontHeading: activeSectionConfig.fontHeading,
      fontBody: activeSectionConfig.fontBody,
      showLogo: activeSectionConfig.showLogo,
      headerImageUrl: activeSectionConfig.headerImageUrl,
      logoUrl: logoUrl, // Include current logo URL in preview config
      heroBanner: activeSectionConfig.heroBanner,
      typography: activeSectionConfig.typography,
    };

    try {
      // Ensure typography is always included and properly structured
      if (!previewConfig.typography) {
        previewConfig.typography = {
          ...defaultTypographyConfig,
          headingFont: activeSectionConfig.fontHeading || defaultTypographyConfig.headingFont,
          bodyFont: activeSectionConfig.fontBody || defaultTypographyConfig.bodyFont,
        };
      }
      
      const encoded = encodeURIComponent(btoa(JSON.stringify(previewConfig)));
      // Add cache-busting timestamp and language for preview sync
      const timestamp = Date.now();
      if (appearanceTarget === "menu") {
        if (!menuId) return null;
        return `/preview/${restaurantSlug}/${menuId}?config=${encoded}&iframe=true&lang=${language}&t=${timestamp}`;
      }
      return `/r/${restaurantSlug}/book-table?config=${encoded}&previewTheme=1&iframe=true&lang=${language}&t=${timestamp}`;
    } catch (error) {
      console.error("Error generating preview URL:", error);
      return null;
    }
  }, [
    restaurantSlug, 
    menuId, 
    appearanceTarget,
    activeSectionConfig.mode,
    activeSectionConfig.primaryColor,
    activeSectionConfig.accentColor,
    activeSectionConfig.fontHeading,
    activeSectionConfig.fontBody,
    activeSectionConfig.showLogo,
    activeSectionConfig.headerImageUrl,
    activeSectionConfig.heroBanner,
    activeSectionConfig.typography?.headingFont,
    activeSectionConfig.typography?.bodyFont,
    activeSectionConfig.typography?.accentFont,
    activeSectionConfig.typography?.headingWeight,
    activeSectionConfig.typography?.bodyWeight,
    activeSectionConfig.typography?.heroTitleSize,
    activeSectionConfig.typography?.sectionHeadingSize,
    activeSectionConfig.typography?.categoryTitleSize,
    activeSectionConfig.typography?.itemNameSize,
    activeSectionConfig.typography?.itemDescriptionSize,
    activeSectionConfig.typography?.priceSize,
    activeSectionConfig.typography?.lineHeight,
    activeSectionConfig.typography?.letterSpacing,
    activeSectionConfig.typography?.paragraphSpacing,
    activeSectionConfig.typography?.textPrimary,
    activeSectionConfig.typography?.textSecondary,
    activeSectionConfig.typography?.textMuted,
    activeSectionConfig.typography?.readableMode,
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
        bookTableAppearance: {
          ...defaultThemeConfig,
          ...(config.bookTableAppearance || {}),
          heroBanner: {
            ...defaultHeroBannerConfig,
            ...((config.bookTableAppearance || {}).heroBanner || {}),
          },
          typography: {
            ...defaultTypographyConfig,
            ...((config.bookTableAppearance || {}).typography || {}),
          },
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

      toast.success(appearanceT.saved);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(appearanceT.error);
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
      toast.error(appearanceT.logoUploadError);
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
      toast.error(appearanceT.logoUrlError);
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

    toast.success(appearanceT.logoUploaded);
  }

  async function handleLogoRemove() {
    if (!logoUrl) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("restaurants")
      .update({ logo_url: null })
      .eq("id", restaurantId);

    if (error) {
      toast.error(appearanceT.logoRemoveError);
      return;
    }

    setLogoUrl(null);

    // Bust cache
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug }),
    }).catch(() => {});

    toast.success(appearanceT.logoRemoved);
  }

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `hero-banners/${restaurantId}-${appearanceTarget}.${ext}`;

    const { error } = await supabase.storage.from("public").upload(path, file, {
      upsert: true,
    });

    if (error) {
      toast.error(appearanceT.heroUploadError);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("public").getPublicUrl(path);

    const imageUrl = `${publicUrl}?t=${Date.now()}`;
    updateActiveSectionConfig({
      headerImageUrl: imageUrl,
      heroBanner: {
        ...(activeSectionConfig.heroBanner || defaultHeroBannerConfig),
        backgroundImage: imageUrl,
      },
    });

    toast.success(appearanceT.heroUploaded);
  }

  function handleHeroImageRemove() {
    updateActiveSectionConfig({
      headerImageUrl: null,
      heroBanner: {
        ...(activeSectionConfig.heroBanner || defaultHeroBannerConfig),
        backgroundImage: null,
      },
    });
    toast.success(appearanceT.heroRemoved);
  }

  function updateTypography(updates: Partial<TypographyConfig>) {
    // Ensure typography always exists with proper defaults
    const currentTypography = activeSectionConfig.typography || {
      ...defaultTypographyConfig,
      headingFont: activeSectionConfig.fontHeading || defaultTypographyConfig.headingFont,
      bodyFont: activeSectionConfig.fontBody || defaultTypographyConfig.bodyFont,
    };
    
    // Create a new typography object to ensure React detects the change
    const newTypography = { 
      ...currentTypography, 
      ...updates,
    };
    
    // Also update legacy font fields if headingFont or bodyFont changed
    const sectionUpdates: Partial<AppearanceSectionConfig> = {
      typography: newTypography,
    };
    
    if (updates.headingFont !== undefined) {
      sectionUpdates.fontHeading = updates.headingFont;
    }
    if (updates.bodyFont !== undefined) {
      sectionUpdates.fontBody = updates.bodyFont;
    }
    
    updateActiveSectionConfig(sectionUpdates);
  }

  function applyTypographyPreset(preset: keyof typeof typographyPresets) {
    const presetConfig = typographyPresets[preset];
    updateActiveSectionConfig({
      typography: { ...defaultTypographyConfig, ...presetConfig, preset },
      fontHeading: presetConfig.headingFont,
      fontBody: presetConfig.bodyFont,
    });
    toast.success(appearanceT.typographyApplied.replace("{preset}", appearanceT[preset]));
  }

  function resetTypography() {
    updateActiveSectionConfig({
      typography: defaultTypographyConfig,
      fontHeading: defaultTypographyConfig.headingFont,
      fontBody: defaultTypographyConfig.bodyFont,
    });
    toast.success(appearanceT.typographyReset);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div
      key={language}
      lang={language}
      translate="no"
      className="space-y-6 overflow-x-hidden px-3 sm:space-y-8 sm:px-4 lg:px-6"
    >
      <FadeIn>
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PageTitle description={appearanceT.description}>
            {appearanceT.title}
          </PageTitle>
          <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-end lg:w-auto">
            <div className="grid w-full grid-cols-2 items-center gap-1 rounded-xl border border-border/60 bg-muted/20 p-1 sm:w-auto sm:min-w-[220px] sm:grid-cols-2">
              <Button
                type="button"
                variant={appearanceTarget === "menu" ? "default" : "ghost"}
                className="rounded-lg px-3 text-xs sm:text-sm"
                onClick={() => setAppearanceTarget("menu")}
              >
                {sectionMenuLabel}
              </Button>
              <Button
                type="button"
                variant={appearanceTarget === "bookTable" ? "default" : "ghost"}
                className="rounded-lg px-3 text-xs sm:text-sm"
                onClick={() => setAppearanceTarget("bookTable")}
              >
                {sectionBookTableLabel}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full justify-center gap-2 bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90 sm:w-auto md:min-w-[140px]"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {appearanceT.save}
            </Button>
          </div>
        </div>
      </FadeIn>

      <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:items-start xl:gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          {/* Theme mode */}
          <FadeIn delay={0.1}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{appearanceT.theme}</CardTitle>
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
                    onClick={() => updateActiveSectionConfig({ mode: value })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      activeSectionConfig.mode === value
                        ? "border-gold bg-gold/5"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <Icon size={20} className={activeSectionConfig.mode === value ? "text-gold" : "text-muted-foreground dark:text-muted-foreground"} />
                    <span className="text-xs font-medium text-foreground dark:text-foreground">{appearanceT[labelKey]}</span>
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
              <CardTitle className="text-lg">{appearanceT.colors}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => updateActiveSectionConfig({
                      primaryColor: preset.primary,
                      accentColor: preset.accent,
                    })}
                    className={`flex items-center gap-2 rounded-lg border p-2 sm:p-2.5 transition-all ${
                      activeSectionConfig.primaryColor === preset.primary
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
                    <span className="text-xs text-foreground dark:text-foreground">{getColorPresetLabel(preset.key)}</span>
                  </button>
                ))}
              </div>

              {/* Custom colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{appearanceT.primary}</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={activeSectionConfig.primaryColor}
                      onChange={(e) => updateActiveSectionConfig({ primaryColor: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded border"
                    />
                    <Input
                      value={activeSectionConfig.primaryColor}
                      onChange={(e) => updateActiveSectionConfig({ primaryColor: e.target.value })}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{appearanceT.accent}</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={activeSectionConfig.accentColor}
                      onChange={(e) => updateActiveSectionConfig({ accentColor: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded border"
                    />
                    <Input
                      value={activeSectionConfig.accentColor}
                      onChange={(e) => updateActiveSectionConfig({ accentColor: e.target.value })}
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
              <CardTitle className="text-lg">{appearanceT.logo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Switch
                  checked={activeSectionConfig.showLogo}
                  onCheckedChange={(checked) => updateActiveSectionConfig({ showLogo: checked })}
                />
                <Label className="text-sm">
                  {appearanceTarget === "menu"
                    ? appearanceT.showLogoOnMenu
                    : appearanceT.showLogoOnBookTable}
                </Label>
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
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <label className="w-full sm:flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                        <span>
                          <Upload size={14} />
                          {appearanceT.replaceLogo}
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogoRemove}
                      className="w-full gap-2 text-destructive hover:text-destructive sm:w-auto"
                    >
                      <X size={14} />
                      {appearanceT.remove}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-8">
                  <Upload size={24} className="mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">{appearanceT.uploadLogo}</p>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>{appearanceT.chooseFile}</span>
                    </Button>
                  </label>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {appearanceT.logoSizeHint}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Hero Banner (Book a Table only) */}
        {appearanceTarget === "bookTable" && (
        <FadeIn delay={0.28}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">
                {appearanceT.bookTableHeroBannerTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(activeSectionConfig.headerImageUrl || activeSectionConfig.heroBanner?.backgroundImage) ? (
                <div className="relative rounded-xl border-2 border-border/50 p-4">
                  <div className="relative mx-auto aspect-video max-w-full overflow-hidden rounded-lg bg-muted/30">
                    <Image
                      src={(activeSectionConfig.headerImageUrl || activeSectionConfig.heroBanner?.backgroundImage) as string}
                      alt="Hero banner"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 600px"
                      unoptimized
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <label className="w-full sm:flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                        <span>
                          <Upload size={14} />
                          {appearanceT.replaceImage}
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleHeroImageRemove}
                      className="w-full gap-2 text-destructive hover:text-destructive sm:w-auto"
                    >
                      <X size={14} />
                      {appearanceT.remove}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-8">
                  <Upload size={24} className="mb-2 text-muted-foreground" />
                  <p className="mb-3 text-sm text-muted-foreground">
                    {appearanceT.uploadBookingHeroImage}
                  </p>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>{appearanceT.chooseFile}</span>
                    </Button>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        )}

        {/* Typography */}
        <FadeIn delay={0.3}>
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <CardTitle className="text-lg">{appearanceT.advancedTypography}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetTypography}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCw size={14} className="mr-1" />
                    {appearanceT.reset}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Typography Presets */}
              <div className="space-y-2">
                <Label className="text-xs">{appearanceT.presetStyles}</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {(["modern", "elegant", "minimal", "classic", "premium"] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyTypographyPreset(preset)}
                      className={`rounded-lg border-2 p-2 text-xs font-medium transition-all ${
                        activeSectionConfig.typography?.preset === preset
                          ? "border-gold bg-gold/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      {appearanceT[preset]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Families */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">{appearanceT.fontFamilies}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.headingFont}</Label>
                    <Select
                      value={activeSectionConfig.typography?.headingFont || activeSectionConfig.fontHeading || "playfair"}
                      onValueChange={(v) => {
                        updateTypography({ headingFont: v });
                        // Also update legacy fontHeading for backward compatibility
                        updateActiveSectionConfig({ fontHeading: v });
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
                    <p className="text-[10px] text-muted-foreground" style={{ fontFamily: activeSectionConfig.typography?.headingFont === "playfair" ? "Playfair Display" : fontOptions.find(f => f.value === activeSectionConfig.typography?.headingFont)?.label }}>
                      {appearanceT.typographySampleHeading}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.bodyFont}</Label>
                    <Select
                      value={activeSectionConfig.typography?.bodyFont || activeSectionConfig.fontBody || "inter"}
                      onValueChange={(v) => {
                        updateTypography({ bodyFont: v });
                        // Also update legacy fontBody for backward compatibility
                        updateActiveSectionConfig({ fontBody: v });
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
                    <p className="text-[10px] text-muted-foreground" style={{ fontFamily: activeSectionConfig.typography?.bodyFont === "inter" ? "Inter" : fontOptions.find(f => f.value === activeSectionConfig.typography?.bodyFont)?.label }}>
                      {appearanceT.typographySampleBody}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{appearanceT.accentFont}</Label>
                  <Select
                    value={activeSectionConfig.typography?.accentFont || "none"}
                    onValueChange={(v) => updateTypography({ accentFont: v === "none" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={appearanceT.sameAsBody} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{appearanceT.sameAsBody}</SelectItem>
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
                <Label className="text-xs">{appearanceT.fontWeights}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.headingWeight}</Label>
                    <Select
                      value={activeSectionConfig.typography?.headingWeight || "400"}
                      onValueChange={(v) => updateTypography({ headingWeight: v as TypographyConfig["headingWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">{appearanceT.light300}</SelectItem>
                        <SelectItem value="400">{appearanceT.regular400}</SelectItem>
                        <SelectItem value="500">{appearanceT.medium500}</SelectItem>
                        <SelectItem value="600">{appearanceT.semiBold600}</SelectItem>
                        <SelectItem value="700">{appearanceT.bold700}</SelectItem>
                        <SelectItem value="800">{appearanceT.extraBold800}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.bodyWeight}</Label>
                    <Select
                      value={activeSectionConfig.typography?.bodyWeight || "400"}
                      onValueChange={(v) => updateTypography({ bodyWeight: v as TypographyConfig["bodyWeight"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">{appearanceT.light300}</SelectItem>
                        <SelectItem value="400">{appearanceT.regular400}</SelectItem>
                        <SelectItem value="500">{appearanceT.medium500}</SelectItem>
                        <SelectItem value="600">{appearanceT.semiBold600}</SelectItem>
                        <SelectItem value="700">{appearanceT.bold700}</SelectItem>
                        <SelectItem value="800">{appearanceT.extraBold800}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Font Sizes */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">{appearanceT.fontSizes}</Label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                      <Label className="text-xs">{appearanceT.heroTitle}: {activeSectionConfig.typography?.heroTitleSize || 4.5}rem</Label>
                      <Select
                        value={(() => {
                          const heroSize = activeSectionConfig.typography?.heroTitleSize || 4.5;
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
                          <SelectItem value="compact">{appearanceT.compact}</SelectItem>
                          <SelectItem value="balanced">{appearanceT.balanced}</SelectItem>
                          <SelectItem value="spacious">{appearanceT.spacious}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      step="0.25"
                      value={activeSectionConfig.typography?.heroTitleSize || 4.5}
                      onChange={(e) => updateTypography({ heroTitleSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.sectionHeading}: {activeSectionConfig.typography?.sectionHeadingSize || 2.5}rem</Label>
                    <input
                      type="range"
                      min="1.5"
                      max="4"
                      step="0.25"
                      value={activeSectionConfig.typography?.sectionHeadingSize || 2.5}
                      onChange={(e) => updateTypography({ sectionHeadingSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.categoryTitle}: {activeSectionConfig.typography?.categoryTitleSize || 1.5}rem</Label>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.125"
                      value={activeSectionConfig.typography?.categoryTitleSize || 1.5}
                      onChange={(e) => updateTypography({ categoryTitleSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.itemName}: {activeSectionConfig.typography?.itemNameSize || 1.1}rem</Label>
                    <input
                      type="range"
                      min="0.875"
                      max="1.5"
                      step="0.125"
                      value={activeSectionConfig.typography?.itemNameSize || 1.1}
                      onChange={(e) => updateTypography({ itemNameSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.itemDescription}: {activeSectionConfig.typography?.itemDescriptionSize || 0.875}rem</Label>
                    <input
                      type="range"
                      min="0.75"
                      max="1.125"
                      step="0.0625"
                      value={activeSectionConfig.typography?.itemDescriptionSize || 0.875}
                      onChange={(e) => updateTypography({ itemDescriptionSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.price}: {activeSectionConfig.typography?.priceSize || 1.125}rem</Label>
                    <input
                      type="range"
                      min="0.875"
                      max="1.5"
                      step="0.125"
                      value={activeSectionConfig.typography?.priceSize || 1.125}
                      onChange={(e) => updateTypography({ priceSize: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Line Height & Spacing */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">{appearanceT.lineHeightSpacing}</Label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.lineHeight}: {activeSectionConfig.typography?.lineHeight || 1.6}x</Label>
                    <input
                      type="range"
                      min="1.2"
                      max="2.2"
                      step="0.1"
                      value={activeSectionConfig.typography?.lineHeight || 1.6}
                      onChange={(e) => updateTypography({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.letterSpacing}: {activeSectionConfig.typography?.letterSpacing || 0}em</Label>
                    <input
                      type="range"
                      min="-0.02"
                      max="0.05"
                      step="0.005"
                      value={activeSectionConfig.typography?.letterSpacing || 0}
                      onChange={(e) => updateTypography({ letterSpacing: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <Label className="text-xs">{appearanceT.paragraphSpacing}</Label>
                    <Switch
                      checked={activeSectionConfig.typography?.paragraphSpacing !== false}
                      onCheckedChange={(checked) => updateTypography({ paragraphSpacing: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Text Colors */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs">{appearanceT.textColors} ({appearanceT.textColorsHint})</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.primary}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeSectionConfig.typography?.textPrimary || "#000000"}
                        onChange={(e) => updateTypography({ textPrimary: e.target.value })}
                        className="h-9 w-9 cursor-pointer rounded border"
                      />
                      <Input
                        value={activeSectionConfig.typography?.textPrimary || ""}
                        onChange={(e) => updateTypography({ textPrimary: e.target.value || null })}
                        placeholder={appearanceT.autoValue}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.secondary}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeSectionConfig.typography?.textSecondary || "#000000"}
                        onChange={(e) => updateTypography({ textSecondary: e.target.value })}
                        className="h-9 w-9 cursor-pointer rounded border"
                      />
                      <Input
                        value={activeSectionConfig.typography?.textSecondary || ""}
                        onChange={(e) => updateTypography({ textSecondary: e.target.value || null })}
                        placeholder={appearanceT.autoValue}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{appearanceT.muted}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeSectionConfig.typography?.textMuted || "#000000"}
                        onChange={(e) => updateTypography({ textMuted: e.target.value })}
                        className="h-9 w-9 cursor-pointer rounded border"
                      />
                      <Input
                        value={activeSectionConfig.typography?.textMuted || ""}
                        onChange={(e) => updateTypography({ textMuted: e.target.value || null })}
                        placeholder={appearanceT.autoValue}
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
                    <Label className="text-xs">{appearanceT.readableMode}</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {appearanceT.readableModeDesc}
                    </p>
                  </div>
                  <Switch
                    checked={activeSectionConfig.typography?.readableMode || false}
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
          <Card className="h-fit w-full max-w-full overflow-hidden border-border/50 xl:sticky xl:top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye size={18} />
                  {appearanceT.livePreview}
                </CardTitle>
                {appearanceTarget === "menu" && !menuId && (
                  <p className="text-xs text-muted-foreground">
                    {appearanceT.createMenuToPreview}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-hidden p-3 sm:p-4 lg:p-6">
              {previewUrl ? (
                <div className="flex w-full justify-center">
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
                            const iframe = document.querySelector(
                              `iframe[title="${appearanceTarget === "menu" ? appearanceT.previewFrameMenuTitle : appearanceT.previewFrameBookTableTitle}"]`
                            ) as HTMLIFrameElement;
                            if (iframe) {
                              iframe.src = iframe.src;
                            }
                          }}
                        >
                          {appearanceT.retry}
                        </Button>
                      </div>
                    )}
                    {/* Simple responsive preview container */}
                    <div className="relative px-1 py-2 sm:px-2 sm:py-4">
                      <div className="relative mx-auto aspect-[9/19] w-full max-w-[min(100%,430px)] overflow-hidden rounded-[24px] bg-background shadow-lg sm:rounded-[32px]">
                        <iframe
                          key={`${previewUrl}-${language}-${activeSectionConfig.typography?.headingFont}-${activeSectionConfig.typography?.bodyFont}-${activeSectionConfig.typography?.headingWeight}-${activeSectionConfig.typography?.bodyWeight}`}
                          src={previewUrl}
                          className="block w-full h-full border-0 rounded-[32px]"
                          title={appearanceTarget === "menu" ? appearanceT.previewFrameMenuTitle : appearanceT.previewFrameBookTableTitle}
                          style={{
                            backgroundColor: "transparent",
                          }}
                          onLoad={() => {
                            setPreviewLoading(false);
                            setPreviewError(null);
                          }}
                          onError={() => {
                            setPreviewLoading(false);
                            setPreviewError(appearanceT.previewLoadError);
                          }}
                        />
                        <div className="absolute top-3 right-4 rounded-md bg-yellow-500/20 px-2 py-1 z-20">
                          <p className="text-[10px] font-medium text-yellow-700 dark:text-yellow-300">
                            {appearanceT.livePreview}
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
                    {appearanceT.noPreviewAvailable}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appearanceTarget === "menu" && !menuId
                      ? appearanceT.createMenuFirst
                      : appearanceT.unableToLoadPreview}
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
