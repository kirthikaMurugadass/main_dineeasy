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
      className="bg-transparent pt-0 pb-0 text-foreground"
    >
      {/* Full-width footer base (no curved corners) */}
      <div className="w-full bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] ring-1 ring-black/5">
        {/* Centered content container (balanced left/right spacing) */}
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-2 gap-y-12 gap-x-10 pt-12 pb-12 md:grid-cols-12 md:gap-y-0 md:pt-14">
            <div className="col-span-2 md:col-span-4">
              <AppLogo href="/" size="sm" />
              <p className="mt-4 text-sm text-muted-foreground">{t.landing.footer.tagline}</p>
              {/* Deterministic 2-column layout so Français appears below English */}
              <div className="mt-4 inline-grid w-fit grid-cols-2 gap-x-3 gap-y-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code as Language)}
                    className={`inline-flex w-fit items-center gap-2 rounded-lg border border-border/70 bg-[#EEF3FB] px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-[var(--sage-light)]/40 hover:text-foreground sm:text-sm ${
                      language === lang.code ? "border-transparent bg-primary/90 text-primary-foreground shadow-md" : ""
                    }`}
                  >
                    <LanguageFlag code={lang.code} />
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-1 md:col-span-3">
              <h4 className="mb-4 text-sm font-semibold text-foreground">{t.landing.footer.product}</h4>
              <ul className="space-y-3">
                {[
                  t.landing.footer.links.features,
                  t.landing.footer.links.pricing,
                  t.landing.footer.links.demo,
                  t.landing.footer.links.changelog,
                ].map((label, i) => (
                  <li key={i}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-1 md:col-span-3">
              <h4 className="mb-4 text-sm font-semibold text-foreground">{t.landing.footer.company}</h4>
              <ul className="space-y-3">
                {[
                  t.landing.footer.links.about,
                  t.landing.footer.links.blog,
                  t.landing.footer.links.contact,
                  t.landing.footer.links.careers,
                ].map((label, i) => (
                  <li key={i}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h4 className="mb-4 text-sm font-semibold text-foreground">{t.landing.footer.legal}</h4>
              <ul className="space-y-3">
                {[
                  t.landing.footer.links.privacy,
                  t.landing.footer.links.terms,
                  t.landing.footer.links.imprint,
                  t.landing.footer.links.cookies,
                ].map((label, i) => (
                  <li key={i}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-2 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-8 pb-10 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {t.landing.footer.copyright.replace("{year}", new Date().getFullYear().toString())}
            </p>
            <p className="text-sm text-muted-foreground">{t.landing.footer.pricesNote}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
