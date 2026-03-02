"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Clock,
  ChefHat,
  CheckCircle,
  ArrowLeft,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Language } from "@/types/database";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
  id: string;
  item_id: string;
  quantity: number;
  price: number;
  item_title?: Record<Language, string>;
  item_image_url?: string | null;
}

interface Order {
  id: string;
  customer_name: string;
  order_type: "dine_in" | "takeaway";
  table_number: number | null;
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

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { t, language } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;

      setLoading(true);
      try {
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

        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .eq("restaurant_id", restaurant.id)
          .single();

        if (orderError || !orderData) {
          toast.error("Order not found");
          router.push("/admin/orders");
          return;
        }

        // Fetch order items
        const { data: orderItemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, item_id, quantity, price")
          .eq("order_id", orderId);

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

        // Fetch menu items for images
        const imageMap = new Map<string, string | null>();
        if (itemIds.length > 0) {
          const { data: menuItems, error: menuItemsError } = await supabase
            .from("menu_items")
            .select("id, image_url")
            .in("id", itemIds);

          if (!menuItemsError && menuItems) {
            menuItems.forEach((item) => {
              imageMap.set(item.id, item.image_url);
            });
          }
        }

        // Combine order with items
        const items: OrderItem[] =
          orderItemsData?.map((item) => ({
            ...item,
            item_title: translationMap.get(item.item_id),
            item_image_url: imageMap.get(item.item_id) || null,
          })) ?? [];

        const total = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        setOrder({
          ...orderData,
          items,
          total,
        });
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, router]);

  async function updateOrderStatus(newStatus: Order["status"]) {
    if (!order) return;

    setUpdatingStatus(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      toast.success(t.admin.orders.statusUpdated);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(t.admin.orders.statusUpdateError);
    } finally {
      setUpdatingStatus(false);
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
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageTitle>Order Details</PageTitle>
        </div>
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 ${getStatusColor(order.status)}`}
        >
          {getStatusIcon(order.status)}
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer Name</p>
                <p className="text-lg font-semibold">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Type</p>
                <p className="text-lg font-semibold">
                  {order.order_type === "dine_in" ? "Dine-in" : "Takeaway"}
                </p>
              </div>
              {order.table_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Table Number</p>
                  <p className="text-lg font-semibold">{order.table_number}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Placed At</p>
                <p className="text-lg font-semibold">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="text-sm font-mono text-muted-foreground">{order.id}</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Status Management */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status !== "pending" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateOrderStatus("pending")}
                  disabled={updatingStatus}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {t.admin.orders.markAsPending}
                </Button>
              )}
              {order.status !== "preparing" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateOrderStatus("preparing")}
                  disabled={updatingStatus}
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  {t.admin.orders.markAsPreparing}
                </Button>
              )}
              {order.status !== "completed" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateOrderStatus("completed")}
                  disabled={updatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t.admin.orders.markAsCompleted}
                </Button>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Order Items */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.orders.items}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border/60 p-4"
                >
                  {item.item_image_url && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.item_image_url}
                        alt={getDisplayTitle(item.item_title, language)}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {getDisplayTitle(item.item_title, language)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x @ CHF {item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    CHF {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-lg font-semibold">{t.admin.orders.total}</span>
                <span className="text-2xl font-bold">
                  CHF {order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
