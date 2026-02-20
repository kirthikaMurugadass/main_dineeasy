import { cn } from "@/lib/utils";

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
  /** Optional description below the title */
  description?: React.ReactNode;
}

/**
 * Unified page heading for admin and app pages.
 * Uses the same font family as primary UI (Inter/system-ui).
 * Modern, minimal SaaS dashboard style.
 */
export function PageTitle({ children, className, description }: PageTitleProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {children}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
