"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChefHat, UtensilsCrossed, Leaf, Home, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

const featureIcons = [ChefHat, UtensilsCrossed, Leaf, Home];

export function AboutSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 0.4], [40, -20]);

  const features = [
    { icon: ChefHat, ...t.landing.about.features.chefs },
    { icon: UtensilsCrossed, ...t.landing.about.features.premium },
    { icon: Leaf, ...t.landing.about.features.fresh },
    { icon: Home, ...t.landing.about.features.cozy },
  ];

  return (
    <section ref={sectionRef} id="about" className="relative overflow-hidden py-32 lg:py-40">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24 lg:items-center">
          <motion.div className="space-y-8" style={{ y }}>
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.landing.about.badge}
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="font-sans text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-foreground">
                {t.landing.about.title}
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t.landing.about.description}
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {features.map((item, i) => {
                const Icon = item.icon;
                return (
                  <FadeIn key={i} delay={0.25 + i * 0.08}>
                    <div className="flex gap-4 rounded-2xl border border-border/80 bg-card/50 p-5 shadow-soft">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            <FadeIn delay={0.5}>
              <Button
                size="lg"
                className="h-12 rounded-xl bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                asChild
              >
                <a href="#">
                  {t.landing.about.readMore}
                  <ArrowRight size={18} className="ml-2" />
                </a>
              </Button>
            </FadeIn>
          </motion.div>

          <FadeIn direction="right" delay={0.15}>
            <div className="relative aspect-[4/3] max-w-lg overflow-hidden rounded-3xl border border-border/80 bg-muted/50 shadow-card">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    'url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80")',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
