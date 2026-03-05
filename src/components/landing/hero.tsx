"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function Hero() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation once on mount
    setVisible(true);
  }, []);

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        backgroundImage: "url('/images/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.55),transparent_55%),linear-gradient(to_right,rgba(0,0,0,0.65),rgba(0,0,0,0.45),rgba(0,0,0,0.35))]" />

      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl items-center px-6 py-20 md:py-24 lg:py-32 lg:px-10">
        <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
          {/* Badge */}
          <p
            className={cn(
              "inline-flex items-center rounded-full bg-black/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--sage-light)] shadow-soft",
              "slide-in-left",
              visible && "is-visible",
              "delay-100"
            )}
          >
            For Modern Restaurants
          </p>

          {/* Heading */}
          <h1
            className={cn(
              "mt-5 text-balance text-[clamp(2.4rem,4.4vw+1rem,3.9rem)] font-semibold leading-[1.05] tracking-tight",
              "slide-in-left",
              visible && "is-visible",
              "delay-200"
            )}
          >
            {t.landing.hero.title}
            {t.landing.hero.titleAccent && (
              <span className="mt-2 block bg-gradient-to-r from-[var(--sage-medium)] via-white to-[var(--sage-medium)] bg-clip-text text-transparent">
                {t.landing.hero.titleAccent}
              </span>
            )}
          </h1>

          {/* Description */}
          <p
            className={cn(
              "mt-4 max-w-xl text-lg leading-relaxed text-white/85 text-balance",
              "slide-in-left",
              visible && "is-visible",
              "delay-300"
            )}
          >
            {t.landing.hero.subtitle}
          </p>

          {/* Buttons */}
          <div
            className={cn(
              "mt-6 flex flex-wrap items-center gap-4 justify-center lg:justify-start",
              "slide-in-left",
              visible && "is-visible",
              "delay-400"
            )}
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="group h-12 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-black/35"
              >
                {t.landing.hero.cta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#workflow">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 rounded-full border border-white/50 bg-white/10 px-7 text-sm font-medium text-white shadow-soft transition-all duration-300 hover:bg-white/15"
              >
                {t.landing.hero.ctaSecondary}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
