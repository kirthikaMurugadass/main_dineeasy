"use client";

import Image from "next/image";
import { ChevronRight, QrCode, ListTree, Clock3 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

const cards = [
  {
    icon: QrCode,
    title: "QR code menu access",
    body: "Replace printed menus with branded QR codes on every table so guests can instantly open your live menu.",
    cta: "See QR menu flow",
  },
  {
    icon: ListTree,
    title: "Smart menu categories",
    body: "Group dishes by course, dietary needs, or specials so browsing feels natural on any phone.",
    cta: "Organise your menu",
  },
  {
    icon: Clock3,
    title: "Real-time updates",
    body: "Hide sold-out items, update prices, and launch promos in seconds—no re-printing or PDFs.",
    cta: "Manage items live",
  },
] as const;

export function MenuCardsSection() {
  const { ref: sectionRef, isVisible: sectionVisible } =
    useScrollReveal<HTMLElement>();
  const { ref: cardsRef, isVisible: cardsVisible } =
    useScrollReveal<HTMLDivElement>();

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative overflow-hidden bg-background py-16 sm:py-20 md:py-24 lg:py-28 2xl:py-32",
        "fade-up",
        sectionVisible && "is-visible"
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-[90rem]">
        {/* Heading + image row */}
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
          <div className="space-y-5">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-primary lg:text-left">
              QR-powered journey
            </p>
            <h2 className="text-center text-[clamp(1.8rem,3vw+0.5rem,2.4rem)] font-semibold leading-tight tracking-tight text-foreground lg:text-left">
              From scan to paid in a single digital flow.
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground lg:mx-0">
              DineEasy connects each table to a live, mobile-first menu. Guests
              scan a QR code, browse categories, place orders, and come back
              again—all without installing an app.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md rounded-3xl bg-[var(--hero-bg)] shadow-card">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/dine1.jpg"
                alt="Guests dining in a modern restaurant space"
                fill
                sizes="(min-width: 1024px) 24rem, (min-width: 768px) 20rem, 100vw"
                className="object-cover"
                priority={false}
              />
            </div>
          </div>
        </div>

        {/* Card row */}
        <div
          ref={cardsRef}
          className={cn(
            "mt-12 grid gap-5 sm:mt-14 sm:gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3",
            "fade-up",
            cardsVisible && "is-visible"
          )}
        >
          {cards.map(({ icon: Icon, title, body, cta }, index) => (
            <article
              key={title}
              className={cn(
                "group flex h-full flex-col rounded-[2.5rem] border border-border/50 bg-[var(--sage-light)]/90 px-6 py-8 shadow-soft backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-card",
                `delay-${(index + 1) * 100}`
              )}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-soft">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>

              <div className="my-6 border-b border-border/40" />

              <button
                type="button"
                className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sage-dark)] transition-colors duration-200 group-hover:text-primary"
              >
                {cta}
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

