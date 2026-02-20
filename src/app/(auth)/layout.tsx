"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/dictionaries";
import type { Language } from "@/types/database";

function AuthNavbar() {
  const { language, setLanguage } = useI18n();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/95 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3E2723] text-[#C6A75E] font-serif font-bold text-lg shadow-sm dark:bg-[#5D4037] dark:text-[#D4AF37]">
            D
          </div>
          <span className="text-base font-medium tracking-tight text-foreground">
            DineEasy
          </span>
        </Link>

        {/* Language Toggle */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="appearance-none rounded-lg border border-border/30 bg-background/80 px-3 py-1.5 pl-8 pr-8 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-border/50 hover:bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-background text-foreground">
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
          <Globe
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>
    </motion.header>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <div className="relative min-h-screen bg-background">
          {/* Theme-aware background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-background/95 dark:from-background dark:via-background/95 dark:to-background/90" />
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.02] dark:opacity-[0.03]"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80")',
              }}
            />
          </div>

          {/* Minimal Navbar */}
          <AuthNavbar />

          {/* Full Screen Content */}
          <div className="pt-20">
            {children}
          </div>
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}
