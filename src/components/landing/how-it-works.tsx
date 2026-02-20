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
    <section className="relative py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
              Simple Setup
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.landing.howItWorks.title}
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.landing.howItWorks.subtitle}
            </p>
          </FadeIn>
        </div>

        {/* Steps */}
        <StaggerContainer className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8" staggerDelay={0.15}>
          {steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <StaggerItem key={i}>
                <div className="relative text-center">
                  {/* Step number background */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-sans text-[120px] font-semibold leading-none text-foreground/[0.03] select-none">
                    {i + 1}
                  </div>

                  {/* Connecting line */}
                  {i < 2 && (
                    <div className="absolute top-10 left-[calc(50%+48px)] hidden h-px w-[calc(100%-96px)] bg-gradient-to-r from-border to-border/0 md:block" />
                  )}

                  {/* Icon */}
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 text-gold shadow-sm ring-1 ring-gold/10">
                    <Icon size={28} />
                  </div>

                  <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
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
