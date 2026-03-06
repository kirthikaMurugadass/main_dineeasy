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
  Palette,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
  Crown,
  DollarSign,
  ShoppingCart,
  Users,
  ChefHat,
  UtensilsCrossed,
  Coffee,
  Timer,
  AlertCircle,
  Zap,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Table,
  Calendar,
  Package,
  FileBarChart,
  UserCheck,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/components/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { getGreeting } from "@/lib/utils/greeting";
import { useSubscription } from "@/contexts/subscription-context";
import { ProCheckoutForm } from "@/components/subscription/pro-checkout-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { isPro, loading: planLoading } = useSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      let user: any | null = null;
      try {
        const {
          data,
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
          console.error("Admin dashboard getUser error:", userError);
          router.push("/login");
          return;
        }
        user = data.user;
      } catch (err) {
        console.error("Admin dashboard getUser lock error:", err);
        router.push("/login");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

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
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      gradient: "from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20",
    },
    {
      title: t.admin.dashboard.activeCategories,
      value: stats.activeCategories,
      icon: Eye,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      gradient: "from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20",
    },
  ];

  // Animated Counter Component with Landing Page Colors
  function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const duration = 1200;
      const steps = 40;
      const increment = value / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const nextValue = Math.min(Math.floor(increment * currentStep), value);
        setDisplayValue(nextValue);
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayValue(value);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, [value]);

    return (
      <motion.span
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, duration: 0.6, type: "spring", stiffness: 200 }}
        className="text-[#2D3A1A] dark:text-[#E8E4D9]"
      >
        {displayValue}
      </motion.span>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Modern Welcome Card with Light Green Theme */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="group relative overflow-hidden rounded-3xl border border-green-200/50 bg-gradient-to-br from-green-50 via-white to-green-50/30 p-8 shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl dark:from-green-950/20 dark:via-background dark:to-green-950/10 dark:border-green-800/30"
      >
        {/* Light green gradient accent */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-green-200/40 via-green-100/20 to-transparent blur-3xl transition-all duration-1000 group-hover:scale-150 dark:from-green-500/20 dark:via-green-400/10" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-green-100/30 to-transparent blur-2xl dark:from-green-500/10" />
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar with light green ring */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-300/50 via-green-200/30 to-green-100/20 blur-xl animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-50 ring-4 ring-green-200/50 shadow-lg dark:from-green-900/30 dark:to-green-800/20 dark:ring-green-800/30">
                {restaurantLogo ? (
                  <Image
                    src={restaurantLogo}
                    alt={stats.restaurantName || t.admin.settings.restaurantProfile}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {(userName || "A")[0].toUpperCase()}
                  </span>
                )}
              </div>
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white"
              >
                {greetingPrefix}
                <span className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent dark:from-green-400 dark:via-green-300 dark:to-green-400">
                  {userName || "Admin"}
                </span>
                {greetingSuffix}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-xl font-semibold text-gray-600 dark:text-gray-300"
              >
                {stats.restaurantName || t.admin.settings.restaurantProfile}
              </motion.p>
            </div>
          </div>

          {/* Dashboard badge with light green */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 px-5 py-3 shadow-md backdrop-blur-sm dark:border-green-800/50 dark:from-green-900/30 dark:to-green-800/20"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              {t.admin.dashboard.title}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Modern Upgrade card with Light Green Theme */}
      {!planLoading && !isPro && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-3xl border border-green-200/60 bg-gradient-to-br from-green-50 via-green-100/30 to-white p-7 shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl dark:border-green-800/40 dark:from-green-950/30 dark:via-green-900/20 dark:to-background"
        >
          {/* Light green animated gradient background */}
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-green-300/30 via-green-200/20 to-transparent blur-3xl transition-all duration-1000 group-hover:scale-150 dark:from-green-500/20 dark:via-green-400/10" />
          
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-gradient-to-br from-green-200 to-green-100 p-4 shadow-lg dark:from-green-800/40 dark:to-green-900/30"
              >
                <Crown className="h-7 w-7 text-green-600 dark:text-green-400" />
              </motion.div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  Unlock Orders, Tables & Bookings
                </p>
                <p className="mt-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Get real-time orders, table management, and booking notifications with Pro.
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="shrink-0 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg transition-all hover:shadow-xl hover:from-green-700 hover:to-green-600 dark:from-green-500 dark:to-green-600"
                onClick={() => setUpgradeModalOpen(true)}
              >
                Upgrade to Pro
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}

      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </DialogHeader>
          <ProCheckoutForm
            compact
            onSuccess={() => {
              setUpgradeModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ============================================
          CAFE MANAGEMENT DASHBOARD - BELOW GREETING
          ============================================ */}
      
      {/* 1. Live Business Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">Live Business Overview</h2>
          <div className="flex items-center gap-2 text-sm text-[#6B7B5A] dark:text-[#9CA88A]">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-[#5B7A2F] dark:bg-[#7A9E4A]"
            />
            <span className="font-medium">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { 
              title: "Today's Revenue", 
              value: 2847, 
              change: +12.5, 
              icon: DollarSign, 
              color: "text-[#5B7A2F] dark:text-[#7A9E4A]",
              bg: "bg-[#E8E4D9]/30 dark:bg-[#2D3A1A]/50"
            },
            { 
              title: "Active Orders", 
              value: 23, 
              change: +8, 
              icon: ShoppingCart, 
              color: "text-[#5B7A2F] dark:text-[#7A9E4A]",
              bg: "bg-[#E8E4D9]/30 dark:bg-[#2D3A1A]/50"
            },
            { 
              title: "Tables Occupied", 
              value: 12, 
              change: -3, 
              icon: Table, 
              color: "text-[#5B7A2F] dark:text-[#7A9E4A]",
              bg: "bg-[#E8E4D9]/30 dark:bg-[#2D3A1A]/50"
            },
            { 
              title: "Kitchen Queue", 
              value: 8, 
              change: -2, 
              icon: ChefHat, 
              color: "text-[#5B7A2F] dark:text-[#7A9E4A]",
              bg: "bg-[#E8E4D9]/30 dark:bg-[#2D3A1A]/50"
            },
            { 
              title: "Customer Footfall", 
              value: 156, 
              change: +18, 
              icon: Users, 
              color: "text-[#5B7A2F] dark:text-[#7A9E4A]",
              bg: "bg-[#E8E4D9]/30 dark:bg-[#2D3A1A]/50"
            },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl ${metric.bg} p-2.5`}>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-[#5B7A2F] dark:bg-[#7A9E4A]"
                    />
                  </div>
                  <CardTitle className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                    {metric.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                      {loading ? (
                        <div className="h-8 w-16 animate-pulse rounded bg-[#E8E4D9]/50 dark:bg-[#2D3A1A]/50" />
                      ) : (
                        <AnimatedCounter value={metric.value} delay={0.4 + i * 0.1} />
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${metric.change > 0 ? 'text-[#5B7A2F] dark:text-[#7A9E4A]' : 'text-red-500'}`}>
                      {metric.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 2. Live Order Activity Feed & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Order Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                  <div className="rounded-xl bg-[#E8E4D9]/30 p-2 dark:bg-[#2D3A1A]/50">
                    <Activity className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                  </div>
                  Live Order Activity
                </CardTitle>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 text-xs font-medium text-[#6B7B5A] dark:text-[#9CA88A]"
                >
                  <div className="h-2 w-2 rounded-full bg-[#5B7A2F] dark:bg-[#7A9E4A]" />
                  Real-time
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {[
                  { item: "Cappuccino × 2", table: "T-05", status: "Preparing", time: "2m ago", icon: Coffee },
                  { item: "Caesar Salad", table: "T-12", status: "Ready", time: "5m ago", icon: UtensilsCrossed },
                  { item: "Espresso × 1", table: "T-08", status: "Served", time: "8m ago", icon: Coffee },
                  { item: "Pasta Carbonara", table: "T-03", status: "Preparing", time: "3m ago", icon: UtensilsCrossed },
                  { item: "Latte × 3", table: "T-15", status: "Ready", time: "1m ago", icon: Coffee },
                ].map((order, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-4 rounded-xl border border-[#D6D2C4]/30 bg-white/50 p-4 shadow-sm transition-all hover:shadow-md dark:border-[#3D4F2A]/30 dark:bg-[#243019]/30"
                  >
                    <div className="rounded-lg bg-[#E8E4D9]/40 p-2.5 dark:bg-[#2D3A1A]/50">
                      <order.icon className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">{order.item}</p>
                      <p className="text-sm text-[#6B7B5A] dark:text-[#9CA88A]">Table {order.table} • {order.time}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === 'Preparing' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      order.status === 'Ready' ? 'bg-[#5B7A2F]/20 text-[#5B7A2F] dark:bg-[#7A9E4A]/20 dark:text-[#7A9E4A]' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {order.status}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <div className="rounded-xl bg-[#E8E4D9]/30 p-2 dark:bg-[#2D3A1A]/50">
                  <Zap className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "New Order", icon: Plus, href: "/admin/categories", color: "bg-[#5B7A2F] dark:bg-[#7A9E4A]" },
                  { label: "Reserve Table", icon: Calendar, href: "#", color: "bg-[#5B7A2F] dark:bg-[#7A9E4A]" },
                  { label: "Add Menu Item", icon: UtensilsCrossed, href: "/admin/categories", color: "bg-[#5B7A2F] dark:bg-[#7A9E4A]" },
                  { label: "View Kitchen", icon: ChefHat, href: "#", color: "bg-[#5B7A2F] dark:bg-[#7A9E4A]" },
                  { label: "Stock Update", icon: Package, href: "#", color: "bg-[#5B7A2F] dark:bg-[#7A9E4A]" },
                  { label: "Generate Report", icon: FileBarChart, href: "#", color: "bg-[#5B7A2F] dark:bg-[#7A9E4A]" },
                ].map((action, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href={action.href}>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 rounded-xl border border-[#D6D2C4]/30 bg-white/50 px-4 py-6 shadow-sm transition-all hover:border-[#5B7A2F]/50 hover:shadow-md dark:border-[#3D4F2A]/30 dark:bg-[#243019]/30 dark:hover:border-[#7A9E4A]/50"
                      >
                        <div className={`rounded-lg ${action.color} p-2`}>
                          <action.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">{action.label}</span>
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 3. Smart Insights & Table Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Smart Insights Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <div className="rounded-xl bg-[#E8E4D9]/30 p-2 dark:bg-[#2D3A1A]/50">
                  <Sparkles className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                </div>
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "Most Ordered Today", value: "Cappuccino", count: "47 orders", icon: Coffee },
                  { title: "Peak Order Time", value: "2:00 PM", count: "23 orders", icon: TrendingUp },
                  { title: "Fastest Selling", value: "Espresso", count: "Ready in 2min", icon: Zap },
                  { title: "Low Stock Alert", value: "Milk", count: "Only 5L left", icon: AlertCircle, alert: true },
                ].map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                      insight.alert 
                        ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20' 
                        : 'border-[#D6D2C4]/30 bg-white/50 dark:border-[#3D4F2A]/30 dark:bg-[#243019]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                          {insight.title}
                        </p>
                        <p className={`mt-1 text-lg font-bold ${insight.alert ? 'text-red-700 dark:text-red-400' : 'text-[#2D3A1A] dark:text-[#E8E4D9]'}`}>
                          {insight.value}
                        </p>
                        <p className="mt-1 text-sm text-[#6B7B5A] dark:text-[#9CA88A]">{insight.count}</p>
                      </div>
                      <div className={`rounded-lg ${insight.alert ? 'bg-red-100 dark:bg-red-900/30' : 'bg-[#E8E4D9]/40 dark:bg-[#2D3A1A]/50'} p-2.5`}>
                        <insight.icon className={`h-5 w-5 ${insight.alert ? 'text-red-600 dark:text-red-400' : 'text-[#5B7A2F] dark:text-[#7A9E4A]'}`} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table Status Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <div className="rounded-xl bg-[#E8E4D9]/30 p-2 dark:bg-[#2D3A1A]/50">
                  <Table className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                </div>
                Table Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 16 }).map((_, i) => {
                  const status = i < 8 ? 'available' : i < 12 ? 'occupied' : 'reserved';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.02 }}
                      whileHover={{ scale: 1.1 }}
                      className={`aspect-square rounded-xl border-2 p-3 shadow-sm transition-all ${
                        status === 'available' 
                          ? 'border-[#5B7A2F]/30 bg-[#5B7A2F]/10 dark:border-[#7A9E4A]/30 dark:bg-[#7A9E4A]/10' 
                          : status === 'occupied'
                          ? 'border-orange-300 bg-orange-100 dark:border-orange-700/30 dark:bg-orange-900/20'
                          : 'border-blue-300 bg-blue-100 dark:border-blue-700/30 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex h-full flex-col items-center justify-center">
                        <p className="text-xs font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">T-{String(i + 1).padStart(2, '0')}</p>
                        <div className={`mt-1 h-1.5 w-1.5 rounded-full ${
                          status === 'available' ? 'bg-[#5B7A2F] dark:bg-[#7A9E4A]' :
                          status === 'occupied' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#5B7A2F] dark:bg-[#7A9E4A]" />
                  <span className="text-[#6B7B5A] dark:text-[#9CA88A]">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-[#6B7B5A] dark:text-[#9CA88A]">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[#6B7B5A] dark:text-[#9CA88A]">Reserved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 4. Revenue Graph & Trending Menu Items */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <div className="rounded-xl bg-[#E8E4D9]/30 p-2 dark:bg-[#2D3A1A]/50">
                  <TrendingUp className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                </div>
                Revenue Graph (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-[#E8E4D9]/30 dark:bg-[#2D3A1A]/30" />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="h-64"
                >
                  <MiniChart data={categoryChartData} color="rgb(91, 122, 47)" />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Trending Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <div className="rounded-xl bg-[#E8E4D9]/30 p-2 dark:bg-[#2D3A1A]/50">
                  <TrendingUp className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                </div>
                Trending Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Cappuccino", orders: 47, revenue: "$423", trend: "up" },
                  { name: "Espresso", orders: 32, revenue: "$256", trend: "up" },
                  { name: "Caesar Salad", orders: 28, revenue: "$392", trend: "up" },
                  { name: "Latte", orders: 24, revenue: "$288", trend: "down" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="rounded-xl border border-[#D6D2C4]/30 bg-white/50 p-4 shadow-sm transition-all hover:shadow-md dark:border-[#3D4F2A]/30 dark:bg-[#243019]/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">{item.name}</p>
                        <p className="text-sm text-[#6B7B5A] dark:text-[#9CA88A]">{item.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#5B7A2F] dark:text-[#7A9E4A]">{item.revenue}</p>
                        {item.trend === 'up' ? (
                          <ArrowUpRight className="mt-1 h-3 w-3 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                        ) : (
                          <ArrowDownRight className="mt-1 h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 5. Staff Activity Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
              <div className="rounded-xl bg-[#E8E4D9]/30 p-2 dark:bg-[#2D3A1A]/50">
                <UserCheck className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
              </div>
              Staff Activity Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Sarah Chen", role: "Barista", orders: 23, status: "active" },
                { name: "Mike Johnson", role: "Server", orders: 18, status: "active" },
                { name: "Emma Davis", role: "Chef", orders: 31, status: "active" },
                { name: "Alex Brown", role: "Manager", orders: 12, status: "break" },
              ].map((staff, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.1 }}
                  className="rounded-xl border border-[#D6D2C4]/30 bg-white/50 p-4 shadow-sm transition-all hover:shadow-md dark:border-[#3D4F2A]/30 dark:bg-[#243019]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#5B7A2F] to-[#7A9E4A] flex items-center justify-center text-white font-bold">
                        {staff.name[0]}
                      </div>
                      {staff.status === 'active' && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -bottom-0 -right-0 h-4 w-4 rounded-full border-2 border-white bg-[#5B7A2F] dark:bg-[#7A9E4A]"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">{staff.name}</p>
                      <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">{staff.role}</p>
                      <p className="mt-1 text-sm font-medium text-[#5B7A2F] dark:text-[#7A9E4A]">{staff.orders} orders</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legacy sections removed - replaced with cafe management dashboard above */}
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

// Enhanced Mini Chart Component with gradients
function MiniChart({ data, color }: { data: ChartData; color: string }) {
  const maxValue = Math.max(...data.values, 1);
  const chartHeight = 120;
  const points = data.values.map(
    (value, i) =>
      `${i * 40 + 20},${chartHeight - (value / maxValue) * chartHeight * 0.8 - 10}`
  );
  const areaPoints = `${points[0]} L${points.join(" L")} L${data.labels.length * 40 - 20},${chartHeight - 10} L20,${chartHeight - 10} Z`;
  
  // Create stable gradient IDs based on color
  const colorHash = color.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10);
  const gradientId = useMemo(() => `gradient-${colorHash}`, [colorHash]);
  const lineGradientId = useMemo(() => `lineGradient-${colorHash}`, [colorHash]);

  return (
    <div className="relative h-full">
      <svg viewBox={`0 0 ${data.labels.length * 40} ${chartHeight}`} className="h-full w-full">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Grid lines with fade effect - Light Green */}
        {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
          <motion.line
            key={y}
            x1="0"
            y1={y * chartHeight}
            x2={data.labels.length * 40}
            y2={y * chartHeight}
            stroke="rgb(220, 252, 231)"
            strokeWidth="0.5"
            strokeOpacity="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}

        {/* Gradient area fill */}
        <motion.path
          d={areaPoints}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />

        {/* Chart line with gradient */}
        <motion.polyline
          points={points.join(" ")}
          fill="none"
          stroke={`url(#${lineGradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-lg"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Data points with glow */}
        {data.values.map((value, i) => (
          <g key={i}>
            <motion.circle
              cx={i * 40 + 20}
              cy={chartHeight - (value / maxValue) * chartHeight * 0.8 - 10}
              r="6"
              fill={color}
              fillOpacity="0.2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 + 0.5, type: "spring", stiffness: 200 }}
            />
            <motion.circle
              cx={i * 40 + 20}
              cy={chartHeight - (value / maxValue) * chartHeight * 0.8 - 10}
              r="4"
              fill={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 + 0.6, type: "spring", stiffness: 200 }}
            />
          </g>
        ))}

        {/* Labels */}
        {data.labels.map((label, i) => (
          <motion.text
            key={i}
            x={i * 40 + 20}
            y={chartHeight - 5}
            textAnchor="middle"
            className="text-[9px] font-medium fill-muted-foreground"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.8 }}
          >
            {label}
          </motion.text>
        ))}
      </svg>
    </div>
  );
}
