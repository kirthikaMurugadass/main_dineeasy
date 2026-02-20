"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/lib/i18n/context";
import { PageTransition } from "@/components/motion";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

// Dynamically import AdminTopbar to avoid hydration errors from Radix UI DropdownMenu
const AdminTopbar = dynamic(() => import("@/components/admin/topbar").then((mod) => ({ default: mod.AdminTopbar })), {
  ssr: false,
});

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminTopbar />
        <main className="flex-1 p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </I18nProvider>
    </ThemeProvider>
  );
}
