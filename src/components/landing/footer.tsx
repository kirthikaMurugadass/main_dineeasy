"use client";

import { AppLogo } from "@/components/ui/app-logo";
import { useI18n } from "@/lib/i18n/context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/dictionaries";
import type { Language } from "@/types/database";
import { LanguageFlag } from "@/components/ui/language-flag";

export function Footer() {
  const { t, language, setLanguage } = useI18n();

  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-t border-[var(--dark-section-foreground)]/10 bg-[var(--dark-section)] pt-20 pb-16 text-[var(--dark-section-foreground)]"
    >
      {/* Curved / wave-style top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -mt-16 h-16 bg-[var(--dark-section)] before:absolute before:inset-x-[-10%] before:bottom-0 before:h-24 before:rounded-t-[50%] before:bg-[var(--background)]" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <AppLogo href="/" size="sm" />
            <p className="mt-4 text-sm text-[var(--dark-section-foreground)]/75">
              {t.landing.footer.tagline}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code as Language)}
                  className={`inline-flex items-center gap-2 rounded-full border border-border/70 bg-[var(--section-alt)]/10 px-3 py-1.5 text-xs sm:text-sm text-[var(--dark-section-foreground)]/75 shadow-sm backdrop-blur-md transition-colors hover:bg-[var(--sage-light)]/25 hover:text-[var(--dark-section-foreground)] ${
                    language === lang.code
                      ? "border-transparent bg-primary/90 text-primary-foreground shadow-md"
                      : ""
                  }`}
                >
                  <LanguageFlag code={lang.code} />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[var(--dark-section-foreground)]">
              {t.landing.footer.product}
            </h4>
            <ul className="space-y-3">
              {[
                t.landing.footer.links.features,
                t.landing.footer.links.pricing,
                t.landing.footer.links.demo,
                t.landing.footer.links.changelog,
              ].map((label, i) => (
                <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-[var(--dark-section-foreground)]/70 transition-colors hover:text-[var(--sage-medium)]"
                    >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[var(--dark-section-foreground)]">
              {t.landing.footer.company}
            </h4>
            <ul className="space-y-3">
              {[
                t.landing.footer.links.about,
                t.landing.footer.links.blog,
                t.landing.footer.links.contact,
                t.landing.footer.links.careers,
              ].map((label, i) => (
                <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-[var(--dark-section-foreground)]/70 transition-colors hover:text-[var(--sage-medium)]"
                    >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[var(--dark-section-foreground)]">
              {t.landing.footer.legal}
            </h4>
            <ul className="space-y-3">
              {[
                t.landing.footer.links.privacy,
                t.landing.footer.links.terms,
                t.landing.footer.links.imprint,
                t.landing.footer.links.cookies,
              ].map((label, i) => (
                <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-[var(--dark-section-foreground)]/70 transition-colors hover:text-[var(--sage-medium)]"
                    >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--dark-section-foreground)]/10 pt-8 sm:flex-row">
          <p className="text-sm text-[var(--dark-section-foreground)]/70">
            {t.landing.footer.copyright.replace("{year}", new Date().getFullYear().toString())}
          </p>
          <p className="text-sm text-[var(--dark-section-foreground)]/70">{t.landing.footer.pricesNote}</p>
        </div>
      </div>
    </footer>
  );
}
