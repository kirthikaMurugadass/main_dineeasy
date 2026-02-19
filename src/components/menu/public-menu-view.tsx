"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import type { PublicMenu, PublicRestaurantData, Language } from "@/types/database";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/dictionaries";

type ViewData = PublicMenu | (PublicRestaurantData & { menu?: { id: string; slug: string } });

interface Props {
  data: ViewData;
}

export function PublicMenuView({ data }: Props) {
  // Always start with "de" so server and client render identical HTML.
  // After hydration, sync from localStorage / browser language.
  const [lang, setLang] = useState<Language>("de");
  const [activeCategory, setActiveCategory] = useState(data.categories[0]?.id ?? "");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);

  // Restore preferred language AFTER hydration to avoid mismatch
  useEffect(() => {
    const stored = localStorage.getItem("dineeasy-menu-lang") as Language | null;
    if (stored && data.availableLanguages.includes(stored)) {
      setLang(stored);
      return;
    }
    const browserLang = navigator.language.substring(0, 2) as Language;
    if (data.availableLanguages.includes(browserLang)) {
      setLang(browserLang);
    }
  }, [data.availableLanguages]);

  useEffect(() => {
    localStorage.setItem("dineeasy-menu-lang", lang);
  }, [lang]);

  const scrollToCategory = useCallback((categoryId: string) => {
    const el = categoryRefs.current.get(categoryId);
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActiveCategory(categoryId);
  }, []);

  // Track scroll position to highlight active category
  useEffect(() => {
    function onScroll() {
      const offset = 160;
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

  const theme = data.restaurant.theme_config;

  return (
    <div className="min-h-screen bg-background">
      {/* Header image */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        {theme.headerImageUrl ? (
          <Image
            src={theme.headerImageUrl}
            alt={data.restaurant.name}
            fill
            className="object-cover animate-kenburns"
            priority
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center animate-kenburns"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&q=80")',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Restaurant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            {data.restaurant.logo_url ? (
              <Image
                src={data.restaurant.logo_url}
                alt="Logo"
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl border-2 border-background object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-espresso text-warm font-serif font-bold text-2xl border-2 border-background shadow-lg">
                {data.restaurant.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-serif text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">
                {data.restaurant.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Language button */}
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-black/40"
        >
          <Globe size={14} />
          {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.flag}{" "}
          {lang.toUpperCase()}
        </button>

        {/* Language picker dropdown */}
        <AnimatePresence>
          {showLangPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-4 top-14 z-50 overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-lg"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setShowLangPicker(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    lang === l.code
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky category navigation */}
      <div
        ref={navRef}
        className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-lg"
      >
        <div className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-espresso text-warm shadow-sm dark:bg-gold dark:text-espresso"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.title[lang] || cat.title.de || "Untitled"}
            </button>
          ))}
        </div>
      </div>

      {/* Menu content */}
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        {data.categories.map((category, catIndex) => (
          <motion.div
            key={category.id}
            ref={(el) => {
              if (el) categoryRefs.current.set(category.id, el);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1, duration: 0.5 }}
            className="mb-10"
          >
            {/* Category header */}
            <div className="mb-4">
              <h2 className="font-serif text-2xl font-bold">
                {category.title[lang] || category.title.de || "Untitled"}
              </h2>
              {category.description[lang] && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description[lang]}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.1 + itemIndex * 0.04, duration: 0.4 }}
                  className="group flex items-start gap-4 rounded-xl border border-border/30 p-4 transition-all hover:border-border/60 hover:bg-muted/20"
                >
                  {/* Image */}
                  {item.image_url && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.image_url}
                        alt={item.title[lang] || ""}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="64px"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-tight">
                      {item.title[lang] || item.title.de || "Untitled"}
                    </h3>
                    {item.description[lang] && (
                      <p className="mt-1 text-sm leading-snug text-muted-foreground line-clamp-2">
                        {item.description[lang]}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="shrink-0 pt-0.5">
                    <span className="font-mono text-sm font-semibold text-gold">
                      CHF {item.price_chf.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            {catIndex < data.categories.length - 1 && (
              <div className="mt-8 border-b border-border/30" />
            )}
          </motion.div>
        ))}

        {/* Powered by */}
        <div className="mt-16 text-center">
          <a
            href="https://dineeasy.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="font-serif font-bold text-gold">D</span>
            Powered by DineEasy
          </a>
        </div>
      </div>
    </div>
  );
}
