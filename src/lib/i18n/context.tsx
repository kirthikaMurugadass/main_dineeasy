"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getDictionary, type Dictionary, SUPPORTED_LANGUAGES } from "./dictionaries";
import type { Language } from "@/types/database";

const STORAGE_KEY = "dineeasy-lang";
const VALID_LANGUAGES = new Set<string>(["de", "en", "fr", "it"]);

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
  languages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextType>({
  language: "de",
  setLanguage: () => {},
  t: getDictionary("de"),
  languages: SUPPORTED_LANGUAGES,
});

export function I18nProvider({
  children,
  defaultLanguage = "de",
}: {
  children: ReactNode;
  defaultLanguage?: Language;
}) {
  // Start with defaultLanguage to match server render
  const [language, setLang] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  // Only read from localStorage/cookies after component mounts (client-side only)
  // This ensures server and client render the same initial content (preventing hydration errors)
  useEffect(() => {
    setMounted(true);
    
    // Try to read from cookie first (for cross-route persistence)
    const cookies = document.cookie.split(";");
    const langCookie = cookies.find((c) => c.trim().startsWith(`${STORAGE_KEY}=`));
    if (langCookie) {
      const lang = langCookie.split("=")[1]?.trim();
      if (lang && VALID_LANGUAGES.has(lang) && lang !== defaultLanguage) {
        // Only update if different from default to avoid unnecessary re-renders
        setLang(lang as Language);
        return;
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_LANGUAGES.has(stored) && stored !== defaultLanguage) {
      setLang(stored as Language);
      // Sync to cookie
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `${STORAGE_KEY}=${stored}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }, [defaultLanguage]);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    if (mounted) {
      // Store in localStorage for client-side persistence
      localStorage.setItem(STORAGE_KEY, lang);
      
      // Also set cookie for SSR consistency and cross-route persistence
      // Cookie expires in 1 year
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `${STORAGE_KEY}=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }, [mounted]);

  const t = getDictionary(language);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
