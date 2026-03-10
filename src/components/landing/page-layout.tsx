"use client";

import { PageTransition } from "@/components/motion";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <PageTransition>
      <Navbar />
      <main className="overflow-x-clip">
        {children}
        <Footer />
      </main>
    </PageTransition>
  );
}
