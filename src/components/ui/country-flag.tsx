import { cn } from "@/lib/utils";

type CountryCode =
  | "IN"
  | "SG"
  | "DE"
  | "CH"
  | "US"
  | "GB"
  | "FR"
  | "IT"
  | "ES"
  | "AU"
  | "CA"
  | "JP"
  | "CN"
  | "KR"
  | "BR"
  | string;

interface CountryFlagProps {
  code: CountryCode;
  className?: string;
}

// NOTE: These are simplified vector flags, visually similar to the real flags.
// They match the style used by the existing LanguageFlag component.
export function CountryFlag({ code, className }: CountryFlagProps) {
  const common =
    "h-5 w-7 rounded-sm shadow-[0_0_0_1px_rgba(15,23,42,0.1)] overflow-hidden";

  const c = code.toUpperCase();

  if (c === "IN") {
    // India
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="24" height="5.33" y="0" fill="#FF9933" />
        <rect width="24" height="5.33" y="10.67" fill="#138808" />
        <circle cx="12" cy="8" r="2.1" fill="#054187" />
      </svg>
    );
  }

  if (c === "SG") {
    // Singapore
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="24" height="8" y="0" fill="#EF3340" />
        <circle cx="6" cy="4" r="2.2" fill="#FFFFFF" />
        <circle cx="6.6" cy="4" r="1.6" fill="#EF3340" />
        <circle cx="8.8" cy="3" r="0.45" fill="#FFFFFF" />
        <circle cx="7.8" cy="4.4" r="0.45" fill="#FFFFFF" />
        <circle cx="6.2" cy="4.7" r="0.45" fill="#FFFFFF" />
        <circle cx="4.6" cy="4.4" r="0.45" fill="#FFFFFF" />
        <circle cx="3.6" cy="3" r="0.45" fill="#FFFFFF" />
      </svg>
    );
  }

  if (c === "DE") {
    // Germany
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#000000" />
        <rect y="5.33" width="24" height="5.33" fill="#DD0000" />
        <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
      </svg>
    );
  }

  if (c === "CH") {
    // Switzerland
    return (
      <svg viewBox="0 0 16 16" className={cn(common, className)} aria-hidden="true">
        <rect width="16" height="16" fill="#D52B1E" />
        <rect x="6.5" y="3.2" width="3" height="9.6" fill="#FFFFFF" />
        <rect x="3.2" y="6.5" width="9.6" height="3" fill="#FFFFFF" />
      </svg>
    );
  }

  if (c === "US") {
    // United States
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#B22234" />
        <rect y="2" width="24" height="2" fill="#FFFFFF" />
        <rect y="6" width="24" height="2" fill="#FFFFFF" />
        <rect y="10" width="24" height="2" fill="#FFFFFF" />
        <rect y="14" width="24" height="2" fill="#FFFFFF" />
        <rect width="10" height="8" fill="#3C3B6E" />
      </svg>
    );
  }

  if (c === "GB") {
    // United Kingdom
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#012169" />
        <path
          d="M0 0 L10 6 L10 0 Z M14 0 L24 6 L24 0 Z M24 10 L14 10 L24 16 Z M0 10 L10 10 L0 16 Z"
          fill="#FFFFFF"
        />
        <path
          d="M0 0 L9.5 5.5 L8.5 6 L0 1 Z M24 0 L14.5 5.5 L15.5 6 L24 1 Z M24 16 L14.5 10.5 L15.5 10 L24 15 Z M0 16 L9.5 10.5 L8.5 10 L0 15 Z"
          fill="#C8102E"
        />
        <rect x="9" width="6" height="16" fill="#FFFFFF" />
        <rect y="5" width="24" height="6" fill="#FFFFFF" />
        <rect x="10.2" width="3.6" height="16" fill="#C8102E" />
        <rect y="6.2" width="24" height="3.6" fill="#C8102E" />
      </svg>
    );
  }

  if (c === "FR") {
    // France
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="8" height="16" x="0" fill="#0055A4" />
        <rect width="8" height="16" x="16" fill="#EF4135" />
      </svg>
    );
  }

  if (c === "IT") {
    // Italy
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="8" height="16" x="0" fill="#009246" />
        <rect width="8" height="16" x="16" fill="#CE2B37" />
      </svg>
    );
  }

  if (c === "ES") {
    // Spain
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#AA151B" />
        <rect y="4" width="24" height="8" fill="#F1BF00" />
      </svg>
    );
  }

  if (c === "AU") {
    // Australia (simplified)
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#00008B" />
        <rect width="10" height="8" fill="#012169" />
      </svg>
    );
  }

  if (c === "CA") {
    // Canada
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="5" height="16" x="0" fill="#D80621" />
        <rect width="5" height="16" x="19" fill="#D80621" />
        <path
          d="M12 4 L13 7 L16 7 L13.5 8.5 L14.5 11 L12 9.5 L9.5 11 L10.5 8.5 L8 7 L11 7 Z"
          fill="#D80621"
        />
      </svg>
    );
  }

  if (c === "JP") {
    // Japan
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#FFFFFF" />
        <circle cx="12" cy="8" r="4" fill="#BC002D" />
      </svg>
    );
  }

  if (c === "CN") {
    // China (simplified)
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#DE2910" />
        <circle cx="5" cy="4.5" r="2" fill="#FFDE00" />
      </svg>
    );
  }

  if (c === "KR") {
    // South Korea (highly simplified)
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#FFFFFF" />
        <circle cx="12" cy="8" r="3.2" fill="#CD2E3A" />
        <path d="M9 8a3 3 0 0 1 6 0" fill="#0047A0" />
      </svg>
    );
  }

  if (c === "BR") {
    // Brazil (simplified)
    return (
      <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
        <rect width="24" height="16" fill="#009C3B" />
        <polygon
          points="12,3 21,8 12,13 3,8"
          fill="#FFDF00"
        />
        <circle cx="12" cy="8" r="3" fill="#002776" />
      </svg>
    );
  }

  // Default fallback: neutral gray rectangle
  return (
    <svg viewBox="0 0 24 16" className={cn(common, className)} aria-hidden="true">
      <rect width="24" height="16" fill="#e5e7eb" />
    </svg>
  );
}

