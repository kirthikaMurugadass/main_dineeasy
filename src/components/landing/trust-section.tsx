"use client";

import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";

export function TrustSection() {
  const { t } = useI18n();

  return (
    <section className="relative border-t border-border/60 bg-background py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <FadeIn>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.landing.trust.eyebrow}
          </p>
        </FadeIn>
        <FadeIn delay={0.06}>
          <h2 className="mt-4 font-sans text-[clamp(1.5rem,2.5vw+0.5rem,2.25rem)] font-semibold leading-tight text-foreground">
            {t.landing.trust.headline}
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-4 text-muted-foreground">{t.landing.trust.tagline}</p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-muted-foreground/80">
            <span className="text-sm font-medium">Cafés</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-sm font-medium">Restaurants</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-sm font-medium">Bars</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-sm font-medium">Hotels</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
