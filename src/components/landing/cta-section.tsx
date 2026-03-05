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
    <section className="relative overflow-hidden border-t border-border/60 bg-[var(--dark-section)] py-28 text-[var(--dark-section-foreground)] lg:py-36">
      <div className="absolute inset-0 -z-20 opacity-30">
        <Image
          src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1600&q=80"
          alt="Subtle abstract restaurant background"
          fill
          className="object-cover opacity-20 dark:opacity-25"
          priority={false}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark-section)]/85 via-[var(--dark-section)]/90 to-[var(--dark-section)]/95" />
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

      <div className="relative mx-auto max-w-3xl rounded-3xl border border-border/70 bg-card/90 px-6 py-12 text-center shadow-floating backdrop-blur-xl lg:py-14">
        <FadeIn>
          <h2 className="font-sans text-[clamp(2.25rem,5vw,3.5rem)] font-semibold tracking-tight text-[var(--dark-section-foreground)]">
            {t.landing.cta.title}
          </h2>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="mx-auto mt-6 max-w-lg text-lg text-[var(--dark-section-foreground)]/80">
            {t.landing.cta.subtitle}
          </p>
        </FadeIn>
        <FadeIn delay={0.24}>
          <div className="mt-12">
            <MagneticButton>
              <Button
                size="lg"
                className="h-14 rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/35"
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
