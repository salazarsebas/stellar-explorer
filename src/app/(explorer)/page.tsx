"use client";

import { Suspense } from "react";
import { Layers, Activity, Wallet, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionCard, TransactionCardSkeleton } from "@/components/cards/transaction-card";
import { LedgerCard, LedgerCardSkeleton } from "@/components/cards/ledger-card";
import { LiveIndicator } from "@/components/common/live-indicator";
import { useLatestLedger, useRecentTransactions, useFeeStats } from "@/lib/hooks";
import { formatLedgerSequence, stroopsToXLM } from "@/lib/utils";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function NetworkStats() {
  const { network } = useNetwork();
  const { data: ledger, isLoading: ledgerLoading } = useLatestLedger();
  const { data: feeStats, isLoading: feeLoading } = useFeeStats();

  const avgFee = feeStats?.fee_charged?.mode ? stroopsToXLM(feeStats.fee_charged.mode) : "100";

  const stats = [
    {
      title: "Latest Ledger",
      value: ledger ? formatLedgerSequence(ledger.sequence) : "-",
      subtitle: ledger ? `${ledger.successful_transaction_count} txs` : undefined,
      icon: Layers,
      loading: ledgerLoading,
      color: "primary",
    },
    {
      title: "Protocol Version",
      value: ledger?.protocol_version?.toString() || "-",
      icon: Activity,
      loading: ledgerLoading,
      color: "chart-2",
    },
    {
      title: "Base Fee",
      value: `${avgFee} XLM`,
      subtitle: "per operation",
      icon: Wallet,
      loading: feeLoading,
      color: "chart-3",
    },
    {
      title: "Network",
      value: network === "public" ? "Mainnet" : network === "testnet" ? "Testnet" : "Futurenet",
      icon: TrendingUp,
      loading: false,
      color: "chart-4",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {stats.map((stat, i) => (
        <Card
          key={stat.title}
          variant="glass"
          className="animate-fade-in-up border-0 py-0"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <CardContent className="p-4">
            {stat.loading ? (
              <div className="space-y-2">
                <div className="bg-muted/50 h-3 w-20 animate-pulse rounded" />
                <div className="bg-muted/50 h-7 w-16 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-muted-foreground mb-1 flex items-center gap-2 text-xs">
                  <stat.icon className="size-3.5" />
                  {stat.title}
                </div>
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                {stat.subtitle && (
                  <div className="text-muted-foreground mt-0.5 text-xs">{stat.subtitle}</div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentTransactions() {
  const { data, isLoading } = useRecentTransactions(8);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <TransactionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data?.records?.length) {
    return <div className="text-muted-foreground py-8 text-center">No recent transactions</div>;
  }

  return (
    <div className="space-y-3">
      {data.records.slice(0, 5).map((tx, i) => (
        <TransactionCard key={tx.hash} transaction={tx} animationDelay={i * 50} />
      ))}
    </div>
  );
}

function RecentLedgers() {
  const { data: latestLedger, isLoading } = useLatestLedger();

  if (isLoading || !latestLedger) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <LedgerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show just the latest ledger info since we only have one
  return (
    <div className="space-y-2">
      <LedgerCard ledger={latestLedger} />
      <div className="text-muted-foreground py-4 text-center text-sm">
        View all ledgers for more history
      </div>
    </div>
  );
}

export default function HomePage() {
  const { network } = useNetwork();

  return (
    <div className="space-y-10">
      {/* Hero section with gradient background */}
      <section className="relative -mx-4 mb-4 px-4 py-12 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        {/* Gradient overlays */}
        <div className="from-primary/5 absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
        <div className="from-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />

        <div className="relative mx-auto max-w-2xl space-y-6 text-center">
          <div className="bg-primary/10 border-primary/20 text-primary mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <Sparkles className="size-3.5" />
            <span>Real-time blockchain data</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            <span className="from-foreground via-foreground to-foreground/60 bg-gradient-to-r bg-clip-text text-transparent">
              Explore the Stellar Network
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto max-w-lg text-lg">
            Discover transactions, accounts, assets, and smart contracts with a premium explorer
            experience.
          </p>

          <div className="flex items-center justify-center gap-3">
            <NetworkBadge network={network} />
            <LiveIndicator />
          </div>
        </div>
      </section>

      {/* Network Stats */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Network Overview</h2>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} variant="glass" className="border-0 py-0">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="bg-muted/50 h-3 w-20 animate-pulse rounded" />
                      <div className="bg-muted/50 h-7 w-16 animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <NetworkStats />
        </Suspense>
      </section>

      {/* Two-column layout for transactions and ledgers */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card variant="elevated" className="border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                <Activity className="text-primary size-4" />
              </div>
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="hover:bg-white/10">
              <Link href="/transactions">
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TransactionCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <RecentTransactions />
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent Ledgers */}
        <Card variant="elevated" className="border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <div className="bg-chart-1/10 flex size-8 items-center justify-center rounded-lg">
                <Layers className="text-chart-1 size-4" />
              </div>
              <CardTitle className="text-base font-semibold">Latest Ledger</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="hover:bg-white/10">
              <Link href="/ledgers">
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <LedgerCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <RecentLedgers />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <section>
        <h2 className="mb-5 text-lg font-semibold">Explore</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            {
              href: "/transactions",
              icon: Activity,
              label: "Transactions",
              description: "View all network activity",
              color: "primary",
              bgClass: "bg-primary/10",
              textClass: "text-primary",
            },
            {
              href: "/ledgers",
              icon: Layers,
              label: "Ledgers",
              description: "Browse ledger history",
              color: "chart-1",
              bgClass: "bg-chart-1/10",
              textClass: "text-chart-1",
            },
            {
              href: "/assets",
              icon: Wallet,
              label: "Assets",
              description: "Discover tokens",
              color: "chart-3",
              bgClass: "bg-chart-3/10",
              textClass: "text-chart-3",
            },
            {
              href: "/contracts",
              icon: TrendingUp,
              label: "Contracts",
              description: "Explore Soroban",
              color: "chart-4",
              bgClass: "bg-chart-4/10",
              textClass: "text-chart-4",
            },
          ].map((item, i) => (
            <Link key={item.href} href={item.href}>
              <Card
                variant="glass"
                interactive
                className="animate-fade-in-up group h-full border-0 py-0"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <CardContent className="flex flex-col items-center p-5 text-center">
                  <div
                    className={`relative size-12 rounded-xl ${item.bgClass} mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    {/* Glow effect on hover */}
                    <div
                      className={`absolute inset-0 rounded-xl ${item.bgClass} opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-60`}
                    />
                    <item.icon className={`relative size-6 ${item.textClass}`} />
                  </div>
                  <span className="mb-1 font-semibold">{item.label}</span>
                  <span className="text-muted-foreground text-xs">{item.description}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
