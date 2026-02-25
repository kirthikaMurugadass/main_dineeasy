"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Language } from "@/types/database";

function AuthNavbar() {
  const router = useRouter();
  const { language, setLanguage, languages } = useI18n();

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as typeof language);
    // Trigger a router refresh to update all translated content
    router.refresh();
  };

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

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              title="Select Language"
            >
              <Globe size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-[140px] px-1.5 py-1.5">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-2.5 cursor-pointer px-3 py-2 w-full ${
                  language === lang.code ? "bg-accent font-medium" : ""
                }`}
              >
                <span className="text-lg shrink-0">{lang.flag}</span>
                <span className="whitespace-nowrap">{lang.label}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                  {lang.code.toUpperCase()}
                </span>
                {language === lang.code && (
                  <span className="ml-1.5 text-primary shrink-0">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
