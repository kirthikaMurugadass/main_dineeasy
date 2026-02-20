"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/dictionaries";
import type { Language } from "@/types/database";

export function AuthNavbar() {
  const { language, setLanguage } = useI18n();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-xl dark:bg-background/90"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3E2723] text-[#C6A75E] font-serif font-bold text-lg shadow-sm dark:bg-[#5D4037] dark:text-[#D4AF37]">
            D
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-foreground">
            Dine<span className="text-[#C6A75E] dark:text-[#D4AF37]">Easy</span>
          </span>
        </Link>

        {/* Language switcher */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="appearance-none rounded-lg border border-border/30 bg-background/50 px-3 py-1.5 pl-8 pr-8 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-border/50 focus:border-[#C6A75E] focus:outline-none focus:ring-2 focus:ring-[#C6A75E]/20 dark:bg-background/70 dark:hover:border-border/60 dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37]/20"
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