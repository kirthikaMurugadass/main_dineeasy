"use client";

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
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "menus", href: "/admin/menus", icon: UtensilsCrossed },
  { key: "appearance", href: "/admin/appearance", icon: Palette },
  { key: "qr", href: "/admin/qr", icon: QrCode },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const router = useRouter();

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
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-espresso text-warm font-serif font-bold text-lg shadow-sm">
            D
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight">
              Dine<span className="text-gold">Easy</span>
            </span>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="gap-3">
                        <item.icon size={18} />
                        <span>{labels[item.key]}</span>
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
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="gap-3 text-destructive hover:text-destructive">
              <LogOut size={18} />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
