"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Palette, Share2 } from "lucide-react";

const stepIcons = [Plus, Palette, Share2];

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    t.landing.howItWorks.step1,
    t.landing.howItWorks.step2,
    t.landing.howItWorks.step3,
  ];

  return (
    <section className="relative py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t.landing.howItWorks.label}
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h2 className="font-sans text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-foreground">
              {t.landing.howItWorks.title}
            </h2>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-5 text-lg text-muted-foreground">
              {t.landing.howItWorks.subtitle}
            </p>
          </FadeIn>
        </div>

        <StaggerContainer
          className="mt-20 grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-12"
          staggerDelay={0.12}
        >
          {steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <StaggerItem key={i}>
                <div className="relative text-center">
                  <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-sans text-[100px] font-bold leading-none text-foreground/[0.04]">
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div className="absolute top-12 left-[calc(50%+56px)] hidden h-px w-[calc(100%-112px)] bg-gradient-to-r from-border to-transparent md:block" />
                  )}
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mx-auto max-w-[260px] text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
