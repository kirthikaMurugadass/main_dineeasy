"use client";

import Image from "next/image";
import { ChevronRight, QrCode, ListTree, Clock3 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function MenuCardsSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible: sectionVisible } =
    useScrollReveal<HTMLElement>();
  const { ref: cardsRef, isVisible: cardsVisible } =
    useScrollReveal<HTMLDivElement>();

  type CardWithIcon = {
    title: string;
    body: string;
    cta: string;
    icon: typeof QrCode;
  };

  const cards: CardWithIcon[] = (t.home?.menuCards?.cards || [
    {
      title: "QR code menu access",
      body: "Replace printed menus with branded QR codes on every table so guests can instantly open your live menu.",
      cta: "See QR menu flow",
    },
    {
      title: "Smart menu categories",
      body: "Group dishes by course, dietary needs, or specials so browsing feels natural on any phone.",
      cta: "Organise your menu",
    },
    {
      title: "Real-time updates",
      body: "Hide sold-out items, update prices, and launch promos in seconds—no re-printing or PDFs.",
      cta: "Manage items live",
    },
  ]).map((card: { title: string; body: string; cta: string }, index: number) => {
    const icons: typeof QrCode[] = [QrCode, ListTree, Clock3];
    return { ...card, icon: icons[index] };
  });

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
              {t.home?.menuCards?.badge || "QR-powered journey"}
            </p>
            <h2 className="text-center text-[clamp(1.8rem,3vw+0.5rem,2.4rem)] font-semibold leading-tight tracking-tight text-foreground lg:text-left">
              {t.home?.menuCards?.title || "From scan to paid in a single digital flow."}
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground lg:mx-0">
              {t.home?.menuCards?.description || "DineEasy connects each table to a live, mobile-first menu. Guests scan a QR code, browse categories, place orders, and come back again—all without installing an app."}
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
                "group flex h-full flex-col rounded-[2.5rem] border border-border/50 bg-[#f0fdf4] px-6 py-8 shadow-soft backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-[rgba(255,255,255,0.05)] dark:backdrop-blur-xl",
                `delay-${(index + 1) * 100}`
              )}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-soft">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {body}
              </p>

              <div className="my-6 border-b border-border/40 dark:border-white/10" />

              <button
                type="button"
                className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary/90"
              >
                {cta}
                <ChevronRight className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

