"use client";

import { motion } from "framer-motion";
import { ArrowRight, QrCode } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";

function FloatingQR() {
  return (
    <motion.div
      className="relative"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative rounded-3xl bg-white p-6 shadow-premium dark:bg-card">
        <div className="gradient-border rounded-2xl bg-warm/30 p-4 dark:bg-white/5">
          <div className="grid grid-cols-5 grid-rows-5 gap-1">
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.div
                key={i}
                className={`h-3 w-3 rounded-sm ${
                  [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 21, 22, 24].includes(i)
                    ? "bg-espresso dark:bg-warm"
                    : "bg-warm dark:bg-white/10"
                }`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.03, duration: 0.3 }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <QrCode size={12} className="text-gold" />
          <span className="text-[10px] font-medium text-muted-foreground">dineeasy.app/demo</span>
        </div>
      </div>
      {/* Glow behind */}
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gold/10 blur-2xl" />
    </motion.div>
  );
}

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 animate-kenburns bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      {/* Noise overlay */}
      <div className="noise absolute inset-0 -z-10" />

      {/* Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pt-24 lg:grid-cols-2 lg:pt-0">
        {/* Left: Text */}
        <div className="max-w-2xl">
          <FadeIn delay={0.2}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-medium text-gold">Made for Swiss Cafés</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <h1 className="font-serif text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              {t.landing.hero.title}
              <br />
              <span className="text-gradient-gold">{t.landing.hero.titleAccent}</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.5}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {t.landing.hero.subtitle}
            </p>
          </FadeIn>

          <FadeIn delay={0.7}>
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
                  className="h-13 px-8 text-base border-border/50"
                >
                  {t.landing.hero.ctaSecondary}
                </Button>
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.9}>
            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
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
            </div>
          </FadeIn>
        </div>

        {/* Right: Floating QR + Device Preview */}
        <FadeIn delay={0.6} direction="left" className="hidden lg:flex justify-center">
          <div className="relative">
            {/* Phone frame */}
            <motion.div
              className="relative z-10 w-[280px] rounded-[2.5rem] border-[8px] border-foreground/10 bg-card p-2 shadow-premium"
              initial={{ rotateY: 10, rotateX: -5 }}
              animate={{ rotateY: 0, rotateX: 0 }}
              transition={{ duration: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
              style={{ perspective: 1000 }}
            >
              <div className="overflow-hidden rounded-[2rem]">
                {/* Status bar */}
                <div className="flex items-center justify-between bg-card px-5 py-2">
                  <span className="text-[10px] font-medium">12:30</span>
                  <div className="mx-auto h-5 w-20 rounded-full bg-foreground/10" />
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-foreground/20" />
                    <div className="h-2 w-2 rounded-full bg-foreground/20" />
                  </div>
                </div>
                {/* Menu preview */}
                <div className="space-y-3 p-4">
                  <div className="h-24 rounded-xl bg-gradient-to-br from-warm to-warm/50 dark:from-white/5 dark:to-white/10" />
                  <div className="space-y-1">
                    <div className="h-3 w-3/4 rounded bg-foreground/10" />
                    <div className="h-2 w-1/2 rounded bg-foreground/5" />
                  </div>
                  <div className="flex gap-2">
                    {["Kaffee", "Gebäck", "Lunch"].map((cat) => (
                      <div
                        key={cat}
                        className="rounded-full bg-warm/50 dark:bg-white/5 px-3 py-1 text-[8px] font-medium"
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                      <div className="space-y-1">
                        <div className="h-2.5 w-20 rounded bg-foreground/10" />
                        <div className="h-2 w-14 rounded bg-foreground/5" />
                      </div>
                      <div className="font-mono text-[10px] font-medium text-gold">CHF {(4 + i * 1.5).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating QR */}
            <motion.div
              className="absolute -right-16 -top-8 z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <FloatingQR />
            </motion.div>

            {/* Background decorative elements */}
            <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-gold/5 blur-3xl" />
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-olive/10 blur-3xl" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
