"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Clock, ChefHat, CheckCircle, MoreVertical, Eye, Calendar, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Language } from "@/types/database";
import Link from "next/link";
import { useOrderNotification } from "@/contexts/order-notification-context";
import { useSubscription } from "@/contexts/subscription-context";

interface OrderItem {
  id: string;
  item_id: string;
  quantity: number;
  price: number;
  item_title?: Record<Language, string>;
}

interface Order {
  id: string;
  customer_name: string;
  order_type: "dine_in" | "takeaway";
  table_number: number | null;
  delivery_address: string | null;
  phone_number: string | null;
  status: "pending" | "preparing" | "completed";
  created_at: string;
  items: OrderItem[];
  total: number;
}

function getDisplayTitle(
  titleRecord: Record<Language, string> | undefined,
  lang: Language
): string {
  if (!titleRecord) return "Unknown Item";
  const order: Language[] = [lang, "de", "en", "fr", "it"];
  for (const l of order) {
    const v = titleRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return "Unknown Item";
}

export default function OrdersPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { resetNotification } = useOrderNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Default to all orders
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadOrders = useCallback(async (currentRestaurantId: string) => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch orders
      let query = supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", currentRestaurantId)
        .order("created_at", { ascending: false });

      // Date filter
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString());
      }

      // Filter by status
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) {
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch order items for each order
      const orderIds = ordersData.map((o) => o.id);
      const { data: orderItemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id, item_id, quantity, price")
        .in("order_id", orderIds);

      if (itemsError) {
        throw itemsError;
      }

      // Fetch translations for menu items
      const itemIds = [
        ...new Set(orderItemsData?.map((oi) => oi.item_id).filter(Boolean) ?? []),
      ];
      const translationMap = new Map<string, Record<Language, string>>();
      
      if (itemIds.length > 0) {
        const { data: translations, error: translationsError } = await supabase
          .from("translations")
          .select("entity_id, language, title")
          .eq("entity_type", "menu_item")
          .in("entity_id", itemIds);

        if (translationsError) {
          console.warn("Error fetching translations:", translationsError);
        } else {
          translations?.forEach((tr) => {
            if (!translationMap.has(tr.entity_id)) {
              translationMap.set(tr.entity_id, {} as Record<Language, string>);
            }
            const record = translationMap.get(tr.entity_id)!;
            record[tr.language as Language] = tr.title;
          });
        }
      }

      // Combine orders with items
      const ordersWithItems: Order[] = ordersData.map((order) => {
        const items =
          orderItemsData?.filter((oi) => oi.order_id === order.id) ?? [];
        const itemsWithTitles: OrderItem[] = items.map((item) => ({
          ...item,
          item_title: translationMap.get(item.item_id),
        }));
        const total = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          ...order,
          items: itemsWithTitles,
          total,
        };
      });

      setOrders(ordersWithItems);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error: any) {
      console.error("Error loading orders:", error);
      const errorMessage = error?.message || "Failed to load orders";
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedDate]);

  useEffect(() => {
    setMounted(true);
    // Reset notification count when orders page is opened
    resetNotification();
  }, [resetNotification]);

  useEffect(() => {
    async function init() {
      if (!mounted || !isPro) return;
      
      const supabase = createClient();

      // Get current user's restaurant
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

      if (!restaurant) {
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      await loadOrders(restaurant.id);

      // Set up realtime subscription
      const channel = supabase
        .channel("orders-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `restaurant_id=eq.${restaurant.id}`,
          },
          () => {
            // Reload orders when changes occur
            loadOrders(restaurant.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    if (mounted && isPro) {
      init();
    }
  }, [mounted, isPro, loadOrders, router]);

  useEffect(() => {
    if (restaurantId && isPro) {
      loadOrders(restaurantId);
    }
  }, [statusFilter, selectedDate, restaurantId, isPro, loadOrders]);

  // Pagination logic
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  // Tab filter handlers
  const handleTabChange = (tab: string) => {
    if (tab === "all") {
      setStatusFilter("all");
    } else if (tab === "pending") {
      setStatusFilter("pending");
    } else if (tab === "completed") {
      setStatusFilter("completed");
    }
    setCurrentPage(1);
  };

  // Get active tab based on statusFilter
  const getActiveTab = () => {
    if (statusFilter === "all") return "all";
    if (statusFilter === "pending") return "pending";
    if (statusFilter === "completed") return "completed";
    return "all"; // Default
  };

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingStatus(orderId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order status updated");
      // Orders will auto-update via realtime subscription
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  }

  function getStatusIcon(status: Order["status"]) {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "preparing":
        return <ChefHat className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
    }
  }

  function getStatusColor(status: Order["status"]) {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "preparing":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  useEffect(() => {
    if (!subscriptionLoading && !isPro) {
      toast.error("Orders feature is available only in Pro plan.");
      router.replace("/admin");
    }
  }, [isPro, subscriptionLoading, router]);

  if (!isPro) {
    return null;
  }

  // Get address display text
  const getAddressText = (order: Order) => {
    if (order.order_type === "dine_in" && order.table_number) {
      return `Table ${order.table_number}`;
    }
    if (order.order_type === "takeaway" && order.delivery_address) {
      return order.delivery_address;
    }
    return "-";
  };

  // Get status badge color
  const getStatusBadgeColor = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "bg-[#5B7A2F]/10 text-[#5B7A2F] border-[#5B7A2F]/20 dark:bg-[#7A9E4A]/20 dark:text-[#7A9E4A] dark:border-[#7A9E4A]/30";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30";
      case "preparing":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  // Get customer avatar initial
  const getAvatarInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <PageTitle>{t.admin.orders.title}</PageTitle>
      </div>

      {/* Tabs and Date Filter */}
      <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange("all")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  getActiveTab() === "all"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => handleTabChange("pending")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  getActiveTab() === "pending"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleTabChange("completed")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  getActiveTab() === "completed"
                    ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                    : "bg-white/50 text-[#6B7B5A] hover:bg-[#E8E4D9]/50 dark:bg-[#243019]/50 dark:text-[#9CA88A] dark:hover:bg-[#2D3A1A]/50"
                }`}
              >
                Completed
              </button>
            </div>

            {/* Date Selector */}
            {mounted && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#6B7B5A] dark:text-[#9CA88A]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-[#D6D2C4]/50 bg-white px-3 py-2 text-sm text-[#2D3A1A] shadow-sm transition-all hover:border-[#5B7A2F]/50 focus:border-[#5B7A2F] focus:outline-none focus:ring-2 focus:ring-[#5B7A2F]/20 dark:border-[#3D4F2A]/50 dark:bg-[#243019] dark:text-[#E8E4D9] dark:hover:border-[#7A9E4A]/50 dark:focus:border-[#7A9E4A]"
                />
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDate("");
                      setCurrentPage(1);
                    }}
                    className="text-xs text-[#6B7B5A] hover:text-[#2D3A1A] dark:text-[#9CA88A] dark:hover:text-[#E8E4D9]"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#5B7A2F] dark:text-[#7A9E4A]" />
        </div>
      ) : orders.length === 0 ? (
        <FadeIn>
          <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-[#6B7B5A] dark:text-[#9CA88A]">{t.admin.orders.noOrders}</p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <Card className="rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D6D2C4]/30 dark:border-[#3D4F2A]/30">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Customer Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#6B7B5A] dark:text-[#9CA88A]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6D2C4]/20 dark:divide-[#3D4F2A]/20">
                  {paginatedOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="transition-colors hover:bg-[#E8E4D9]/30 dark:hover:bg-[#2D3A1A]/30"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#5B7A2F] to-[#7A9E4A] text-white font-semibold text-sm shadow-md">
                            {getAvatarInitial(order.customer_name)}
                          </div>
                          <span className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                            {order.customer_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#5B7A2F] shadow-sm dark:bg-[#243019]/70 dark:text-[#7A9E4A]">
                          {order.order_type === "dine_in" ? "Dine-in" : "Takeaway"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#6B7B5A] dark:text-[#9CA88A] max-w-xs truncate block" title={getAddressText(order)}>
                          {getAddressText(order)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#6B7B5A] dark:text-[#9CA88A]">
                          {formatDate(order.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                          CHF {order.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`flex w-fit items-center gap-1.5 border ${getStatusBadgeColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-[#D6D2C4]/50 bg-white/50 text-[#5B7A2F] hover:bg-[#5B7A2F] hover:text-white hover:border-[#5B7A2F] shadow-sm transition-all dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:text-[#7A9E4A] dark:hover:bg-[#7A9E4A] dark:hover:text-[#1A2212]"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={updatingStatus === order.id}
                                className="rounded-xl hover:bg-[#E8E4D9]/50 dark:hover:bg-[#2D3A1A]/50"
                              >
                                {updatingStatus === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-[#5B7A2F] dark:text-[#7A9E4A]" />
                                ) : (
                                  <MoreVertical className="h-4 w-4 text-[#6B7B5A] dark:text-[#9CA88A]" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-[#D6D2C4]/50 dark:border-[#3D4F2A]/50">
                              {order.status !== "pending" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateOrderStatus(order.id, "pending")
                                  }
                                  className="rounded-lg"
                                >
                                  {t.admin.orders.markAsPending}
                                </DropdownMenuItem>
                              )}
                              {order.status !== "preparing" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateOrderStatus(order.id, "preparing")
                                  }
                                  className="rounded-lg"
                                >
                                  {t.admin.orders.markAsPreparing}
                                </DropdownMenuItem>
                              )}
                              {order.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateOrderStatus(order.id, "completed")
                                  }
                                  className="rounded-lg"
                                >
                                  {t.admin.orders.markAsCompleted}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-[#D6D2C4]/30 px-6 py-4 dark:border-[#3D4F2A]/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6B7B5A] dark:text-[#9CA88A]">
                    Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 disabled:opacity-50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`rounded-xl ${
                              currentPage === pageNum
                                ? "bg-[#5B7A2F] text-white shadow-md dark:bg-[#7A9E4A]"
                                : "border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 disabled:opacity-50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
