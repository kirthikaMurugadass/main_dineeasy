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
  const s = sizeMap[size];
  const textColor = variant === "light" ? "text-white" : "text-foreground";
  const accentColor = variant === "light" ? "text-gold" : "text-gold";
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
      {!iconOnly && (
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
      )}
    </>
  );

  const wrapperClass = "flex items-center gap-2.5";

  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(wrapperClass, className)}
    >
      {content}
    </Wrapper>
  );
}

/** Inline brand text "DineEasy" — same font as UI */
export function BrandText({ className }: { className?: string }) {
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
