"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FadeIn, MagneticButton } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";

export function CTASection() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden py-32">
      {/* Background image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/image1.jpg"
          alt=""
          fill
          className="object-cover"
          priority={false}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-espresso/60 dark:bg-card/70" />
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl -z-10"
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-olive/10 blur-3xl -z-10"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Noise */}
      <div className="noise absolute inset-0 -z-[5]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <FadeIn>
          <h2 className="font-sans text-4xl font-semibold tracking-tight text-warm sm:text-5xl lg:text-6xl">
            {t.landing.cta.title}
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-lg text-lg text-warm/70">
            {t.landing.cta.subtitle}
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-12">
            <MagneticButton>
              <Link href="/login">
                <Button
                  size="lg"
                  className="group h-14 rounded-full bg-gold px-10 text-base font-semibold text-espresso hover:bg-gold/90 animate-pulse-glow"
                >
                  {t.landing.cta.button}
                  <ArrowRight
                    size={18}
                    className="ml-2 transition-transform group-hover:translate-x-1"
                  />
                </Button>
              </Link>
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
