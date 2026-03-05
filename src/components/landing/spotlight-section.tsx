"use client";

import { QrCode, Smartphone, Table2, ListTree, Clock3, Phone } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const spotlightItems = [
  {
    title: "QR menu access",
    description:
      "Generate branded QR codes for every table so guests can scan and open your live menu in seconds.",
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    title: "Instant food ordering",
    description:
      "Let guests send orders directly from their phone to your POS—no more waiting to flag staff.",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    title: "Table booking via QR",
    description:
      "Allow guests to reserve or join a waitlist by scanning your QR code online or at the door.",
    icon: <Table2 className="h-5 w-5" />,
  },
  {
    title: "Smart menu categories",
    description:
      "Organise dishes into intuitive categories so guests can quickly find exactly what they want.",
    icon: <ListTree className="h-5 w-5" />,
  },
  {
    title: "Real-time order management",
    description:
      "Track new, in-progress, and ready orders in a single, real-time view for your team.",
    icon: <Clock3 className="h-5 w-5" />,
  },
  {
    title: "Mobile-first digital menu",
    description:
      "A beautiful menu designed for phones—no pinching, zooming, or PDF downloads required.",
    icon: <Phone className="h-5 w-5" />,
  },
] as const;

export function SpotlightSection() {
  return (
    <section className="border-t border-border/60 bg-background/40 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Product Features
          </p>
          <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Everything you need to power QR-first dining.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {spotlightItems.map((item) => (
            <SpotlightCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

