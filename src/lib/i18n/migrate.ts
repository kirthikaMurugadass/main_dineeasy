/**
 * Migration helper to bridge old dictionaries.ts and new modular JSON system
 * This allows gradual migration while maintaining functionality
 */
import type { Language } from "@/types/database";
import { loadAllTranslations, type Translations } from "./loader";

// Import old system as fallback
import { getDictionary as getOldDictionary } from "./dictionaries";
import type { Dictionary as OldDictionary } from "./dictionaries";

export interface ModularDictionary extends OldDictionary {
  navbar: Translations;
  home: Translations;
  footer: Translations;
  dashboard: Translations;
  // menu is kept from OldDictionary for backward compatibility
  order: Translations;
  table: Translations;
  booking: Translations;
  analytics: Translations;
  appearance: Translations;
  qr: Translations;
  settings: Translations;
}

/**
 * Get translations using new modular system with fallback to old system
 */
export async function getModularDictionary(
  language: Language
): Promise<ModularDictionary> {
  try {
    // Try to load from new modular system
    const translations = await loadAllTranslations(language);
    
    // Check if translations are populated (not just empty objects)
    // Specifically check navbar since it's critical for the app to work
    const hasContent = translations.navbar && Object.keys(translations.navbar).length > 0;
    
    if (hasContent) {
      // Load old dictionary for backward compatibility
      const oldDict = getOldDictionary(language);
      return {
        // Spread old dictionary first to ensure all required properties exist
        ...oldDict,
        // Then add new modular structure (this adds new properties but doesn't remove old ones)
        navbar: translations.navbar,
        home: translations.home,
        footer: translations.footer,
        dashboard: translations.dashboard,
        // Merge modular menu translations while preserving old keys for compatibility
        menu: {
          ...oldDict.menu,
          ...translations.menu,
        },
        order: translations.order,
        table: translations.table,
        booking: translations.booking,
        analytics: translations.analytics,
        appearance: translations.appearance,
        qr: translations.qr,
        settings: translations.settings,
        // Merge auth translations - new modular takes precedence but keep old structure for compatibility
        auth: {
          ...oldDict.auth,
          login: translations.auth?.login || oldDict.auth?.login || {},
          signup: translations.auth?.signup || oldDict.auth?.signup || {},
        },
      } as ModularDictionary;
    }
  } catch (error) {
    console.warn("Failed to load modular translations, using fallback", error);
  }
  
  // Fallback to old system and convert structure
  const oldDict = getOldDictionary(language);
  return convertOldToModular(oldDict);
}

/**
 * Convert old Dictionary structure to new modular structure
 */
function convertOldToModular(oldDict: OldDictionary): ModularDictionary {
  return {
    // Spread the full old dictionary first for backward compatibility
    ...oldDict,
    // Then add new modular structure
    navbar: oldDict.landing?.nav || {},
    home: {
      hero: oldDict.landing?.hero || {},
      features: oldDict.landing?.features || {},
      demo: oldDict.landing?.demo || {},
      howItWorks: oldDict.landing?.howItWorks || {},
      about: oldDict.landing?.about || {},
      cta: oldDict.landing?.cta || {},
      story: oldDict.landing?.story || {},
      workflow: oldDict.landing?.workflow || {},
      ecosystem: oldDict.landing?.ecosystem || {},
      trust: oldDict.landing?.trust || {},
      finalCta: oldDict.landing?.finalCta || {},
    },
    footer: oldDict.landing?.footer || {},
    dashboard: oldDict.admin?.dashboard || {},
    menu: {
      ...oldDict.menu,
      ...oldDict.admin?.menus,
      ...oldDict.admin?.categories,
    },
    order: oldDict.admin?.orders || {},
    table: {}, // Empty for now
    booking: {}, // Empty for now
    analytics: oldDict.admin?.analytics || {},
    appearance: oldDict.admin?.appearance || {},
    qr: oldDict.admin?.qr || {},
    settings: oldDict.admin?.settings || {},
    auth: oldDict.auth || {
      login: {},
      signup: {},
    },
  } as ModularDictionary;
}
