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
  const [language, setLang] = useState<Language>(defaultLanguage);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_LANGUAGES.has(stored) && stored !== defaultLanguage) {
      setLang(stored as Language);
    }
  }, [defaultLanguage]);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = getDictionary(language);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
