"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetworkStats } from "@/lib/hooks";
import {
  Layers,
  Users,
  Coins,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StatItemProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  className?: string;
}

function StatItem({ label, value, icon: Icon, trend, className }: StatItemProps) {
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
      {trend !== undefined && (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            trend >= 0 ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
          )}
        >
          {trend >= 0 ? "+" : ""}
          {trend.toFixed(2)}%
        </Badge>
      )}
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
  const { data: stats, isLoading, error } = useNetworkStats();
  const t = useTranslations("networkStats");

  if (isLoading) {
    return <NetworkStatsCardSkeleton />;
  }

  if (error || !stats) {
    // Silently fail - this is optional enriched data
    return null;
  }

  const formatLargeNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return t("notAvailable");
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const successRate =
    stats.successful_transactions && stats.transactions
      ? (stats.successful_transactions / stats.transactions) * 100
      : 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="text-primary size-4" />
            {t("title")}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {t("source")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatItem
            label={t("totalLedgers")}
            value={formatLargeNumber(stats.ledgers)}
            icon={Layers}
          />
          <StatItem
            label={t("totalAccounts")}
            value={formatLargeNumber(stats.accounts?.total)}
            icon={Users}
          />
          <StatItem
            label={t("fundedAccounts")}
            value={formatLargeNumber(stats.accounts?.funded)}
            icon={Wallet}
          />
          <StatItem label={t("totalAssets")} value={formatLargeNumber(stats.assets)} icon={Coins} />
          <StatItem
            label={t("totalOperations")}
            value={formatLargeNumber(stats.operations)}
            icon={Activity}
          />
          <StatItem
            label={t("totalTransactions")}
            value={formatLargeNumber(stats.transactions)}
            icon={ArrowLeftRight}
          />
          <StatItem
            label={t("totalTrades")}
            value={formatLargeNumber(stats.trades)}
            icon={TrendingUp}
          />
          <StatItem
            label={t("trustlines")}
            value={formatLargeNumber(stats.trustlines)}
            icon={Coins}
          />
          <StatItem label={t("successRate")} value={`${successRate.toFixed(2)}%`} icon={Activity} />
        </div>
      </CardContent>
    </Card>
  );
}
