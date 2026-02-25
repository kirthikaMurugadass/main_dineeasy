"use client";

import { PageTransition } from "@/components/motion";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { AboutSection } from "@/components/landing/about-section";
import { DemoPreview } from "@/components/landing/demo-preview";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <PageTransition>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <AboutSection />
        <DemoPreview />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </PageTransition>
  );
}
