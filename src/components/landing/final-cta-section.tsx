"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function FinalCtaSection() {
  const { t } = useI18n();

  return (
    <section id="pricing" className="relative overflow-hidden border-t border-border/60 py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
      <div className="absolute left-1/2 top-1/4 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <FadeIn>
          <h2 className="font-sans text-[clamp(1.75rem,3vw+0.5rem,2.5rem)] font-semibold leading-tight tracking-tight text-foreground">
            {t.landing.finalCta.headline}
          </h2>
        </FadeIn>
        <FadeIn delay={0.08}>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.landing.finalCta.subhead}
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <Link href="/signup" className="mt-10 inline-block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button size="lg" className="h-12 rounded-xl px-8 text-base">
                {t.landing.finalCta.button}
              </Button>
            </motion.div>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
