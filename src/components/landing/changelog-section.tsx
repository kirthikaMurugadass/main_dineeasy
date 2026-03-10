"use client";

import { FadeIn } from "@/components/motion";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export function ChangelogSection() {
  const { resolvedTheme } = useTheme();

  return (
    <section 
      id="changelog"
      className={cn(
        "relative overflow-hidden border-t border-border/70 py-16 sm:py-20 md:py-24 lg:py-28 2xl:py-32",
        resolvedTheme === "dark" 
          ? "bg-[#000000]" 
          : "bg-[radial-gradient(circle_at_15%_0%,rgba(91,122,47,0.10),transparent_48%),radial-gradient(circle_at_95%_10%,rgba(232,228,217,0.75),transparent_55%),linear-gradient(180deg,var(--warm),var(--section-alt))]"
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-[90rem]">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Changelog
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-5 text-balance text-[clamp(2.2rem,3.4vw+0.6rem,3.1rem)] font-semibold leading-tight tracking-tight text-foreground dark:text-[#ffffff]">
              What&apos;s new in DineEasy
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg dark:text-[#bfbfbf]">
              Stay updated with the latest features, improvements, and updates to DineEasy.
            </p>
          </FadeIn>
        </div>

        <div className="mt-12 mx-auto max-w-4xl">
          <FadeIn delay={0.3}>
            <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
              <p className="text-center text-muted-foreground dark:text-[#bfbfbf]">
                Changelog coming soon. Check back for updates!
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
