"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetLogo } from "@/components/common/asset-logo";
import { TrendingUp, TrendingDown, Users, Coins, BarChart3, Minus } from "lucide-react";
import { formatNumber, truncateHash, cn } from "@/lib/utils";

export interface AssetData {
  code: string;
  issuer: string;
  assetType?: string;
  numAccounts: number;
  amount: number;
  volume24h?: number;
  priceChange24h?: number;
  currentPrice?: number;
  flags?: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
    auth_clawback_enabled: boolean;
  };
}

interface AssetTableProps {
  assets: AssetData[];
  isLoading?: boolean;
  showRank?: boolean;
  title?: string;
}

function PriceChange({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-sm">
        <Minus className="size-3" />
        0.00%
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-green-500" : "text-red-500"
      )}
    >
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {isPositive ? "+" : ""}
      {change.toFixed(2)}%
    </span>
  );
}

export function AssetTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AssetTable({ assets, isLoading, showRank = true, title }: AssetTableProps) {
  if (isLoading) {
    return <AssetTableSkeleton rows={assets?.length || 6} />;
  }

  if (!assets || assets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No assets found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : ""}>
        {/* Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 pb-3 text-xs text-muted-foreground font-medium border-b mb-3">
          {showRank && <div className="col-span-1">#</div>}
          <div className={showRank ? "col-span-3" : "col-span-4"}>Asset</div>
          <div className="col-span-2 text-right">Price (XLM)</div>
          <div className="col-span-2 text-right">24h Change</div>
          <div className="col-span-2 text-right">24h Volume</div>
          <div className="col-span-2 text-right">Holders</div>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {assets.map((asset, index) => (
            <Link
              key={`${asset.code}-${asset.issuer}`}
              href={`/asset/${asset.code}-${asset.issuer}`}
              className="group block"
            >
              <div className="grid grid-cols-2 md:grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                {/* Rank */}
                {showRank && (
                  <div className="hidden md:block col-span-1 text-muted-foreground font-medium">
                    {index + 1}
                  </div>
                )}

                {/* Asset Info */}
                <div className={cn("flex items-center gap-3", showRank ? "md:col-span-3" : "md:col-span-4")}>
                  <AssetLogo code={asset.code} issuer={asset.issuer} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{asset.code}</span>
                      {asset.flags?.auth_required && (
                        <Badge variant="outline" className="text-[10px] px-1">
                          Auth
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {truncateHash(asset.issuer, 4, 4)}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="hidden md:block col-span-2 text-right">
                  {asset.currentPrice ? (
                    <span className="font-mono text-sm">
                      {asset.currentPrice < 0.0001
                        ? asset.currentPrice.toExponential(2)
                        : formatNumber(asset.currentPrice.toString(), { maximumFractionDigits: 6 })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>

                {/* 24h Change */}
                <div className="hidden md:flex col-span-2 justify-end">
                  {asset.priceChange24h !== undefined ? (
                    <PriceChange change={asset.priceChange24h} />
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>

                {/* Volume */}
                <div className="hidden md:block col-span-2 text-right">
                  {asset.volume24h ? (
                    <span className="font-mono text-sm">
                      {formatNumber(asset.volume24h.toFixed(0))} XLM
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>

                {/* Holders */}
                <div className="text-right md:col-span-2">
                  <div className="flex items-center justify-end gap-1.5">
                    <Users className="size-3 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {formatNumber(asset.numAccounts.toString())}
                    </span>
                  </div>
                </div>

                {/* Mobile: Price Change */}
                <div className="md:hidden flex justify-end">
                  {asset.priceChange24h !== undefined ? (
                    <PriceChange change={asset.priceChange24h} />
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AssetStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Icon className="size-4 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-2">
            <PriceChange change={trend} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
