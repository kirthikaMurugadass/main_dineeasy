"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[var(--hero-bg)] pt-12 pb-8 sm:pt-14 sm:pb-10 md:pt-18 md:pb-12 lg:pt-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-[90rem]">
        <div className="relative z-10 rounded-[22px] bg-primary/24 shadow-[0_22px_70px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
          <div className="grid items-center gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 md:grid-cols-[300px_1fr] md:gap-8 md:px-8 md:py-10 lg:grid-cols-[340px_1fr] lg:gap-10 lg:px-12 lg:py-12">
            {/* Illustration */}
            <div className="relative mx-auto w-full max-w-[360px] md:max-w-none">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[22px] bg-white/55 ring-1 ring-black/10 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.65),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(0,0,0,0.10),transparent_55%)]" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/images/image2.jpg"
                    alt="DineEasy preview"
                    fill
                    className="object-cover opacity-95"
                    sizes="(max-width: 768px) 90vw, 340px"
                    priority={false}
                  />
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center md:text-left">
              <FadeIn>
                <h2 className="text-balance font-sans text-[clamp(1.9rem,3vw+0.6rem,2.75rem)] font-semibold leading-[1.15] tracking-tight text-foreground">
                  Ready to bring QR-first dining to your restaurant?
                </h2>
              </FadeIn>
              <FadeIn delay={0.12}>
                <p className="mx-auto mt-4 max-w-2xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base md:mx-0">
                  Launch your digital menu with DineEasy in minutes. Start free, connect your tables, and
                  let guests scan, browse, and order from anywhere in your space.
                </p>
              </FadeIn>

              <FadeIn delay={0.18}>
                <div className="mt-7">
                  <Link href="/signup" className="inline-block">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    >
                      <Button
                        size="lg"
                        className="h-11 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_rgba(91,122,47,0.25)] hover:bg-primary/90"
                      >
                        Get started with DineEasy
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
