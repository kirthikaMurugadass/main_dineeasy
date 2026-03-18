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
  Settings,
  QrCode,
  Plus,
  Lock,
  Clock,
  CheckCircle,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { getGreeting } from "@/lib/utils/greeting";
import { useSubscription } from "@/contexts/subscription-context";
import { setCachedRestaurant } from "@/lib/restaurant-cache";
import { ProCheckoutForm } from "@/components/subscription/pro-checkout-form";
import { OrdersOverviewCard } from "@/components/admin/orders-overview-card";
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
  status: "available" | "reserved";
}

interface TodayBookingStatus {
  table_id: string;
  booking_date: string | null;
  booking_time: string | null;
  customer_name: string | null;
  guest_count: number | null;
  status: string | null;
}

interface BusinessStats {
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalOrdersToday: number;
  takeawayOrders: number;
  dineInOrders: number;
  deliveryOrders: number;
  tablesOccupied: number;
  tablesAvailable: number;
  totalTables: number;
  totalCategories: number;
  activeCategories: number;
}

interface TrendingMenuItem {
  id: string;
  name: string;
  image_url: string | null;
  orders: number;
  price: number;
  rating: number;
}

interface CategoryDonutItem {
  label: string;
  value: number;
  color: string;
}

type AnalyticsPoint = {
  label: string;
  value: number;
};

export default function AdminDashboard() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  // Keep initial render deterministic between SSR and client hydration.
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const { isPro, loading: planLoading } = useSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Real-time data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [todayBookings, setTodayBookings] = useState<TodayBookingStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentDateKey, setCurrentDateKey] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    `${new Date().getHours().toString().padStart(2, "0")}:00`
  );
  const [stats, setStats] = useState<BusinessStats>({
    todayRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalOrdersToday: 0,
    takeawayOrders: 0,
    dineInOrders: 0,
    deliveryOrders: 0,
    tablesOccupied: 0,
    tablesAvailable: 0,
    totalTables: 0,
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
  const [trendingMenus, setTrendingMenus] = useState<TrendingMenuItem[]>([]);
  const [categoryDonutData, setCategoryDonutData] = useState<CategoryDonutItem[]>([]);
  
  // View toggles
  const [ordersView, setOrdersView] = useState<"day" | "month">("day");
  const [revenueView, setRevenueView] = useState<"day" | "month">("day");
  const [bookingsView, setBookingsView] = useState<"day" | "month">("day");
  const timeSlots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => `${hour.toString().padStart(2, "0")}:00`),
    []
  );
  const getStatsCacheKey = useCallback((restId: string) => `dineeasy-dashboard-stats:${restId}`, []);

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
      setCachedRestaurant({ id: restaurant.id, name: restaurant.name });
      if (restaurant.logo_url) {
        setRestaurantLogo(`${restaurant.logo_url}?t=${Date.now()}`);
      }

      if (typeof window !== "undefined") {
        const cachedStats = window.sessionStorage.getItem(getStatsCacheKey(restaurant.id));
        if (cachedStats) {
          try {
            const parsed = JSON.parse(cachedStats) as Partial<BusinessStats>;
            setStats((prev) => ({ ...prev, ...parsed }));
            setOverviewLoading(false);
          } catch {
            // Ignore invalid cache and continue with fresh network data.
          }
        }
      }

      // Load initial data without blocking first paint.
      loadDashboardData(restaurant.id);
      setLoading(false);

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

    }

    async function loadDashboardData(restId: string) {
      const supabase = createClient();
      const now = new Date();
      // Keep "today" key consistent with Bookings page filtering logic.
      const todayStr = now.toISOString().split("T")[0];
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      setCurrentDateKey(todayStr);

      // Load recent orders details in background so overview metrics can render first.
      if (isPro) {
        void (async () => {
          try {
          // First, fetch orders
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("id, customer_name, order_type, table_number, status, created_at")
            .eq("restaurant_id", restId)
            .order("created_at", { ascending: false })
            .limit(10);
          
          if (ordersError) {
            // Log as a warning to avoid noisy error overlays in dev
            console.warn(
              "Dashboard: failed to load recent orders",
              ordersError?.message || ordersError
            );
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
              console.warn(
                "Dashboard: failed to load order items for recent orders",
                itemsError?.message || itemsError
              );
              // Still set orders but without items
              const formattedOrders: Order[] = ordersData.map((order: any) => ({
                id: order.id,
                customer_name: order.customer_name || "",
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
                  .from("translations")
                  .select("entity_id, title, language")
                  .eq("entity_type", "menu_item")
                  .in("entity_id", itemIds);
                
                if (!translationsError && translationsData) {
                  translationsData.forEach((t: any) => {
                    if (!translationMap.has(t.entity_id)) {
                      translationMap.set(t.entity_id, []);
                    }
                    translationMap.get(t.entity_id)!.push({
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
                  customer_name: order.customer_name || "",
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
        })();

        // Calculate stats from orders
        const { data: todayOrders } = await supabase
          .from("orders")
          .select("status, order_type, order_items(price, quantity)")
          .eq("restaurant_id", restId)
          .gte("created_at", startOfToday.toISOString());

        let revenue = 0;
        let pendingOrdersCount = 0;
        let completedOrdersCount = 0;
        let totalOrdersTodayCount = 0;
        let takeawayOrdersCount = 0;
        let dineInOrdersCount = 0;
        let deliveryOrdersCount = 0;

        // Always initialize to 0, then calculate from data if available
        if (todayOrders && todayOrders.length > 0) {
          totalOrdersTodayCount = todayOrders.length;
          todayOrders.forEach((order: any) => {
            // Count pending orders (not completed)
            if (order.status !== "completed") {
              pendingOrdersCount++;
            } else {
              completedOrdersCount++;
            }
            // Count order types
            const orderType = (order.order_type || "").toString().toLowerCase().trim();
            if (orderType === "takeaway" || orderType === "pickup" || orderType === "pick_up") {
              takeawayOrdersCount++;
            } else if (orderType === "dine-in" || orderType === "dine_in" || orderType === "dinein") {
              dineInOrdersCount++;
            } else if (orderType === "delivery") {
              deliveryOrdersCount++;
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
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("table_id, status, booking_date, booking_time, created_at, customer_name, guest_count")
          .eq("restaurant_id", restId)
          .order("booking_date", { ascending: true })
          .order("booking_time", { ascending: true });
        if (bookingsError) {
          console.error("Error loading bookings for dashboard:", bookingsError);
        }
        
        // Filter today's bookings for table status and dashboard display
        const todaysAllBookings = bookings?.filter((b) => b.booking_date === todayStr) || [];
        const todayConfirmedBookings = todaysAllBookings.filter((b: any) => b.status === "confirmed");
        setTodayBookings(
          (bookings || []).map((b: any) => ({
            table_id: b.table_id,
            booking_date: b.booking_date || null,
            booking_time: b.booking_time || null,
            customer_name: b.customer_name || null,
            guest_count: b.guest_count ?? null,
            status: b.status || null,
          }))
        );

        // Load active orders for table status checking (needed for both free and pro plans)
        const { data: activeOrdersData } = await supabase
          .from("orders")
          .select("id, table_number, status, created_at")
          .eq("restaurant_id", restId)
          .gte("created_at", startOfToday.toISOString())
          .neq("status", "completed");

        // Load tables
        const { data: tablesData } = await supabase
          .from("restaurant_tables")
          .select("id, table_name, capacity, is_active")
          .eq("restaurant_id", restId)
          .eq("is_active", true);

        // Initialize table metrics to 0
        let reservedTables = 0;
        let availableTables = 0;
        const tableStatuses: TableStatus[] = [];

        if (tablesData && tablesData.length > 0) {
          // Map table statuses
          tablesData.forEach((table) => {
            // Check if table is reserved (has confirmed booking for today)
            const isReserved = todayConfirmedBookings.some(
              (b) => b.table_id === table.id
            );

            // Check if table has active order (pending or preparing, not completed)
            const hasActiveOrder = (activeOrdersData || []).some(
              (o) =>
                o.status !== "completed" &&
                o.table_number &&
                o.table_number.toString() === table.table_name.replace("T-", "")
            );

            let status: "available" | "reserved" = "available";
            // Treat any active order or confirmed booking as "Reserved".
            if (hasActiveOrder || isReserved) {
              status = "reserved";
            }

            tableStatuses.push({
              id: table.id,
              table_name: table.table_name,
              capacity: table.capacity,
              status,
            });

            // Count reserved tables (has active order or is reserved)
            if (hasActiveOrder || isReserved) {
              reservedTables++;
            }
          });

          setTables(tableStatuses);
          availableTables = tablesData.length - reservedTables;
        } else {
          // No tables configured - set empty array
          setTables([]);
        }

        // Always set stats, ensuring all values default to 0
        const nextStats: BusinessStats = {
          todayRevenue: revenue || 0,
          pendingOrders: pendingOrdersCount || 0,
          completedOrders: completedOrdersCount || 0,
          totalOrdersToday: totalOrdersTodayCount || 0,
          takeawayOrders: takeawayOrdersCount || 0,
          dineInOrders: dineInOrdersCount || 0,
          deliveryOrders: deliveryOrdersCount || 0,
          tablesOccupied: reservedTables || 0,
          tablesAvailable: availableTables || 0,
          totalTables: tablesData?.length || 0,
          totalCategories: 0, // Will be loaded separately
          activeCategories: 0,
        };
        setStats(nextStats);
        setOverviewLoading(false);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(getStatsCacheKey(restId), JSON.stringify(nextStats));
        }

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

        // Trending menus fallback (if no recent order-item data)
        const loadTrendingMenuFallback = async () => {
          const { data: menu } = await supabase
            .from("menus")
            .select("id")
            .eq("restaurant_id", restId)
            .maybeSingle();

          if (!menu?.id) {
            setTrendingMenus([]);
            return;
          }

          const { data: categories } = await supabase
            .from("categories")
            .select("id")
            .eq("menu_id", menu.id);

          const categoryIds = (categories || []).map((c: any) => c.id).filter(Boolean);
          if (categoryIds.length === 0) {
            setTrendingMenus([]);
            return;
          }

          const { data: menuItems } = await supabase
            .from("menu_items")
            .select("id, image_url, price_chf, sort_order")
            .in("category_id", categoryIds)
            .order("sort_order", { ascending: true })
            .limit(6);

          const itemIds = (menuItems || []).map((m: any) => m.id).filter(Boolean);
          const { data: menuItemTitles } = itemIds.length
            ? await supabase
                .from("translations")
                .select("entity_id, title, language")
                .eq("entity_type", "menu_item")
                .in("entity_id", itemIds)
            : { data: [] as any[] };

          const titleMap = new Map<string, string>();
          (menuItemTitles || []).forEach((tr: any) => {
            const id = tr.entity_id;
            if (!id || !tr.title) return;
            if (tr.language === language) {
              titleMap.set(id, tr.title);
              return;
            }
            if (!titleMap.has(id)) {
              titleMap.set(id, tr.title);
            }
          });

          const fallbackTrending: TrendingMenuItem[] = (menuItems || []).map((m: any, idx: number) => ({
            id: m.id,
            name: titleMap.get(m.id) || `${t.menu?.untitled || "Untitled"} ${idx + 1}`,
            image_url: m.image_url || null,
            orders: Math.max(0, 12 - idx * 2),
            price: Number(m.price_chf || 0),
            rating: Number((4.6 - idx * 0.1).toFixed(1)),
          }));

          setTrendingMenus(fallbackTrending);
        };

        // Trending menus + category donut data (last 30 days)
        const trendingFrom = new Date(now);
        trendingFrom.setDate(trendingFrom.getDate() - 30);
        const { data: trendingOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("restaurant_id", restId)
          .gte("created_at", trendingFrom.toISOString())
          .limit(800);

        const trendingOrderIds = (trendingOrders || []).map((o: any) => o.id).filter(Boolean);
        if (trendingOrderIds.length > 0) {
          const { data: trendItems } = await supabase
            .from("order_items")
            .select("item_id, quantity, price")
            .in("order_id", trendingOrderIds);

          const itemAgg = new Map<string, { orders: number; priceSum: number; qtySum: number }>();
          (trendItems || []).forEach((it: any) => {
            const itemId = it.item_id;
            if (!itemId) return;
            if (!itemAgg.has(itemId)) {
              itemAgg.set(itemId, { orders: 0, priceSum: 0, qtySum: 0 });
            }
            const rec = itemAgg.get(itemId)!;
            const qty = Number(it.quantity || 0);
            rec.orders += qty;
            rec.qtySum += qty;
            rec.priceSum += Number(it.price || 0) * qty;
          });

          const itemIds = Array.from(itemAgg.keys());
          const [{ data: menuItems }, { data: menuItemTitles }] = await Promise.all([
            supabase
              .from("menu_items")
              .select("id, image_url, price_chf, category_id")
              .in("id", itemIds),
            supabase
              .from("translations")
              .select("entity_id, title, language")
              .eq("entity_type", "menu_item")
              .in("entity_id", itemIds),
          ]);

          const titleMap = new Map<string, string>();
          (menuItemTitles || []).forEach((tr: any) => {
            const id = tr.entity_id;
            if (!id || !tr.title) return;
            if (tr.language === language) {
              titleMap.set(id, tr.title);
              return;
            }
            if (!titleMap.has(id)) {
              titleMap.set(id, tr.title);
            }
          });

          const menuMap = new Map<string, any>();
          (menuItems || []).forEach((m: any) => menuMap.set(m.id, m));

          const trendingList: TrendingMenuItem[] = itemIds
            .map((id) => {
              const agg = itemAgg.get(id)!;
              const menu = menuMap.get(id);
              const unitPrice =
                Number(menu?.price_chf ?? 0) > 0
                  ? Number(menu?.price_chf)
                  : agg.qtySum > 0
                  ? agg.priceSum / agg.qtySum
                  : 0;
              const rating = Number((4.1 + Math.min(0.8, agg.orders / 80)).toFixed(1));
              return {
                id,
                name: titleMap.get(id) || t.menu?.untitled || "Untitled",
                image_url: menu?.image_url ?? null,
                orders: agg.orders,
                price: unitPrice,
                rating,
              };
            })
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 6);

          if (trendingList.length > 0) {
            setTrendingMenus(trendingList);
          } else {
            await loadTrendingMenuFallback();
          }

          // Category donut data
          const catCounts = new Map<string, number>();
          itemIds.forEach((id) => {
            const menu = menuMap.get(id);
            const categoryId = menu?.category_id;
            if (!categoryId) return;
            const qty = itemAgg.get(id)?.orders || 0;
            catCounts.set(categoryId, (catCounts.get(categoryId) || 0) + qty);
          });

          const categoryIds = Array.from(catCounts.keys());
          if (categoryIds.length > 0) {
            const { data: categoryTitles } = await supabase
              .from("translations")
              .select("entity_id, title, language")
              .eq("entity_type", "category")
              .in("entity_id", categoryIds);

            const categoryNameMap = new Map<string, string>();
            (categoryTitles || []).forEach((tr: any) => {
              if (!tr.entity_id || !tr.title) return;
              if (tr.language === language) {
                categoryNameMap.set(tr.entity_id, tr.title);
                return;
              }
              if (!categoryNameMap.has(tr.entity_id)) {
                categoryNameMap.set(tr.entity_id, tr.title);
              }
            });

            const palette = ["#16a34a", "#22c55e", "#86efac", "#bbf7d0", "#dcfce7"];
            const donut = categoryIds
              .map((id, idx) => ({
                label: categoryNameMap.get(id) || t.admin?.categories?.title || "Category",
                value: catCounts.get(id) || 0,
                color: palette[idx % palette.length],
              }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            setCategoryDonutData(donut);
          } else {
            setCategoryDonutData([]);
          }
        } else {
          await loadTrendingMenuFallback();
          setCategoryDonutData([]);
        }
      } else {
        // Free plan: basic stats only
      setTodayBookings([]);
      setTables([]);
      setTrendingMenus([]);
      setCategoryDonutData([]);
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

          const nextStats: BusinessStats = {
            todayRevenue: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalOrdersToday: 0,
            takeawayOrders: 0,
            dineInOrders: 0,
            deliveryOrders: 0,
            tablesOccupied: 0,
            tablesAvailable: 0,
            totalTables: 0,
            totalCategories: categories?.length || 0,
            activeCategories: categories?.filter((c) => c.is_active).length || 0,
          };
          setStats(nextStats);
          setOverviewLoading(false);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(getStatsCacheKey(restId), JSON.stringify(nextStats));
          }
        } else {
          setOverviewLoading(false);
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
  }, [isPro, router, language]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextDate = new Date().toISOString().split("T")[0];
      setCurrentDateKey((prev) => (prev === nextDate ? prev : nextDate));
    }, 60_000);
    return () => clearInterval(timer);
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
    { label: t.dashboard?.quickActions?.settings || "Settings", icon: Settings, href: "/admin/settings", pro: false },
    { label: t.dashboard?.quickActions?.qrCode || t.dashboard.quickActions?.qrCode || "QR Code", icon: QrCode, href: "/admin/qr", pro: false },
  ];

  const welcomeHeadlineTemplate =
    t.dashboard?.welcomeHeadline || "Welcome to {restaurant} Overview";
  const welcomeHeadline = welcomeHeadlineTemplate.replace(
    "{restaurant}",
    restaurantName || "Restaurant"
  );

  const overviewCards = [
    { title: t.dashboard?.overviewCards?.todaysRevenue || "Today's Revenue", value: stats.todayRevenue, icon: DollarSign, isCurrency: true },
    { title: t.dashboard?.overviewCards?.takeawayOrders || "Takeaway Orders", value: stats.takeawayOrders, icon: ShoppingCart },
    { title: t.dashboard?.overviewCards?.dineInOrders || "Dine-in Orders", value: stats.dineInOrders, icon: ChefHat },
    { title: t.dashboard?.overviewCards?.todaysTotalOrders || "Today's Total Orders", value: stats.totalOrdersToday, icon: Activity },
    { title: t.dashboard?.overviewCards?.deliveryOrders || "Delivery Orders", value: stats.deliveryOrders, icon: Users },
    { title: t.dashboard?.overviewCards?.totalTables || "Total Tables", value: stats.totalTables, icon: Table },
    { title: t.dashboard?.overviewCards?.availableTables || "Available Tables", value: stats.tablesAvailable, icon: CheckCircle },
    { title: t.dashboard?.overviewCards?.reservedTables || t.dashboard?.overviewCards?.occupiedTables || "Reserved Tables", value: stats.tablesOccupied, icon: Table },
    { title: t.dashboard?.overviewCards?.pendingOrders || "Pending Orders", value: stats.pendingOrders, icon: Clock },
    { title: t.dashboard?.overviewCards?.completedOrders || "Completed Orders", value: stats.completedOrders, icon: CheckCircle },
  ];

  const categoryTotal = stats.takeawayOrders + stats.dineInOrders + stats.deliveryOrders;
  const takeawayPct = categoryTotal ? Math.round((stats.takeawayOrders / categoryTotal) * 100) : 0;
  const dineInPct = categoryTotal ? Math.round((stats.dineInOrders / categoryTotal) * 100) : 0;
  const deliveryPct = Math.max(0, 100 - takeawayPct - dineInPct);
  const revenueData: AnalyticsPoint[] =
    revenueView === "day"
      ? revenueChartData.map((d) => ({ label: d.hour, value: d.revenue }))
      : revenueMonthlyData.map((d) => ({ label: d.day.replace("Day ", ""), value: d.revenue }));
  const ordersData: AnalyticsPoint[] =
    ordersView === "day"
      ? ordersChartData.map((d) => ({ label: d.hour, value: d.count }))
      : ordersMonthlyData.map((d) => ({ label: d.day.replace("Day ", ""), value: d.count }));
  const selectedHourBookedTableIds = useMemo(() => {
    const selectedHour = Number(selectedTime.split(":")[0] || 0);
    return new Set(
      todayBookings
        .filter((b) => {
          if (!b.booking_time) return false;
          if (b.booking_date !== selectedDate) return false;
          const bookingHour = Number(b.booking_time.split(":")[0] || -1);
          return bookingHour === selectedHour;
        })
        .map((b) => b.table_id)
    );
  }, [todayBookings, selectedTime, selectedDate]);
  const selectedHourBookingsByTable = useMemo(() => {
    const selectedHour = Number(selectedTime.split(":")[0] || 0);
    const map = new Map<string, TodayBookingStatus>();
    todayBookings.forEach((b) => {
      if (!b.booking_time) return;
      if (b.booking_date !== selectedDate) return;
      const bookingHour = Number(b.booking_time.split(":")[0] || -1);
      if (bookingHour === selectedHour && !map.has(b.table_id)) {
        map.set(b.table_id, b);
      }
    });
    return map;
  }, [todayBookings, selectedTime, selectedDate]);
  const selectedSlotBookings = useMemo(
    () =>
      todayBookings.filter((b) => {
        if (!b.booking_time) return false;
        if (b.booking_date !== selectedDate) return false;
        const bookingHour = Number(b.booking_time.split(":")[0] || -1);
        const selectedHour = Number(selectedTime.split(":")[0] || 0);
        return bookingHour === selectedHour;
      }),
    [todayBookings, selectedDate, selectedTime]
  );
  const todaysBookingsList = useMemo(
    () =>
      todayBookings
        .filter((b) => b.booking_date === currentDateKey)
        .sort((a, b) => (a.booking_time || "").localeCompare(b.booking_time || "")),
    [todayBookings, currentDateKey]
  );
  const tableNameById = useMemo(() => {
    const map = new Map<string, string>();
    tables.forEach((t) => map.set(t.id, t.table_name));
    return map;
  }, [tables]);
  const dashboardTables = useMemo(
    () =>
      tables.map((table) => {
        const reservedBySelectedBooking = selectedHourBookedTableIds.has(table.id);
        const bookingDetails = selectedHourBookingsByTable.get(table.id) || null;
        return {
          ...table,
          bookingDetails,
          status:
            reservedBySelectedBooking
              ? ("reserved" as const)
              : ("available" as const),
        };
      }),
    [tables, selectedHourBookedTableIds, selectedHourBookingsByTable]
  );

  const donutTotal = categoryDonutData.reduce((sum, c) => sum + c.value, 0);
  const donutGradient =
    categoryDonutData.length > 0
      ? (() => {
          let start = 0;
          const stops = categoryDonutData.map((c) => {
            const pct = donutTotal > 0 ? (c.value / donutTotal) * 100 : 0;
            const stop = `${c.color} ${start}% ${start + pct}%`;
            start += pct;
            return stop;
          });
          return `conic-gradient(${stops.join(", ")})`;
        })()
      : "conic-gradient(#dcfce7 0% 100%)";

  return (
    <div
      className="space-y-6 overflow-x-hidden pb-8 text-[13px] dark:bg-[#000000]"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}
    >
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/12 via-primary/8 to-primary/10 px-4 py-5 shadow-lg transition-all duration-500 sm:px-6 sm:py-6 lg:px-8"
      >
        {/* Decorative green circles (reference-style) */}
        <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-primary/30" />
        <div className="pointer-events-none absolute left-[52%] top-[34%] h-3.5 w-3.5 rounded-full bg-primary/35" />
        <div className="pointer-events-none absolute left-[47%] bottom-[22%] h-4.5 w-4.5 rounded-full bg-primary/30" />
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[320px] md:block">
          <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-l from-primary/10 to-transparent" />
        </div>

        <div className="relative z-10 flex w-full items-start justify-between gap-4 sm:gap-6 md:items-center">
          <div className="min-w-0 flex-1">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-bold tracking-wide text-foreground/90 sm:text-base"
            >
              {greetingPrefix}
              <span className="text-primary">{userName || "Admin"}</span>
              {greetingSuffix}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2.5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[42px]"
              suppressHydrationWarning
            >
              {welcomeHeadline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 max-w-4xl text-sm text-muted-foreground sm:text-base"
            >
              {t.dashboard?.welcomeSubtitle || "Manage your restaurant operations, orders, and reservations easily."}
            </motion.p>
          </div>

          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-primary/20 bg-background/70 shadow-sm sm:h-14 sm:w-14 md:h-20 md:w-20">
            {restaurantLogo ? (
              <Image
                src={restaurantLogo}
                alt="Restaurant logo"
                fill
                sizes="(max-width: 640px) 44px, (max-width: 768px) 56px, 80px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-primary/70 sm:text-xl">
                {(restaurantName || "R").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
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

      {/* Operations first: Recent Orders, Trending Menus, Booking sections */}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {/* Recent Orders */}
          <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader className="pb-1.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base font-bold tracking-tight text-foreground dark:text-[#ffffff]">
                  {t.dashboard?.recentOrders?.title || "Recent Orders"}
                </CardTitle>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full rounded-lg px-3 text-[11px] font-semibold sm:h-7 sm:w-auto"
                    onClick={() => router.push("/admin/orders")}
                  >
                    {t.dashboard?.recentOrders?.seeAllOrders || "See All Orders"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 md:hidden">
                {loading ? (
                  <div className="rounded-xl border border-border/70 p-4 text-center text-sm text-muted-foreground">
                    {t.dashboard?.liveOrderActivity?.loading || "Loading orders..."}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-xl border border-border/70 p-4 text-center text-sm text-muted-foreground">
                    {t.dashboard?.liveOrderActivity?.noOrders || "No orders yet"}
                  </div>
                ) : (
                  orders.map((order) => {
                    const amount = order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
                    const orderType = (order.order_type || "").toLowerCase();
                    const typeLabel =
                      orderType === "dine_in" || orderType === "dine-in"
                        ? (t.dashboard?.recentOrders?.dineIn || "Dine-in")
                        : orderType === "takeaway"
                        ? (t.dashboard?.recentOrders?.takeaway || "Takeaway")
                        : (t.dashboard?.recentOrders?.delivery || "Delivery");

                    return (
                      <div key={order.id} className="rounded-xl border border-border/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{t.dashboard?.recentOrders?.orderId || "Order ID"}</p>
                            <p className="truncate text-sm font-semibold text-foreground dark:text-[#ffffff]">
                              #{order.id.slice(0, 8).toLowerCase()}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-green-200/70 bg-green-50/70 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                            {typeLabel}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-foreground dark:text-[#ffffff]">
                            {order.customer_name || t.dashboard?.recentOrders?.guest || "Guest"}
                          </p>
                          <p className="shrink-0 text-sm font-semibold text-foreground dark:text-[#ffffff]">
                            CHF {amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="hidden overflow-x-auto md:block" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
                <table className="w-full min-w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80">
                      <th className="py-2.5 pr-3 font-medium">{t.dashboard?.recentOrders?.orderId || "Order ID"}</th>
                      <th className="py-2.5 pr-3 font-medium">{t.dashboard?.recentOrders?.customerName || "Customer Name"}</th>
                      <th className="py-2.5 pr-3 font-medium">{t.dashboard?.recentOrders?.orderType || "Order Type"}</th>
                      <th className="py-2.5 pr-3 font-medium">{t.dashboard?.recentOrders?.total || "Total"}</th>
                      <th className="py-2.5 font-medium">{t.dashboard?.recentOrders?.status || "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          {t.dashboard?.liveOrderActivity?.loading || "Loading orders..."}
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          {t.dashboard?.liveOrderActivity?.noOrders || "No orders yet"}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const amount = order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
                        const orderType = (order.order_type || "").toLowerCase();
                        const typeLabel =
                          orderType === "dine_in" || orderType === "dine-in"
                            ? (t.dashboard?.recentOrders?.dineIn || "Dine-in")
                            : orderType === "takeaway"
                            ? (t.dashboard?.recentOrders?.takeaway || "Takeaway")
                            : (t.dashboard?.recentOrders?.delivery || "Delivery");

                        return (
                          <tr key={order.id} className="border-b border-border/50 transition-colors hover:bg-muted/15 last:border-b-0">
                            <td className="py-2.5 pr-3 font-medium text-foreground dark:text-[#ffffff]">
                              #{order.id.slice(0, 8).toLowerCase()}
                            </td>
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white shadow-sm">
                                  {(order.customer_name || "G").charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[13px] font-semibold text-foreground dark:text-[#ffffff]">
                                  {order.customer_name || t.dashboard?.recentOrders?.guest || "Guest"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3">
                              <span className="inline-flex items-center rounded-full border border-green-200/70 bg-green-50/70 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                                {typeLabel}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3">
                              <span className="text-[13px] font-medium text-foreground dark:text-[#ffffff]">
                                CHF
                              </span>{" "}
                              <span className="text-[13px] font-semibold leading-none tracking-tight text-foreground dark:text-[#ffffff]">
                                {amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                  order.status === "completed"
                                    ? "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                                    : order.status === "preparing"
                                    ? "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300"
                                    : "border-amber-200/70 bg-amber-50/70 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
                                }`}
                              >
                                {order.status === "pending"
                                  ? (t.dashboard?.status?.pending || "Pending")
                                  : order.status === "preparing"
                                  ? (t.dashboard?.status?.preparing || "Preparing")
                                  : (t.dashboard?.status?.completed || "Completed")}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">
                  {t.dashboard?.todaysBookings?.title || "Today's Bookings"}
                </CardTitle>
                <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">{currentDateKey}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {todaysBookingsList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t.dashboard?.todaysBookings?.empty || "No bookings scheduled for today."}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-2 md:hidden">
                    {todaysBookingsList.map((booking, idx) => (
                      <div key={`${booking.table_id}-${booking.booking_time}-${idx}`} className="rounded-xl border border-border/70 p-3">
                        <p className="truncate text-sm font-semibold text-foreground dark:text-[#ffffff]">
                          {booking.customer_name || t.dashboard?.recentOrders?.guest || "Guest"}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <p className="text-muted-foreground">
                            {t.dashboard?.todaysBookings?.bookingTime || "Booking Time"}: {booking.booking_time || "-"}
                          </p>
                          <p className="text-muted-foreground">
                            {t.dashboard?.todaysBookings?.numberOfGuests || "Number of Guests"}: {booking.guest_count ?? "-"}
                          </p>
                          <p className="col-span-2 text-muted-foreground">
                            {t.dashboard?.todaysBookings?.tableNumber || "Table Number"}: {tableNameById.get(booking.table_id) || "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[620px] text-sm">
                      <thead>
                        <tr className="border-b border-border/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-3 pr-3 font-semibold">{t.dashboard?.todaysBookings?.customerName || "Customer Name"}</th>
                          <th className="py-3 pr-3 font-semibold">{t.dashboard?.todaysBookings?.bookingTime || "Booking Time"}</th>
                          <th className="py-3 pr-3 font-semibold">{t.dashboard?.todaysBookings?.numberOfGuests || "Number of Guests"}</th>
                          <th className="py-3 font-semibold">{t.dashboard?.todaysBookings?.tableNumber || "Table Number"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todaysBookingsList.map((booking, idx) => (
                          <tr key={`${booking.table_id}-${booking.booking_time}-${idx}`} className="border-b border-border/60 transition-colors hover:bg-muted/20 last:border-b-0">
                            <td className="py-3 pr-3 text-foreground dark:text-[#ffffff]">{booking.customer_name || t.dashboard?.recentOrders?.guest || "Guest"}</td>
                            <td className="py-3 pr-3 text-muted-foreground">{booking.booking_time || "-"}</td>
                            <td className="py-3 pr-3 text-muted-foreground">{booking.guest_count ?? "-"}</td>
                            <td className="py-3 text-muted-foreground">{tableNameById.get(booking.table_id) || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">{t.dashboard?.revenueGraph?.title || "Revenue Graph"}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant={revenueView === "day" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setRevenueView("day")}>{t.dashboard?.revenueGraph?.daily || "Daily"}</Button>
                  <Button variant={revenueView === "month" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setRevenueView("month")}>{t.dashboard?.revenueGraph?.monthly || "Monthly"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleLineAreaChart data={revenueData} loading={loading} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-green-200/70 bg-gradient-to-br from-green-50/80 to-white shadow-sm dark:border-[#1f1f1f] dark:from-[#111111] dark:to-[#111111]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">
                  {t.dashboard?.analytics || "Revenue Analytics"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant={revenueView === "day" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setRevenueView("day")}>{t.dashboard?.revenueGraph?.daily || "Daily"}</Button>
                  <Button variant={revenueView === "month" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setRevenueView("month")}>{t.dashboard?.revenueGraph?.monthly || "Monthly"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleLineAreaChart data={revenueData} loading={loading} />
            </CardContent>
          </Card>

          <OrdersOverviewCard
            title={t.dashboard?.ordersOverview?.title || "Orders Overview"}
            todayLabel={t.dashboard?.ordersOverview?.today || "Today"}
            monthLabel={t.dashboard?.ordersOverview?.month || "Month"}
            ordersView={ordersView}
            setOrdersView={setOrdersView}
            data={ordersData}
            loading={loading}
          />

        </div>

        {/* Right rail: Trending Menus + Quick Actions + Table Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6 xl:col-span-4"
        >
          <Card className="overflow-hidden rounded-2xl border border-border/70 bg-[#FFFFFF] shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">
                {t.dashboard?.trendingMenus?.title || "Trending Menus"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingMenus.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  {t.dashboard?.trendingMenus?.empty || "No trending menus yet."}
                </div>
              ) : (
                trendingMenus.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex flex-col items-start gap-3 rounded-xl border border-border/70 bg-[#FFFFFF] p-3 shadow-sm sm:flex-row sm:items-center dark:border-[#1f1f1f] dark:bg-[#0f0f0f]"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-lg bg-muted/40">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">{t.dashboard?.trendingMenus?.noImage || "No Image"}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground dark:text-[#ffffff]">{dish.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {dish.rating.toFixed(1)} {t.dashboard?.trendingMenus?.rating || "rating"} • {dish.orders} {t.dashboard?.trendingMenus?.orders || "orders"}
                      </p>
                    </div>
                    <p className="self-end text-sm font-semibold text-foreground sm:self-auto dark:text-[#ffffff]">
                      CHF {dish.price.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">
                {t.dashboard?.quickActions?.title || "Quick Actions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const isDisabled = action.pro && !isPro;
                return (
                  <Link key={action.label} href={isDisabled ? "#" : action.href} className="block">
                    <Button
                      variant="outline"
                      disabled={isDisabled}
                      className="h-[82px] w-full flex-col items-center justify-center gap-1 rounded-lg border-border/80 bg-card p-2 text-center text-[11px] font-medium hover:border-primary dark:border-[#1f1f1f] dark:bg-[#0f0f0f]"
                      onClick={
                        isDisabled
                          ? (e) => {
                              e.preventDefault();
                              setUpgradeModalOpen(true);
                            }
                          : undefined
                      }
                    >
                      <span className="rounded-md bg-primary p-1.5">
                        <action.icon className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground dark:text-[#ffffff]">
                        {action.label}
                      </span>
                      {isDisabled && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </Link>
                );
              })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
            <CardHeader>
              <div className="space-y-3">
                <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">
                  {t.dashboard?.tableStatus?.title || "Table Status"}
                </CardTitle>
                <div className="grid w-full grid-cols-[minmax(0,1fr)_110px] gap-2 sm:ml-auto sm:max-w-[360px]">
                  <div className="relative min-w-0">
                    <CalendarDays className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-9 w-full min-w-0 rounded-md border border-border bg-background pl-7 pr-2 text-xs font-medium text-foreground outline-none focus:border-primary dark:border-[#2a2a2a] dark:bg-[#0f0f0f]"
                    />
                  </div>
                  <div className="relative min-w-0">
                    <Clock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="h-9 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs font-medium text-foreground outline-none focus:border-primary dark:border-[#2a2a2a] dark:bg-[#0f0f0f]"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>                
              </div>
              <p className="text-xs text-muted-foreground">
                {(t.dashboard?.tableStatus?.availabilityFor || "Availability for")} {selectedDate} {(t.dashboard?.tableStatus?.at || "at")} {selectedTime}
              </p>
              <div className="flex items-center gap-4 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {t.dashboard?.tableStatus?.available || "Available"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                  {t.dashboard?.tableStatus?.reserved || "Reserved"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardTables.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  {t.dashboard?.tableStatus?.noTables || "No tables configured. Add tables in the Tables section."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                  {dashboardTables.map((table) => (
                    <div
                      key={table.id}
                      className={`h-[104px] rounded-xl border-2 p-2.5 transition-all ${
                        table.status === "available"
                          ? "border-primary/90 bg-primary/5"
                          : "border-[#3B82F6]/40 bg-[#3B82F6]/10 dark:bg-[#3B82F6]/15"
                      }`}
                    >
                      <div className="flex h-full flex-col items-center justify-between text-center">
                        <p className="text-sm font-bold text-foreground dark:text-[#ffffff]">
                          {table.table_name}
                        </p>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            table.status === "available" ? "bg-primary" : "bg-[#3B82F6]"
                          }`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t.dashboard?.tableStatus?.capacity || "Capacity"}: {table.capacity} {t.dashboard?.tableStatus?.persons || "Persons"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 border-t border-border/70 pt-4">
                <h4 className="text-sm font-semibold text-foreground dark:text-[#ffffff]">
                  {t.dashboard?.tableStatus?.bookingDetails || "Booking Details"}
                </h4>
                {selectedSlotBookings.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.dashboard?.tableStatus?.noBookingsForSelected || "No bookings for the selected date and time."}
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {selectedSlotBookings.map((booking, idx) => (
                      <div
                        key={`${booking.table_id}-${booking.booking_time}-${idx}`}
                        className="rounded-lg border border-border/70 bg-background/40 p-2.5 text-xs"
                      >
                        <p className="text-muted-foreground">
                          {(t.dashboard?.todaysBookings?.customerName || "Customer Name")}:{" "}
                          <span className="font-medium text-foreground dark:text-[#ffffff]">
                            {booking.customer_name || "-"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {(t.dashboard?.todaysBookings?.bookingTime || "Booking Time")}:{" "}
                          <span className="font-medium text-foreground dark:text-[#ffffff]">
                            {booking.booking_time || "-"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {(t.dashboard?.todaysBookings?.numberOfGuests || "Number of Guests")}:{" "}
                          <span className="font-medium text-foreground dark:text-[#ffffff]">
                            {booking.guest_count ?? "-"}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-green-200/70 bg-gradient-to-br from-green-50/80 to-white shadow-sm dark:border-[#1f1f1f] dark:from-[#111111] dark:to-[#111111]">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">{t.dashboard?.topCategories?.title || "Top Categories"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="mx-auto h-44 w-44 rounded-full"
                style={{ background: donutGradient }}
              >
                <div className="m-auto h-24 w-24 translate-y-10 rounded-full bg-card dark:bg-[#111111]" />
              </div>
              <div className="space-y-2 text-sm">
                {categoryDonutData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.dashboard?.topCategories?.empty || "No category data available."}</p>
                ) : (
                  categoryDonutData.map((cat) => (
                    <div key={cat.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </span>
                      <span className="font-semibold text-foreground dark:text-[#ffffff]">
                        {donutTotal > 0 ? Math.round((cat.value / donutTotal) * 100) : 0}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </div>
  );
}

// Revenue Chart Component
function SimpleLineAreaChart({ data, loading }: { data: AnalyticsPoint[]; loading: boolean }) {
  const { t } = useI18n();
  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;
  if (!data.length) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{t.dashboard?.charts?.noData || "No data available"}</div>;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = Math.max(360, data.length * 28);
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
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full sm:h-64">
        <defs>
          <linearGradient id="greenAreaDashboard" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <path d={areaPoints} fill="url(#greenAreaDashboard)" />
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
  data: AnalyticsPoint[];
  loading: boolean;
  highlightColor: string;
}) {
  const { t } = useI18n();
  if (loading) return <div className="h-56 animate-pulse rounded-xl bg-muted/50" />;
  if (!data.length) return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">{t.dashboard?.charts?.noData || "No data available"}</div>;

  const isTimeSeries = data.some((d) => d.label.includes(":"));
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = Math.max(360, data.length * (isTimeSeries ? 34 : 24));
  const height = 230;
  const padding = 28;
  const chartW = width - padding * 2;
  const barW = Math.max(8, chartW / data.length - 8);
  const stepX = chartW / data.length;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full sm:h-56">
        {data.map((d, i) => {
          const x = padding + i * stepX + Math.max((stepX - barW) / 2, 2);
          const h = (d.value / maxValue) * (height - padding * 2);
          const y = height - padding - h;
          const showLabel = !isTimeSeries || data.length <= 8 || i % 2 === 0 || i === data.length - 1;
          return (
            <g key={`${d.label}-${i}`}>
              <rect x={x} y={y} width={barW} height={h} rx="4" fill={highlightColor} opacity={i === data.length - 1 ? 1 : 0.65} />
              {showLabel ? (
                <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[9px] sm:text-[10px]">
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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
  reserved,
  available,
}: {
  reserved: number;
  available: number;
}) {
  const { t } = useI18n();
  const total = reserved + available;
  const reservedPercent = total > 0 ? (reserved / total) * 100 : 0;
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
          {/* Reserved segment */}
          {reserved > 0 && (
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="20"
              strokeDasharray={`${(reservedPercent / 100) * 502.65} 502.65`}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 502.65" }}
              animate={{
                strokeDasharray: `${(reservedPercent / 100) * 502.65} 502.65`,
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
              strokeDashoffset={-((reservedPercent / 100) * 502.65)}
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 502.65" }}
              animate={{
                strokeDasharray: `${(availablePercent / 100) * 502.65} 502.65`,
                strokeDashoffset: -((reservedPercent / 100) * 502.65),
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
          <div className="h-4 w-4 rounded-full bg-[#3B82F6]" />
          <span className="text-sm text-foreground dark:text-[#ffffff]">
            {t.dashboard?.tableStatus?.reserved || "Reserved"}: {reserved}
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
