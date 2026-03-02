"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import type { PublicMenu, PublicRestaurantData, Language, ThemeConfig } from "@/types/database";
import { defaultThemeConfig } from "@/types/database";
import { GoogleFontsLoader } from "./google-fonts-loader";
import { useI18n } from "@/lib/i18n/context";
import { useCartStore } from "@/lib/stores/cart-store";

type ViewData = PublicMenu | (PublicRestaurantData & { menu?: { id: string; slug: string } });

interface Props {
  data: ViewData;
  restaurantId?: string;
  menuId?: string;
  /** When provided (e.g. from preview iframe), use this language and sync with I18n context */
  initialLang?: Language;
}

/* ─── Helpers ─── */

function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

function resolveFontFamily(key: string, type: "heading" | "body" | "accent"): string {
  const map: Record<string, string> = {
    playfair: "'Playfair Display', Georgia, serif",
    poppins: "'Poppins', system-ui, sans-serif",
    inter: "'Inter', system-ui, sans-serif",
    dmsans: "'DM Sans', system-ui, sans-serif",
    montserrat: "'Montserrat', system-ui, sans-serif",
    lora: "'Lora', Georgia, serif",
    merriweather: "'Merriweather', Georgia, serif",
    roboto: "'Roboto', system-ui, sans-serif",
    opensans: "'Open Sans', system-ui, sans-serif",
    nunito: "'Nunito', system-ui, sans-serif",
    plusjakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
    georgia: "Georgia, 'Times New Roman', serif",
  };
  return (
    map[key] ??
    (type === "heading"
      ? "'Playfair Display', Georgia, serif"
      : type === "accent"
      ? "'Inter', system-ui, sans-serif"
      : "'Inter', system-ui, sans-serif")
  );
}

/** Get best available title from translations; prefers current lang, then de, en, fr, it */
function getDisplayTitle(
  titleRecord: Record<Language, string> | undefined,
  lang: Language
): string {
  if (!titleRecord) return "";
  const order: Language[] = [lang, "de", "en", "fr", "it"];
  for (const l of order) {
    const v = titleRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return "";
}

function getDisplayDescription(
  descriptionRecord: Record<Language, string | null> | undefined,
  lang: Language
): string {
  if (!descriptionRecord) return "";
  const order: Language[] = [lang, "de", "en", "fr", "it"];
  for (const l of order) {
    const v = descriptionRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return "";
}

/* ─── Decorative Ornamental Divider ─── */
function OrnamentalDivider({ accentColor, isDark }: { accentColor: string; isDark: boolean }) {
  const goldColor = accentColor; // Use the accent color from theme
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <div
        className="h-px flex-1 max-w-16"
        style={{ background: `linear-gradient(to right, transparent, ${goldColor}60)` }}
      />
      <span className="text-[10px] opacity-70" style={{ color: goldColor }}>
        ◆
      </span>
      <div className="h-px w-1 bg-current opacity-40" style={{ color: goldColor }} />
      <span className="text-[8px] opacity-50" style={{ color: goldColor }}>
        ●
      </span>
      <div className="h-px w-1 bg-current opacity-40" style={{ color: goldColor }} />
      <span className="text-[10px] opacity-70" style={{ color: goldColor }}>
        ◆
      </span>
      <div
        className="h-px flex-1 max-w-16"
        style={{ background: `linear-gradient(to left, transparent, ${goldColor}60)` }}
      />
    </div>
  );
}

export function PublicMenuView({ data, restaurantId, menuId, initialLang }: Props) {
  const { t, setLanguage } = useI18n();
  const [lang, setLang] = useState<Language>(initialLang ?? "de");
  const [activeCategory, setActiveCategory] = useState(data.categories[0]?.id ?? "");
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Cart store
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
    setRestaurant,
    getItemCount,
  } = useCartStore();

  // Set restaurant info in cart store when component mounts
  useEffect(() => {
    if (restaurantId && menuId && data.restaurant.slug) {
      setRestaurant(restaurantId, data.restaurant.slug, menuId);
    }
  }, [restaurantId, menuId, data.restaurant.slug, setRestaurant]);

  // When initialLang is provided (preview mode), sync with I18n context so UI strings translate
  useEffect(() => {
    if (initialLang) {
      setLang(initialLang);
      setLanguage(initialLang);
    }
  }, [initialLang, setLanguage]);

  // Sync lang when initialLang changes (e.g. iframe reloaded with new lang param)
  useEffect(() => {
    if (initialLang && lang !== initialLang) {
      setLang(initialLang);
    }
  }, [initialLang, lang]);

  const theme: ThemeConfig = useMemo(
    () => ({ ...defaultThemeConfig, ...data.restaurant.theme_config }),
    [data.restaurant.theme_config]
  );

  // Get typography config or use defaults
  // If typography exists, use it; otherwise create from legacy font fields or defaults
  const typography = theme.typography || {
    headingFont: theme.fontHeading || "playfair",
    bodyFont: theme.fontBody || "inter",
    accentFont: undefined,
    headingWeight: "400",
    bodyWeight: "400",
    heroTitleSize: 4.5,
    sectionHeadingSize: 2.5,
    categoryTitleSize: 1.5,
    itemNameSize: 1.1,
    itemDescriptionSize: 0.875,
    priceSize: 1.125,
    lineHeight: 1.6,
    letterSpacing: 0,
    paragraphSpacing: true,
    textPrimary: null,
    textSecondary: null,
    textMuted: null,
    readableMode: false,
    preset: null,
  };

  const primaryColor = theme.primaryColor;
  const accentColor = theme.accentColor;
  const primaryText = contrastText(primaryColor);
  const headingFont = resolveFontFamily(typography.headingFont, "heading");
  const bodyFont = resolveFontFamily(typography.bodyFont, "body");
  const accentFont = typography.accentFont ? resolveFontFamily(typography.accentFont, "accent") : bodyFont;

  // Set CSS variables for fonts to ensure they're applied dynamically
  useEffect(() => {
    // Set on document root for global access
    const root = document.documentElement;
    root.style.setProperty("--font-heading", headingFont);
    root.style.setProperty("--font-body", bodyFont);
    root.style.setProperty("--font-accent", accentFont);
    
    // Also set on the component's root div (backup)
    const componentRoot = document.querySelector('[data-menu-root]') as HTMLElement;
    if (componentRoot) {
      componentRoot.style.setProperty("--font-heading", headingFont);
      componentRoot.style.setProperty("--font-body", bodyFont);
      componentRoot.style.setProperty("--font-accent", accentFont);
    }
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log("Typography applied:", {
        headingFont: typography.headingFont,
        bodyFont: typography.bodyFont,
        accentFont: typography.accentFont,
        resolvedHeading: headingFont,
        resolvedBody: bodyFont,
        resolvedAccent: accentFont,
        cssVars: {
          "--font-heading": headingFont,
          "--font-body": bodyFont,
          "--font-accent": accentFont,
        },
      });
    }
  }, [headingFont, bodyFont, accentFont, typography.headingFont, typography.bodyFont, typography.accentFont]);

  const [isDark, setIsDark] = useState(theme.mode === "dark");

  useEffect(() => {
    if (theme.mode === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    setIsDark(theme.mode === "dark");
  }, [theme.mode]);

  // Only read from localStorage when NOT in preview mode (no initialLang)
  useEffect(() => {
    if (initialLang) return; // Preview mode: lang is controlled by URL
    const stored = localStorage.getItem("dineeasy-menu-lang") as Language | null;
    if (stored && data.availableLanguages.includes(stored)) {
      setLang(stored);
      return;
    }
    const browserLang = navigator.language.substring(0, 2) as Language;
    if (data.availableLanguages.includes(browserLang)) setLang(browserLang);
  }, [data.availableLanguages, initialLang]);

  // Persist lang to localStorage only when NOT in preview mode
  useEffect(() => {
    if (initialLang) return;
    localStorage.setItem("dineeasy-menu-lang", lang);
  }, [lang, initialLang]);

  const scrollToCategory = useCallback((categoryId: string) => {
    const el = categoryRefs.current.get(categoryId);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActiveCategory(categoryId);
  }, []);

  useEffect(() => {
    function onScroll() {
      const offset = 140;
      for (const [id, el] of categoryRefs.current) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom > offset) {
          setActiveCategory(id);
          break;
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fine-dining color palette (fixed backgrounds)
  const darkBg = "#1a1714"; // Warm dark charcoal (fixed)
  const lightBg = "#f5f0eb"; // Warm cream (fixed)
  const goldAccent = accentColor || "#c9a96e"; // Use accent color from theme (only accent changes)
  const mutedGray = "#a8a29e"; // Warm gray (fixed)
  const sectionBg = "#201d19"; // Slightly lighter charcoal (fixed)

  const bgColor = isDark ? darkBg : lightBg;
  // Use typography colors if set, otherwise use theme defaults
  const textPrimary = typography.textPrimary || (isDark ? "#f5f0eb" : "#1a1714");
  const textSecondary = typography.textSecondary || (isDark ? "#f5f0eb" : "#1a1714");
  const textMuted = typography.textMuted || (isDark ? mutedGray : "#6b6b6b");
  const sectionBackground = isDark ? sectionBg : "#faf8f5";

  // Get hero banner config or use defaults
  const heroBanner = theme.heroBanner || {
    backgroundType: "image" as const,
    backgroundImage: theme.headerImageUrl,
    gradientStart: "#1a1714",
    gradientEnd: "#3a2f28",
    gradientDirection: "to-b" as const,
    solidColor: "#1a1714",
    overlayColor: "#000000",
    overlayOpacity: 65,
    title: "Our Menu",
    subtitle: "DELICIOUS & AMAZING",
    textAlign: "center" as const,
    fontSize: 4.5,
    fontWeight: "300" as const,
    showCta: false,
    ctaText: "Order Now",
    ctaLink: "",
    ctaStyle: "solid" as const,
  };

  // Get background style based on type
  const getBackgroundStyle = () => {
    if (heroBanner.backgroundType === "image" && heroBanner.backgroundImage) {
      return {
        backgroundImage: `url(${heroBanner.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    } else if (heroBanner.backgroundType === "gradient") {
      const directionMap = {
        "to-r": "to right",
        "to-b": "to bottom",
        "to-br": "to bottom right",
        "to-bl": "to bottom left",
      };
      return {
        background: `linear-gradient(${directionMap[heroBanner.gradientDirection]}, ${heroBanner.gradientStart}, ${heroBanner.gradientEnd})`,
      };
    } else {
      return {
        backgroundColor: heroBanner.solidColor,
      };
    }
  };

  // Get overlay style
  const overlayStyle = {
    backgroundColor: heroBanner.overlayColor,
    opacity: heroBanner.overlayOpacity / 100,
  };

  // Get text alignment class
  const textAlignClass = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  }[heroBanner.textAlign];

  return (
    <>
      <GoogleFontsLoader 
        key={`fonts-${typography.headingFont}-${typography.bodyFont}-${typography.accentFont || 'none'}`}
        typography={typography} 
      />
      <div
        data-menu-root
        className="min-h-screen scroll-smooth"
        style={{
          backgroundColor: bgColor,
          color: textPrimary,
          fontFamily: bodyFont,
          lineHeight: typography.lineHeight,
          letterSpacing: `${typography.letterSpacing}em`,
          // CSS variables for dynamic font application
          "--font-heading": headingFont,
          "--font-body": bodyFont,
          "--font-accent": accentFont,
        } as React.CSSProperties & {
          "--font-heading": string;
          "--font-body": string;
          "--font-accent": string;
        }}
      >
      {/* ─── Hero Banner ─── */}
      <header className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col overflow-hidden">
        <div className="absolute inset-0" style={getBackgroundStyle()}>
          {heroBanner.backgroundType === "image" && heroBanner.backgroundImage && (
            <Image
              src={heroBanner.backgroundImage}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="100vw"
              unoptimized={
                heroBanner.backgroundImage.includes("127.0.0.1") || heroBanner.backgroundImage.includes("localhost")
              }
            />
          )}
          {/* Customizable overlay */}
          <div className="absolute inset-0" style={overlayStyle} />
        </div>

        {/* Top bar: Logo + Name (left), Cart (right) */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            {data.restaurant.logo_url && theme.showLogo ? (
              <Image
                src={data.restaurant.logo_url}
                alt=""
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: primaryColor,
                  color: primaryText,
                  fontFamily: headingFont,
                }}
              >
                {data.restaurant.name.charAt(0)}
              </div>
            )}
            <h1
              className="font-semibold text-white text-lg sm:text-xl"
              style={{
                fontFamily: headingFont,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              }}
            >
              {data.restaurant.name}
            </h1>
          </div>
          
          {/* Cart Button */}
          {restaurantId && menuId && (
            <Link
              href={`/public-menu/${data.restaurant.slug}/${menuId}/cart`}
              className="relative flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2.5 text-white transition-all hover:bg-white/20"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline text-sm font-medium">Cart</span>
              {getItemCount() > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor: accentColor,
                    color: "#1a1714",
                  }}
                >
                  {getItemCount()}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Center: Customizable hero content */}
        <div className={`relative z-10 flex flex-1 flex-col justify-center px-4 pb-12 ${textAlignClass}`}>
          {heroBanner.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 text-xs font-medium tracking-[0.3em] uppercase sm:text-sm"
              style={{ color: accentColor }}
            >
              {heroBanner.subtitle}
            </motion.p>
          )}

          {heroBanner.subtitle && <OrnamentalDivider accentColor={accentColor} isDark={isDark} />}

          {heroBanner.title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="py-4 font-light italic text-white"
              style={{
                fontFamily: headingFont,
                fontSize: `${typography.heroTitleSize}rem`,
                fontWeight: typography.headingWeight,
                letterSpacing: `${typography.letterSpacing}em`,
                lineHeight: typography.lineHeight,
                textShadow: "0 4px 24px rgba(0,0,0,0.8)",
              }}
            >
              {heroBanner.title}
            </motion.h2>
          )}

          {heroBanner.subtitle && <OrnamentalDivider accentColor={accentColor} isDark={isDark} />}

          {/* CTA Button */}
          {heroBanner.showCta && heroBanner.ctaText && heroBanner.ctaLink && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6"
            >
              <a
                href={heroBanner.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block rounded-full px-8 py-3 text-sm font-semibold transition-all ${
                  heroBanner.ctaStyle === "solid"
                    ? "bg-white text-gray-900 hover:bg-gray-100"
                    : "border-2 border-white text-white hover:bg-white/10"
                }`}
              >
                {heroBanner.ctaText}
              </a>
            </motion.div>
          )}
        </div>
      </header>

      {/* ─── Sticky Category Navigation ─── */}
      <nav
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          backgroundColor: isDark ? `${darkBg}E6` : `${lightBg}E6`,
        }}
      >
        <div className="mx-auto max-w-[1200px] flex gap-2 overflow-x-auto px-4 py-4 scrollbar-hide sm:justify-center sm:gap-3">
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className="shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
              style={
                activeCategory === cat.id
                  ? {
                      backgroundColor: accentColor,
                      color: "#1a1714",
                      boxShadow: `0 0 20px ${accentColor}59`,
                    }
                  : {
                      color: isDark ? "rgba(245,240,235,0.75)" : "rgba(26,26,26,0.6)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
                    }
              }
            >
              {getDisplayTitle(cat.title, lang) || t.menu.untitled}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Menu Content ─── */}
      <main className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8">
        {data.categories.map((category, catIndex) => (
          <motion.section
            key={category.id}
            ref={(el) => {
              if (el) categoryRefs.current.set(category.id, el);
            }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: catIndex * 0.05 }}
            className="scroll-mt-28 pb-20 sm:pb-24"
            style={{
              backgroundColor: sectionBackground,
              padding: "80px 24px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            {/* Section label (uppercase, gold, tracking-wide) */}
            <div className="mb-6 text-center">
              <p
                className="mb-4 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm"
                style={{ color: accentColor }}
              >
                {getDisplayTitle(category.title, lang)?.toUpperCase() || t.menu.menuSection.toUpperCase()}
              </p>

              <OrnamentalDivider accentColor={accentColor} isDark={isDark} />
            </div>

            {/* Menu items: 2-column grid, flexbox rows */}
            <div className="grid gap-8 sm:grid-cols-2">
              {category.items.map((item, itemIndex) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: itemIndex * 0.03 }}
                  className="flex items-start gap-4"
                >
                  {/* Circular food thumbnail (70-80px) */}
                  <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={getDisplayTitle(item.title, lang) || t.menu.untitled}
                        fill
                        unoptimized
                        className="rounded-full object-cover"
                        sizes="96px"
                        loading="lazy"
                        style={{
                          border: `2px solid ${isDark ? "rgba(201,169,110,0.2)" : "rgba(201,169,110,0.3)"}`,
                        }}
                      />
                    ) : (
                      <div
                        className="h-full w-full rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: isDark ? `${accentColor}1A` : `${accentColor}26`,
                          border: `2px solid ${isDark ? `${accentColor}33` : `${accentColor}4D`}`,
                        }}
                      >
                        <span className="text-2xl opacity-40" style={{ color: accentColor }}>
                          ◆
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Text content: name, description, price */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h4
                        className="font-semibold leading-tight flex-1"
                        style={{
                          fontFamily: bodyFont,
                          color: textPrimary,
                          fontSize: `${typography.itemNameSize}rem`,
                          fontWeight: typography.bodyWeight,
                          letterSpacing: `${typography.letterSpacing}em`,
                          lineHeight: typography.lineHeight,
                        }}
                      >
                        {getDisplayTitle(item.title, lang) || t.menu.untitled}
                      </h4>
                      <span
                        className="font-mono font-semibold tracking-wide shrink-0"
                        style={{
                          color: accentColor,
                          fontSize: `${typography.priceSize}rem`,
                          fontFamily: accentFont,
                          fontWeight: typography.bodyWeight,
                        }}
                      >
                        {t.menu.currency} {item.price_chf.toFixed(2)}
                      </span>
                    </div>
                    {getDisplayDescription(item.description, lang) && (
                      <p
                        className={typography.paragraphSpacing ? "mt-2" : "mt-1"}
                        style={{
                          color: textMuted,
                          fontSize: `${typography.itemDescriptionSize}rem`,
                          fontFamily: bodyFont,
                          fontWeight: typography.bodyWeight,
                          letterSpacing: `${typography.letterSpacing}em`,
                          lineHeight: typography.lineHeight,
                        }}
                      >
                        {getDisplayDescription(item.description, lang)}
                      </p>
                    )}
                    
                    {/* Cart Controls */}
                    {restaurantId && menuId && (
                      <div className="mt-4 flex items-center gap-3">
                        {(() => {
                          const cartItem = cartItems.find((ci) => ci.id === item.id);
                          const quantity = cartItem?.quantity ?? 0;
                          
                          return quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (quantity === 1) {
                                    removeItem(item.id);
                                  } else {
                                    updateQuantity(item.id, quantity - 1);
                                  }
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110"
                                style={{
                                  backgroundColor: accentColor,
                                  color: "#1a1714",
                                }}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={16} />
                              </button>
                              <span
                                className="min-w-[2rem] text-center text-sm font-semibold"
                                style={{ color: textPrimary }}
                              >
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110"
                                style={{
                                  backgroundColor: accentColor,
                                  color: "#1a1714",
                                }}
                                aria-label="Increase quantity"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                addItem({
                                  id: item.id,
                                  title: item.title,
                                  description: item.description,
                                  price: item.price_chf,
                                  image_url: item.image_url,
                                });
                              }}
                              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                              style={{
                                backgroundColor: accentColor,
                                color: "#1a1714",
                              }}
                            >
                              <Plus size={16} />
                              <span>Add</span>
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>
        ))}

        {/* ─── Footer ─── */}
        <footer className="mt-24 border-t pt-12 text-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          <a
            href="https://dineeasy.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs transition-colors hover:opacity-80"
            style={{ color: textMuted }}
          >
            <span
              className="font-bold"
              style={{ color: accentColor, fontFamily: headingFont }}
            >
              D
            </span>
            {t.menu.poweredBy}
          </a>
        </footer>
      </main>
    </div>
    </>
  );
}
