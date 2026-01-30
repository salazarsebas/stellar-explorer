"use client";

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Zap } from "lucide-react";
import { ChartWrapper } from "./chart-wrapper";
import { chartColors, chartAxisStyle } from "./chart-config";
import { useTPSChartData } from "@/lib/hooks/use-chart-data";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { timestamp: number } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border-border rounded-lg border px-3 py-2 shadow-lg">
      <p className="text-foreground text-sm font-medium">{payload[0].value.toFixed(2)} TPS</p>
      <p className="text-muted-foreground text-xs">{formatTime(payload[0].payload.timestamp)}</p>
    </div>
  );
}

export default function TPSChart() {
  const { data, currentTPS, isLoading } = useTPSChartData();
  const t = useTranslations("charts");

  const hasData = data.length > 1;

  return (
    <ChartWrapper
      title={t("tps")}
      icon={Zap}
      loading={isLoading}
      headerRight={
        <div className="text-right">
          <span
            className={cn(
              "text-xl font-bold tabular-nums",
              currentTPS > 0 ? "text-chart-1" : "text-muted-foreground"
            )}
          >
            {currentTPS.toFixed(1)}
          </span>
          <span className="text-muted-foreground ml-1 text-xs">{t("tpsLabel")}</span>
        </div>
      }
    >
      {!hasData ? (
        <div className="flex h-[140px] items-center justify-center">
          <p className="text-muted-foreground text-sm">{t("collectingData")}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              {...chartAxisStyle}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              {...chartAxisStyle}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(0)}
              domain={[0, "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="tps"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: chartColors.primary }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
