"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  /** Render as link to home/admin */
  href?: string;
  /** Optional subtitle (e.g. "Admin Panel") */
  subtitle?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** "light" = white text (for dark overlays), "default" = foreground */
  variant?: "default" | "light";
  className?: string;
  /** Show icon only */
  iconOnly?: boolean;
}

const sizeMap = {
  sm: { icon: "h-8 w-8 text-sm", text: "text-base" },
  md: { icon: "h-9 w-9 text-lg", text: "text-lg" },
  lg: { icon: "h-12 w-12 text-xl", text: "text-xl" },
};

/**
 * Unified brand logo: icon + "DineEasy" text.
 * Uses the same font family as primary UI (Inter/system-ui).
 */
export function AppLogo({
  href,
  subtitle,
  size = "md",
  variant = "default",
  className,
  iconOnly = false,
}: AppLogoProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const s = sizeMap[size];
  const textColor = variant === "light" ? "text-white" : "text-foreground";
  const accentColor = variant === "light" ? "text-gold" : "text-gold";

  // Render logo text only after mount to avoid hydration mismatch from browser
  // extensions (e.g. Google Translate) that inject <font> tags before React hydrates
  const logoText = mounted ? (
    <div className="flex flex-col">
      <span
        className={cn(
          "font-sans font-semibold tracking-tight",
          textColor,
          s.text
        )}
      >
        Dine<span className={accentColor}>Easy</span>
      </span>
      {subtitle && (
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      )}
    </div>
  ) : (
    <div className={cn("flex flex-col min-w-[5.5rem]", s.text)} aria-hidden="true" />
  );

  const content = (
    <>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-espresso text-warm font-sans font-semibold shadow-sm",
          s.icon
        )}
      >
        D
      </div>
      {!iconOnly && logoText}
    </>
  );

  const wrapperClass = "flex items-center gap-2.5";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(wrapperClass, className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn(wrapperClass, className)}>
      {content}
    </div>
  );
}

/** Inline brand text "DineEasy" — same font as UI */
export function BrandText({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className={cn("font-sans font-semibold tracking-tight text-foreground min-w-[5.5rem]", className)} aria-hidden="true" />;
  }

  return (
    <span
      className={cn(
        "font-sans font-semibold tracking-tight text-foreground",
        className
      )}
    >
      Dine<span className="text-gold">Easy</span>
    </span>
  );
}
