"use client";

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";
import { ChartWrapper } from "./chart-wrapper";
import { chartColors, chartAxisStyle } from "./chart-config";
import { useTxChartData } from "@/lib/hooks/use-chart-data";
import { formatCompactNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";

function formatHour(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { timestamp: number } }>;
  transactionsLabel?: string;
}

function CustomTooltip({ active, payload, transactionsLabel = "transactions" }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const date = new Date(payload[0].payload.timestamp);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = formatHour(payload[0].payload.timestamp);

  return (
    <div className="bg-popover border-border rounded-lg border px-3 py-2 shadow-lg">
      <p className="text-foreground text-sm font-medium">
        {formatCompactNumber(payload[0].value)} {transactionsLabel}
      </p>
      <p className="text-muted-foreground text-xs">
        {dateStr} {timeStr}
      </p>
    </div>
  );
}

export default function TransactionsChart() {
  const { data, isLoading, isCollecting } = useTxChartData();
  const t = useTranslations("charts");
  const tRoot = useTranslations();

  // Calculate total transactions
  const totalTx = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ChartWrapper
      title={t("transactionVolume")}
      subtitle={isCollecting ? tRoot("accumulatingData") : t("hourlyActivity")}
      icon={TrendingUp}
      loading={isLoading}
      headerRight={
        totalTx > 0 ? (
          <div className="text-right">
            <span className="text-chart-2 text-lg font-bold tabular-nums">
              {formatCompactNumber(totalTx)}
            </span>
            <span className="text-muted-foreground ml-1 text-xs">{t("total")}</span>
          </div>
        ) : null
      }
    >
      {isCollecting ? (
        <div className="flex h-[140px] flex-col items-center justify-center gap-2">
          <div className="bg-primary/10 text-primary rounded-full p-3">
            <TrendingUp className="size-5" />
          </div>
          <p className="text-muted-foreground text-sm">{t("collectingData")}</p>
          <p className="text-muted-foreground text-xs">{t("chartWillPopulate")}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.success} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColors.success} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatHour}
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
              tickFormatter={(v) => formatCompactNumber(v)}
              domain={[0, "auto"]}
            />
            <Tooltip content={<CustomTooltip transactionsLabel={tRoot("transactions_word")} />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={chartColors.success}
              strokeWidth={2}
              fill="url(#txGradient)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
