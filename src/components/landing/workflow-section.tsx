"use client";

import Link from "next/link";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { useI18n } from "@/lib/i18n/context";

export function WorkflowSection() {
  const { t } = useI18n();
  const steps = t.landing.workflow.steps;

  return (
    <section
      id="workflow"
      className="relative overflow-hidden border-t border-border/60 bg-background py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 lg:items-center">
          <div>
            <FadeIn>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                {t.landing.workflow.eyebrow}
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h2 className="mt-4 font-sans text-[clamp(1.75rem,3vw+0.5rem,2.75rem)] font-semibold leading-tight tracking-tight text-foreground">
                {t.landing.workflow.headline}
              </h2>
            </FadeIn>
            <StaggerContainer className="mt-12 space-y-8">
              {steps.map((step, i) => (
                <StaggerItem key={i} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-sans text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-muted-foreground">{step.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
            <FadeIn delay={0.2}>
              <Link href="/signup" className="mt-10 inline-block">
                <Button size="lg" className="rounded-xl">
                  {t.landing.hero.cta}
                </Button>
              </Link>
            </FadeIn>
          </div>
          <FadeIn delay={0.15} direction="left">
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-full max-w-[260px] sm:max-w-[300px]">
                <PhoneMockup withFloating={false} />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
