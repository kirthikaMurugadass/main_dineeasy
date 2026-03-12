"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Users,
  ChefHat,
  Table,
  Activity,
  Crown,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  Calendar,
  BarChart3,
  Palette,
  QrCode,
  Plus,
  Lock,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
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

interface Order {
  id: string;
  customer_name: string;
  order_type: string;
  table_number: number | null;
  status: "pending" | "preparing" | "completed";
  created_at: string;
  items: Array<{
    item_id: string;
    quantity: number;
    price: number;
    menu_item?: {
      translations?: Array<{ title: string; language: string }>;
    };
  }>;
}

interface TableStatus {
  id: string;
  table_name: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
}

interface BusinessStats {
  todayRevenue: number;
  pendingOrders: number;
  totalOrdersToday: number;
  tablesOccupied: number;
  tablesAvailable: number;
  totalCategories: number;
  activeCategories: number;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const { isPro, loading: planLoading } = useSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Real-time data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [stats, setStats] = useState<BusinessStats>({
    todayRevenue: 0,
    pendingOrders: 0,
    totalOrdersToday: 0,
    tablesOccupied: 0,
    tablesAvailable: 0,
    totalCategories: 0,
    activeCategories: 0,
  });
  
  // Chart data state
  const [ordersChartData, setOrdersChartData] = useState<Array<{ hour: string; count: number }>>([]);
  const [ordersMonthlyData, setOrdersMonthlyData] = useState<Array<{ day: string; count: number }>>([]);
  const [revenueChartData, setRevenueChartData] = useState<Array<{ hour: string; revenue: number }>>([]);
  const [revenueMonthlyData, setRevenueMonthlyData] = useState<Array<{ day: string; revenue: number }>>([]);
  const [bookingsChartData, setBookingsChartData] = useState<Array<{ hour: string; count: number }>>([]);
  const [bookingsMonthlyData, setBookingsMonthlyData] = useState<Array<{ day: string; count: number }>>([]);
  
  // View toggles
  const [ordersView, setOrdersView] = useState<"day" | "month">("day");
  const [revenueView, setRevenueView] = useState<"day" | "month">("day");
  const [bookingsView, setBookingsView] = useState<"day" | "month">("day");

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    let ordersChannel: any = null;
    let bookingsChannel: any = null;
    let tablesChannel: any = null;
      const supabase = createClient();

    async function init() {

      // Get user
        const {
        data: { user },
          error: userError,
        } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }

      const displayName =
        (user.user_metadata as any)?.full_name ||
        user.email?.split("@")[0] ||
        "Admin";
      setUserName(displayName);

      // Get restaurant
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        router.push("/admin/onboarding");
        return;
      }

      setRestaurantId(restaurant.id);
      setRestaurantName(restaurant.name);
      if (restaurant.logo_url) {
        setRestaurantLogo(`${restaurant.logo_url}?t=${Date.now()}`);
      }

      // Load initial data
      await loadDashboardData(restaurant.id);

      // Set up real-time subscriptions
      if (isPro) {
        // Orders subscription
        ordersChannel = supabase
          .channel(`orders-${restaurant.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "orders",
              filter: `restaurant_id=eq.${restaurant.id}`,
            },
            () => {
              loadDashboardData(restaurant.id);
            }
          )
          .subscribe();

        // Bookings subscription
        bookingsChannel = supabase
          .channel(`bookings-${restaurant.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "bookings",
              filter: `restaurant_id=eq.${restaurant.id}`,
            },
            () => {
              loadDashboardData(restaurant.id);
            }
          )
          .subscribe();

        // Tables subscription
        tablesChannel = supabase
          .channel(`tables-${restaurant.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "restaurant_tables",
              filter: `restaurant_id=eq.${restaurant.id}`,
            },
            () => {
              loadDashboardData(restaurant.id);
            }
          )
          .subscribe();
      }

      setLoading(false);
    }

    async function loadDashboardData(restId: string) {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      // Load orders (Pro only)
      if (isPro) {
        try {
          // First, fetch orders
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("id, customer_name, order_type, table_number, status, created_at")
            .eq("restaurant_id", restId)
            .order("created_at", { ascending: false })
            .limit(10);
          
          if (ordersError) {
            console.error("Error loading orders:", ordersError);
            setOrders([]);
          } else if (!ordersData || ordersData.length === 0) {
            setOrders([]);
          } else {
            // Fetch order items for these orders
            const orderIds = ordersData.map((o) => o.id);
            const { data: orderItemsData, error: itemsError } = await supabase
              .from("order_items")
              .select("id, order_id, item_id, quantity, price")
              .in("order_id", orderIds);
            
            if (itemsError) {
              console.error("Error loading order items:", itemsError);
              // Still set orders but without items
              const formattedOrders: Order[] = ordersData.map((order: any) => ({
                id: order.id,
                customer_name: order.customer_name || "Guest",
                order_type: order.order_type,
                table_number: order.table_number,
                status: order.status,
                created_at: order.created_at,
                items: [],
              }));
              setOrders(formattedOrders);
            } else {
              // Fetch menu item translations
              const itemIds = [
                ...new Set(
                  (orderItemsData || [])
                    .map((oi) => oi.item_id)
                    .filter(Boolean)
                ),
              ];
              
              let translationMap = new Map<string, Array<{ title: string; language: string }>>();
              
              if (itemIds.length > 0) {
                const { data: translationsData, error: translationsError } = await supabase
                  .from("menu_item_translations")
                  .select("menu_item_id, title, language")
                  .in("menu_item_id", itemIds);
                
                if (!translationsError && translationsData) {
                  translationsData.forEach((t: any) => {
                    if (!translationMap.has(t.menu_item_id)) {
                      translationMap.set(t.menu_item_id, []);
                    }
                    translationMap.get(t.menu_item_id)!.push({
                      title: t.title,
                      language: t.language,
                    });
                  });
                }
              }
              
              // Group order items by order_id
              const itemsByOrderId = new Map<string, typeof orderItemsData>();
              (orderItemsData || []).forEach((item: any) => {
                if (!itemsByOrderId.has(item.order_id)) {
                  itemsByOrderId.set(item.order_id, []);
                }
                itemsByOrderId.get(item.order_id)!.push(item);
              });
              
              // Format orders with their items
              const formattedOrders: Order[] = ordersData.map((order: any) => {
                const orderItems = itemsByOrderId.get(order.id) || [];
                const items = orderItems.map((item: any) => {
                  const translations = translationMap.get(item.item_id) || [];
                  return {
                    item_id: item.item_id || item.id,
                    quantity: item.quantity || 0,
                    price: item.price || 0,
                    menu_item: translations.length > 0 ? { translations } : undefined,
                  };
                });
                
                return {
                  id: order.id,
                  customer_name: order.customer_name || "Guest",
                  order_type: order.order_type,
                  table_number: order.table_number,
                  status: order.status,
                  created_at: order.created_at,
                  items: items,
                };
              });
              
              setOrders(formattedOrders);
            }
          }
        } catch (error) {
          console.error("Unexpected error loading orders:", error);
          setOrders([]);
        }

        // Calculate stats from orders
        const { data: todayOrders } = await supabase
          .from("orders")
          .select("status, order_items(price, quantity)")
          .eq("restaurant_id", restId)
          .gte("created_at", today.toISOString());

        let revenue = 0;
        let pendingOrdersCount = 0;
        let totalOrdersTodayCount = 0;

        // Always initialize to 0, then calculate from data if available
        if (todayOrders && todayOrders.length > 0) {
          totalOrdersTodayCount = todayOrders.length;
          todayOrders.forEach((order: any) => {
            // Count pending orders (not completed)
            if (order.status !== "completed") {
              pendingOrdersCount++;
            }
            // Calculate revenue
            if (order.order_items) {
              order.order_items.forEach((item: any) => {
                revenue += parseFloat(item.price || 0) * (item.quantity || 0);
              });
            }
          });
        }

        // Load bookings for table status and chart data
        const { data: bookings } = await supabase
          .from("bookings")
          .select("table_id, status, booking_date, booking_time, created_at")
          .eq("restaurant_id", restId)
          .eq("status", "confirmed");
        
        // Filter today's bookings for table status
        const todayBookings = bookings?.filter((b) => b.booking_date === todayStr) || [];

        // Load active orders for table status checking (needed for both free and pro plans)
        const { data: activeOrdersData } = await supabase
          .from("orders")
          .select("id, table_number, status")
          .eq("restaurant_id", restId)
          .neq("status", "completed");

        // Load tables
        const { data: tablesData } = await supabase
          .from("restaurant_tables")
          .select("id, table_name, capacity, is_active")
          .eq("restaurant_id", restId)
          .eq("is_active", true);

        // Initialize table metrics to 0
        let occupiedTables = 0;
        let availableTables = 0;
        const tableStatuses: TableStatus[] = [];

        if (tablesData && tablesData.length > 0) {
          // Map table statuses
          tablesData.forEach((table) => {
            // Check if table is reserved (has confirmed booking for today)
            const isReserved = todayBookings.some(
              (b) => b.table_id === table.id
            );

            // Check if table has active order (pending or preparing, not completed)
            const hasActiveOrder = (activeOrdersData || []).some(
              (o) =>
                o.status !== "completed" &&
                o.table_number &&
                o.table_number.toString() === table.table_name.replace("T-", "")
            );

            let status: "available" | "occupied" | "reserved" = "available";
            if (hasActiveOrder) {
              status = "occupied";
            } else if (isReserved) {
              status = "reserved";
            }

            tableStatuses.push({
              id: table.id,
              table_name: table.table_name,
              capacity: table.capacity,
              status,
            });

            // Count occupied tables (has active order or is reserved)
            if (hasActiveOrder || isReserved) {
              occupiedTables++;
            }
          });

          setTables(tableStatuses);
          availableTables = tablesData.length - occupiedTables;
        } else {
          // No tables configured - set empty array
          setTables([]);
        }

        // Always set stats, ensuring all values default to 0
        setStats({
          todayRevenue: revenue || 0,
          pendingOrders: pendingOrdersCount || 0,
          totalOrdersToday: totalOrdersTodayCount || 0,
          tablesOccupied: occupiedTables || 0,
          tablesAvailable: availableTables || 0,
          totalCategories: 0, // Will be loaded separately
          activeCategories: 0,
        });

        // Generate chart data for orders over time (today) - real-time
        generateOrdersChartData(todayOrders || []);
        
        // Generate monthly orders data
        generateOrdersMonthlyData(restId);
        
        // Generate revenue chart data (dummy data for now - will be replaced with real data later)
        generateRevenueChartData();
        
        // Generate bookings chart data (use all bookings for today's chart)
        const todayBookingsForChart = bookings?.filter((b) => {
          const bookingDate = new Date(b.created_at);
          const today = new Date();
          return bookingDate.toDateString() === today.toDateString();
        }) || [];
        generateBookingsChartData(todayBookingsForChart);
        
        // Generate monthly bookings data
        generateBookingsMonthlyData(restId);
      } else {
        // Free plan: basic stats only
      const { data: menu } = await supabase
        .from("menus")
          .select("id")
          .eq("restaurant_id", restId)
        .maybeSingle();

      if (menu) {
          const { data: categories } = await supabase
          .from("categories")
            .select("id, is_active")
            .eq("menu_id", menu.id);

          setStats({
            todayRevenue: 0,
            pendingOrders: 0,
            totalOrdersToday: 0,
            tablesOccupied: 0,
            tablesAvailable: 0,
            totalCategories: categories?.length || 0,
            activeCategories: categories?.filter((c) => c.is_active).length || 0,
          });
        }
        
        // Generate revenue chart data (dummy data) for free plan too
        generateRevenueChartData();
      }
    }

    function generateOrdersChartData(todayOrders: any[]) {
      // Group orders by hour
      const hourCounts: Record<number, number> = {};
      const now = new Date();
      const currentHour = now.getHours();
      
      // Initialize all hours from 0 to current hour with 0
      for (let i = 0; i <= currentHour; i++) {
        hourCounts[i] = 0;
      }
      
      // Count orders per hour
      todayOrders.forEach((order: any) => {
        const orderHour = new Date(order.created_at).getHours();
        if (orderHour <= currentHour) {
          hourCounts[orderHour] = (hourCounts[orderHour] || 0) + 1;
        }
      });
      
      // Convert to array format
      const chartData = Object.entries(hourCounts)
        .map(([hour, count]) => ({
          hour: `${parseInt(hour)}:00`,
          count: count as number,
        }))
        .sort((a, b) => {
          const hourA = parseInt(a.hour.split(':')[0]);
          const hourB = parseInt(b.hour.split(':')[0]);
          return hourA - hourB;
        });
      
      setOrdersChartData(chartData);
    }

    async function generateOrdersMonthlyData(restId: string) {
      const supabase = createClient();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: monthlyOrders } = await supabase
        .from("orders")
        .select("created_at")
        .eq("restaurant_id", restId)
        .gte("created_at", startOfMonth.toISOString());
      
      // Group orders by day
      const dayCounts: Record<string, number> = {};
      const daysInMonth = now.getDate();
      
      // Initialize all days in current month
      for (let i = 1; i <= daysInMonth; i++) {
        dayCounts[i] = 0;
      }
      
      if (monthlyOrders) {
        monthlyOrders.forEach((order: any) => {
          const orderDate = new Date(order.created_at);
          const day = orderDate.getDate();
          if (day <= daysInMonth) {
            dayCounts[day] = (dayCounts[day] || 0) + 1;
          }
        });
      }
      
      const chartData = Object.entries(dayCounts)
        .map(([day, count]) => ({
          day: `Day ${day}`,
          count: count as number,
        }))
        .sort((a, b) => {
          const dayA = parseInt(a.day.replace("Day ", ""));
          const dayB = parseInt(b.day.replace("Day ", ""));
          return dayA - dayB;
        });
      
      setOrdersMonthlyData(chartData);
    }

    function generateBookingsChartData(todayBookings: any[]) {
      // Group bookings by hour
      const hourCounts: Record<number, number> = {};
      const now = new Date();
      const currentHour = now.getHours();
      
      // Initialize all hours from 0 to current hour with 0
      for (let i = 0; i <= currentHour; i++) {
        hourCounts[i] = 0;
      }

      // Count bookings per hour
      todayBookings.forEach((booking: any) => {
        const bookingHour = new Date(booking.created_at).getHours();
        if (bookingHour <= currentHour) {
          hourCounts[bookingHour] = (hourCounts[bookingHour] || 0) + 1;
        }
      });
      
      // Convert to array format
      const chartData = Object.entries(hourCounts)
        .map(([hour, count]) => ({
          hour: `${parseInt(hour)}:00`,
          count: count as number,
        }))
        .sort((a, b) => {
          const hourA = parseInt(a.hour.split(':')[0]);
          const hourB = parseInt(b.hour.split(':')[0]);
          return hourA - hourB;
        });
      
      setBookingsChartData(chartData);
    }

    async function generateBookingsMonthlyData(restId: string) {
      const supabase = createClient();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: monthlyBookings } = await supabase
        .from("bookings")
        .select("created_at")
        .eq("restaurant_id", restId)
        .gte("created_at", startOfMonth.toISOString());

      // Group bookings by day
      const dayCounts: Record<string, number> = {};
      const daysInMonth = now.getDate();
      
      // Initialize all days in current month
      for (let i = 1; i <= daysInMonth; i++) {
        dayCounts[i] = 0;
      }
      
      if (monthlyBookings) {
        monthlyBookings.forEach((booking: any) => {
          const bookingDate = new Date(booking.created_at);
          const day = bookingDate.getDate();
          if (day <= daysInMonth) {
            dayCounts[day] = (dayCounts[day] || 0) + 1;
          }
        });
      }
      
      const chartData = Object.entries(dayCounts)
        .map(([day, count]) => ({
          day: `Day ${day}`,
          count: count as number,
        }))
        .sort((a, b) => {
          const dayA = parseInt(a.day.replace("Day ", ""));
          const dayB = parseInt(b.day.replace("Day ", ""));
          return dayA - dayB;
        });
      
      setBookingsMonthlyData(chartData);
    }

    function generateRevenueChartData() {
      // Dummy revenue data for today (hourly) - will be replaced with real data later
      const hours = Array.from({ length: 12 }, (_, i) => i);
      const chartData = hours.map((hour) => ({
        hour: `${hour * 2}:00`,
        revenue: Math.floor(Math.random() * 500) + 100, // Dummy data between 100-600
      }));
      setRevenueChartData(chartData);
      
      // Generate monthly revenue data (dummy)
      const now = new Date();
      const daysInMonth = now.getDate();
      const monthlyData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: `Day ${i + 1}`,
        revenue: Math.floor(Math.random() * 2000) + 500, // Dummy data between 500-2500
      }));
      setRevenueMonthlyData(monthlyData);
    }

    init();

    return () => {
      if (ordersChannel) {
        supabase.removeChannel(ordersChannel);
      }
      if (bookingsChannel) {
        supabase.removeChannel(bookingsChannel);
      }
      if (tablesChannel) {
        supabase.removeChannel(tablesChannel);
    }
    };
  }, [isPro, router]);

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

  function AnimatedCounter({
    value,
    delay = 0,
  }: {
    value: number;
    delay?: number;
  }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const duration = 1200;
      const steps = 40;
      const increment = value / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const nextValue = Math.min(
          Math.floor(increment * currentStep),
          value
        );
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
        className="text-foreground dark:text-[#ffffff]"
      >
        {displayValue}
      </motion.span>
    );
  }

  function formatTimeAgo(date: string): string {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t.dashboard?.liveOrderActivity?.timeAgo?.justNow || t.dashboard.liveOrderActivity?.timeAgo?.justNow || "Just now";
    if (diffMins < 60) return `${diffMins}${t.dashboard?.liveOrderActivity?.timeAgo?.minutesAgo || t.dashboard.liveOrderActivity?.timeAgo?.minutesAgo || "m ago"}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}${t.dashboard?.liveOrderActivity?.timeAgo?.hoursAgo || t.dashboard.liveOrderActivity?.timeAgo?.hoursAgo || "h ago"}`;
    return orderDate.toLocaleDateString();
  }

  const quickActions = [
    { label: t.dashboard?.quickActions?.manageMenu || t.dashboard.quickActions?.manageMenu || "Manage Menu", icon: UtensilsCrossed, href: "/admin/categories", pro: false },
    { label: t.dashboard?.quickActions?.viewOrders || t.dashboard.quickActions?.viewOrders || "View Orders", icon: ShoppingCart, href: "/admin/orders", pro: true },
    { label: t.dashboard?.quickActions?.manageTables || t.dashboard.quickActions?.manageTables || "Manage Tables", icon: Table, href: "/admin/tables", pro: true },
    { label: t.dashboard?.quickActions?.viewBookings || t.dashboard.quickActions?.viewBookings || "View Bookings", icon: Calendar, href: "/admin/bookings", pro: true },
    { label: t.dashboard?.quickActions?.analytics || t.dashboard.quickActions?.analytics || "Analytics", icon: BarChart3, href: "/admin/analytics", pro: false },
    { label: t.dashboard?.quickActions?.appearance || t.dashboard.quickActions?.appearance || "Appearance", icon: Palette, href: "/admin/appearance", pro: false },
    { label: t.dashboard?.quickActions?.qrCode || t.dashboard.quickActions?.qrCode || "QR Code", icon: QrCode, href: "/admin/qr", pro: false },
  ];

  const overviewCards = isPro
    ? [
        {
          title: t.dashboard?.statistics?.todaysRevenue || t.dashboard.statistics?.todaysRevenue || "Today's Revenue",
          value: stats.todayRevenue,
          change: 0, // Can calculate from previous day
          icon: DollarSign,
        },
        {
          title: t.dashboard?.statistics?.pendingOrders || t.dashboard.statistics?.pendingOrders || "Pending Orders",
          value: stats.pendingOrders,
          change: 0,
          icon: Clock,
        },
        {
          title: t.dashboard?.statistics?.totalOrdersToday || t.dashboard.statistics?.totalOrdersToday || "Total Orders Today",
          value: stats.totalOrdersToday,
          change: 0,
          icon: ShoppingCart,
        },
        {
          title: t.dashboard?.statistics?.tablesOccupied || t.dashboard.statistics?.tablesOccupied || "Tables Occupied",
          value: stats.tablesOccupied,
          change: 0,
          icon: Table,
        },
        {
          title: t.dashboard?.statistics?.tablesAvailable || t.dashboard.statistics?.tablesAvailable || "Tables Available",
          value: stats.tablesAvailable,
          change: 0,
          icon: CheckCircle,
        },
      ]
    : [
        {
          title: t.dashboard?.statistics?.totalCategories || t.dashboard.statistics?.totalCategories || t.dashboard.totalCategories || "Total Categories",
          value: stats.totalCategories,
          change: 0,
          icon: UtensilsCrossed,
        },
        {
          title: t.dashboard?.statistics?.activeCategories || t.dashboard.statistics?.activeCategories || t.dashboard.activeCategories || "Active Categories",
          value: stats.activeCategories,
          change: 0,
          icon: UtensilsCrossed,
        },
      ];

  return (
    <div className="space-y-8 pb-8 dark:bg-[#000000]">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="group relative overflow-hidden rounded-3xl border border-green-200/50 bg-gradient-to-br from-green-50 via-white to-green-50/30 p-5 shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl dark:from-green-950/20 dark:via-background dark:to-green-950/10 dark:border-green-800/30"
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-green-200/40 via-green-100/20 to-transparent blur-3xl transition-all duration-1000 group-hover:scale-150 dark:from-green-500/20 dark:via-green-400/10" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-green-100/30 to-transparent blur-2xl dark:from-green-500/10" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-300/50 via-green-200/30 to-green-100/20 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-50 ring-4 ring-green-200/50 shadow-lg dark:from-green-900/30 dark:to-green-800/20 dark:ring-green-800/30">
                {restaurantLogo ? (
                  <Image
                    src={restaurantLogo}
                    alt={restaurantName}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
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
                className="mt-1 text-base font-semibold text-gray-600 dark:text-gray-300"
              >
                {restaurantName}
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 px-4 py-2 shadow-md backdrop-blur-sm dark:border-green-800/50 dark:from-green-900/30 dark:to-green-800/20"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              {t.admin.dashboard.title}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Upgrade Card */}
      {!planLoading && !isPro && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-3xl border border-green-200/60 bg-gradient-to-br from-green-50 via-green-100/30 to-white p-7 shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl dark:border-green-800/40 dark:from-green-950/30 dark:via-green-900/20 dark:to-background"
        >
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
                  {t.dashboard?.upgrade?.title || "Upgrade to Pro to unlock advanced analytics"}
                </p>
                <p className="mt-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t.dashboard?.upgrade?.description || "Get real-time orders, table management, and booking notifications with Pro."}
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="shrink-0 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg transition-all hover:shadow-xl hover:from-green-700 hover:to-green-600 dark:from-green-500 dark:to-green-600"
                onClick={() => setUpgradeModalOpen(true)}
              >
                {t.dashboard?.upgrade?.button || "Upgrade to Pro"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}

      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.dashboard?.upgrade?.dialogTitle || "Upgrade to Pro"}</DialogTitle>
          </DialogHeader>
          <ProCheckoutForm
            compact
            onSuccess={() => {
              setUpgradeModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Live Business Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground dark:text-[#ffffff]">
            {t.dashboard?.liveBusinessOverview || "Live Business Overview"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-[#9ca3af]">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-primary"
            />
            <span className="font-medium">{t.dashboard?.live || "Live"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {overviewCards.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg dark:border-[#1f1f1f] dark:bg-[#111111]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 p-2.5 dark:bg-primary/10">
                      <metric.icon className="h-5 w-5 text-primary" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-primary"
                    />
                  </div>
                  <CardTitle className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-[#bfbfbf]">
                    {metric.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-foreground dark:text-[#ffffff]">
                      {metric.title.includes("Revenue") ? (
                        <>
                          $
                          <AnimatedCounter
                            value={Math.round(metric.value || 0)}
                            delay={loading ? 0 : 0.4 + i * 0.1}
                          />
                        </>
                      ) : (
                        <AnimatedCounter
                          value={metric.value || 0}
                          delay={loading ? 0 : 0.4 + i * 0.1}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
                {!isPro && i >= 2 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <div className="flex items-center gap-2 text-white">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-semibold">{t.dashboard?.upgrade?.proFeature || "Pro Feature"}</span>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Live Order Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Order Activity */}
        {isPro ? (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
            <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                    <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                  </div>
                  {t.dashboard?.liveOrderActivity?.title || "Live Order Activity"}
                </CardTitle>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground dark:text-[#9ca3af]"
                >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  {t.dashboard?.realtime || t.dashboard?.liveOrderActivity?.realtime || "Real-time"}
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t.dashboard?.liveOrderActivity?.loading || "Loading orders..."}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t.dashboard?.liveOrderActivity?.noOrders || "No orders yet"}
                    </div>
                  ) : (
                    orders.map((order, i) => {
                      const itemNames = order.items && order.items.length > 0
                        ? order.items
                            .map((item) => {
                              const title =
                                item.menu_item?.translations?.[0]?.title ||
                                `Item ${item.item_id || 'Unknown'}`;
                              return `${title} × ${item.quantity}`;
                            })
                            .join(", ")
                        : "Order #" + order.id.slice(0, 8);

                      return (
                  <motion.div
                          key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#0f0f0f]"
                  >
                          <div className="rounded-lg bg-primary/10 p-2.5 dark:bg-primary/10">
                            <UtensilsCrossed className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                            <p className="font-semibold text-foreground dark:text-[#ffffff]">
                              {itemNames || (t.dashboard?.liveOrderActivity?.orderItems || "Order items")}
                            </p>
                            <p className="text-sm text-muted-foreground dark:text-[#9ca3af]">
                              {order.customer_name}
                              {order.table_number
                                ? ` • ${t.dashboard?.liveOrderActivity?.table || "Table"} T-${order.table_number.toString().padStart(2, "0")}`
                                : ""}{" "}
                              • {formatTimeAgo(order.created_at)}
                            </p>
                    </div>
                          <div
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              order.status === "preparing"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : order.status === "completed"
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                : "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary"
                            }`}
                          >
                            {order.status === "pending" 
                              ? (t.dashboard?.status?.pending || "Pending")
                              : order.status === "preparing"
                              ? (t.dashboard?.status?.preparing || "Preparing")
                              : (t.dashboard?.status?.completed || "Completed")}
                    </div>
                  </motion.div>
                      );
                    })
                  )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                  <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  {t.dashboard?.liveOrderActivity?.title || "Live Order Activity"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-semibold text-foreground">
                    {t.dashboard?.upgrade?.proFeature || "Pro Feature"}
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    {t.dashboard?.upgrade?.proFeatureDescription || "Upgrade to Pro to view real-time orders and manage your restaurant operations."}
                  </p>
                  <Button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="mt-2"
                  >
                    {t.dashboard?.upgrade?.button || "Upgrade to Pro"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                {t.dashboard?.quickActions?.title || t.dashboard.quickActions || "Quick Actions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, i) => {
                  const isDisabled = action.pro && !isPro;
                  return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                      whileHover={!isDisabled ? { scale: 1.02, x: 4 } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  >
                      <Link href={isDisabled ? "#" : action.href}>
                      <Button
                        variant="outline"
                          disabled={isDisabled}
                          className="w-full justify-start gap-3 rounded-xl border-border bg-card px-4 py-6 shadow-sm transition-all hover:border-primary hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#0f0f0f] disabled:opacity-50"
                          onClick={
                            isDisabled
                              ? (e) => {
                                  e.preventDefault();
                                  setUpgradeModalOpen(true);
                                }
                              : undefined
                          }
                      >
                          <div className="rounded-lg bg-primary p-2">
                          <action.icon className="h-4 w-4 text-white" />
                        </div>
                          <span className="font-semibold text-foreground dark:text-[#ffffff]">
                            {action.label}
                          </span>
                          {isDisabled && (
                            <Lock className="ml-auto h-4 w-4 text-muted-foreground" />
                          )}
                      </Button>
                    </Link>
                  </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table Status */}
      <div className="mt-6">
        {isPro ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
            <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                  <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                    <Table className="h-5 w-5 text-primary" />
                </div>
                {t.dashboard?.tableStatus?.title || "Table Status"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {loading ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {t.dashboard?.tableStatus?.loading || "Loading tables..."}
                    </div>
                  ) : tables.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {t.dashboard?.tableStatus?.noTables || "No tables configured. Add tables in the Tables section."}
                    </div>
                  ) : (
                    tables.map((table, i) => (
                    <motion.div
                        key={table.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.02 }}
                      whileHover={{ scale: 1.1 }}
                      className={`aspect-square rounded-xl border-2 p-3 shadow-sm transition-all ${
                          table.status === "available"
                            ? "border-primary/30 bg-primary/10 dark:border-primary/30 dark:bg-primary/20"
                            : table.status === "occupied"
                            ? "border-red-500/50 bg-red-100 dark:border-red-700/30 dark:bg-red-900/20"
                            : "border-blue-300 bg-blue-100 dark:border-blue-700/30 dark:bg-blue-900/20"
                      }`}
                    >
                      <div className="flex h-full flex-col items-center justify-center">
                          <p className="text-xs font-bold text-foreground dark:text-[#ffffff]">
                            {table.table_name}
                          </p>
                          <div
                            className={`mt-1 h-1.5 w-1.5 rounded-full ${
                              table.status === "available"
                                ? "bg-primary"
                                : table.status === "occupied"
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                          />
                      </div>
                    </motion.div>
                    ))
                  )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground dark:text-[#9ca3af]">
                      {t.dashboard?.tableStatus?.available || "Available"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground dark:text-[#9ca3af]">
                      {t.dashboard?.tableStatus?.occupied || "Occupied"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground dark:text-[#9ca3af]">
                      {t.dashboard?.tableStatus?.reserved || "Reserved"}
                    </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                  <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                    <Table className="h-5 w-5 text-primary" />
                  </div>
                  {t.dashboard?.tableStatus?.title || "Table Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-semibold text-foreground">
                    {t.dashboard?.upgrade?.proFeature || "Pro Feature"}
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    {t.dashboard?.upgrade?.proFeatureTables || "Upgrade to Pro to manage tables and view real-time table status."}
                  </p>
                  <Button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="mt-2"
                  >
                    {t.dashboard?.upgrade?.button || "Upgrade to Pro"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                  <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                  {t.dashboard?.revenueAnalytics?.title || "Revenue Analytics"}
              </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={revenueView === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRevenueView("day")}
                    className="h-7 text-xs"
                  >
                    {t.dashboard?.revenueAnalytics?.daily || "Daily"}
                  </Button>
                  <Button
                    variant={revenueView === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRevenueView("month")}
                    className="h-7 text-xs"
                  >
                    {t.dashboard?.revenueAnalytics?.monthly || "Monthly"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <RevenueChart
                  data={revenueView === "day" ? revenueChartData : revenueMonthlyData}
                  view={revenueView}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders Graph */}
        {isPro ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
            <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                    <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                    {t.dashboard?.orders?.title || "Orders"}
              </CardTitle>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground dark:text-[#9ca3af]"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {t.dashboard?.live || "Live"}
                  </motion.div>
                      </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={ordersView === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOrdersView("day")}
                    className="h-7 text-xs"
                  >
                    {t.dashboard?.orders?.today || "Today"}
                  </Button>
                  <Button
                    variant={ordersView === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOrdersView("month")}
                    className="h-7 text-xs"
                  >
                    {t.dashboard?.orders?.month || "Month"}
                  </Button>
                      </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mx-auto w-full max-w-[560px] aspect-[9/5]">
                  <OrdersChart
                    data={ordersView === "day" ? ordersChartData : ordersMonthlyData}
                    view={ordersView}
                  />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
      >
            <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
          <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                  <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                    <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
                  {t.dashboard?.orders?.title || "Orders"}
            </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-semibold text-foreground">
                    {t.dashboard?.upgrade?.proFeature || "Pro Feature"}
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    {t.dashboard?.upgrade?.proFeatureOrders || "Upgrade to Pro to view real-time orders graph."}
                  </p>
                  <Button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="mt-2"
                  >
                    {t.dashboard?.upgrade?.button || "Upgrade to Pro"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Table Bookings Graph */}
      {isPro && (
                <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground dark:text-[#ffffff]">
                  <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                      </div>
                  {t.dashboard?.tableBookings?.title || "Table Bookings Analytics"}
                </CardTitle>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground dark:text-[#9ca3af]"
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {t.dashboard?.live || "Live"}
                </motion.div>
                    </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={bookingsView === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBookingsView("day")}
                  className="h-7 text-xs"
                >
                  {t.dashboard?.tableBookings?.today || "Today"}
                </Button>
                <Button
                  variant={bookingsView === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBookingsView("month")}
                  className="h-7 text-xs"
                >
                  {t.dashboard?.tableBookings?.month || "Month"}
                </Button>
                    </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mx-auto w-full max-w-[560px] aspect-[9/5]">
                <BookingsChart
                  data={bookingsView === "day" ? bookingsChartData : bookingsMonthlyData}
                  view={bookingsView}
                />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      )}

    </div>
  );
}

// Revenue Chart Component
function RevenueChart({
  data,
  view,
}: {
  data: Array<{ hour?: string; day?: string; revenue: number }>;
  view: "day" | "month";
}) {
  const { t } = useI18n();
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {t.dashboard?.revenueAnalytics?.noData || "No data available"}
      </div>
    );
}

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const chartHeight = 200;
  const spacing = view === "day" ? 40 : 20;
  const chartWidth = Math.max(data.length * spacing, 400);
  const padding = 40;

  const points = data.map(
    (d, i) =>
      `${i * spacing + padding},${chartHeight - (d.revenue / maxRevenue) * (chartHeight - padding * 2) - padding}`
  );
  const areaPoints = `M${padding},${chartHeight - padding} L${points.join(" L")} L${chartWidth - padding},${chartHeight - padding} Z`;

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
          <line
            key={i}
            x1={padding}
            y1={y * (chartHeight - padding * 2) + padding}
            x2={chartWidth - padding}
            y2={y * (chartHeight - padding * 2) + padding}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            className="text-foreground"
          />
        ))}

        {/* Area fill */}
        <path
          d={areaPoints}
          fill="url(#revenueGradient)"
        />

        {/* Line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = i * spacing + padding;
          const y =
            chartHeight -
            (d.revenue / maxRevenue) * (chartHeight - padding * 2) -
            padding;
          return (
          <g key={i}>
              <circle
                cx={x}
                cy={y}
              r="6"
                fill="var(--primary)"
              fillOpacity="0.2"
              />
              <circle cx={x} cy={y} r="4" fill="var(--primary)" />
            </g>
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const x = i * spacing + padding;
          const label = view === "day" ? (d.hour || "") : (d.day || "");
          return (
            <text
              key={i}
              x={x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Orders Chart Component
function OrdersChart({
  data,
  view,
}: {
  data: Array<{ hour?: string; day?: string; count: number }>;
  view: "day" | "month";
}) {
  const { t } = useI18n();
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {view === "day" 
          ? (t.dashboard?.orders?.noOrdersToday || "No orders today")
          : (t.dashboard?.orders?.noOrdersMonth || "No orders this month")}
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const padding = 40;
  const minSpacingPerBar = view === "day" ? 28 : 20;
  // Calculate chart width based on number of data points
  const chartWidth = Math.max(data.length * minSpacingPerBar + padding * 2, 560);
  const chartArea = chartWidth - padding * 2;
  // Divide chart area into equal segments for each data point
  const segmentWidth = chartArea / data.length;
  const barWidth = Math.max(
    8,
    Math.min(segmentWidth * 0.5, view === "day" ? 20 : 14)
  );

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
          <line
            key={i}
            x1={padding}
            y1={y * (chartHeight - padding * 2) + padding}
            x2={chartWidth - padding}
            y2={y * (chartHeight - padding * 2) + padding}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            className="text-foreground"
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          // Center each bar in its segment
          const x = padding + (i + 0.5) * segmentWidth;
          const barHeight =
            (d.count / maxCount) * (chartHeight - padding * 2);
          const y = chartHeight - padding - barHeight;
          return (
            <g key={i}>
              <motion.rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="var(--primary)"
                rx="4"
                initial={{ height: 0, y: chartHeight - padding }}
                animate={{ height: barHeight, y: y }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              />
              {/* Value label */}
              {d.count > 0 && (
                <text
                  x={x}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-foreground"
                >
                  {d.count}
                </text>
              )}
          </g>
          );
        })}

        {/* Labels - Show all labels for proper alignment */}
        {data.map((d, i) => {
          // Center label under each bar
          const x = padding + (i + 0.5) * segmentWidth;
          const label = view === "day" ? (d.hour || "") : (d.day?.replace("Day ", "") || "");
          return (
            <text
              key={i}
              x={x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Bookings Chart Component
function BookingsChart({
  data,
  view,
}: {
  data: Array<{ hour?: string; day?: string; count: number }>;
  view: "day" | "month";
}) {
  const { t } = useI18n();
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {view === "day" 
          ? (t.dashboard?.tableBookings?.noBookingsToday || "No bookings today")
          : (t.dashboard?.tableBookings?.noBookingsMonth || "No bookings this month")}
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const padding = 40;
  const minSpacingPerBar = view === "day" ? 28 : 20;
  // Calculate chart width based on number of data points
  const chartWidth = Math.max(data.length * minSpacingPerBar + padding * 2, 560);
  const chartArea = chartWidth - padding * 2;
  // Divide chart area into equal segments for each data point
  const segmentWidth = chartArea / data.length;
  const barWidth = Math.max(
    8,
    Math.min(segmentWidth * 0.5, view === "day" ? 20 : 14)
  );

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
          <line
            key={i}
            x1={padding}
            y1={y * (chartHeight - padding * 2) + padding}
            x2={chartWidth - padding}
            y2={y * (chartHeight - padding * 2) + padding}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            className="text-foreground"
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          // Center each bar in its segment
          const x = padding + (i + 0.5) * segmentWidth;
          const barHeight =
            (d.count / maxCount) * (chartHeight - padding * 2);
          const y = chartHeight - padding - barHeight;
          return (
            <g key={i}>
              <motion.rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="rgb(59, 130, 246)"
                rx="4"
                initial={{ height: 0, y: chartHeight - padding }}
                animate={{ height: barHeight, y: y }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              />
              {/* Value label */}
              {d.count > 0 && (
                <text
                  x={x}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-foreground"
                >
                  {d.count}
                </text>
              )}
            </g>
          );
        })}

        {/* Labels - Show all labels for proper alignment */}
        {data.map((d, i) => {
          // Center label under each bar
          const x = padding + (i + 0.5) * segmentWidth;
          const label = view === "day" ? (d.hour || "") : (d.day?.replace("Day ", "") || "");
          return (
            <text
              key={i}
              x={x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Tables Chart Component
function TablesChart({
  occupied,
  available,
}: {
  occupied: number;
  available: number;
}) {
  const { t } = useI18n();
  const total = occupied + available;
  const occupiedPercent = total > 0 ? (occupied / total) * 100 : 0;
  const availablePercent = total > 0 ? (available / total) * 100 : 0;

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center gap-6">
      {/* Pie/Doughnut Chart */}
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeOpacity="0.1"
            className="text-foreground"
          />
          {/* Occupied segment */}
          {occupied > 0 && (
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgb(239, 68, 68)"
              strokeWidth="20"
              strokeDasharray={`${(occupiedPercent / 100) * 502.65} 502.65`}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 502.65" }}
              animate={{
                strokeDasharray: `${(occupiedPercent / 100) * 502.65} 502.65`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          )}
          {/* Available segment */}
          {available > 0 && (
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="20"
              strokeDasharray={`${(availablePercent / 100) * 502.65} 502.65`}
              strokeDashoffset={-((occupiedPercent / 100) * 502.65)}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 502.65" }}
              animate={{
                strokeDasharray: `${(availablePercent / 100) * 502.65} 502.65`,
                strokeDashoffset: -((occupiedPercent / 100) * 502.65),
              }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-foreground dark:text-[#ffffff]">
            {total}
          </div>
          <div className="text-xs text-muted-foreground dark:text-[#9ca3af]">
            {t.dashboard?.tableStatus?.totalTables || "Total Tables"}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-red-500" />
          <span className="text-sm text-foreground dark:text-[#ffffff]">
            {t.dashboard?.tableStatus?.occupied || "Occupied"}: {occupied}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-primary" />
          <span className="text-sm text-foreground dark:text-[#ffffff]">
            {t.dashboard?.tableStatus?.available || "Available"}: {available}
          </span>
        </div>
      </div>
    </div>
  );
}
