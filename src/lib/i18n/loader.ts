import type { Language } from "@/types/database";

export type TranslationSection =
  | "navbar"
  | "home"
  | "footer"
  | "dashboard"
  | "menu"
  | "order"
  | "table"
  | "booking"
  | "analytics"
  | "appearance"
  | "qr"
  | "settings"
  | "auth";

export type Translations = Record<string, any>;

// Cache for loaded translations
const translationCache: Map<string, Translations> = new Map();

/**
 * Load translations for a specific section and language
 */
export async function loadTranslations(
  section: TranslationSection,
  language: Language
): Promise<Translations> {
  const cacheKey = `${section}:${language}`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Dynamic import based on section and language
    // Messages folder is in src/messages
    const translations = await import(
      `@/messages/${section}/${language}.json`
    );
    
    // Cache the result
    const result = translations.default || translations;
    translationCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.warn(
      `Failed to load translations for ${section}/${language}, falling back to English`,
      error
    );
    
    // Fallback to English
    if (language !== "en") {
      return loadTranslations(section, "en");
    }
    
    // If English also fails, return empty object
    return {};
  }
}

/**
 * Load all translations for a language
 */
export async function loadAllTranslations(
  language: Language
): Promise<Record<TranslationSection, Translations>> {
  const sections: TranslationSection[] = [
    "navbar",
    "home",
    "footer",
    "dashboard",
    "menu",
    "order",
    "table",
    "booking",
    "analytics",
    "appearance",
    "qr",
    "settings",
    "auth",
  ];

  const [navbar, home, footer, dashboard, menu, order, table, booking, analytics, appearance, qr, settings, auth] =
    await Promise.all([
      loadTranslations("navbar", language),
      loadTranslations("home", language),
      loadTranslations("footer", language),
      loadTranslations("dashboard", language),
      loadTranslations("menu", language),
      loadTranslations("order", language),
      loadTranslations("table", language),
      loadTranslations("booking", language),
      loadTranslations("analytics", language),
      loadTranslations("appearance", language),
      loadTranslations("qr", language),
      loadTranslations("settings", language),
      loadTranslations("auth", language),
    ]);

  return {
    navbar,
    home,
    footer,
    dashboard,
    menu,
    order,
    table,
    booking,
    analytics,
    appearance,
    qr,
    settings,
    auth,
  };
}

/**
 * Clear translation cache (useful for hot reloading in development)
 */
export function clearTranslationCache() {
  translationCache.clear();
}
