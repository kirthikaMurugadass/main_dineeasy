"use client";

import { AppLogo } from "@/components/ui/app-logo";
import { useI18n } from "@/lib/i18n/context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/dictionaries";
import type { Language } from "@/types/database";

export function Footer() {
  const { t, language, setLanguage } = useI18n();

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <AppLogo href="/" size="sm" />
            <p className="mt-3 text-sm text-muted-foreground">{t.landing.footer.tagline}</p>

            {/* Language selector */}
            <div className="mt-4 flex gap-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as Language)}
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    language === lang.code
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang.flag}
                </button>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">{t.landing.footer.product}</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.features}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.pricing}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.demo}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.changelog}
                </a>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">{t.landing.footer.company}</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.about}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.blog}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.contact}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.careers}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">{t.landing.footer.legal}</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.privacy}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.terms}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.imprint}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.landing.footer.links.cookies}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {t.landing.footer.copyright.replace("{year}", new Date().getFullYear().toString())}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.landing.footer.pricesNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
