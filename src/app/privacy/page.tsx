"use client";

import { PageLayout } from "@/components/landing/page-layout";
import { FadeIn } from "@/components/motion";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function PrivacyPage() {
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
              Privacy Policy
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
                  Introduction
                </h2>
                <p>
                  DineEasy (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                  use our service.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  Information We Collect
                </h2>
                <p>
                  We collect information that you provide directly to us, including account information, restaurant data, 
                  and customer orders. We also collect technical information automatically when you use our service.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  How We Use Your Information
                </h2>
                <p>
                  We use the information we collect to provide, maintain, and improve our services, process transactions, 
                  and communicate with you about your account and our services.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageLayout>
  );
}
