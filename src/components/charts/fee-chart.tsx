"use client";

import { Wallet } from "lucide-react";
import { ChartWrapper } from "./chart-wrapper";
import { useFeeStats } from "@/lib/hooks";
import { stroopsToXLM } from "@/lib/utils";

export default function FeeChart() {
  const { data: feeStats, isLoading } = useFeeStats();

  const fees = feeStats
    ? {
        min: stroopsToXLM(feeStats.fee_charged.min),
        max: stroopsToXLM(feeStats.fee_charged.max),
        mode: stroopsToXLM(feeStats.fee_charged.mode),
        p50: stroopsToXLM(feeStats.fee_charged.p50),
        p99: stroopsToXLM(feeStats.fee_charged.p99),
      }
    : null;

  return (
    <ChartWrapper
      title="Network Fees"
      subtitle="Current fee statistics"
      icon={Wallet}
      loading={isLoading}
    >
      {fees ? (
        <div className="space-y-4">
          {/* Main fee display */}
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-xs">Average Fee</p>
            <p className="text-chart-3 text-2xl font-bold tabular-nums">
              {fees.mode} <span className="text-sm font-normal">XLM</span>
            </p>
          </div>

          {/* Fee range visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Min</span>
              <span className="text-muted-foreground">Max</span>
            </div>
            <div className="bg-muted relative h-2 rounded-full">
              <div
                className="bg-chart-3 absolute h-full rounded-full"
                style={{
                  left: "0%",
                  width: `${Math.min(100, (parseFloat(fees.mode) / parseFloat(fees.max)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs tabular-nums">
              <span>{fees.min}</span>
              <span>{fees.max}</span>
            </div>
          </div>

          {/* Percentiles */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground text-xs">P50</p>
              <p className="text-sm font-medium tabular-nums">{fees.p50}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground text-xs">P99</p>
              <p className="text-sm font-medium tabular-nums">{fees.p99}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-[140px] items-center justify-center">
          <p className="text-muted-foreground text-sm">No fee data available</p>
        </div>
      )}
    </ChartWrapper>
  );
}
