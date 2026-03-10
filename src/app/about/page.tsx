"use client";

import { PageLayout } from "@/components/landing/page-layout";
import { FadeIn } from "@/components/motion";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function AboutPage() {
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
              About DineEasy
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-lg text-muted-foreground dark:text-[#bfbfbf]">
              DineEasy is revolutionizing the restaurant industry by providing a seamless, contactless dining experience.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground dark:text-[#bfbfbf]">
              <p>
                We believe that technology should enhance, not replace, the human connection that makes dining special. 
                Our platform empowers restaurants to offer modern, efficient service while maintaining the warmth and 
                hospitality that guests love.
              </p>
              <p>
                Founded with a mission to simplify restaurant operations, DineEasy combines QR code technology with 
                intuitive design to create a dining experience that works for everyone—restaurant owners, staff, and guests.
              </p>
              <p>
                Whether you&apos;re a small café or a large restaurant chain, DineEasy provides the tools you need to 
                streamline operations, reduce wait times, and delight your customers.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageLayout>
  );
}
