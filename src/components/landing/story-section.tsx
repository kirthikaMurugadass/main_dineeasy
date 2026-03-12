"use client";

import Link from "next/link";
import { FadeIn, ScrollReveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { Sparkles, Zap, GaugeCircle, Smile } from "lucide-react";

export function StorySection() {
  const { t } = useI18n();
  
  type BenefitWithIcon = {
    title: string;
    body: string;
    icon: React.ReactElement;
  };

  const benefits: BenefitWithIcon[] = (t.home?.story?.benefits || [
    {
      title: "Contactless dining experience",
      body: "Guests browse the full menu, place orders, and pay from their phone—no printed menus required.",
    },
    {
      title: "Faster order processing",
      body: "Orders go straight from the table to your kitchen or bar, reducing wait times and errors.",
    },
    {
      title: "Improved restaurant efficiency",
      body: "Turn tables faster, keep staff focused on hospitality, and let DineEasy handle the busy-work.",
    },
    {
      title: "Better customer experience",
      body: "Delight guests with shorter waits, effortless reordering, and clear, mobile-first menus.",
    },
  ]).map((item: { title: string; body: string }, index: number) => {
    const icons = [
      <Sparkles className="h-5 w-5" key="sparkles" />,
      <Zap className="h-5 w-5" key="zap" />,
      <GaugeCircle className="h-5 w-5" key="gauge" />,
      <Smile className="h-5 w-5" key="smile" />,
    ];
    return { ...item, icon: icons[index] };
  });

  return (
    <section className="relative border-t border-border/60 bg-gradient-to-b from-[var(--hero-bg)] via-[var(--section-alt)] to-background py-16 sm:py-20 md:py-24 lg:py-28 2xl:py-32 dark:bg-[#000000]">
      {/* soft radial accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 dark:hidden">
        <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[15%] bottom-[-4rem] h-72 w-72 rounded-full bg-[var(--sage-light)]/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-[90rem]">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn delay={0.1}>
            <p className="inline-flex items-center justify-center rounded-full bg-card/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary shadow-soft backdrop-blur">
              {t.home?.story?.badge || "Why DineEasy"}
            </p>
          </FadeIn>
          <ScrollReveal delay={0.05}>
            <h2 className="mt-5 text-balance text-[clamp(2.1rem,3.8vw+0.5rem,3rem)] font-semibold leading-tight tracking-tight text-foreground dark:text-[#ffffff]">
              {t.home?.story?.title || "Give every guest a smooth, contactless dining experience."}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg dark:text-[#bfbfbf]">
              {t.home?.story?.description || "DineEasy turns any table into a smart entry point for your restaurant—guests scan, browse, order, and book in seconds while your team focuses on hospitality."}
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 sm:grid-cols-2 lg:mt-14 lg:gap-7 lg:grid-cols-4">
          {benefits.map((item, index) => (
            <FadeIn key={item.title} delay={0.15 + index * 0.06}>
              <article className="group relative flex h-full flex-col rounded-2xl border border-border/50 bg-card/80 px-6 py-7 text-left shadow-card backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(15,23,42,0.18)] dark:bg-[#111111] dark:border-[#1f1f1f] dark:shadow-none dark:hover:-translate-y-1 dark:hover:border-[#2a2a2a] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/35 via-white/10 to-white/0 opacity-70 mix-blend-screen dark:hidden" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft group-hover:bg-primary/15 dark:bg-primary/15 dark:text-primary">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base dark:text-[#ffffff]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-[#bfbfbf]">
                      {item.body}
                    </p>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} direction="up">
          <div className="mt-12 text-center">
            <Link href="#workflow">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border border-primary/40 bg-card/80 px-8 text-sm font-semibold text-foreground shadow-soft backdrop-blur-md transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
              >
                {t.home?.story?.cta || "See how it works"}
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
