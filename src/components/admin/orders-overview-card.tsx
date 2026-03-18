"use client";

import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type OrdersOverviewPoint = {
  label: string;
  value: number;
};

function SimpleBarChart({
  data,
  loading,
  highlightColor,
}: {
  data: OrdersOverviewPoint[];
  loading: boolean;
  highlightColor: string;
}) {
  const { t } = useI18n();
  if (loading) return <div className="h-56 animate-pulse rounded-xl bg-muted/50" />;
  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        {t.dashboard?.charts?.noData || "No data available"}
      </div>
    );
  }

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
          const showLabel =
            !isTimeSeries || data.length <= 8 || i % 2 === 0 || i === data.length - 1;
          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="4"
                fill={highlightColor}
                opacity={i === data.length - 1 ? 1 : 0.65}
              />
              {showLabel ? (
                <text
                  x={x + barW / 2}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px] sm:text-[10px]"
                >
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

export function OrdersOverviewCard({
  title,
  todayLabel,
  monthLabel,
  ordersView,
  setOrdersView,
  data,
  loading,
}: {
  title: string;
  todayLabel: string;
  monthLabel: string;
  ordersView: "day" | "month";
  setOrdersView: (view: "day" | "month") => void;
  data: OrdersOverviewPoint[];
  loading: boolean;
}) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground dark:text-[#ffffff]">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={ordersView === "day" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOrdersView("day")}
            >
              {todayLabel}
            </Button>
            <Button
              variant={ordersView === "month" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOrdersView("month")}
            >
              {monthLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SimpleBarChart data={data} loading={loading} highlightColor="var(--primary)" />
      </CardContent>
    </Card>
  );
}

