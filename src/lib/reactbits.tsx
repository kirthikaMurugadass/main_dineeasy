"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeContentProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  /** Kept for API compatibility, not used in this lightweight version */
  threshold?: number;
  initialOpacity?: number;
}

export function FadeContent({
  children,
  className,
  duration = 0.8,
  delay = 0,
  initialOpacity = 0,
}: FadeContentProps) {
  return (
    <motion.div
      initial={{ opacity: initialOpacity, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedContentProps {
  children: ReactNode;
  className?: string;
  direction?: "vertical" | "horizontal";
  distance?: number;
  delay?: number;
}

export function AnimatedContent({
  children,
  className,
  direction = "vertical",
  distance = 24,
  delay = 0,
}: AnimatedContentProps) {
  const axis = direction === "horizontal" ? "x" : "y";

  return (
    <motion.div
      initial={{ opacity: 0, [axis]: distance }}
      animate={{ opacity: 1, [axis]: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SimpleSpotlightCardProps {
  className?: string;
  children: ReactNode;
}

export function SpotlightCard({ className, children }: SimpleSpotlightCardProps) {
  return <div className={cn("relative", className)}>{children}</div>;
}

