"use client";

import type { ReactNode } from "react";
import { SpotlightCard as ReactBitsSpotlightCard } from "@/lib/reactbits";
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
    "relative flex flex-col gap-3 rounded-2xl border px-5 py-6 sm:px-6 sm:py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const lightStyles =
    "border-border/70 bg-card shadow-sm";

  const darkStyles =
    "border-border/60 bg-card/95 shadow-sm";

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
          "transform-gpu will-change-transform transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-lg",
          className
        )}
      >
        <div className="flex items-start gap-3">
          {icon && <div className="mt-1 text-primary">{icon}</div>}
          <div className="text-left">
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
