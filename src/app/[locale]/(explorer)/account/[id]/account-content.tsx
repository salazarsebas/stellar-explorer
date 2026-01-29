"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { HashDisplay } from "@/components/common/hash-display";
import { TimeAgo } from "@/components/common/time-ago";
import { OperationBadge } from "@/components/common/operation-badge";
import { LoadingCard } from "@/components/common/loading-card";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TransactionCard, TransactionCardSkeleton } from "@/components/cards/transaction-card";
import { useAccount, useAccountTransactions, useAccountOperations } from "@/lib/hooks";
import { useWatchlist } from "@/lib/hooks";
import { formatNumber, truncateHash } from "@/lib/utils";
import { Star, StarOff, Key, Coins } from "lucide-react";
import type { Horizon } from "@stellar/stellar-sdk";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

interface AccountContentProps {
  id: string;
}

function AccountSummary({ account }: { account: Horizon.ServerApi.AccountRecord }) {
  // Find XLM balance
  const xlmBalance = account.balances.find((b) => b.asset_type === "native") as
    | Horizon.HorizonApi.BalanceLineNative
    | undefined;

  // Count non-native assets
  const otherAssets = account.balances.filter((b) => b.asset_type !== "native");

  return (
    <Card variant="elevated" className="animate-fade-in-up border-0">
      <CardHeader>
        <CardTitle className="text-base">Account Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column - Balances */}
          <div className="space-y-4">
            <div className="bg-primary/5 border-primary/10 rounded-xl border p-4">
              <span className="text-muted-foreground text-sm">XLM Balance</span>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {xlmBalance ? formatNumber(xlmBalance.balance) : "0"} XLM
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Other Assets</span>
              <Badge variant="secondary">{otherAssets.length}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Subentries</span>
              <span className="text-sm font-medium">{account.subentry_count}</span>
            </div>
          </div>

          {/* Right column - Account info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Sequence</span>
              <span className="font-mono text-sm">{account.sequence}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Thresholds</span>
              <div className="space-x-2 text-sm">
                <span>L:{account.thresholds.low_threshold}</span>
                <span>M:{account.thresholds.med_threshold}</span>
                <span>H:{account.thresholds.high_threshold}</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Signers</span>
              <Badge variant="secondary">{account.signers.length}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Home Domain</span>
              <span className="text-sm">{account.home_domain || "-"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountBalances({ account }: { account: Horizon.ServerApi.AccountRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Balances ({account.balances.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {account.balances.map((balance, index) => {
            const isNative = balance.asset_type === "native";
            const assetCode = isNative
              ? "XLM"
              : (balance as Horizon.HorizonApi.BalanceLineAsset).asset_code;
            const issuer = isNative
              ? null
              : (balance as Horizon.HorizonApi.BalanceLineAsset).asset_issuer;

            return (
              <div
                key={index}
                className="bg-card/50 flex items-center justify-between rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-chart-3/10 flex size-8 items-center justify-center rounded-md">
                    <Coins className="text-chart-3 size-4" />
                  </div>
                  <div>
                    <span className="font-medium">{assetCode}</span>
                    {issuer && (
                      <div className="text-muted-foreground text-xs">
                        <HashDisplay
                          hash={issuer}
                          truncate
                          startLength={4}
                          endLength={4}
                          copyable={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-mono tabular-nums">{formatNumber(balance.balance)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountTransactions({ accountId }: { accountId: string }) {
  const { data, isLoading, error, refetch } = useAccountTransactions(accountId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <TransactionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState title="Failed to load transactions" message={error.message} onRetry={refetch} />
    );
  }

  if (!data?.records?.length) {
    return (
      <EmptyState
        title="No transactions"
        description="This account hasn't made any transactions yet."
      />
    );
  }

  return (
    <div className="space-y-2">
      {data.records.map((tx: Horizon.ServerApi.TransactionRecord) => (
        <TransactionCard key={tx.hash} transaction={tx} />
      ))}
    </div>
  );
}

function AccountOperations({ accountId }: { accountId: string }) {
  const { data, isLoading, error, refetch } = useAccountOperations(accountId);

  if (isLoading) {
    return <LoadingCard rows={5} />;
  }

  if (error) {
    return (
      <ErrorState title="Failed to load operations" message={error.message} onRetry={refetch} />
    );
  }

  if (!data?.records?.length) {
    return (
      <EmptyState
        title="No operations"
        description="This account hasn't performed any operations yet."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-border divide-y">
          {data.records.map((op: Horizon.ServerApi.OperationRecord) => (
            <div
              key={op.id}
              className="hover:bg-card-hover flex items-center justify-between p-4 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <OperationBadge type={op.type} />
                <div className="min-w-0">
                  <Link
                    href={`/tx/${op.transaction_hash}`}
                    className="hover:text-primary font-mono text-sm transition-colors"
                  >
                    {truncateHash(op.transaction_hash, 8, 4)}
                  </Link>
                </div>
              </div>
              <TimeAgo timestamp={op.created_at} className="text-xs" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountSigners({ account }: { account: Horizon.ServerApi.AccountRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signers ({account.signers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {account.signers.map((signer) => (
            <div
              key={signer.key}
              className="bg-card/50 flex items-center justify-between rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
                  <Key className="text-primary size-4" />
                </div>
                <div>
                  <HashDisplay
                    hash={signer.key}
                    truncate
                    linkTo={
                      signer.type === "ed25519_public_key" ? `/account/${signer.key}` : undefined
                    }
                    className="text-sm"
                  />
                  <span className="text-muted-foreground text-xs capitalize">
                    {signer.type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <Badge variant="outline">Weight: {signer.weight}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountContent({ id }: AccountContentProps) {
  const { data: account, isLoading, error, refetch } = useAccount(id);
  const { has, add, remove } = useWatchlist();
  const isWatched = has(id);

  const toggleWatchlist = () => {
    if (isWatched) {
      remove(id);
    } else {
      add({ type: "account", id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-96 animate-pulse rounded" />
        </div>
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Account" subtitle="Account not found" backHref="/" backLabel="Home" />
        <ErrorState
          title="Account not found"
          message="The account you're looking for doesn't exist or may have been removed."
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!account) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Accounts", href: "/accounts" },
          { label: truncateHash(id, 6, 6), href: `/account/${id}` },
        ]}
      />

      <PageHeader
        title="Account"
        hash={id}
        backHref="/accounts"
        backLabel="Accounts"
        showQr
        actions={
          <Button
            variant={isWatched ? "secondary" : "outline"}
            size="sm"
            onClick={toggleWatchlist}
            className="hover:bg-white/10"
          >
            {isWatched ? (
              <>
                <StarOff className="mr-2 size-4" />
                Remove
              </>
            ) : (
              <>
                <Star className="mr-2 size-4" />
                Watch
              </>
            )}
          </Button>
        }
      />

      <AccountSummary account={account} />

      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="signers">Signers</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-4">
          <AccountTransactions accountId={id} />
        </TabsContent>
        <TabsContent value="operations" className="mt-4">
          <AccountOperations accountId={id} />
        </TabsContent>
        <TabsContent value="balances" className="mt-4">
          <AccountBalances account={account} />
        </TabsContent>
        <TabsContent value="signers" className="mt-4">
          <AccountSigners account={account} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
