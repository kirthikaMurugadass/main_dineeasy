"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useScrollReveal
 *
 * Lightweight IntersectionObserver hook that toggles a visibility flag
 * when the element enters the viewport. Combine with the animation
 * utility classes defined in globals.css:
 *
 *   const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
 *   <div ref={ref} className={cn("fade-up", isVisible && "is-visible")} />
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, isVisible };
}

