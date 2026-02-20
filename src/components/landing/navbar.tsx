"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/app-logo";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/components/providers/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass shadow-premium py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <AppLogo href="/" variant={!scrolled ? "light" : "default"} size="md" />

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Theme Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-9 w-9 ${!scrolled ? "text-white hover:bg-white/10 hover:text-white" : ""}`}
                >
                  <ThemeIcon size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun size={14} className="mr-2" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon size={14} className="mr-2" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor size={14} className="mr-2" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/login">
              <Button variant="ghost" size="sm" className={`text-sm ${!scrolled ? "text-white hover:bg-white/10 hover:text-white" : ""}`}>
                {t.landing.nav.login}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="bg-espresso text-warm hover:bg-espresso/90 glow-gold text-sm"
              >
                {t.landing.nav.cta}
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl md:hidden ${!scrolled ? "text-white" : ""}`}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

          {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 top-16 z-40 glass-strong p-6 md:hidden"
          >
            <nav className="flex flex-col gap-6 pt-4">
              {/* Theme Switcher in Mobile Menu */}
              <div className="flex flex-col gap-3 pt-4 border-t">
                <div className="px-2 py-2 text-sm font-medium text-muted-foreground">Theme</div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setTheme("light");
                      setMobileOpen(false);
                    }}
                  >
                    <Sun size={16} className="mr-2" /> Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setTheme("dark");
                      setMobileOpen(false);
                    }}
                  >
                    <Moon size={16} className="mr-2" /> Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setTheme("system");
                      setMobileOpen(false);
                    }}
                  >
                    <Monitor size={16} className="mr-2" /> System
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t.landing.nav.login}
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-espresso text-warm hover:bg-espresso/90">
                    {t.landing.nav.cta}
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
