"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const featuresFree = [
  "Menu management",
  "Public menu page",
  "Basic dashboard",
];

const featuresPro = [
  "Menu management",
  "Table booking",
  "Real-time table selection",
  "Booking notifications",
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const isAnnual = billingCycle === "annual";

  return (
    <section className="relative overflow-hidden border-t border-border/70 bg-[radial-gradient(circle_at_15%_0%,rgba(91,122,47,0.10),transparent_48%),radial-gradient(circle_at_95%_10%,rgba(232,228,217,0.75),transparent_55%),linear-gradient(180deg,var(--warm),var(--section-alt))] py-16 sm:py-20 md:py-24 lg:py-28 2xl:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-10 h-72 w-72 rounded-full bg-primary/12 blur-3xl animate-parallax-bg" />
        <div
          className="absolute right-[8%] bottom-[-5rem] h-80 w-80 rounded-full bg-[var(--sage-light)]/40 blur-3xl animate-parallax-bg"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute left-1/2 top-[40%] h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl animate-parallax-bg"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-[90rem]">
        {/* 1️⃣ Top Area (Centered) */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Pricing
          </p>
          <h2 className="mt-5 text-balance text-[clamp(2.2rem,3.4vw+0.6rem,3.1rem)] font-semibold leading-tight tracking-tight text-foreground">
            Simple pricing for busy restaurants.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Start with the Free plan in minutes. When you&apos;re ready for full
            table booking and realtime coordination, upgrade to Pro with a
            single click.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <div className="relative inline-flex items-center gap-1 rounded-full bg-white/55 p-1 ring-1 ring-primary/15 backdrop-blur-xl shadow-soft">
              <motion.div
                className="absolute inset-y-1 w-[92px] rounded-full bg-primary shadow-soft"
                animate={{ x: isAnnual ? 98 : 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  !isAnnual ? "text-primary-foreground" : "text-muted-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={cn(
                  "relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  isAnnual ? "text-primary-foreground" : "text-muted-foreground"
                )}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2 py-1 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Flexible billing
            </span>
            <span>Switch between monthly and annual anytime.</span>
          </div>
        </div>

        {/* 2️⃣ Bottom Area (Cards Section) */}
        <div className="mt-10 mx-auto grid w-full max-w-5xl grid-cols-1 items-stretch justify-items-center gap-5 sm:mt-12 sm:gap-6 md:grid-cols-2 md:gap-6 lg:mt-14 lg:gap-8">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            whileHover={{ y: -5 }}
            className="h-full w-full max-w-[460px]"
          >
            <div className="group relative flex h-full flex-col rounded-2xl border border-primary/18 bg-white/55 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:shadow-card">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_0%,rgba(232,228,217,0.75),transparent_60%)] opacity-80" />
              <div className="mb-3">
                <h3 className="text-base font-semibold text-foreground">Free</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Perfect to launch your digital menu.
                </p>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">₹0</span>
                <span className="text-xs text-muted-foreground">/ forever</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {featuresFree.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary/70" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Button
                  asChild
                className="h-11 w-full rounded-xl border border-primary/20 bg-white/55 text-sm font-semibold text-foreground shadow-soft backdrop-blur transition-all duration-300 hover:bg-white/70 hover:shadow-md"
                >
                  <Link href="/signup?plan=free">Start Free</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -5 }}
            className="h-full w-full max-w-[460px]"
          >
            <div className="group relative flex h-full flex-col rounded-2xl border border-primary/26 bg-white/60 p-6 shadow-card backdrop-blur-xl transition-all duration-300 hover:shadow-floating">
              <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-[radial-gradient(circle_at_20%_0%,rgba(91,122,47,0.18),transparent_60%),radial-gradient(circle_at_90%_20%,rgba(232,228,217,0.65),transparent_60%)] opacity-80" />
              <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-primary/18 bg-white/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-soft backdrop-blur">
                <Crown className="h-3 w-3" />
                Most popular
              </div>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-foreground">Pro</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Full booking system with realtime coordination.
                </p>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {isAnnual ? "₹9,999" : "₹999"}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {isAnnual ? "year" : "month"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Billed {isAnnual ? "once per year" : "monthly"}. Cancel anytime.
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {featuresPro.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary/70" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Button
                  asChild
                  className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.01] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
                >
                  <Link href={`/signup?plan=pro&billing=${billingCycle}`}>
                    Upgrade to Pro
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

