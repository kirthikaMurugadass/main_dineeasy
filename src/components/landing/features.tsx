"use client";

import { QrCode, Languages, Palette, Zap, Smartphone, GripVertical } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";

const featureIcons = [QrCode, Languages, Palette, Zap, Smartphone, GripVertical];

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
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-olive/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
              Features
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.landing.features.title}
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.landing.features.subtitle}
            </p>
          </FadeIn>
        </div>

        {/* Feature grid */}
        <StaggerContainer className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
          {features.map((feature, i) => {
            const Icon = featureIcons[i];
            return (
              <StaggerItem key={i}>
                <HoverScale lift={-6}>
                  <div className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-gold/20 hover:shadow-premium">
                    {/* Gradient glow on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/5 via-transparent to-olive/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="relative z-10">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gold/15">
                        <Icon size={22} />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
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
