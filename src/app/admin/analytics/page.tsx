"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Calendar, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type OrderRow = {
  created_at: string;
  order_type: string | null;
  order_items?: Array<{ price: number | string; quantity: number | null }>;
};

type Point = {
  label: string;
  value: number;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const analyticsT = t.analytics || t.admin?.analytics || {};
  const [loading, setLoading] = useState(true);
  const [revenueView, setRevenueView] = useState<"day" | "month">("day");
  const [ordersView, setOrdersView] = useState<"day" | "month">("day");
  const [performanceView, setPerformanceView] = useState<"week" | "month">("week");

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [monthlyOrdersCount, setMonthlyOrdersCount] = useState(0);
  const [takeawayOrders, setTakeawayOrders] = useState(0);
  const [dineInOrders, setDineInOrders] = useState(0);
  const [deliveryOrders, setDeliveryOrders] = useState(0);

  const [revenueDayData, setRevenueDayData] = useState<Point[]>([]);
  const [revenueMonthData, setRevenueMonthData] = useState<Point[]>([]);
  const [ordersDayData, setOrdersDayData] = useState<Point[]>([]);
  const [ordersMonthData, setOrdersMonthData] = useState<Point[]>([]);
  const [performanceWeekData, setPerformanceWeekData] = useState<Point[]>([]);
  const [performanceMonthData, setPerformanceMonthData] = useState<Point[]>([]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!restaurant?.id) {
          return;
        }

        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const [{ data: todayRows }, { data: monthRows }, { data: weekRows }] = await Promise.all([
          supabase
            .from("orders")
            .select("created_at, order_type, order_items(price, quantity)")
            .eq("restaurant_id", restaurant.id)
            .gte("created_at", today.toISOString()),
          supabase
            .from("orders")
            .select("created_at, order_type, order_items(price, quantity)")
            .eq("restaurant_id", restaurant.id)
            .gte("created_at", startOfMonth.toISOString()),
          supabase
            .from("orders")
            .select("created_at, order_type")
            .eq("restaurant_id", restaurant.id)
            .gte("created_at", weekStart.toISOString()),
        ]);

        const todayOrdersData = (todayRows || []) as OrderRow[];
        const monthOrdersData = (monthRows || []) as OrderRow[];
        const weekOrdersData = (weekRows || []) as OrderRow[];

        setTodayOrders(todayOrdersData.length);
        setMonthlyOrdersCount(monthOrdersData.length);

        let revenue = 0;
        const hourRevenue: Record<number, number> = {};
        const hourOrders: Record<number, number> = {};
        for (let h = 0; h < 24; h++) {
          hourRevenue[h] = 0;
          hourOrders[h] = 0;
        }
        todayOrdersData.forEach((order) => {
          const hour = new Date(order.created_at).getHours();
          hourOrders[hour] += 1;
          (order.order_items || []).forEach((item) => {
            const itemRevenue = Number(item.price || 0) * Number(item.quantity || 0);
            revenue += itemRevenue;
            hourRevenue[hour] += itemRevenue;
          });
        });
        setTodayRevenue(revenue);
        setRevenueDayData(
          Object.entries(hourRevenue).map(([hour, value]) => ({ label: `${hour}:00`, value }))
        );
        setOrdersDayData(
          Object.entries(hourOrders).map(([hour, value]) => ({ label: `${hour}:00`, value }))
        );

        const daysInRange = now.getDate();
        const dayRevenue: Record<number, number> = {};
        const dayOrders: Record<number, number> = {};
        for (let d = 1; d <= daysInRange; d++) {
          dayRevenue[d] = 0;
          dayOrders[d] = 0;
        }

        let takeaway = 0;
        let dineIn = 0;
        let delivery = 0;

        monthOrdersData.forEach((order) => {
          const day = new Date(order.created_at).getDate();
          dayOrders[day] += 1;
          (order.order_items || []).forEach((item) => {
            dayRevenue[day] += Number(item.price || 0) * Number(item.quantity || 0);
          });

          const type = (order.order_type || "").toLowerCase().trim();
          if (type === "takeaway" || type === "pickup" || type === "pick_up") takeaway += 1;
          else if (type === "dine-in" || type === "dine_in" || type === "dinein") dineIn += 1;
          else if (type === "delivery") delivery += 1;
        });

        setTakeawayOrders(takeaway);
        setDineInOrders(dineIn);
        setDeliveryOrders(delivery);

        setRevenueMonthData(
          Object.entries(dayRevenue).map(([day, value]) => ({ label: day, value }))
        );
        setOrdersMonthData(
          Object.entries(dayOrders).map(([day, value]) => ({ label: day, value }))
        );

        const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weekCounts: Record<string, number> = {
          Sun: 0,
          Mon: 0,
          Tue: 0,
          Wed: 0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
        };
        weekOrdersData.forEach((order) => {
          const dayName = weekdayLabels[new Date(order.created_at).getDay()];
          weekCounts[dayName] += 1;
        });
        setPerformanceWeekData(
          weekdayLabels.map((label) => ({ label, value: weekCounts[label] || 0 }))
        );

        const weekOfMonthCounts: Record<string, number> = {
          W1: 0,
          W2: 0,
          W3: 0,
          W4: 0,
          W5: 0,
        };
        monthOrdersData.forEach((order) => {
          const day = new Date(order.created_at).getDate();
          const bucket = `W${Math.min(5, Math.floor((day - 1) / 7) + 1)}`;
          weekOfMonthCounts[bucket] += 1;
        });
        setPerformanceMonthData(
          Object.entries(weekOfMonthCounts).map(([label, value]) => ({ label, value }))
        );
      } catch (error) {
        console.error("Error loading analytics:", error);
        toast.error(analyticsT?.loadError || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [router]);

  const totalCategoryOrders = takeawayOrders + dineInOrders + deliveryOrders;
  const takeawayPct = totalCategoryOrders ? Math.round((takeawayOrders / totalCategoryOrders) * 100) : 0;
  const dineInPct = totalCategoryOrders ? Math.round((dineInOrders / totalCategoryOrders) * 100) : 0;
  const deliveryPct = Math.max(0, 100 - takeawayPct - dineInPct);

  const revenueData = revenueView === "day" ? revenueDayData : revenueMonthData;
  const ordersData = ordersView === "day" ? ordersDayData : ordersMonthData;
  const performanceData = performanceView === "week" ? performanceWeekData : performanceMonthData;

  return (
    <div className="space-y-6 pb-8">
      <PageTitle>{analyticsT?.title || "Analytics"}</PageTitle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: analyticsT?.todaysRevenue || "Today's Revenue", value: `$${Math.round(todayRevenue)}`, icon: TrendingUp },
          { title: analyticsT?.todaysOrders || "Today's Orders", value: todayOrders, icon: ShoppingCart },
          { title: analyticsT?.monthlyOrders || "Monthly Orders", value: monthlyOrdersCount, icon: Calendar },
          { title: analyticsT?.performance || "Performance", value: `${dineInPct}% ${analyticsT?.dineIn || "Dine-in"}`, icon: BarChart3 },
        ].map((item) => (
          <Card key={item.title} className="rounded-2xl border border-green-200/70 bg-gradient-to-r from-green-50/80 to-white shadow-sm dark:border-green-900/30 dark:from-green-950/25 dark:to-[#111111]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">{item.title}</p>
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-[#ffffff]">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">{analyticsT?.revenueGraph || "Revenue Graph"}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant={revenueView === "day" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setRevenueView("day")}>{analyticsT?.daily || "Daily"}</Button>
                  <Button variant={revenueView === "month" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setRevenueView("month")}>{analyticsT?.monthly || "Monthly"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleLineAreaChart data={revenueData} loading={loading} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">{analyticsT?.ordersStatistics || "Orders Statistics"}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant={ordersView === "day" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setOrdersView("day")}>{analyticsT?.today || "Today"}</Button>
                  <Button variant={ordersView === "month" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setOrdersView("month")}>{analyticsT?.month || "Month"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={ordersData} loading={loading} highlightColor="var(--primary)" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">{analyticsT?.dineInVsTakeaway || "Dine-in vs Takeaway"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="mx-auto h-44 w-44 rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) 0 ${dineInPct}%, #86efac ${dineInPct}% ${dineInPct + takeawayPct}%, #dcfce7 ${dineInPct + takeawayPct}% 100%)`,
                }}
              >
                <div className="m-auto h-24 w-24 translate-y-10 rounded-full bg-card dark:bg-[#111111]" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">{analyticsT?.dineIn || "Dine-in"}</span><span className="font-semibold">{dineInPct}%</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">{analyticsT?.takeaway || "Takeaway"}</span><span className="font-semibold">{takeawayPct}%</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">{analyticsT?.delivery || "Delivery"}</span><span className="font-semibold">{deliveryPct}%</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">{analyticsT?.performanceGraph || "Performance Graph"}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant={performanceView === "week" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setPerformanceView("week")}>{analyticsT?.weekly || "Weekly"}</Button>
                  <Button variant={performanceView === "month" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setPerformanceView("month")}>{analyticsT?.monthly || "Monthly"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={performanceData} loading={loading} highlightColor="#86efac" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SimpleLineAreaChart({ data, loading }: { data: Point[]; loading: boolean }) {
  const { t } = useI18n();
  const analyticsT = t.analytics || t.admin?.analytics || {};
  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{analyticsT?.noData || "No data available"}</div>;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = Math.max(600, data.length * 34);
  const height = 240;
  const padding = 28;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (d.value / maxValue) * (height - padding * 2);
    return `${x},${y}`;
  });
  const areaPoints = `M${padding},${height - padding} L${points.join(" L")} L${width - padding},${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full min-w-[600px]">
        <defs>
          <linearGradient id="greenArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <path d={areaPoints} fill="url(#greenArea)" />
        <polyline fill="none" stroke="var(--primary)" strokeWidth="3" points={points.join(" ")} />
        {data.map((d, i) => {
          const x = padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
          const y = height - padding - (d.value / maxValue) * (height - padding * 2);
          return <circle key={`${d.label}-${i}`} cx={x} cy={y} r="4" fill="var(--primary)" />;
        })}
      </svg>
    </div>
  );
}

function SimpleBarChart({
  data,
  loading,
  highlightColor,
}: {
  data: Point[];
  loading: boolean;
  highlightColor: string;
}) {
  const { t } = useI18n();
  const analyticsT = t.analytics || t.admin?.analytics || {};
  if (loading) return <div className="h-56 animate-pulse rounded-xl bg-muted/50" />;
  if (!data.length) return <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">{analyticsT?.noData || "No data available"}</div>;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = Math.max(560, data.length * 30);
  const height = 230;
  const padding = 28;
  const chartW = width - padding * 2;
  const barW = Math.max(8, chartW / data.length - 8);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full min-w-[560px]">
        {data.map((d, i) => {
          const x = padding + i * (chartW / data.length) + 4;
          const h = (d.value / maxValue) * (height - padding * 2);
          const y = height - padding - h;
          return (
            <g key={`${d.label}-${i}`}>
              <rect x={x} y={y} width={barW} height={h} rx="4" fill={highlightColor} opacity={i === data.length - 1 ? 1 : 0.65} />
              <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
