"use client";

import { SpotlightCard } from "@/components/ui/spotlight-card";

const spotlightItems = [
  {
    title: "Fast setup",
    description:
      "Launch your digital menu in minutes, not weeks, with opinionated defaults and smart presets.",
  },
  {
    title: "Multi-language support",
    description:
      "Serve guests in English, German, French, and Italian with a single, centrally managed menu.",
  },
  {
    title: "QR menu system",
    description:
      "Generate beautiful QR codes for tables, windows, and print, all linked to your live menu.",
  },
  {
    title: "Real-time updates",
    description:
      "Change prices, availability, or specials instantly—guests always see the latest version.",
  },
  {
    title: "Analytics ready",
    description:
      "Get your menu structure ready for insights—what guests view, what converts, and what needs attention.",
  },
  {
    title: "Cloud sync",
    description:
      "Your menus stay in sync across all devices and locations, with nothing to install or maintain.",
  },
];

export function SpotlightSection() {
  return (
    <section className="border-t border-border/60 bg-background/40 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Product
          </p>
          <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Everything you need. Nothing you don’t.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {spotlightItems.map((item) => (
            <SpotlightCard
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

