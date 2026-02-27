"use client";

import { QrCode, Languages, Palette, Zap, Smartphone, GripVertical } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";

const icons = [QrCode, Languages, Palette, Zap, Smartphone, GripVertical];

export function Features() {
  const { t } = useI18n();
  const features = [
    t.landing.features.qr,
    t.landing.features.multilang,
    t.landing.features.themes,
    t.landing.features.publish,
    t.landing.features.mobile,
    t.landing.features.analytics,
  ];

  return (
    <section id="features" className="relative py-32 lg:py-40">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[380px] w-[380px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t.landing.features.label}
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h2 className="font-sans text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-foreground">
              {t.landing.features.title}
            </h2>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-5 text-lg text-muted-foreground">
              {t.landing.features.subtitle}
            </p>
          </FadeIn>
        </div>

        <StaggerContainer className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
          {features.map((feature, i) => {
            const Icon = icons[i];
            return (
              <StaggerItem key={i}>
                <HoverScale lift={-6}>
                  <div className="group relative rounded-2xl border border-border/80 bg-card p-8 shadow-soft transition-all duration-300 hover:border-border hover:shadow-card">
                    <div className="relative">
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </HoverScale>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
