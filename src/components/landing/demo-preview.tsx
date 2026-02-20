"use client";

import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { PhoneMockup } from "./phone-mockup";

export function DemoPreview() {
  const { t } = useI18n();

  return (
    <section id="demo" className="relative pt-48 pb-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-warm/30 to-transparent dark:via-white/[0.02]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
              Live Preview
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.landing.demo.title}
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-lg text-muted-foreground">{t.landing.demo.subtitle}</p>
          </FadeIn>
        </div>

        {/* Device frame */}
        <FadeIn delay={0.3} className="mt-16 flex justify-center">
          <div className="relative w-full max-w-sm">
            <PhoneMockup />
            {/* Decorative */}
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 h-64 w-32 rounded-full bg-gold/5 blur-3xl" />
            <div className="absolute -right-16 top-1/3 h-48 w-32 rounded-full bg-olive/5 blur-3xl" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
