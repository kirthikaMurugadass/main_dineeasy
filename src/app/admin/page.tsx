"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, UtensilsCrossed, Eye, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalMenus: number;
  activeMenus: number;
  restaurantName: string;
  restaurantSlug: string;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalMenus: 0,
    activeMenus: 0,
    restaurantName: "",
    restaurantSlug: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        router.push("/admin/onboarding");
        return;
      }

      const { data: menus } = await supabase
        .from("menus")
        .select("id, is_active")
        .eq("restaurant_id", restaurant.id);

      setStats({
        totalMenus: menus?.length ?? 0,
        activeMenus: menus?.filter((m) => m.is_active).length ?? 0,
        restaurantName: restaurant.name,
        restaurantSlug: restaurant.slug,
      });
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    {
      title: t.admin.dashboard.totalMenus,
      value: stats.totalMenus,
      icon: UtensilsCrossed,
      color: "text-gold",
      bg: "bg-gold/10",
    },
    {
      title: t.admin.dashboard.activeMenus,
      value: stats.activeMenus,
      icon: Eye,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">{t.admin.dashboard.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {t.admin.dashboard.welcome}
              {stats.restaurantName ? `, ${stats.restaurantName}` : ""}
            </p>
          </div>
          <Link href="/admin/menus/new">
            <Button className="gap-2 bg-espresso text-warm hover:bg-espresso/90">
              <Plus size={16} />
              {t.admin.dashboard.quickCreate}
            </Button>
          </Link>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <StaggerItem key={i}>
            <HoverScale lift={-4}>
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? (
                      <div className="h-9 w-12 animate-pulse rounded bg-muted" />
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        {stat.value}
                      </motion.span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </HoverScale>
          </StaggerItem>
        ))}

        {/* Quick action: QR */}
        <StaggerItem>
          <HoverScale lift={-4}>
            <Link href="/admin/qr">
              <Card className="border-border/50 cursor-pointer transition-colors hover:border-gold/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.admin.qr.title}
                  </CardTitle>
                  <div className="rounded-lg bg-gold/10 p-2">
                    <QrCode size={16} className="text-gold" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t.admin.qr.generate} & {t.admin.qr.download}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </HoverScale>
        </StaggerItem>
      </StaggerContainer>

      {/* Recent activity placeholder */}
      <FadeIn delay={0.3}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg border border-dashed border-border/50 p-4 transition-colors hover:border-gold/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                <Plus size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Create your first menu</h4>
                <p className="text-sm text-muted-foreground">
                  Add dishes, prices, and descriptions in multiple languages
                </p>
              </div>
              <Link href="/admin/menus/new">
                <Button variant="outline" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
