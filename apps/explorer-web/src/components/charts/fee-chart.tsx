"use client";

import { Wallet } from "lucide-react";
import { ChartWrapper } from "./chart-wrapper";
import { useFeeStats } from "@/lib/hooks";
import { stroopsToXLM } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function FeeChart() {
  const { data: feeStats, isLoading } = useFeeStats();
  const t = useTranslations("charts");

  const fees = feeStats
    ? {
        min: stroopsToXLM(feeStats.fee_charged.min),
        max: stroopsToXLM(feeStats.fee_charged.max),
        mode: stroopsToXLM(feeStats.fee_charged.mode),
        p50: stroopsToXLM(feeStats.fee_charged.p50),
        p99: stroopsToXLM(feeStats.fee_charged.p99),
      }
    : null;

  // Calculate mode position as percentage of max
  const modePosition = fees
    ? Math.min(100, (parseFloat(fees.mode) / parseFloat(fees.max)) * 100)
    : 0;

  return (
    <ChartWrapper
      title={t("networkFees")}
      subtitle={t("feeStats")}
      icon={Wallet}
      loading={isLoading}
    >
      {fees ? (
        <div className="space-y-4">
          {/* Main fee display */}
          <div className="text-center">
            <p className="text-chart-3 text-3xl font-bold tabular-nums">
              {fees.mode}
              <span className="text-muted-foreground ml-1 text-sm font-normal">XLM</span>
            </p>
            <p className="text-muted-foreground text-xs">{t("averageFee")}</p>
          </div>

          {/* Fee range visualization with gradient bar */}
          <div className="relative px-1">
            {/* Labels */}
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-muted-foreground">{t("min")}</span>
              <span className="text-muted-foreground">{t("max")}</span>
            </div>

            {/* Gradient bar */}
            <div className="relative h-3 overflow-hidden rounded-full">
              <div className="from-chart-3/20 via-chart-3 to-chart-3/20 absolute inset-0 bg-gradient-to-r" />

              {/* Mode indicator */}
              <div
                className="bg-foreground absolute -top-0.5 h-4 w-1 rounded-full shadow-md transition-all"
                style={{ left: `calc(${modePosition}% - 2px)` }}
              />
            </div>

            {/* Min/Max values */}
            <div className="mt-2 flex justify-between text-xs tabular-nums">
              <span className="text-foreground font-medium">{fees.min}</span>
              <span className="text-foreground font-medium">{fees.max}</span>
            </div>
          </div>

          {/* Percentiles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <p className="text-muted-foreground text-xs">P50</p>
              <p className="text-sm font-medium tabular-nums">{fees.p50}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <p className="text-muted-foreground text-xs">P99</p>
              <p className="text-sm font-medium tabular-nums">{fees.p99}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-[140px] items-center justify-center">
          <p className="text-muted-foreground text-sm">{t("collectingData")}</p>
        </div>
      )}
    </ChartWrapper>
  );
}
