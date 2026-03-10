"use client";

import { PageLayout } from "@/components/landing/page-layout";
import { FadeIn } from "@/components/motion";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function CookiesPage() {
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
              Cookie Policy
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
                  What Are Cookies
                </h2>
                <p>
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                  They are widely used to make websites work more efficiently and provide information to the owners of the site.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  How We Use Cookies
                </h2>
                <p>
                  We use cookies to remember your preferences, maintain your session, and improve your experience on our 
                  platform. We also use analytics cookies to understand how visitors interact with our website.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  Managing Cookies
                </h2>
                <p>
                  You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies 
                  can impact your user experience and parts of our website may no longer be fully accessible.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageLayout>
  );
}
