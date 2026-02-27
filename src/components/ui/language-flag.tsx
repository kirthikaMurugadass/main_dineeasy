"use client";

import { cn } from "@/lib/utils";

type LanguageCode = "en" | "de" | "fr" | "it" | string;

interface LanguageFlagProps {
  code: LanguageCode;
  className?: string;
}

export function LanguageFlag({ code, className }: LanguageFlagProps) {
  const common = "h-5 w-5 rounded-sm shadow-[0_0_0_1px_rgba(15,23,42,0.08)]";

  if (code === "de") {
    // Germany
    return (
      <svg
        viewBox="0 0 24 16"
        className={cn(common, className)}
        aria-hidden="true"
      >
        <rect width="24" height="16" fill="#000000" />
        <rect y="5.33" width="24" height="5.33" fill="#DD0000" />
        <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
      </svg>
    );
  }

  if (code === "fr") {
    // France
    return (
      <svg
        viewBox="0 0 24 16"
        className={cn(common, className)}
        aria-hidden="true"
      >
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="8" height="16" x="0" fill="#0055A4" />
        <rect width="8" height="16" x="16" fill="#EF4135" />
      </svg>
    );
  }

  if (code === "it") {
    // Italy
    return (
      <svg
        viewBox="0 0 24 16"
        className={cn(common, className)}
        aria-hidden="true"
      >
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="8" height="16" x="0" fill="#009246" />
        <rect width="8" height="16" x="16" fill="#CE2B37" />
      </svg>
    );
  }

  // Default: English (use simple US-style flag)
  return (
    <svg
      viewBox="0 0 24 16"
      className={cn(common, className)}
      aria-hidden="true"
    >
      <rect width="24" height="16" fill="#B22234" />
      <rect y="2" width="24" height="2" fill="#FFFFFF" />
      <rect y="6" width="24" height="2" fill="#FFFFFF" />
      <rect y="10" width="24" height="2" fill="#FFFFFF" />
      <rect y="14" width="24" height="2" fill="#FFFFFF" />
      <rect width="10" height="8" fill="#3C3B6E" />
    </svg>
  );
}

