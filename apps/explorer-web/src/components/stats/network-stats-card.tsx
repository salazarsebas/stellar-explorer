"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestLedger, useFeeStats } from "@/lib/hooks";
import { Layers, ArrowLeftRight, Activity, BarChart3, Wallet, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { formatLedgerSequence, stroopsToXLM } from "@/lib/utils";

interface StatItemProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

function StatItem({ label, value, icon: Icon, className }: StatItemProps) {
  return (
    <div className={cn("bg-muted/30 flex items-center justify-between rounded-lg p-3", className)}>
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <Icon className="text-primary size-4" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="font-semibold tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

function NetworkStatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function NetworkStatsCard() {
  const { data: ledger, isLoading: ledgerLoading } = useLatestLedger();
  const { data: feeStats, isLoading: feeLoading } = useFeeStats();
  const t = useTranslations("networkStats");

  const isLoading = ledgerLoading || feeLoading;

  if (isLoading) {
    return <NetworkStatsCardSkeleton />;
  }

  if (!ledger) {
    return null;
  }

  const successRate =
    ledger.successful_transaction_count + ledger.failed_transaction_count > 0
      ? (ledger.successful_transaction_count /
          (ledger.successful_transaction_count + ledger.failed_transaction_count)) *
        100
      : 0;

  const avgFee = feeStats?.fee_charged?.mode || "100";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="text-primary size-4" />
            {t("title")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatItem
            label={t("totalLedgers")}
            value={formatLedgerSequence(ledger.sequence)}
            icon={Layers}
          />
          <StatItem
            label={t("totalTransactions")}
            value={ledger.successful_transaction_count.toLocaleString()}
            icon={ArrowLeftRight}
          />
          <StatItem
            label={t("totalOperations")}
            value={ledger.operation_count.toLocaleString()}
            icon={Activity}
          />
          <StatItem label={t("successRate")} value={`${successRate.toFixed(1)}%`} icon={Activity} />
          <StatItem label={t("baseFee")} value={`${stroopsToXLM(avgFee)} XLM`} icon={Wallet} />
          <StatItem
            label={t("protocolVersion")}
            value={`v${ledger.protocol_version}`}
            icon={Gauge}
          />
        </div>
      </CardContent>
    </Card>
  );
}
