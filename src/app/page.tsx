"use client";

import { PageTransition } from "@/components/motion";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { StorySection } from "@/components/landing/story-section";
import { SpotlightSection } from "@/components/landing/spotlight-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { EcosystemSection } from "@/components/landing/ecosystem-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TrustSection } from "@/components/landing/trust-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <PageTransition>
      <Navbar />
      <main>
        <Hero />
        <StorySection />
        <WorkflowSection />
        {/* <EcosystemSection /> */}
        <PricingSection />
        <SpotlightSection />
        <TrustSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </PageTransition>
  );
}
