"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
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
    <section className="relative overflow-hidden border-t border-border/70 bg-[radial-gradient(circle_at_15%_0%,rgba(91,122,47,0.10),transparent_48%),radial-gradient(circle_at_95%_10%,rgba(232,228,217,0.75),transparent_55%),linear-gradient(180deg,var(--warm),var(--section-alt))] py-24 sm:py-28 lg:py-32">
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

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        {/* 1️⃣ Top Area (Centered) */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center justify-center rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-primary shadow-soft backdrop-blur">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
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
            <div className="relative inline-flex items-center gap-1 rounded-full bg-card/80 p-1 ring-1 ring-border/60 backdrop-blur-xl shadow-soft">
              <motion.div
                className="absolute inset-y-1 w-[92px] rounded-full bg-foreground shadow-soft"
                animate={{ x: isAnnual ? 98 : 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  !isAnnual ? "text-background" : "text-muted-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={cn(
                  "relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  isAnnual ? "text-background" : "text-muted-foreground"
                )}
              >
                Annual
                <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  Save 17%
                </span>
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
        <div className="mt-14 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:gap-8">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="h-full"
          >
            <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/85 p-6 shadow-soft backdrop-blur">
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
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Button
                  asChild
                  className="h-11 w-full rounded-xl bg-foreground text-sm font-semibold text-background shadow-soft hover:bg-foreground/90"
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
            className="h-full"
          >
            <div className="relative flex h-full flex-col rounded-2xl border border-primary/60 bg-gradient-to-b from-primary/90 via-primary to-primary/90 p-6 text-primary-foreground shadow-glow">
              <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                <Crown className="h-3 w-3" />
                Most popular
              </div>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-primary-foreground">Pro</h3>
                <p className="mt-1 text-xs text-primary-foreground/80">
                  Full booking system with realtime coordination.
                </p>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {isAnnual ? "₹9,999" : "₹999"}
                </span>
                <span className="text-xs text-primary-foreground/80">
                  / {isAnnual ? "year" : "month"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-primary-foreground/75">
                Billed {isAnnual ? "once per year" : "monthly"}. Cancel anytime.
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {featuresPro.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-200" />
                    <span className="text-primary-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Button
                  asChild
                  className="h-11 w-full rounded-xl bg-primary-foreground text-sm font-semibold text-primary shadow-soft hover:bg-primary-foreground/95"
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

