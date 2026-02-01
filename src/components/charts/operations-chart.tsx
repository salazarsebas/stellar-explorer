"use client";

import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { ChartWrapper } from "./chart-wrapper";
import { useOperationsChartData } from "@/lib/hooks/use-chart-data";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { chartColors } from "./chart-config";

export default function OperationsChart() {
  const { data, total, successRate, isLoading } = useOperationsChartData();
  const t = useTranslations("charts");
  const tRoot = useTranslations();

  const hasData = data.length > 0 && total > 0;
  const successful = data.find((d) => d.name === "Successful")?.value || 0;
  const failed = data.find((d) => d.name === "Failed")?.value || 0;

  // Calculate stroke dash for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (successRate / 100) * circumference;

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
        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative flex h-[120px] w-[120px] items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={
                  successRate >= 95
                    ? chartColors.success
                    : successRate >= 80
                      ? chartColors.warning
                      : chartColors.red
                }
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
                style={{ opacity: 0.85 }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  successRate >= 95
                    ? "text-emerald-400/90"
                    : successRate >= 80
                      ? "text-cyan-400/90"
                      : "text-red-400/90"
                )}
              >
                {successRate}
              </span>
              <span className="text-muted-foreground text-xs">%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            {/* Successful */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400/80" />
                <span className="text-muted-foreground text-sm">{t("successful")}</span>
              </div>
              <span className="font-medium tabular-nums">{successful}</span>
            </div>

            {/* Failed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-red-400/80" />
                <span className="text-muted-foreground text-sm">Failed</span>
              </div>
              <span className="font-medium tabular-nums">{failed}</span>
            </div>

            {/* Divider */}
            <div className="border-border border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{t("total")}</span>
                <span className="text-sm font-semibold tabular-nums">{total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
