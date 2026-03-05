"use client";

import { QrCode, UtensilsCrossed, Table2 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

const items = [
  {
    icon: QrCode,
    title: "Scan & view menu",
    body: "Place a unique QR code on every table so guests can open your live digital menu in seconds.",
  },
  {
    icon: UtensilsCrossed,
    title: "Order instantly",
    body: "Let guests send food and drink orders directly from their phone—no more waiting to flag staff.",
  },
  {
    icon: Table2,
    title: "Book tables with QR",
    body: "Allow customers to join a waitlist or reserve tables ahead of time using the same simple QR flow.",
  },
] as const;

export function HeroFeatureBar() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <section
      aria-label="DineEasy highlights"
      className="relative z-20 -mt-12 mb-8 px-4 sm:-mt-14 sm:mb-10 sm:px-6 lg:-mt-20 lg:mb-12"
    >
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full max-w-7xl rounded-[2rem] border border-border/70 bg-[var(--feature-bar)]/95 shadow-lg shadow-black/5 backdrop-blur-md sm:rounded-[2.5rem] 2xl:max-w-[90rem]",
          "fade-up",
          isVisible && "is-visible"
        )}
      >
        <div className="grid gap-4 px-4 py-5 sm:grid-cols-3 sm:gap-6 sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10">
          {items.map(({ icon: Icon, title, body }, index) => (
            <div
              key={title}
              className={cn(
                "flex items-start gap-3 rounded-2xl px-1 py-1 sm:px-2",
                `delay-${(index + 1) * 100}`
              )}
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-soft">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
