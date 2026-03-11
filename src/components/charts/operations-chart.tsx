"use client";

import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartWrapper } from "./chart-wrapper";
import { useOpsPerLedgerChartData } from "@/lib/hooks/use-chart-data";
import { useTranslations } from "next-intl";
import {
  chartColors,
  chartConfig,
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "./chart-config";

export default function OperationsChart() {
  const { data, avgOps, isLoading } = useOpsPerLedgerChartData();
  const t = useTranslations("charts");

  const hasData = data.length > 1;

  return (
    <ChartWrapper
      title={t("opsPerLedger")}
      subtitle={hasData ? t("avgOps", { count: avgOps }) : t("collectingData")}
      icon={BarChart3}
      loading={isLoading}
    >
      {!hasData ? (
        <div className="flex h-[140px] items-center justify-center">
          <p className="text-muted-foreground text-sm">{t("chartWillPopulate")}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartConfig.mobileHeight}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid {...chartGridStyle} vertical={false} />
            <XAxis
              dataKey="ledger"
              {...chartAxisStyle}
              tickFormatter={(v: number) => `#${(v % 100000).toString()}`}
            />
            <YAxis {...chartAxisStyle} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelFormatter={(v) => `Ledger #${Number(v).toLocaleString()}`}
              formatter={(value, name) => [
                Number(value).toLocaleString(),
                name === "ops" ? t("operationsLabel") : t("transactionsLabel"),
              ]}
            />
            <Bar dataKey="ops" fill={chartColors.primary} radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
