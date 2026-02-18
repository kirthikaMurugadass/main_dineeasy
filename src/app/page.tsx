"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/lib/i18n/context";
import { PageTransition } from "@/components/motion";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { DemoPreview } from "@/components/landing/demo-preview";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PageTransition>
          <Navbar />
          <main>
            <Hero />
            <Features />
            <DemoPreview />
            <HowItWorks />
            <CTASection />
          </main>
          <Footer />
        </PageTransition>
      </I18nProvider>
    </ThemeProvider>
  );
}
