"use client";

import { I18nProvider } from "@/lib/i18n/context";

/**
 * Client-side wrapper for I18nProvider
 * Always starts with default "de" to match server render
 * Language is updated from cookies/localStorage after mount in I18nProvider
 * This prevents hydration mismatches
 */
export function I18nProviderWrapper({ children }: { children: React.ReactNode }) {
  // Always use "de" as default to match server render
  // The I18nProvider will read from cookies/localStorage after mount
  // This ensures server and client render the same initial content
  return <I18nProvider defaultLanguage="de">{children}</I18nProvider>;
}
