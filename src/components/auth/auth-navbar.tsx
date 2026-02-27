"use client";

import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/dictionaries";
import { AppLogo } from "@/components/ui/app-logo";
import type { Language } from "@/types/database";

export function AuthNavbar() {
  const { t, language, setLanguage } = useI18n();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl dark:bg-background/90"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <AppLogo href="/" size="sm" />

        {/* Language switcher */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            title={t.landing.nav.selectLanguage}
            aria-label={t.landing.nav.selectLanguage}
            className="appearance-none rounded-lg border border-border bg-background/80 px-3 py-1.5 pl-8 pr-8 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 dark:bg-background/90"
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