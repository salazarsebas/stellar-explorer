"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { LedgerCard, LedgerCardSkeleton } from "@/components/cards/ledger-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useLatestLedger } from "@/lib/hooks";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import { formatLedgerSequence } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LedgersPage() {
  const { network } = useNetwork();
  const { data: latestLedger, isLoading, error, refetch } = useLatestLedger();

  // Generate a list of recent ledger sequences
  const recentSequences = latestLedger
    ? Array.from({ length: 20 }, (_, i) => latestLedger.sequence - i)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledgers"
        backHref="/"
        backLabel="Home"
        showCopy={false}
        badge={<NetworkBadge network={network} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Ledgers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <LedgerCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState title="Failed to load ledgers" message={error.message} onRetry={refetch} />
          ) : !latestLedger ? (
            <EmptyState title="No ledgers" description="No ledgers found on this network." />
          ) : (
            <div className="space-y-2">
              {/* Show the latest ledger with full data */}
              <LedgerCard ledger={latestLedger} />

              {/* Show links to previous ledgers */}
              {recentSequences.slice(1).map((seq) => (
                <Link
                  key={seq}
                  href={`/ledger/${seq}`}
                  className="bg-card/50 hover:bg-card-hover flex items-center justify-between rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
                      <span className="text-primary text-xs font-medium">#</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatLedgerSequence(seq)}
                    </span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
