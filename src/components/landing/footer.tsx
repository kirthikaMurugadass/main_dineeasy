"use client";

import Link from "next/link";
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
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso text-warm font-serif font-bold text-sm">
                D
              </div>
              <span className="font-serif text-lg font-bold">
                Dine<span className="text-gold">Easy</span>
              </span>
            </Link>
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
              {["Features", "Pricing", "Demo", "Changelog"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">{t.landing.footer.company}</h4>
            <ul className="space-y-2.5">
              {["About", "Blog", "Contact", "Careers"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">{t.landing.footer.legal}</h4>
            <ul className="space-y-2.5">
              {["Privacy", "Terms", "Imprint", "Cookies"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DineEasy. Made with ♥ in Switzerland.
          </p>
          <p className="text-xs text-muted-foreground">
            All prices in CHF.
          </p>
        </div>
      </div>
    </footer>
  );
}
