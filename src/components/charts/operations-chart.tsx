"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Activity } from "lucide-react";
import { ChartWrapper } from "./chart-wrapper";
import { useOperationsChartData } from "@/lib/hooks/use-chart-data";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border-border rounded-lg border px-3 py-2 shadow-lg">
      <p className="text-foreground text-sm font-medium">
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
}

export default function OperationsChart() {
  const { data, total, successRate, isLoading } = useOperationsChartData();
  const t = useTranslations("charts");
  const tRoot = useTranslations();

  const hasData = data.length > 0 && total > 0;

  return (
    <ChartWrapper
      title={t("successRate")}
      subtitle={t("last100")}
      icon={Activity}
      loading={isLoading}
    >
      {!hasData ? (
        <div className="flex h-[140px] items-center justify-center">
          <p className="text-muted-foreground text-sm">{tRoot("noTransactionData")}</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Donut chart */}
          <div className="relative h-[140px] w-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={300}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  successRate >= 95
                    ? "text-chart-2"
                    : successRate >= 80
                      ? "text-chart-3"
                      : "text-chart-5"
                )}
              >
                {successRate}%
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-muted-foreground text-sm tabular-nums">{item.value}</span>
              </div>
            ))}
            <div className="border-border border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{t("total")}</span>
                <span className="text-sm font-medium tabular-nums">{total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
