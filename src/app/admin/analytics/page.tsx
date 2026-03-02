"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShoppingCart, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface MostOrderedItem {
  item_id: string;
  item_name: string;
  total_quantity: number;
}

interface AnalyticsData {
  totalOrders: number;
  todayOrders: number;
  mostOrderedItems: MostOrderedItem[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: typeof ShoppingCart;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const supabase = createClient();

        // Verify user is authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch analytics data
        const response = await fetch("/api/analytics");
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error: any) {
        console.error("Error loading analytics:", error);
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle>{t.admin.analytics.title}</PageTitle>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle>{t.admin.analytics.title}</PageTitle>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title={t.admin.analytics.totalOrders}
          value={analytics?.totalOrders ?? 0}
          icon={ShoppingCart}
          delay={0}
        />
        <StatCard
          title={t.admin.analytics.todayOrders}
          value={analytics?.todayOrders ?? 0}
          icon={Calendar}
          delay={0.1}
        />
      </div>

      {/* Most Ordered Items */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t.admin.analytics.mostOrderedItems}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!analytics?.mostOrderedItems || analytics.mostOrderedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.admin.analytics.noItemsYet}
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.mostOrderedItems.map((item, index) => (
                  <motion.div
                    key={item.item_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.item_name}</span>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {item.total_quantity} {item.total_quantity === 1 ? t.admin.analytics.order : t.admin.analytics.orders}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
