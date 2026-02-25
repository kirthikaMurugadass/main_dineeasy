"use client";

import { motion, type Variants, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { PhoneMockup } from "./phone-mockup";
import { useRef } from "react";

const slideFromLeft: Variants = {
  hidden: { x: -60, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: "easeOut", delay: i * 0.1 },
  }),
};

const slideFromRight: Variants = {
  hidden: { x: 60, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: "easeOut", delay: 0.2 },
  },
};

export function Hero() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax effect for phone mockup
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section ref={sectionRef} className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[url('/images/image2.jpg')] bg-cover bg-center bg-no-repeat" />
        {/* Black overlay for contrast, lighter in center */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      </div>

      <div className="noise absolute inset-0 -z-10" />

      {/* Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-32 pb-24 lg:grid-cols-2 lg:gap-16 lg:pt-32">
        {/* Left: Text — slides in from the left, children staggered by 0.1s */}
        <div className="w-full max-w-2xl lg:max-w-none lg:pr-8">
          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-medium text-gold">{t.landing.hero.badge}</span>
            </div>
          </motion.div>

          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <h1 className="font-sans text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              <span className="block">{t.landing.hero.title}</span>
              <br />
              <span className="block text-gradient-gold">{t.landing.hero.titleAccent}</span>
            </h1>
          </motion.div>

          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <p className="mt-6 text-lg leading-relaxed text-white/85 lg:max-w-xl">
              {t.landing.hero.subtitle}
            </p>
          </motion.div>

          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="group bg-espresso text-warm hover:bg-espresso/90 glow-gold h-13 px-8 text-base"
                >
                  {t.landing.hero.cta}
                  <ArrowRight
                    size={16}
                    className="ml-2 transition-transform group-hover:translate-x-1"
                  />
                </Button>
              </Link>
              <a href="#demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 text-base border-white/50 bg-transparent text-white shadow-none hover:bg-white/15 hover:text-white hover:border-white/60 focus-visible:ring-white/30"
                >
                  {t.landing.hero.ctaSecondary}
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            {/* <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                4 languages
              </div>
            </div> */}
          </motion.div>
        </div>

        {/* Right: Phone Mockup — slides in from the right */}
        <motion.div
          variants={slideFromRight}
          initial="hidden"
          animate="visible"
          className="flex justify-center lg:justify-end relative z-10"
          style={parallaxY ? { y: parallaxY } : undefined}
        >
          <div className="relative w-full max-w-sm shrink-0">
            <PhoneMockup withFloating={true} />
            {/* Decorative glow effects */}
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 h-64 w-32 rounded-full bg-gold/10 blur-3xl -z-10" />
            <div className="absolute -right-16 top-1/3 h-48 w-32 rounded-full bg-olive/10 blur-3xl -z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
