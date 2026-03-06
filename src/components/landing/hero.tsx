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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(2,6,23,0.55),transparent_55%),linear-gradient(to_right,rgba(2,6,23,0.65),rgba(15,23,42,0.45),rgba(15,23,42,0.35))]" />

      <div className="relative mx-auto flex min-h-[70vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28 lg:px-10 2xl:max-w-[90rem] 2xl:py-32">
        <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
          {/* Badge */}
          <p
            className={cn(
              "inline-flex items-center rounded-full bg-[#0f172a]/45 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#4ade80] shadow-soft",
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
              "mt-4 max-w-xl text-base leading-relaxed text-white/85 text-balance sm:text-lg",
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
              "mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start",
              "slide-in-left",
              visible && "is-visible",
              "delay-400"
            )}
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="group h-12 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/50"
              >
                {t.landing.hero.cta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#workflow">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 rounded-full border border-[#4ade80] bg-transparent px-7 text-sm font-medium text-white shadow-soft transition-all duration-300 hover:border-[#22c55e] hover:bg-primary/10 hover:text-white"
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
