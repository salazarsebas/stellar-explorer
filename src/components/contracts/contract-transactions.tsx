"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HashDisplay } from "@/components/common/hash-display";
import { LoadingCard } from "@/components/common/loading-card";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { useContractEvents } from "@/lib/hooks";
import {
  detectEventPattern,
  categorizeEventType,
  getEventCategoryColor,
} from "@/lib/utils/soroban-helpers";
import type { DecodedScVal } from "@/lib/utils/soroban-helpers";
import { FileCode, Activity } from "lucide-react";

interface DecodedEvent {
  id?: string;
  type?: string;
  ledger?: number;
  txHash?: string;
  decodedTopics: DecodedScVal[];
  decodedValue: DecodedScVal | null;
}

export function ContractTransactions({ contractId }: { contractId: string }) {
  const t = useTranslations("contract");
  const { data, isLoading, error, refetch } = useContractEvents(contractId);

  // Extract unique transactions from events
  const transactions = useMemo(() => {
    if (!data?.events?.length) return [];

    const txMap = new Map<
      string,
      { txHash: string; ledger: number; eventCount: number; mainEvent: DecodedEvent }
    >();

    for (const event of data.events as DecodedEvent[]) {
      if (!event.txHash) continue;

      const existing = txMap.get(event.txHash);
      if (existing) {
        existing.eventCount++;
      } else {
        txMap.set(event.txHash, {
          txHash: event.txHash,
          ledger: event.ledger ?? 0,
          eventCount: 1,
          mainEvent: event,
        });
      }
    }

    return Array.from(txMap.values());
  }, [data]);

  if (isLoading) {
    return <LoadingCard rows={5} />;
  }

  if (error) {
    return <ErrorState title={t("failedToLoadEvents")} message={error.message} onRetry={refetch} />;
  }

  if (transactions.length === 0) {
    return <EmptyState title={t("noTransactions")} description={t("noTransactionsDesc")} icon="search" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCode className="size-4" />
          {t("recentTransactions")} ({transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.map((tx) => {
            const category = categorizeEventType(tx.mainEvent.decodedTopics);
            const colors = getEventCategoryColor(category);
            const { summary } = detectEventPattern(tx.mainEvent.decodedTopics);

            return (
              <div
                key={tx.txHash}
                className="bg-card/50 flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-md ${colors.bg}`}
                  >
                    <Activity className={`size-4 ${colors.text}`} />
                  </div>
                  <div className="min-w-0">
                    <HashDisplay
                      hash={tx.txHash}
                      truncate
                      startLength={8}
                      endLength={6}
                      linkTo={`tx/${tx.txHash}`}
                      className="text-sm"
                    />
                    <p className="text-muted-foreground truncate text-xs">
                      {summary} &middot; {t("ledger")} {tx.ledger}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {tx.eventCount > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {tx.eventCount} {t("events").toLowerCase()}
                    </Badge>
                  )}
                  <Badge variant="outline">{t("contractEvent")}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
