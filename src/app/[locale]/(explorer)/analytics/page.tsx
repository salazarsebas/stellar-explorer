"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Activity,
  Layers,
  Users,
  Coins,
  ArrowLeftRight,
  Calculator,
} from "lucide-react";
import { DashboardCharts } from "@/components/charts";
import { NetworkStatsCard } from "@/components/stats";
import { useNetworkStats, useLatestLedger, useRecentTransactions } from "@/lib/hooks";
import { useAnalyticsMode, useNetwork } from "@/lib/providers";
import { cn } from "@/lib/utils";

// Statistical calculation functions
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}

function calculateMin(values: number[]): number {
  return values.length > 0 ? Math.min(...values) : 0;
}

function calculateMax(values: number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

interface StatisticCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  className?: string;
}

function StatisticCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatisticCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-primary/10 rounded-lg p-2">
              <Icon className="text-primary size-4" />
            </div>
            {trend !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  trend >= 0
                    ? "border-green-500/30 text-green-500"
                    : "border-red-500/30 text-red-500"
                )}
              >
                {trend >= 0 ? (
                  <TrendingUp className="mr-1 size-3" />
                ) : (
                  <TrendingDown className="mr-1 size-3" />
                )}
                {Math.abs(trend).toFixed(2)}%
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatisticsTableProps {
  title: string;
  data: {
    label: string;
    value: string | number;
    description?: string;
  }[];
}

function StatisticsTable({ title, data }: StatisticsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="text-primary size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i} className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                {item.description && (
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                )}
              </div>
              <p className="font-mono text-sm font-semibold tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const { isAnalyticsMode, settings } = useAnalyticsMode();
  const { network } = useNetwork();
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

  // Fetch data
  const { data: networkStats, isLoading: statsLoading } = useNetworkStats();
  const { data: latestLedger, isLoading: ledgerLoading } = useLatestLedger();
  const { data: recentTxs, isLoading: txLoading } = useRecentTransactions(100);

  // Calculate transaction statistics
  const txStats = useMemo(() => {
    if (!recentTxs?.records) return null;

    const txs = recentTxs.records;
    const opCounts = txs.map((tx) => tx.operation_count);
    const fees = txs.map((tx) => Number(tx.fee_charged));
    const successCount = txs.filter((tx) => tx.successful).length;

    return {
      total: txs.length,
      successful: successCount,
      failed: txs.length - successCount,
      successRate: (successCount / txs.length) * 100,
      operations: {
        mean: calculateMean(opCounts),
        median: calculateMedian(opCounts),
        stdDev: calculateStdDev(opCounts),
        min: calculateMin(opCounts),
        max: calculateMax(opCounts),
        total: opCounts.reduce((sum, val) => sum + val, 0),
      },
      fees: {
        mean: calculateMean(fees),
        median: calculateMedian(fees),
        stdDev: calculateStdDev(fees),
        min: calculateMin(fees),
        max: calculateMax(fees),
      },
    };
  }, [recentTxs]);

  // Export data function
  const exportData = (format: "json" | "csv") => {
    if (!txStats || !networkStats) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      network,
      timeRange,
      networkStats: {
        ledgers: networkStats.ledgers,
        accounts: networkStats.accounts,
        assets: networkStats.assets,
        transactions: networkStats.transactions,
        operations: networkStats.operations,
        trades: networkStats.trades,
      },
      transactionStats: txStats,
      latestLedger: latestLedger
        ? {
            sequence: latestLedger.sequence,
            closedAt: latestLedger.closed_at,
            txCount: latestLedger.successful_transaction_count,
            protocolVersion: latestLedger.protocol_version,
          }
        : null,
    };

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === "json") {
      content = JSON.stringify(exportData, null, 2);
      mimeType = "application/json";
      filename = `stellar-analytics-${network}-${timeRange}.json`;
    } else {
      // CSV format
      const lines: string[] = [
        "Category,Metric,Value",
        `Network,Name,${network}`,
        `Network,Total Ledgers,${networkStats.ledgers}`,
        `Network,Total Accounts,${networkStats.accounts?.total || "N/A"}`,
        `Network,Funded Accounts,${networkStats.accounts?.funded || "N/A"}`,
        `Network,Total Assets,${networkStats.assets}`,
        `Network,Total Transactions,${networkStats.transactions}`,
        `Network,Total Operations,${networkStats.operations}`,
        `Network,Total Trades,${networkStats.trades}`,
        `Transactions,Sample Size,${txStats.total}`,
        `Transactions,Success Rate,${txStats.successRate.toFixed(2)}%`,
        `Transactions,Successful,${txStats.successful}`,
        `Transactions,Failed,${txStats.failed}`,
        `Operations,Mean per TX,${txStats.operations.mean.toFixed(2)}`,
        `Operations,Median per TX,${txStats.operations.median}`,
        `Operations,Std Dev,${txStats.operations.stdDev.toFixed(2)}`,
        `Operations,Min,${txStats.operations.min}`,
        `Operations,Max,${txStats.operations.max}`,
        `Fees,Mean (stroops),${txStats.fees.mean.toFixed(0)}`,
        `Fees,Median (stroops),${txStats.fees.median}`,
        `Fees,Min (stroops),${txStats.fees.min}`,
        `Fees,Max (stroops),${txStats.fees.max}`,
      ];
      content = lines.join("\n");
      mimeType = "text/csv";
      filename = `stellar-analytics-${network}-${timeRange}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number | undefined | null, decimals: number = 2): string => {
    if (num === undefined || num === null || isNaN(num)) return "-";
    if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const isLoading = statsLoading || ledgerLoading || txLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <div className="bg-primary/10 rounded-lg p-2">
              <BarChart3 className="text-primary size-6" />
            </div>
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{t("timeRange.1h")}</SelectItem>
              <SelectItem value="24h">{t("timeRange.24h")}</SelectItem>
              <SelectItem value="7d">{t("timeRange.7d")}</SelectItem>
              <SelectItem value="30d">{t("timeRange.30d")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Export buttons */}
          {settings.enableDataExport && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData("json")}
                disabled={isLoading}
              >
                <Download className="mr-1 size-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData("csv")}
                disabled={isLoading}
              >
                <Download className="mr-1 size-4" />
                CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Mode Banner */}
      {!isAnalyticsMode && (
        <Card className="border-chart-2/30 bg-chart-2/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-chart-2/10 rounded-lg p-2">
              <BarChart3 className="text-chart-2 size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{t("enableBanner.title")}</p>
              <p className="text-muted-foreground text-sm">{t("enableBanner.description")}</p>
            </div>
            <Badge variant="outline" className="border-chart-2/30 text-chart-2">
              PRO
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("keyMetrics")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatisticCard
            title={t("metrics.totalLedgers")}
            value={networkStats ? formatNumber(networkStats.ledgers, 0) : "-"}
            icon={Layers}
          />
          <StatisticCard
            title={t("metrics.totalAccounts")}
            value={
              networkStats?.accounts?.total ? formatNumber(networkStats.accounts.total, 0) : "-"
            }
            subtitle={
              networkStats?.accounts?.funded
                ? `${formatNumber(networkStats.accounts.funded, 0)} ${t("funded")}`
                : undefined
            }
            icon={Users}
          />
          <StatisticCard
            title={t("metrics.totalTransactions")}
            value={networkStats ? formatNumber(networkStats.transactions, 0) : "-"}
            icon={ArrowLeftRight}
          />
          <StatisticCard
            title={t("metrics.totalAssets")}
            value={networkStats ? formatNumber(networkStats.assets, 0) : "-"}
            icon={Coins}
          />
        </div>
      </section>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("tabs.transactions")}</TabsTrigger>
          <TabsTrigger value="network">{t("tabs.network")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <DashboardCharts />

          {isAnalyticsMode && settings.showStatistics && txStats && (
            <div className="grid gap-4 md:grid-cols-2">
              <StatisticsTable
                title={t("statistics.operationsPerTx")}
                data={[
                  { label: t("stats.mean"), value: txStats.operations.mean.toFixed(2) },
                  { label: t("stats.median"), value: txStats.operations.median },
                  { label: t("stats.stdDev"), value: txStats.operations.stdDev.toFixed(2) },
                  { label: t("stats.min"), value: txStats.operations.min },
                  { label: t("stats.max"), value: txStats.operations.max },
                  { label: t("stats.total"), value: txStats.operations.total },
                ]}
              />
              <StatisticsTable
                title={t("statistics.feesStroops")}
                data={[
                  { label: t("stats.mean"), value: formatNumber(txStats.fees.mean, 0) },
                  { label: t("stats.median"), value: formatNumber(txStats.fees.median, 0) },
                  { label: t("stats.stdDev"), value: formatNumber(txStats.fees.stdDev, 0) },
                  { label: t("stats.min"), value: formatNumber(txStats.fees.min, 0) },
                  { label: t("stats.max"), value: formatNumber(txStats.fees.max, 0) },
                ]}
              />
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {txStats && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticCard
                  title={t("tx.sampleSize")}
                  value={txStats.total}
                  subtitle={t("tx.recentTransactions")}
                  icon={Activity}
                />
                <StatisticCard
                  title={t("tx.successRate")}
                  value={`${txStats.successRate.toFixed(1)}%`}
                  icon={TrendingUp}
                  trend={txStats.successRate - 95} // Compare to 95% baseline
                />
                <StatisticCard
                  title={t("tx.successful")}
                  value={txStats.successful}
                  icon={Activity}
                />
                <StatisticCard title={t("tx.failed")} value={txStats.failed} icon={TrendingDown} />
              </div>

              {isAnalyticsMode && settings.showStatistics && (
                <div className="grid gap-4 md:grid-cols-3">
                  <StatisticsTable
                    title={t("statistics.operationsPerTx")}
                    data={[
                      { label: t("stats.mean"), value: txStats.operations.mean.toFixed(2) },
                      { label: t("stats.median"), value: txStats.operations.median },
                      { label: t("stats.stdDev"), value: txStats.operations.stdDev.toFixed(2) },
                      {
                        label: t("stats.range"),
                        value: `${txStats.operations.min} - ${txStats.operations.max}`,
                      },
                    ]}
                  />
                  <StatisticsTable
                    title={t("statistics.feesStroops")}
                    data={[
                      { label: t("stats.mean"), value: formatNumber(txStats.fees.mean, 0) },
                      { label: t("stats.median"), value: formatNumber(txStats.fees.median, 0) },
                      { label: t("stats.stdDev"), value: formatNumber(txStats.fees.stdDev, 0) },
                      {
                        label: t("stats.range"),
                        value: `${txStats.fees.min} - ${formatNumber(txStats.fees.max, 0)}`,
                      },
                    ]}
                  />
                  <StatisticsTable
                    title={t("statistics.summary")}
                    data={[
                      { label: t("tx.totalOperations"), value: txStats.operations.total },
                      { label: t("tx.avgOpsPerTx"), value: txStats.operations.mean.toFixed(2) },
                      { label: t("tx.successRate"), value: `${txStats.successRate.toFixed(2)}%` },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-6">
          <NetworkStatsCard />

          {isAnalyticsMode && networkStats && (
            <div className="grid gap-4 md:grid-cols-2">
              <StatisticsTable
                title={t("network.accountStats")}
                data={[
                  {
                    label: t("network.totalAccounts"),
                    value: formatNumber(networkStats.accounts?.total || 0, 0),
                  },
                  {
                    label: t("network.fundedAccounts"),
                    value: formatNumber(networkStats.accounts?.funded || 0, 0),
                  },
                  {
                    label: t("network.deletedAccounts"),
                    value: formatNumber(networkStats.accounts?.deleted || 0, 0),
                  },
                  {
                    label: t("network.fundedRatio"),
                    value: networkStats.accounts?.total
                      ? `${((networkStats.accounts.funded / networkStats.accounts.total) * 100).toFixed(2)}%`
                      : "N/A",
                  },
                ]}
              />
              <StatisticsTable
                title={t("network.activityStats")}
                data={[
                  {
                    label: t("network.totalOperations"),
                    value: formatNumber(networkStats.operations, 0),
                  },
                  { label: t("network.totalTrades"), value: formatNumber(networkStats.trades, 0) },
                  {
                    label: t("network.totalPayments"),
                    value: formatNumber(networkStats.payments, 0),
                  },
                  {
                    label: t("network.trustlines"),
                    value: formatNumber(networkStats.trustlines, 0),
                  },
                ]}
              />
            </div>
          )}

          {latestLedger && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="text-primary size-4" />
                  {t("network.latestLedger")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">{t("network.sequence")}</p>
                    <p className="font-mono text-lg font-bold">
                      #{latestLedger.sequence.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">{t("network.transactions")}</p>
                    <p className="text-lg font-bold">{latestLedger.successful_transaction_count}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">{t("network.operations")}</p>
                    <p className="text-lg font-bold">{latestLedger.operation_count}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">{t("network.protocolVersion")}</p>
                    <p className="text-lg font-bold">v{latestLedger.protocol_version}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
