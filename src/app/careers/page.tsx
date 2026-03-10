"use client";

import { PageLayout } from "@/components/landing/page-layout";
import { FadeIn } from "@/components/motion";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function CareersPage() {
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
              Careers
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-lg text-muted-foreground dark:text-[#bfbfbf]">
              Join our team and help shape the future of restaurant technology.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-12 rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
              <p className="text-center text-muted-foreground dark:text-[#bfbfbf]">
                We&apos;re always looking for talented individuals. Check back soon for open positions!
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageLayout>
  );
}
