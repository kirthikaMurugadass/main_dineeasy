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
    <section className="relative overflow-hidden py-32 lg:py-40">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/image1.jpg"
          alt=""
          fill
          className="object-cover"
          priority={false}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-primary/75 dark:bg-primary/85" />
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

      <div className="relative mx-auto max-w-3xl px-6 text-center">
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
                className="h-14 rounded-xl bg-primary-foreground px-10 text-base font-semibold text-primary shadow-floating hover:bg-primary-foreground/95"
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
