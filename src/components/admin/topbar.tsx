"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Monitor, User, Globe, Crown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";
import { LanguageFlag } from "@/components/ui/language-flag";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSubscription } from "@/contexts/subscription-context";
import { clearCachedRestaurant } from "@/lib/restaurant-cache";

export function AdminTopbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, languages } = useI18n();
  const { isPro, loading: planLoading } = useSubscription();

  const [userName, setUserName] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name =
        (user.user_metadata as any)?.full_name ||
        user.email?.split("@")[0] ||
        "Admin";
      setUserName(name);
    });
  }, []);

  const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const ThemeIcon = themeIcon;

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearCachedRestaurant();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl dark:bg-background/95">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex min-h-16 w-full items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-0 lg:px-6"
      >
        {/* Left: Sidebar trigger + Plan badge */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <SidebarTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm transition duration-200 hover:opacity-80" />
          {planLoading ? (
            <span className="inline-flex h-7 w-24 animate-pulse rounded-full border border-border/60 bg-muted/60" />
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-xs",
                isPro
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-muted/50 text-muted-foreground"
              )}
            >
              {isPro ? (
                <>
                  <Crown className="h-3.5 w-3.5" />
                  {t.admin.topbar?.proPlan || "Pro Plan"}
                </>
              ) : (
                t.admin.topbar?.freePlan || "Free Plan"
              )}
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
          {planLoading ? (
            <div className="hidden h-9 w-32 animate-pulse rounded-full bg-muted/60 sm:block" />
          ) : !isPro ? (
            <Button
              size="sm"
              className="hidden rounded-full bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex"
              onClick={() => router.push("/admin/checkout")}
            >
              {t.dashboard?.upgrade?.button || t.admin.topbar?.upgradeToPro || "Upgrade to Pro"}
            </Button>
          ) : null}
          {/* Language / globe */}
          {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm backdrop-blur-md transition duration-200 hover:opacity-80"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 max-w-[calc(100vw-1rem)] rounded-xl border border-border/70 bg-card p-1 shadow-xl backdrop-blur-xl"
            >
              {languages?.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    language === lang.code
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <LanguageFlag code={lang.code} className="h-4 w-4" />
                  <span className="flex-1 text-left">{lang.label}</span>
                  {language === lang.code && (
                    <span className="text-primary text-xs">★</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          {/* Theme switcher */}
          {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-border/60 bg-card shadow-sm transition duration-200 hover:opacity-80"
                aria-label={t.admin.topbar.theme}
              >
                <ThemeIcon size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-card p-1 shadow-xl backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="rounded-lg py-2.5 text-sm"
              >
                <Sun size={16} className="mr-2" /> {t.admin.topbar.light}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="rounded-lg py-2.5 text-sm"
              >
                <Moon size={16} className="mr-2" /> {t.admin.topbar.dark}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="rounded-lg py-2.5 text-sm"
              >
                <Monitor size={16} className="mr-2" /> {t.admin.topbar.system}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          {/* Profile menu with avatar */}
          {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full border border-border/60 bg-card text-foreground shadow-md transition duration-200 hover:opacity-90"
                aria-label={t.admin.topbar?.openProfileMenu || "Open profile menu"}
              >
                <Avatar size="sm" className="border border-white/20 bg-transparent">
                  <AvatarFallback className="bg-transparent text-[11px] font-semibold tracking-wide">
                    {initials || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 max-w-[calc(100vw-1rem)] rounded-xl border border-border/70 bg-card p-1.5 shadow-2xl backdrop-blur-xl"
            >
              <DropdownMenuItem
                disabled
                className="flex flex-col items-start gap-0.5 rounded-lg py-2.5 text-xs cursor-default"
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                  {t.admin.sidebar.adminPanel}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {userName || "Admin"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/profile")}
                className="mt-0.5 rounded-lg py-2.5 text-sm"
              >
                {t.settings?.profile?.title || t.admin.topbar?.profile || "Profile"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/settings")}
                className="rounded-lg py-2.5 text-sm"
              >
                {t.admin.sidebar.settings}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-lg py-2.5 text-sm text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.admin.sidebar.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </motion.div>
    </header>
  );
}
