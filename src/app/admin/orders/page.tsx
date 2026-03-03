"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Clock, ChefHat, CheckCircle, MoreVertical, Eye } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<string>("active"); // Default to active orders
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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

      // Default filter: show pending + preparing first
      if (statusFilter === "active") {
        query = query.in("status", ["pending", "preparing"]);
      } else if (statusFilter !== "all") {
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
    } catch (error: any) {
      console.error("Error loading orders:", error);
      const errorMessage = error?.message || "Failed to load orders";
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setMounted(true);
    // Reset notification count when orders page is opened
    resetNotification();
  }, [resetNotification]);

  useEffect(() => {
    async function init() {
      if (!mounted) return;
      
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

    if (mounted) {
      init();
    }
  }, [mounted, loadOrders, router]);

  useEffect(() => {
    if (restaurantId) {
      loadOrders(restaurantId);
    }
  }, [statusFilter, restaurantId, loadOrders]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>{t.admin.orders.title}</PageTitle>
        {mounted && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Orders</SelectItem>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">{t.admin.orders.noOrders}</p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <FadeIn key={order.id} delay={index * 0.05}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {order.customer_name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1.5 ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {order.order_type === "dine_in"
                            ? "Dine-in"
                            : "Takeaway"}
                        </span>
                        {order.order_type === "dine_in" && order.table_number && (
                          <span>Table {order.table_number}</span>
                        )}
                        {order.order_type === "takeaway" && order.delivery_address && (
                          <span className="max-w-xs truncate" title={order.delivery_address}>
                            📍 {order.delivery_address}
                          </span>
                        )}
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={updatingStatus === order.id}
                          >
                            {updatingStatus === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status !== "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(order.id, "pending")
                              }
                            >
                              {t.admin.orders.markAsPending}
                            </DropdownMenuItem>
                          )}
                          {order.status !== "preparing" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(order.id, "preparing")
                              }
                            >
                              {t.admin.orders.markAsPreparing}
                            </DropdownMenuItem>
                          )}
                          {order.status !== "completed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(order.id, "completed")
                              }
                            >
                              {t.admin.orders.markAsCompleted}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.quantity}x{" "}
                            {getDisplayTitle(item.item_title, language)}
                          </span>
                          <span className="font-medium">
                            CHF {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="font-semibold">{t.admin.orders.total}</span>
                      <span className="text-lg font-bold">
                        CHF {order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
