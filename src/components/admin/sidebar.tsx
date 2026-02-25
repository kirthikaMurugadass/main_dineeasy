"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Palette,
  QrCode,
  LogOut,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/ui/app-logo";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "menus", href: "/admin/categories", icon: UtensilsCrossed },
  { key: "appearance", href: "/admin/appearance", icon: Palette },
  { key: "qr", href: "/admin/qr", icon: QrCode },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();

  // Close sidebar on mobile when pathname changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const labels: Record<string, string> = {
    dashboard: t.admin.dashboard.title,
    menus: t.admin.menus.title,
    appearance: t.admin.appearance.title,
    qr: t.admin.qr.title,
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <AppLogo href="/admin" subtitle={t.admin.sidebar.adminPanel} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span suppressHydrationWarning translate="no">
              {t.admin.sidebar.navigation}
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : item.href === "/admin/categories"
                    ? pathname.startsWith("/admin/categories") || pathname.startsWith("/admin/menu/category")
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="gap-3">
                        <item.icon size={18} />
                        <span suppressHydrationWarning translate="no">{labels[item.key]}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/settings" className="gap-3">
                <Settings size={18} />
                <span suppressHydrationWarning translate="no">{t.admin.sidebar.settings}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="gap-3 text-destructive hover:text-destructive">
              <LogOut size={18} />
              <span suppressHydrationWarning translate="no">{t.admin.sidebar.signOut}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
