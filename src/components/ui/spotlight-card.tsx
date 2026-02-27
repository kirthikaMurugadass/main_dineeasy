"use client";

import type { ReactNode } from "react";
import { SpotlightCard as ReactBitsSpotlightCard } from "@appletosolutions/reactbits";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export function SpotlightCard({
  title,
  description,
  icon,
  className,
}: SpotlightCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const base =
    "relative overflow-hidden flex flex-col gap-3 rounded-2xl border px-5 py-6 sm:px-6 sm:py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const lightStyles =
    "border-slate-200 bg-card/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-[6px]";

  const darkStyles =
    "border-white/10 bg-slate-900/70 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl";

  return (
    <article
      tabIndex={0}
      aria-label={title}
      className="outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:rounded-2xl"
    >
      <ReactBitsSpotlightCard
        className={cn(
          base,
          isDark ? darkStyles : lightStyles,
          "transform-gpu will-change-transform transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl",
          className
        )}
      >
      {/* Glow / gradient layer behind content */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 transition-opacity duration-300",
          isDark
            ? "bg-gradient-to-b from-black/60 via-black/30 to-black/60"
            : "bg-gradient-to-b from-white/95 via-white/80 to-white/95"
        )}
      />

      <div className="relative z-10 flex items-start gap-3">
        {icon && <div className="mt-1 text-primary">{icon}</div>}
        <div
          className="text-left"
          style={
            isDark
              ? undefined
              : { textShadow: "0 1px 2px rgba(0,0,0,0.12)" }
          }
        >
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white sm:text-base">
            {title}
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
            {description}
          </p>
        </div>
      </div>
    </ReactBitsSpotlightCard>
    </article>
  );
}
