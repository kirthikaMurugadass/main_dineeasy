"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Palette,
  QrCode,
  LogOut,
  Settings,
  ShoppingCart,
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

const navItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "menus", href: "/admin/categories", icon: UtensilsCrossed },
  { key: "orders", href: "/admin/orders", icon: ShoppingCart },
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
    orders: t.admin.orders.title,
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
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-none md:[&_[data-slot=sidebar-inner]]:rounded-none md:[&_[data-slot=sidebar-inner]]:border-none md:[&_[data-slot=sidebar-inner]]:shadow-none"
    >
      <SidebarHeader className="px-3 pb-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.7 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="will-change-transform"
        >
          <AppLogo
            href="/admin"
            subtitle={t.admin.sidebar.adminPanel}
            variant="light"
            className="w-full justify-start md:group-data-[collapsible=icon]:justify-center [&>div:first-child]:h-11 [&>div:first-child]:w-11 [&>div:first-child]:rounded-full"
          />
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
            <span suppressHydrationWarning translate="no">
              {t.admin.sidebar.navigation}
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4 space-y-2">
              {navItems.map((item, index) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : item.href === "/admin/categories"
                    ? pathname.startsWith("/admin/categories") ||
                      pathname.startsWith("/admin/menu/category")
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.key}>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * index, duration: 0.25 }}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="group relative flex items-center justify-center rounded-full px-2.5 py-2 text-sm font-semibold text-sidebar-foreground dark:text-sidebar-foreground transition duration-200 hover:bg-muted/70 hover:text-sidebar-foreground dark:hover:text-sidebar-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary dark:data-[active=true]:text-primary"
                      >
                        <Link
                          href={item.href}
                          className="flex w-full items-center justify-start gap-3 md:group-data-[collapsible=icon]:justify-center md:group-data-[collapsible=icon]:gap-0"
                        >
                          <div className="relative flex h-11 w-11 items-center justify-center text-sidebar-foreground dark:text-sidebar-foreground transition-transform duration-200 group-hover:scale-105 group-data-[active=true]:text-primary dark:group-data-[active=true]:text-primary">
                            <Icon size={20} />
                          </div>
                          <span
                            suppressHydrationWarning
                            translate="no"
                            className="relative truncate transition duration-200 md:group-data-[collapsible=icon]:w-0 md:group-data-[collapsible=icon]:overflow-hidden md:group-data-[collapsible=icon]:opacity-0 md:group-data-[collapsible=icon]:translate-x-1"
                          >
                            {labels[item.key]}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 px-2 pb-4 pt-3">
        <SidebarMenu className="space-y-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group flex items-center justify-center rounded-full px-2.5 py-2 text-sm text-muted-foreground dark:text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground dark:hover:text-foreground"
            >
              <Link
                href="/admin/settings"
                className="flex w-full items-center justify-start gap-3 md:group-data-[collapsible=icon]:justify-center md:group-data-[collapsible=icon]:gap-0"
              >
                <div className="flex h-11 w-11 items-center justify-center text-muted-foreground dark:text-muted-foreground">
                  <Settings size={20} />
                </div>
                <span suppressHydrationWarning translate="no" className="truncate md:group-data-[collapsible=icon]:w-0 md:group-data-[collapsible=icon]:overflow-hidden md:group-data-[collapsible=icon]:opacity-0 md:group-data-[collapsible=icon]:translate-x-1">
                  {t.admin.sidebar.settings}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="group flex items-center justify-start rounded-full px-2.5 py-2 text-sm text-rose-500 dark:text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
            >
              <div className="flex h-11 w-11 items-center justify-center text-rose-500 dark:text-rose-400">
                <LogOut size={20} />
              </div>
              <span
                suppressHydrationWarning
                translate="no"
                className="truncate md:group-data-[collapsible=icon]:w-0 md:group-data-[collapsible=icon]:overflow-hidden md:group-data-[collapsible=icon]:opacity-0 md:group-data-[collapsible=icon]:translate-x-1"
              >
                {t.admin.sidebar.signOut}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
