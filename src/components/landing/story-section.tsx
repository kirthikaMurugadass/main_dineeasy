"use client";

import Link from "next/link";
import { FadeIn, ScrollReveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function StorySection() {
  const { t } = useI18n();

  return (
    <section className="relative border-t border-border/60 bg-muted/30 py-24 md:py-32 lg:py-40">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <FadeIn delay={0.1}>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.landing.story.eyebrow}
          </p>
        </FadeIn>
        <ScrollReveal delay={0.05}>
          <h2 className="mt-6 font-serif text-[clamp(2rem,4vw+1rem,3.25rem)] font-medium leading-[1.15] tracking-tight text-foreground">
            {t.landing.story.headline}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t.landing.story.body}
          </p>
        </ScrollReveal>
        <FadeIn delay={0.2} direction="up">
          <Link href="#workflow" className="mt-10 inline-block">
            <Button variant="outline" size="lg" className="rounded-xl border-2">
              {t.landing.story.cta}
            </Button>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
