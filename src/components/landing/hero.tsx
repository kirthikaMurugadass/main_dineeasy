"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeContent, AnimatedContent } from "@/lib/reactbits";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import ParticlesBackground from "@/components/ui/particles-background";
import { useTheme } from "@/components/providers/theme-provider";

export function Hero() {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const particleColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-background lg:min-h-screen">
      <ParticlesBackground
        className="absolute inset-0 z-0"
        particleCount={300}
        particleSpread={10}
        speed={0.1}
        particleColors={[particleColor]}
        alphaParticles
        moveParticlesOnHover={false}
        particleBaseSize={100}
        sizeRandomness={0.4}
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-4xl items-center justify-center px-6 pb-24 pt-28 text-center lg:min-h-screen lg:px-8">
        <FadeContent
          duration={1.1}
          delay={0.1}
          threshold={0.2}
          initialOpacity={0}
          className="w-full"
        >
          <div className="flex flex-col items-center gap-6">
            <AnimatedContent direction="vertical" distance={24} delay={0.1}>
              <p className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary shadow-soft backdrop-blur-md">
                {t.landing.hero.badge}
              </p>
            </AnimatedContent>

            <AnimatedContent direction="vertical" distance={32} delay={0.18}>
              <h1 className="text-balance text-[clamp(2.25rem,4vw+1rem,3.75rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
                {t.landing.hero.title}
                {t.landing.hero.titleAccent && (
                  <span className="mt-2 block bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                    {t.landing.hero.titleAccent}
                  </span>
                )}
              </h1>
            </AnimatedContent>

            <AnimatedContent direction="vertical" distance={24} delay={0.26}>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground text-balance">
                {t.landing.hero.subtitle}
              </p>
            </AnimatedContent>

            <AnimatedContent direction="vertical" distance={24} delay={0.34}>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group h-12 min-w-[180px] rounded-xl bg-foreground px-7 text-sm font-semibold text-background shadow-floating transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-premium"
                  >
                    {t.landing.hero.cta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="#workflow">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 min-w-[180px] rounded-xl border-2 border-border/70 bg-background/70 px-7 text-sm font-medium text-foreground/90 shadow-soft backdrop-blur-md hover:bg-background/90"
                  >
                    {t.landing.hero.ctaSecondary}
                  </Button>
                </Link>
              </div>
            </AnimatedContent>
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
