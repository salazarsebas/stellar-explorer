"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionCard, TransactionCardSkeleton } from "@/components/cards/transaction-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useRecentTransactions } from "@/lib/hooks";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";

export default function TransactionsPage() {
  const { network } = useNetwork();
  const { data, isLoading, error, refetch } = useRecentTransactions(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        backHref="/"
        backLabel="Home"
        showCopy={false}
        badge={<NetworkBadge network={network} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <TransactionCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to load transactions"
              message={error.message}
              onRetry={refetch}
            />
          ) : !data?.records?.length ? (
            <EmptyState
              title="No transactions"
              description="No recent transactions found on this network."
            />
          ) : (
            <div className="space-y-2">
              {data.records.map((tx) => (
                <TransactionCard key={tx.hash} transaction={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
