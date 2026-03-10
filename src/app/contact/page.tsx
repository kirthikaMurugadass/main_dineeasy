"use client";

import { PageLayout } from "@/components/landing/page-layout";
import { FadeIn } from "@/components/motion";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function ContactPage() {
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
              Contact Us
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-lg text-muted-foreground dark:text-[#bfbfbf]">
              Get in touch with our team. We&apos;re here to help.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-12 space-y-8">
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  Email
                </h2>
                <p className="text-muted-foreground dark:text-[#bfbfbf]">
                  support@dineeasy.com
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-xl dark:bg-[#111111] dark:border-[#1f1f1f]">
                <h2 className="text-xl font-semibold text-foreground dark:text-[#ffffff] mb-4">
                  Support Hours
                </h2>
                <p className="text-muted-foreground dark:text-[#bfbfbf]">
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday - Sunday: Closed
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageLayout>
  );
}
