"use client";

import { StaggerContainer, StaggerItem, FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";

export function EcosystemSection() {
  const { t } = useI18n();
  const items = t.landing.ecosystem.items;

  return (
    <section id="features" className="relative border-t border-border/60 bg-muted/20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.landing.ecosystem.eyebrow}
          </p>
        </FadeIn>
        <FadeIn delay={0.06}>
          <h2 className="mt-4 max-w-2xl font-sans text-[clamp(1.75rem,3vw+0.5rem,2.75rem)] font-semibold leading-tight tracking-tight text-foreground">
            {t.landing.ecosystem.headline}
          </h2>
        </FadeIn>
        <StaggerContainer className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <StaggerItem key={i}>
              <div className="group rounded-2xl border border-border/80 bg-card/80 p-6 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                <h3 className="font-sans font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
