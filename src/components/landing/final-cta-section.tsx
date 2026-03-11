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
      className="relative overflow-hidden bg-[#f0fdf4] pt-12 pb-8 sm:pt-14 sm:pb-10 md:pt-18 md:pb-12 lg:pt-20 dark:bg-[rgba(255,255,255,0.05)]"
    >
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-10">
        <div className="w-full text-center">
              <FadeIn>
            <h2 className="text-balance font-sans text-[clamp(1.9rem,3vw+0.6rem,2.75rem)] font-semibold leading-[1.15] tracking-tight text-gray-900 dark:text-white">
                  {t.home?.finalCta?.title || "Ready to bring QR-first dining to your restaurant?"}
                </h2>
              </FadeIn>
              <FadeIn delay={0.12}>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t.home?.finalCta?.description || "Launch your digital menu with DineEasy in minutes. Start free, connect your tables, and let guests scan, browse, and order from anywhere in your space."}
                </p>
              </FadeIn>

              <FadeIn delay={0.18}>
            <div className="mt-8 sm:mt-10">
                  <Link href="/signup" className="inline-block">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    >
                      <Button
                        size="lg"
                    className="h-12 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/35"
                      >
                        {t.home?.finalCta?.button || "Get started with DineEasy"}
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </FadeIn>
        </div>
      </div>
    </section>
  );
}
