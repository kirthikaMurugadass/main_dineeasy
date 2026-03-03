"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <section className="relative border-t border-border/70 bg-gradient-to-b from-background via-background/98 to-background py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-12 top-10 h-64 rounded-[40px] bg-gradient-to-tr from-primary/4 via-primary/2 to-primary/4 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 lg:flex-row lg:items-start lg:gap-12 lg:px-8">
        <div className="max-w-xl">
          <p className="inline-flex items-center rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-primary shadow-soft backdrop-blur">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Pricing
          </p>
          <h2 className="mt-4 text-balance text-[clamp(2rem,3vw+1rem,2.8rem)] font-semibold leading-tight tracking-tight text-foreground">
            Simple pricing for busy restaurants.
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Start with the Free plan in minutes. When you&apos;re ready for full
            table booking and realtime coordination, upgrade to Pro with a
            single click.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2 py-1 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Flexible billing
            </span>
            <span>Switch between monthly and annual anytime.</span>
          </div>
        </div>

        <div className="w-full max-w-xl lg:ml-auto">
          <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
            <span
              className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 transition ${
                !isAnnual
                  ? "bg-foreground text-background shadow-soft"
                  : "bg-card/80"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </span>
            <span
              className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 transition ${
                isAnnual
                  ? "bg-foreground text-background shadow-soft"
                  : "bg-card/80"
              }`}
              onClick={() => setBillingCycle("annual")}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                Save 17%
              </span>
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Free
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Perfect to launch your digital menu.
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  ₹0
                </span>
                <span className="text-xs text-muted-foreground">/ forever</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {featuresFree.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-6 h-10 w-full rounded-xl bg-foreground text-sm font-semibold text-background shadow-soft hover:bg-foreground/90"
              >
                <Link href="/signup?plan=free">Start Free</Link>
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative flex h-full flex-col rounded-2xl border border-primary/60 bg-gradient-to-b from-primary/90 via-primary to-primary/90 p-5 text-primary-foreground shadow-glow"
            >
              <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                <Crown className="h-3 w-3" />
                Most popular
              </div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-primary-foreground">
                    Pro
                  </h3>
                  <p className="mt-1 text-xs text-primary-foreground/80">
                    Full booking system with realtime coordination.
                  </p>
                </div>
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
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {featuresPro.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-200" />
                    <span className="text-primary-foreground/90">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-6 h-10 w-full rounded-xl bg-primary-foreground text-sm font-semibold text-primary shadow-soft hover:bg-primary-foreground/95"
              >
                <Link href={`/signup?plan=pro&billing=${billingCycle}`}>
                  Upgrade to Pro
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

