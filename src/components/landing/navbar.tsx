"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Monitor, Globe, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/app-logo";
import { LanguageFlag } from "@/components/ui/language-flag";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/components/providers/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { key: "home" as const, href: "/" },
  { key: "features" as const, href: "#features" },
  { key: "pricing" as const, href: "#pricing" },
 
  { key: "contact" as const, href: "#contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { t, language, setLanguage, languages } = useI18n();
  const { theme, setTheme } = useTheme();
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as typeof language);
    router.refresh();
  };

  useEffect(() => {
    setMounted(true);

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      setShowScrollTop(y > 300);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "fixed inset-x-0 top-0 z-[9999] border-b border-border/60 transition-all duration-300 ease-out",
          scrolled
            ? "bg-background/90 shadow-md backdrop-blur-md"
            : "border-transparent bg-black/30 shadow-none backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6 lg:h-[72px] lg:px-10">
          {/* Left: Logo — always high contrast (AppLogo renders the link to avoid nested <a>) */}
          <AppLogo
            href="/"
            variant="default"
            size="md"
            className="shrink-0 transition-transform duration-300 ease-out hover:rotate-3"
            ariaLabel="DineEasy Home"
          />

          {/* Center: Nav links — desktop only */}
          <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
            {navLinks.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  "group relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                  scrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-white hover:text-[var(--sage-light)]"
                )}
              >
                <span className="absolute inset-0 rounded-full bg-[var(--accent)]/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10">{t.landing.nav[key]}</span>
              </Link>
            ))}
          </nav>

          {/* Right: Language, Theme, Sign In, Get Started */}
          <div className="flex shrink-0 items-center gap-1">
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full transition-colors",
                      scrolled
                        ? "text-foreground hover:bg-accent hover:text-foreground"
                        : "text-white hover:bg-white/10 hover:text-white"
                    )}
                    title={t.landing.nav.selectLanguage}
                    aria-label={t.landing.nav.selectLanguage}
                  >
                    <Globe className="h-[18px] w-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[10000] min-w-[180px] rounded-xl border border-border/70 bg-background/80 p-1 shadow-lg backdrop-blur-md"
                >
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors",
                        language === lang.code
                          ? "bg-accent/90 text-accent-foreground shadow-sm"
                          : "hover:bg-muted/70"
                      )}
                    >
                      <LanguageFlag code={lang.code} />
                      <span className="flex-1 text-left">{lang.label}</span>
                      {language === lang.code && <span className="text-primary">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-foreground/70"
                title={t.landing.nav.selectLanguage}
                aria-label={t.landing.nav.selectLanguage}
                disabled
              >
                <Globe className="h-[18px] w-[18px]" />
              </Button>
            )}
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full transition-colors",
                      scrolled
                        ? "text-foreground hover:bg-accent hover:text-foreground"
                        : "text-white hover:bg-white/10 hover:text-white"
                    )}
                    aria-label={t.landing.nav.theme}
                  >
                    <ThemeIcon className="h-[18px] w-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[10000] min-w-[140px] rounded-xl border border-border bg-popover p-1 shadow-lg"
                >
                  <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg py-2.5 text-foreground">
                    <Sun className="mr-3 h-[18px] w-[18px]" /> {t.admin.topbar.light}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg py-2.5 text-foreground">
                    <Moon className="mr-3 h-[18px] w-[18px]" /> {t.admin.topbar.dark}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg py-2.5 text-foreground">
                    <Monitor className="mr-3 h-[18px] w-[18px]" /> {t.admin.topbar.system}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-foreground/70"
                aria-label={t.landing.nav.theme}
                disabled
              >
                <ThemeIcon className="h-[18px] w-[18px]" />
              </Button>
            )}
            <Link href="/login" className="hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                  scrolled
                    ? "text-foreground hover:bg-accent hover:text-[var(--sage-dark)]"
                    : "text-white hover:bg-white/10"
                )}
              >
                {t.landing.nav.login}
              </Button>
            </Link>
            <Link href="/signup" className="hidden sm:block">
              <Button
                size="sm"
                className="h-9 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/50"
              >
                {t.landing.nav.cta}
              </Button>
            </Link>

            {/* Mobile: hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg md:hidden",
                scrolled
                  ? "text-foreground hover:bg-muted"
                  : "text-white hover:bg-white/10"
              )}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile: full-screen slide menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-background shadow-xl md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <AppLogo href="/" variant="default" size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-6" aria-label="Mobile menu">
                {navLinks.map(({ key, href }) => (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3.5 text-base font-medium text-foreground hover:bg-muted"
                  >
                    {t.landing.nav[key]}
                  </Link>
                ))}
                <div className="my-4 h-px bg-border" />
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.landing.nav.language}
                </p>
                <div className="flex flex-col gap-1">
                  {languages.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? "secondary" : "ghost"}
                      className="justify-start rounded-lg py-3 text-foreground transition-colors hover:bg-muted/70"
                      onClick={() => {
                        handleLanguageChange(lang.code);
                      }}
                    >
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-sm">
                        <LanguageFlag code={lang.code} />
                      </span>
                      <span>{lang.label}</span>
                    </Button>
                  ))}
                </div>
                <p className="mt-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.landing.nav.theme}
                </p>
                <div className="flex flex-col gap-1">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={theme === mode ? "secondary" : "ghost"}
                      className="justify-start rounded-lg py-3 text-foreground"
                      onClick={() => setTheme(mode)}
                    >
                      {mode === "light" && <Sun className="mr-3 h-[18px] w-[18px]" />}
                      {mode === "dark" && <Moon className="mr-3 h-[18px] w-[18px]" />}
                      {mode === "system" && <Monitor className="mr-3 h-[18px] w-[18px]" />}
                      {t.admin.topbar[mode]}
                    </Button>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="h-12 w-full rounded-xl font-medium">
                      {t.landing.nav.login}
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button className="h-12 w-full rounded-xl font-medium">
                      {t.landing.nav.cta}
                    </Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Scroll to top floating button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-to-top"
            type="button"
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="fixed bottom-20 right-4 z-[9999] flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-lg shadow-black/15 backdrop-blur-xl transition-colors transition-shadow hover:bg-background/95 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:bottom-8 md:right-8 md:h-12 md:w-12"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
