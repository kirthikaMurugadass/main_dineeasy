"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, MagneticButton } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";

export function CTASection() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden border-t border-border/70 bg-gradient-to-b from-background/98 via-background/95 to-background/98 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/92 py-28 lg:py-36">
      <div className="absolute inset-0 -z-20">
        <Image
          src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1600&q=80"
          alt="Subtle abstract restaurant background"
          fill
          className="object-cover opacity-20 dark:opacity-25"
          priority={false}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/88 to-background/96 dark:from-slate-950/82 dark:via-slate-950/88 dark:to-slate-950/96" />
      </div>
      <motion.div
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, -24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="noise absolute inset-0 -z-10" />

      <div className="relative mx-auto max-w-3xl px-6 text-center rounded-3xl border border-border/70 bg-card/85 shadow-floating backdrop-blur-xl py-12 lg:py-14">
        <FadeIn>
          <h2 className="font-sans text-[clamp(2.25rem,5vw,3.5rem)] font-semibold tracking-tight text-primary-foreground">
            {t.landing.cta.title}
          </h2>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="mx-auto mt-6 max-w-lg text-lg text-primary-foreground/85">
            {t.landing.cta.subtitle}
          </p>
        </FadeIn>
        <FadeIn delay={0.24}>
          <div className="mt-12">
            <MagneticButton>
              <Button
                size="lg"
                className="h-14 rounded-xl bg-primary-foreground px-10 text-base font-semibold text-primary shadow-glow hover:bg-primary-foreground/95 hover:shadow-floating"
                asChild
              >
                <Link href="/login">
                  {t.landing.cta.button}
                  <ArrowRight size={20} className="ml-2" />
                </Link>
              </Button>
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
