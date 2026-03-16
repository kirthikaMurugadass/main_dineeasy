"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ThemeConfig } from "@/types/database";
import { defaultThemeConfig } from "@/types/database";

type PublicTheme = "light" | "dark" | "system";

type PublicThemeContextValue = {
  theme: PublicTheme;
  setTheme: (next: PublicTheme, options?: { persist?: boolean }) => void;
};

const PublicThemeContext = createContext<PublicThemeContextValue>({
  theme: "system",
  setTheme: () => {},
});

function mapRestaurantModeToTheme(mode: ThemeConfig["mode"] | undefined): PublicTheme {
  if (mode === "light" || mode === "dark") return mode;
  return "system";
}

function isValidHexColor(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function getContrastForeground(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
}

export function PublicThemeProvider({
  children,
  restaurantSlug,
  themeConfig,
  persistUserPreference = true,
}: {
  children: ReactNode;
  restaurantSlug: string;
  themeConfig: ThemeConfig;
  persistUserPreference?: boolean;
}) {
  const mergedTheme = useMemo(
    () => ({
      ...defaultThemeConfig,
      ...(themeConfig || {}),
    }),
    [themeConfig]
  );

  const storageKey = useMemo(
    () => `dineeasy-public-theme:${restaurantSlug}`,
    [restaurantSlug]
  );
  const [theme, setThemeState] = useState<PublicTheme>(
    mapRestaurantModeToTheme(mergedTheme.mode)
  );
  const snapshotRef = useRef<{
    hadDark: boolean;
    hadLight: boolean;
    vars: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isPreviewUrl = params.get("previewTheme") === "1";
    if (isPreviewUrl) {
      // Preview pages should be driven by preview config/theme toggles only.
      // Avoid forcing theme from persisted/default values after mount.
      return;
    }
    const effectiveAllowPersistence = persistUserPreference && !isPreviewUrl;

    if (effectiveAllowPersistence) {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
        return;
      }
    }
    setThemeState(mapRestaurantModeToTheme(mergedTheme.mode));
  }, [storageKey, mergedTheme.mode, persistUserPreference]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    root.dataset.publicThemeLock = "true";

    if (!snapshotRef.current) {
      snapshotRef.current = {
        hadDark: root.classList.contains("dark"),
        hadLight: root.classList.contains("light"),
        vars: {
          "--primary": root.style.getPropertyValue("--primary"),
          "--primary-foreground": root.style.getPropertyValue("--primary-foreground"),
          "--accent": root.style.getPropertyValue("--accent"),
          "--accent-foreground": root.style.getPropertyValue("--accent-foreground"),
          "--ring": root.style.getPropertyValue("--ring"),
        },
      };
    }

    const primary = isValidHexColor(mergedTheme.primaryColor)
      ? mergedTheme.primaryColor
      : defaultThemeConfig.primaryColor;
    const accent = isValidHexColor(mergedTheme.accentColor)
      ? mergedTheme.accentColor
      : defaultThemeConfig.accentColor;
    const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;

    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", getContrastForeground(primary));
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-foreground", getContrastForeground(accent));
    root.style.setProperty("--ring", primary);

    const onMediaChange = () => {
      if (theme !== "system") return;
      const nextResolved = media.matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(nextResolved);
    };

    media.addEventListener("change", onMediaChange);
    return () => {
      media.removeEventListener("change", onMediaChange);
    };
  }, [theme, mergedTheme.primaryColor, mergedTheme.accentColor]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      const root = document.documentElement;
      const snapshot = snapshotRef.current;
      if (!snapshot) return;

      root.classList.remove("light", "dark");
      if (snapshot.hadDark) root.classList.add("dark");
      if (snapshot.hadLight) root.classList.add("light");

      for (const [key, value] of Object.entries(snapshot.vars)) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
      delete root.dataset.publicThemeLock;
    };
  }, []);

  const setTheme = useCallback((next: PublicTheme, options?: { persist?: boolean }) => {
    setThemeState(next);
    const shouldPersist = options?.persist ?? true;
    if (typeof window !== "undefined" && shouldPersist) {
      const params = new URLSearchParams(window.location.search);
      const isPreviewUrl = params.get("previewTheme") === "1";
      const effectiveAllowPersistence = persistUserPreference && !isPreviewUrl;
      if (!effectiveAllowPersistence) return;
      window.localStorage.setItem(storageKey, next);
    }
  }, [persistUserPreference, storageKey]);

  return (
    <PublicThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  return useContext(PublicThemeContext);
}

