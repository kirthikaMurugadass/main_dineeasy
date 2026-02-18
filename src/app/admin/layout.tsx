"use client";

import { ThemeProvider, useTheme } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/lib/i18n/context";
import { PageTransition } from "@/components/motion";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

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
