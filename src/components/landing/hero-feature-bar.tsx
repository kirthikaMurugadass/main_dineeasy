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
      className="relative z-20 -mt-14 mb-10 px-4 sm:-mt-16 sm:px-6 lg:-mt-20"
    >
      <div
        ref={ref}
        className={cn(
          "mx-auto max-w-5xl rounded-[2.5rem] border border-border/70 bg-[var(--feature-bar)]/95 shadow-lg shadow-black/5 backdrop-blur-md",
          "fade-up",
          isVisible && "is-visible"
        )}
      >
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:gap-6 sm:px-8 sm:py-6 lg:px-10 lg:py-7">
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
