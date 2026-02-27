"use client";

import { PageTransition } from "@/components/motion";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_60%)]">
        <AdminTopbar />
        <main className="relative flex-1 px-3 pb-6 pt-3 sm:px-5 sm:pb-8 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-6 overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_top,_black,transparent_65%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col rounded-3xl border border-border/60 bg-background/80 shadow-lg shadow-black/10 dark:shadow-black/40 backdrop-blur-2xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
