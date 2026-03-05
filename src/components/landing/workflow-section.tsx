"use client";

import Link from "next/link";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { PhoneDemo } from "@/components/landing/phone-demo";

const steps = [
  {
    title: "Scan the QR code",
    description: "Guests point their camera at the table QR code—no app downloads or logins required.",
  },
  {
    title: "Order instantly from the menu",
    description: "Guests add items to cart, checkout in seconds, and get a confirmed order state—right on their phone.",
  },
  {
    title: "Book a table in seconds",
    description: "Guests choose a time slot and confirm a reservation with a clean, modern booking flow.",
  },
];

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="relative overflow-hidden border-t border-border/60 bg-background py-16 sm:py-20 md:py-24 lg:py-28 2xl:py-32"
    >
      {/* Ambient blur shapes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-10 h-72 w-72 rounded-full bg-[var(--sage-light)]/22 blur-3xl" />
        <div className="absolute right-[12%] bottom-[-5rem] h-80 w-80 rounded-full bg-[var(--sage-light)]/28 blur-3xl" />
        <div className="absolute left-1/2 top-[40%] h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--sage-light)]/18 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-[90rem]">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20">
          <div className="text-center lg:text-left">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                How it works
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h2 className="mt-4 font-sans text-[clamp(1.9rem,3vw+0.5rem,2.7rem)] font-semibold leading-tight tracking-tight text-foreground">
                A live product demo—right in your browser.
              </h2>
            </FadeIn>
            <FadeIn delay={0.14}>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                Watch the flow guests experience at the table: scan a QR, add items to cart, confirm an order,
                then reserve a time slot—all without downloading an app.
              </p>
            </FadeIn>
            <StaggerContainer className="mt-8 space-y-6 sm:mt-10 sm:space-y-7" staggerDelay={0.06}>
              {steps.map((step, i) => (
                <StaggerItem key={step.title} className="flex gap-4 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-card/70 text-sm font-semibold text-primary shadow-soft backdrop-blur">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
            <FadeIn delay={0.25}>
              <Link href="/signup" className="mt-8 inline-block sm:mt-10">
                <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                  Start with DineEasy
                </Button>
              </Link>
            </FadeIn>
          </div>
          <FadeIn delay={0.15} direction="left">
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-full max-w-[260px] sm:max-w-[290px] lg:max-w-[280px]">
                <PhoneDemo />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
