"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-border/60 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(22,101,52,0.12),transparent_60%),radial-gradient(circle_at_bottom,_rgba(22,163,74,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/98 to-background" />
      </div>
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <FadeIn>
          <h2 className="font-sans text-[clamp(1.9rem,3.1vw+0.5rem,2.6rem)] font-semibold leading-tight tracking-tight text-foreground">
            Ready to bring QR-first dining to your restaurant?
          </h2>
        </FadeIn>
        <FadeIn delay={0.08}>
          <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            Launch your digital menu with DineEasy in minutes. Start free, connect your tables, and
            let guests scan, browse, and order from anywhere in your space.
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
                className="h-11 rounded-full px-7 text-sm font-semibold shadow-soft hover:shadow-md"
              >
                Get started with DineEasy
              </Button>
            </motion.div>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
