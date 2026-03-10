"use client";

import { PageLayout } from "@/components/landing/page-layout";
import { FadeIn } from "@/components/motion";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function TermsPage() {
  const { resolvedTheme } = useTheme();

  return (
    <PageLayout>
      <section className={cn(
        "relative py-16 sm:py-20 md:py-24 lg:py-28",
        resolvedTheme === "dark" ? "bg-[#000000]" : "bg-background"
      )}>
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-10">
          <FadeIn>
            <h1 className="text-[clamp(2.5rem,4vw+1rem,3.5rem)] font-semibold leading-tight tracking-tight text-foreground dark:text-[#ffffff]">
              Terms of Service
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-sm text-muted-foreground dark:text-[#bfbfbf]">
              Last updated: January 1, 2025
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-12 space-y-8 text-base leading-relaxed text-muted-foreground dark:text-[#bfbfbf]">
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  Agreement to Terms
                </h2>
                <p>
                  By accessing or using DineEasy, you agree to be bound by these Terms of Service. If you disagree with 
                  any part of these terms, you may not access the service.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  Use License
                </h2>
                <p>
                  Permission is granted to temporarily use DineEasy for personal or commercial purposes. This license 
                  does not include the right to modify or copy the materials, use them for any commercial purpose, or 
                  remove any copyright or proprietary notations.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  Disclaimer
                </h2>
                <p>
                  The materials on DineEasy are provided on an &apos;as is&apos; basis. DineEasy makes no warranties, 
                  expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
                  implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                  of intellectual property or other violation of rights.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageLayout>
  );
}
