"use client";

import { FadeIn } from "@/components/motion";

const metrics = [
  { label: "Average time saved per table", value: "5–7 min" },
  { label: "Orders handled with DineEasy", value: "100K+" },
  { label: "Reduction in menu printing costs", value: "90%" },
  { label: "Uptime for your digital menu", value: "99.9%" },
];

export function TrustSection() {
  return (
    <section className="relative border-t border-border/60 bg-background py-16 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-[90rem]">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Built for busy dining rooms
            </p>
          </FadeIn>
          <FadeIn delay={0.06}>
            <h2 className="mt-4 font-sans text-[clamp(1.8rem,2.8vw+0.5rem,2.3rem)] font-semibold leading-tight text-foreground">
              Trusted by modern cafés, bistros, and restaurants.
            </h2>
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Whether you run a neighbourhood brunch spot or a multi-location group, DineEasy keeps
              your QR menus fast, reliable, and always up to date.
            </p>
          </FadeIn>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <FadeIn key={metric.label} delay={0.16}>
              <div className="rounded-2xl border border-border/70 bg-card/90 px-5 py-6 text-center shadow-soft">
                <p className="text-xl font-semibold text-foreground">{metric.value}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
