"use client";

import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { PhoneMockup } from "./phone-mockup";

export function DemoPreview() {
  const { t } = useI18n();

  return (
    <section id="demo" className="relative py-32 lg:py-40">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t.landing.demo.label}
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h2 className="font-sans text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-foreground">
              {t.landing.demo.title}
            </h2>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-5 text-lg text-muted-foreground">
              {t.landing.demo.subtitle}
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.25} className="mt-16 flex justify-center">
          <div className="relative w-full max-w-[320px]">
            <PhoneMockup />
            <div className="absolute -left-12 top-1/2 h-48 w-32 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -right-12 top-1/3 h-40 w-28 rounded-full bg-primary/[0.03] blur-3xl" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
