"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Eye,
  QrCode,
  Plus,
  FileText,
  BarChart3,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/components/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { getGreeting } from "@/lib/utils/greeting";

interface DashboardStats {
  hasMenu: boolean;
  menuActive: boolean;
  restaurantName: string;
  restaurantSlug: string;
  totalCategories: number;
  activeCategories: number;
}

interface RecentActivity {
  id: string;
  type: "category" | "qr" | "menu";
  title: string;
  timestamp: Date;
  icon: typeof Folder;
  color: string;
}

interface ChartData {
  labels: string[];
  values: number[];
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const chartColor = resolvedTheme === "dark" ? "rgb(250, 250, 250)" : "rgb(15, 15, 15)";
  const [stats, setStats] = useState<DashboardStats>({
    hasMenu: false,
    menuActive: false,
    restaurantName: "",
    restaurantSlug: "",
    totalCategories: 0,
    activeCategories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<ChartData>({ labels: [], values: [] });
  const [qrChartData, setQrChartData] = useState<ChartData>({ labels: [], values: [] });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        router.push("/admin/onboarding");
        return;
      }

      const displayName =
        (user.user_metadata as any)?.full_name ||
        user.email?.split("@")[0] ||
        "Admin";
      setUserName(displayName);

      setRestaurantId(restaurant.id);

      if (restaurant.logo_url) {
        setRestaurantLogo(`${restaurant.logo_url}?t=${Date.now()}`);
      }

      const { data: menu } = await supabase
        .from("menus")
        .select("id, is_active, created_at, updated_at")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      if (menu) {
        setMenuId(menu.id);
      }

      // Fetch category stats
      let totalCategories = 0;
      let activeCategories = 0;
      const activities: RecentActivity[] = [];

      if (menu) {
        const { data: categories } = await supabase
          .from("categories")
          .select("id, is_active, created_at")
          .eq("menu_id", menu.id)
          .order("created_at", { ascending: false })
          .limit(5);

        totalCategories = categories?.length ?? 0;
        activeCategories = categories?.filter((c) => c.is_active).length ?? 0;

        // Add recent categories to activities
        if (categories) {
          for (const cat of categories.slice(0, 3)) {
            const { data: translations } = await supabase
              .from("translations")
              .select("title")
              .eq("entity_id", cat.id)
              .eq("entity_type", "category")
              .eq("language", "en")
              .single();

            activities.push({
              id: cat.id,
              type: "category",
              title: translations?.title || "New Category",
              timestamp: new Date(cat.created_at),
              icon: Folder,
              color: "text-blue-500",
            });
          }
        }

        // Add menu update activity
        if (menu.updated_at && menu.updated_at !== menu.created_at) {
          activities.push({
            id: menu.id,
            type: "menu",
            title: t.admin.dashboard.activity.menuUpdated,
            timestamp: new Date(menu.updated_at),
            icon: FileText,
            color: "text-purple-500",
          });
        }
      }

      // Add QR code activity (simulated - you can enhance this with actual QR generation tracking)
      activities.push({
        id: "qr-1",
        type: "qr",
        title: t.admin.dashboard.activity.qrGenerated,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        icon: QrCode,
        color: "text-primary",
      });

      // Sort activities by timestamp
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Generate chart data (simulated - you can enhance with actual analytics)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      });

      setCategoryChartData({
        labels: last7Days,
        values: last7Days.map(() => Math.floor(Math.random() * 5) + 1), // Simulated data
      });

      setQrChartData({
        labels: last7Days,
        values: last7Days.map(() => Math.floor(Math.random() * 10) + 5), // Simulated data
      });

      setStats({
        hasMenu: !!menu,
        menuActive: menu?.is_active ?? false,
        restaurantName: restaurant.name,
        restaurantSlug: restaurant.slug,
        totalCategories,
        activeCategories,
      });
      setRecentActivities(activities);
      setLoading(false);
    }
    load();
  }, []);

  const rawGreeting = useMemo(
    () =>
      getGreeting(
        {
          goodMorning: t.admin.topbar.goodMorning,
          goodAfternoon: t.admin.topbar.goodAfternoon,
          goodEvening: t.admin.topbar.goodEvening,
        },
        "__NAME__"
      ),
    [t]
  );

  const [greetingPrefix, greetingSuffix] = useMemo(() => {
    const parts = rawGreeting.split("__NAME__");
    return [parts[0] ?? "", parts[1] ?? ""];
  }, [rawGreeting]);

  const statCards = [
    {
      title: t.admin.dashboard.totalCategories,
      value: stats.totalCategories,
      icon: Folder,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: t.admin.dashboard.activeCategories,
      value: stats.activeCategories,
      icon: Eye,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-10">
      <FadeIn>
        <div className="mt-2 space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greetingPrefix}
            <span className="text-primary">
              {userName || "Admin"}
            </span>
            {greetingSuffix}
          </h1>

          {/* Cafe section: logo + name, visually distinct */}
          <div className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background/90 px-3 py-2 shadow-sm">
            {restaurantLogo && (
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border/70 bg-muted/40">
                <Image
                  src={restaurantLogo}
                  alt={stats.restaurantName || t.admin.settings.restaurantProfile}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
            )}
            <p className="text-base sm:text-xl font-extrabold text-foreground">
              {stats.restaurantName || t.admin.settings.restaurantProfile}
            </p>
          </div>

          {/* Dashboard label below cafe section */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
            {t.admin.dashboard.title}
          </p>
        </div>
      </FadeIn>
      <StaggerContainer className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <StaggerItem key={i}>
            <HoverScale lift={-4}>
              <Card className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-background/80 via-background/90 to-background/80 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="pointer-events-none absolute inset-px rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),transparent_55%)] opacity-60" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`relative rounded-xl p-2 ${stat.bg}`}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight">
                    {loading ? (
                      <div className="h-9 w-14 animate-pulse rounded-lg bg-muted" />
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
              <Card className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background/95 to-background/80 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.admin.qr.title}
                  </CardTitle>
                  <div className="rounded-xl bg-primary/10 p-2">
                    <QrCode size={16} className="text-primary" />
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

      {/* Smart Dashboard Insights */}
      <FadeIn delay={0.3}>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">
              {t.admin.dashboard.smartInsights}
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Activity className="h-5 w-5 text-primary" />
                  {t.admin.dashboard.recentActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length > 0 ? (
                  <div className="relative max-h-72 space-y-4 overflow-y-auto pr-1">
                    <div className="pointer-events-none absolute left-[18px] top-1 bottom-4 w-px bg-border/60" />
                    <AnimatePresence>
                      {recentActivities.slice(0, 5).map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex gap-3 pl-10"
                        >
                          <div className="absolute left-[10px] top-4 flex h-3 w-3 items-center justify-center">
                            <span className="h-3 w-3 rounded-full border-2 border-background bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.35)]" />
                          </div>
                          <div className="flex-1 rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:bg-muted/60">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ${activity.color}`}>
                                <activity.icon size={16} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium leading-tight">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimestamp(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t.admin.dashboard.noRecentActivity}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t.admin.dashboard.quickActions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <HoverScale>
                    <Link href="/admin/categories">
                      <Button
                        variant="outline"
                        className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/80 text-xs font-medium transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-medium">
                          {t.admin.dashboard.addCategory}
                        </span>
                      </Button>
                    </Link>
                  </HoverScale>

                  <HoverScale>
                    <Link href="/admin/qr">
                      <Button
                        variant="outline"
                        className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/80 text-xs font-medium transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <QrCode className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-medium">
                          {t.admin.dashboard.generateQr}
                        </span>
                      </Button>
                    </Link>
                  </HoverScale>

                  <HoverScale>
                    <Link href="/admin/categories">
                      <Button
                        variant="outline"
                        className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/80 text-xs font-medium transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-medium">
                          {t.admin.menus.title}
                        </span>
                      </Button>
                    </Link>
                  </HoverScale>

                  <HoverScale>
                    <Button
                      variant="outline"
                      className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/70 text-xs font-medium transition-all hover:-translate-y-1 hover:bg-accent/40 hover:shadow-md"
                      disabled
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10">
                        <BarChart3 className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-xs font-medium">{t.admin.dashboard.viewAnalytics}</span>
                    </Button>
                  </HoverScale>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t.admin.dashboard.categoryGrowth}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-32 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="h-32">
                    <MiniChart data={categoryChartData} color="rgb(59, 130, 246)" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <QrCode className="h-5 w-5 text-primary" />
                  {t.admin.dashboard.qrActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-32 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="h-32">
                    <MiniChart data={qrChartData} color={chartColor} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

// Helper function to format timestamps
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Mini Chart Component
function MiniChart({ data, color }: { data: ChartData; color: string }) {
  const maxValue = Math.max(...data.values, 1);
  const chartHeight = 120;

  return (
    <div className="relative h-full">
      <svg viewBox={`0 0 ${data.labels.length * 40} ${chartHeight}`} className="h-full w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y * chartHeight}
            x2={data.labels.length * 40}
            y2={y * chartHeight}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border/30"
          />
        ))}

        {/* Chart line */}
        <motion.polyline
          points={data.values
            .map(
              (value, i) =>
                `${i * 40 + 20},${chartHeight - (value / maxValue) * chartHeight * 0.8 - 10}`
            )
            .join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* Data points */}
        {data.values.map((value, i) => (
          <motion.circle
            key={i}
            cx={i * 40 + 20}
            cy={chartHeight - (value / maxValue) * chartHeight * 0.8 - 10}
            r="4"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, type: "spring" }}
          />
        ))}

        {/* Labels */}
        {data.labels.map((label, i) => (
          <text
            key={i}
            x={i * 40 + 20}
            y={chartHeight - 5}
            textAnchor="middle"
            className="text-[8px] fill-muted-foreground"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
