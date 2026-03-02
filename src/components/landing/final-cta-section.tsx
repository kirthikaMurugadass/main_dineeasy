"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function FinalCtaSection() {
  const { t } = useI18n();

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-border/60 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),transparent_60%),radial-gradient(circle_at_bottom,_rgba(148,163,184,0.04),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.45),transparent_60%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.6),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/96 to-background" />
      </div>
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <FadeIn>
          <h2 className="font-sans text-[clamp(1.9rem,3.1vw+0.5rem,2.6rem)] font-semibold leading-tight tracking-tight text-foreground">
            {t.landing.finalCta.headline}
          </h2>
        </FadeIn>
        <FadeIn delay={0.08}>
          <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
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
              <Button
                size="lg"
                className="h-11 rounded-xl px-7 text-sm font-semibold shadow-soft hover:shadow-md"
              >
                {t.landing.finalCta.button}
              </Button>
            </motion.div>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
