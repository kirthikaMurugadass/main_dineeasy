"use client";

import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

export function Features() {
  const { t } = useI18n();

  const prefersReduced = useReducedMotion();

  const blocks = [
    { feature: t.landing.features.qr, variant: "scan" as const },
    { feature: t.landing.features.multilang, variant: "order" as const },
    { feature: t.landing.features.themes, variant: "booking" as const },
  ];

  function DeviceFrame({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <div className={cn("relative mx-auto w-full max-w-[520px]", className)} style={{ aspectRatio: "16 / 10" }}>
        {/* soft shadow */}
        <div className="pointer-events-none absolute left-1/2 top-[92%] h-16 w-[22rem] -translate-x-1/2 rounded-full bg-black/10 blur-3xl dark:bg-black/40" />

        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] ring-1 ring-black/10 backdrop-blur-xl shadow-floating dark:ring-white/10">
          {/* light sweep */}
          <div className="pointer-events-none absolute -inset-[55%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent)] mix-blend-screen opacity-30 animate-phone-glare" />
          <div className="relative p-4 sm:p-5">{children}</div>
        </div>
      </div>
    );
  }

  function PhoneMini({
    variant,
  }: {
    variant: "scan" | "order" | "booking";
  }) {
    return (
      <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px]" style={{ aspectRatio: "9 / 19.5" }}>
        {/* frame */}
        <div className="absolute inset-0 rounded-[52px] bg-[linear-gradient(135deg,rgba(15,23,42,0.48),rgba(255,255,255,0.70),rgba(15,23,42,0.36))] shadow-[0_50px_110px_rgba(15,23,42,0.18)] ring-1 ring-black/10 dark:ring-white/10" />
        <div className="absolute inset-[2px] rounded-[50px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.16))] opacity-95" />
        <div className="absolute inset-[10px] rounded-[44px] bg-black/92 ring-1 ring-white/12" />

        {/* screen */}
        <div className="absolute inset-[14px] overflow-hidden rounded-[40px] bg-[var(--background)] ring-1 ring-white/20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)]">
          <div className="pointer-events-none absolute left-1/2 top-2 h-6 w-28 -translate-x-1/2 rounded-full bg-black/92 ring-1 ring-white/10" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -inset-[55%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] mix-blend-screen animate-phone-glare" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.10),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(91,122,47,0.08),transparent_55%)]" />
          </div>

          <div className="relative px-4 pb-4 pt-10">
            {variant === "scan" && (
              <div className="rounded-3xl bg-[var(--hero-bg)] p-4 ring-1 ring-border/60 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Table QR</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Scan to view menu</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-primary/12 ring-1 ring-primary/20" />
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
                  <div className="h-20 rounded-2xl bg-white/45" />
                  <div className="relative h-16 w-14 rounded-2xl bg-white/70 ring-1 ring-white/60 shadow-[0_0_0_8px_rgba(122,158,74,0.16)]" />
                </div>
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute left-8 right-8 h-0.5 rounded-full bg-primary/75 blur-[0.35px]"
                  animate={prefersReduced ? undefined : { top: ["28%", "78%", "28%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ opacity: 0.8 }}
                />
              </div>
            )}

            {variant === "order" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-card/70 px-4 py-3 ring-1 ring-border/60 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold text-foreground">DineEasy</p>
                    <p className="text-[11px] text-muted-foreground">Menu · Table 12</p>
                  </div>
                  <div className="relative">
                    <div className="h-9 w-9 rounded-2xl bg-primary/10 ring-1 ring-primary/20" />
                    <div className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/30">
                      1
                    </div>
                  </div>
                </div>
                {[
                  { n: "Garden Wrap", p: "CHF 9.90" },
                  { n: "Avocado Bowl", p: "CHF 12.50" },
                ].map((it) => (
                  <div key={it.n} className="flex items-center gap-3 rounded-2xl bg-card/80 p-3 ring-1 ring-border/60 backdrop-blur">
                    <div className="h-12 w-12 rounded-xl bg-[linear-gradient(135deg,rgba(91,122,47,0.14),rgba(232,228,217,0.75))]" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{it.n}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{it.p}</p>
                    </div>
                    <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                      Added
                    </span>
                  </div>
                ))}
                <div className="rounded-3xl bg-primary/10 p-4 ring-1 ring-primary/20">
                  <p className="text-xs font-semibold text-foreground">Order confirmed</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Sent to kitchen instantly</p>
                </div>
              </div>
            )}

            {variant === "booking" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-card/70 px-4 py-3 ring-1 ring-border/60 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Book a table</p>
                    <p className="text-[11px] text-muted-foreground">Pick a time</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-primary/10 ring-1 ring-primary/20" />
                </div>
                <div className="rounded-3xl bg-card/80 p-4 ring-1 ring-border/60 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Select time
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["6:30", "7:00", "7:30", "8:00", "8:30", "9:00"].map((t, i) => (
                      <span
                        key={t}
                        className={cn(
                          "flex items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold",
                          i === 2 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--hero-bg)] px-3 py-3">
                    <p className="text-xs font-medium text-foreground">2 guests · Indoors</p>
                    <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                      Reserve
                    </span>
                  </div>
                </div>
                <div className="rounded-3xl bg-primary/10 p-4 ring-1 ring-primary/20 shadow-[0_0_0_8px_rgba(122,158,74,0.10)]">
                  <p className="text-xs font-semibold text-foreground">Table reserved</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Confirmation sent</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section
      id="features"
      ref={ref}
      className={cn(
        "relative py-24 md:py-28 lg:py-32",
        "fade-up",
        isVisible && "is-visible",
        "bg-[radial-gradient(circle_at_15%_0%,rgba(91,122,47,0.10),transparent_48%),radial-gradient(circle_at_95%_10%,rgba(232,228,217,0.80),transparent_55%),linear-gradient(180deg,var(--warm),var(--section-alt))]"
      )}
    >
      {/* background blur shapes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-14 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-parallax-bg" />
        <div className="absolute right-[10%] top-10 h-80 w-80 rounded-full bg-[var(--sage-light)]/30 blur-3xl animate-parallax-bg" style={{ animationDelay: "2s" }} />
        <div className="absolute left-1/2 bottom-[-10rem] h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl animate-parallax-bg" style={{ animationDelay: "4s" }} />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="mb-4 text-sm tracking-widest text-green-700 dark:text-primary">
              {t.landing.features.label}
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h2 className="text-balance text-[clamp(2.25rem,3.6vw+0.6rem,3.4rem)] font-bold leading-tight tracking-tight text-foreground">
              <span className="bg-[linear-gradient(90deg,var(--foreground),rgba(122,158,74,0.95))] bg-clip-text text-transparent">
                {t.landing.features.title}
              </span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t.landing.features.subtitle}
            </p>
          </FadeIn>
        </div>

        {/* Glass container */}
        <div className="mt-14 rounded-[2.25rem] bg-white/40 p-6 ring-1 ring-black/5 backdrop-blur-xl shadow-floating dark:bg-card/30 dark:ring-white/10 sm:p-8 lg:p-10">
          <StaggerContainer className="space-y-12" staggerDelay={0.12}>
            {blocks.map((b, idx) => {
              const isReverse = idx === 1;
              return (
                <StaggerItem key={b.feature.title}>
                  <div className={cn("grid items-center gap-10 lg:grid-cols-2 lg:gap-12", isReverse && "lg:[&>*:first-child]:order-2")}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      className="relative"
                    >
                      <div className={cn("relative", !prefersReduced && "animate-phone-float")}>
                        <DeviceFrame>
                          <PhoneMini variant={b.variant} />
                        </DeviceFrame>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="text-left"
                    >
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {b.feature.title}
                      </h3>
                      <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {b.feature.description}
                      </p>
                    </motion.div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
