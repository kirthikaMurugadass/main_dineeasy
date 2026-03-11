"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getModularDictionary, type ModularDictionary } from "./migrate";
import { SUPPORTED_LANGUAGES } from "./dictionaries";
import type { Language } from "@/types/database";

const STORAGE_KEY = "dineeasy-lang";
const VALID_LANGUAGES = new Set<string>(["de", "en", "fr", "it"]);

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ModularDictionary;
  languages: typeof SUPPORTED_LANGUAGES;
  loading: boolean;
}

// Initialize with old dictionary for SSR and client-side compatibility
const getInitialDictionary = (lang: Language = "de"): ModularDictionary => {
  // Use old dictionary synchronously for both SSR and client-side initial render
  const { getDictionary } = require("./dictionaries");
  const oldDict = getDictionary(lang);
  return {
    ...oldDict,
    navbar: oldDict.landing?.nav || {},
    home: {},
    footer: oldDict.landing?.footer || {},
    dashboard: oldDict.admin?.dashboard || {},
      order: oldDict.admin?.orders || {},
      table: {},
      booking: {},
      analytics: oldDict.admin?.analytics || {},
      appearance: oldDict.admin?.appearance || {},
      qr: oldDict.admin?.qr || {},
      settings: oldDict.admin?.settings || {},
      auth: oldDict.auth || {
        login: {},
        signup: {},
      },
  } as ModularDictionary;
};

const I18nContext = createContext<I18nContextType>({
  language: "de",
  setLanguage: () => {},
  t: getInitialDictionary("de"),
  languages: SUPPORTED_LANGUAGES,
  loading: true,
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
  // Initialize with old dictionary immediately (both SSR and client-side)
  const [translations, setTranslations] = useState<ModularDictionary>(() => 
    getInitialDictionary(defaultLanguage)
  );
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load translations when language changes
  useEffect(() => {
    let cancelled = false;
    
    async function loadTranslations() {
      setLoading(true);
      try {
        const t = await getModularDictionary(language);
        if (!cancelled) {
          // Ensure navbar is always defined (fallback to old system if needed)
          if (!t.navbar || Object.keys(t.navbar).length === 0) {
            // Use the migration helper's conversion function
            const { getDictionary: getOldDict } = await import("./dictionaries");
            const oldDict = getOldDict(language);
            const converted = {
              ...oldDict,
              navbar: oldDict.landing?.nav || {},
              home: {},
              footer: oldDict.landing?.footer || {},
              dashboard: oldDict.admin?.dashboard || {},
      order: oldDict.admin?.orders || {},
      table: {},
      booking: {},
      analytics: oldDict.admin?.analytics || {},
      appearance: oldDict.admin?.appearance || {},
      qr: oldDict.admin?.qr || {},
      settings: oldDict.admin?.settings || {},
      auth: oldDict.auth || {
        login: {},
        signup: {},
      },
            };
            setTranslations(converted as ModularDictionary);
          } else {
            setTranslations(t);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load translations:", error);
        // Fallback to old system
        if (!cancelled) {
          const { getDictionary: getOldDict } = await import("./dictionaries");
          const oldDict = getOldDict(language);
          const converted = {
            ...oldDict,
            navbar: oldDict.landing?.nav || {},
            home: {},
            footer: oldDict.landing?.footer || {},
            dashboard: oldDict.admin?.dashboard || {},
      order: oldDict.admin?.orders || {},
      table: {},
      booking: {},
      analytics: oldDict.admin?.analytics || {},
      appearance: oldDict.admin?.appearance || {},
      qr: oldDict.admin?.qr || {},
      settings: oldDict.admin?.settings || {},
      auth: oldDict.auth || {
        login: {},
        signup: {},
      },
          };
          setTranslations(converted as ModularDictionary);
          setLoading(false);
        }
      }
    }
    
    loadTranslations();
    
    return () => {
      cancelled = true;
    };
  }, [language]);

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

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translations, languages: SUPPORTED_LANGUAGES, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
