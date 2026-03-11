"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import Particles from "@/components/ui/particles-background";

export function Hero() {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation once on mount
    setVisible(true);
  }, []);

  // Green theme colors for particles - brighter for visibility
  const particleColors = resolvedTheme === "dark" 
    ? ["#22c55e", "#4ade80", "#86efac", "#34d399"] // Green shades for dark theme
    : ["#22c55e", "#16a34a", "#10b981", "#059669"]; // Green shades for light theme

  // Get pixel ratio safely for SSR
  const [pixelRatio, setPixelRatio] = useState(1);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }
  }, []);

  return (
    <section className="relative overflow-hidden bg-background min-h-[80vh]">
      {/* Particles Background Layer */}
      <div className="absolute inset-0 z-0 w-full h-full" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <Particles
          particleCount={100}
          particleSpread={10}
          speed={0.08}
          particleColors={particleColors}
          moveParticlesOnHover={false}
          alphaParticles={true}
          particleBaseSize={120}
          sizeRandomness={0.8}
          cameraDistance={18}
          disableRotation={false}
          pixelRatio={pixelRatio}
          className="w-full h-full"
        />
      </div>
      
      {/* Hero Content Layer */}
      <div className="relative z-10 mx-auto flex min-h-[80vh] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28 lg:px-10 2xl:max-w-[90rem] 2xl:py-32">
        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          {/* Badge */}
          <p
            className={cn(
              "inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary shadow-soft",
              "slide-in-left",
              visible && "is-visible",
              "delay-100"
            )}
          >
            {t.home?.hero?.badge || t.landing?.hero?.badge || "For Modern Restaurants"}
          </p>

          {/* Heading */}
          <h1
            className={cn(
              "mt-5 text-balance text-[clamp(2.4rem,4.4vw+1rem,3.9rem)] font-semibold leading-[1.05] tracking-tight text-foreground",
              "slide-in-left",
              visible && "is-visible",
              "delay-200"
            )}
          >
            {t.home?.hero?.title || t.landing?.hero?.title || "Next-Gen Digital Menu Platform"}
            {(t.home?.hero?.titleAccent || t.landing?.hero?.titleAccent) && (
              <span className="mt-2 block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                {t.home?.hero?.titleAccent || t.landing?.hero?.titleAccent}
              </span>
            )}
          </h1>

          {/* Description */}
          <p
            className={cn(
              "mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-balance sm:text-lg",
              "slide-in-left",
              visible && "is-visible",
              "delay-300"
            )}
          >
            {t.home?.hero?.subtitle || t.landing?.hero?.subtitle || "Create beautiful QR menus, manage categories, track performance, and deliver a premium dining experience — all in one powerful dashboard."}
          </p>

          {/* Buttons */}
          <div
            className={cn(
              "mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start",
              "slide-in-left",
              visible && "is-visible",
              "delay-400"
            )}
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="group h-12 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/50"
              >
                {t.home?.hero?.cta || t.landing?.hero?.cta || "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#workflow">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-primary bg-transparent px-7 text-sm font-medium text-primary shadow-soft transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                {t.home?.hero?.ctaSecondary || t.landing?.hero?.ctaSecondary || "Live Demo"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
