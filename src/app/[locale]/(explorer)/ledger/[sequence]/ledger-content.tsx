"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { HashDisplay } from "@/components/common/hash-display";
import { LoadingCard } from "@/components/common/loading-card";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TransactionCard, TransactionCardSkeleton } from "@/components/cards/transaction-card";
import { useLedger, useLedgerTransactions } from "@/lib/hooks";
import { formatDateTime, formatLedgerSequence, stroopsToXLM } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Activity, Wallet, Hash } from "lucide-react";
import { useTranslations } from "next-intl";

interface LedgerContentProps {
  sequence: number;
}

function LedgerNavigation({ sequence }: { sequence: number }) {
  const t = useTranslations("ledgerDetails");

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/ledger/${sequence - 1}`}>
          <ChevronLeft className="mr-1 size-4" />
          {t("prev")}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/ledger/${sequence + 1}`}>
          {t("next")}
          <ChevronRight className="ml-1 size-4" />
        </Link>
      </Button>
    </div>
  );
}

function LedgerSummary({
  ledger,
}: {
  ledger: import("@stellar/stellar-sdk").Horizon.ServerApi.LedgerRecord;
}) {
  const t = useTranslations("ledgerDetails");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("details")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="size-4" />
                {t("closeTime")}
              </span>
              <span className="text-sm">{formatDateTime(ledger.closed_at)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Activity className="size-4" />
                {t("transactions")}
              </span>
              <span className="text-sm font-medium">
                {ledger.successful_transaction_count} {t("successful")} /{" "}
                {ledger.failed_transaction_count} {t("failed")}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("operations")}</span>
              <span className="text-sm font-medium">{ledger.operation_count}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("protocolVersion")}</span>
              <span className="text-sm font-medium">{ledger.protocol_version}</span>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Wallet className="size-4" />
                {t("totalFees")}
              </span>
              <span className="font-mono text-sm">{stroopsToXLM(ledger.total_coins)} XLM</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("baseFee")}</span>
              <span className="font-mono text-sm">{ledger.base_fee_in_stroops} stroops</span>
            </div>
            <Separator />
            <div className="flex items-start justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Hash className="size-4" />
                {t("hash")}
              </span>
              <HashDisplay
                hash={ledger.hash}
                truncate
                startLength={12}
                endLength={8}
                className="text-sm"
              />
            </div>
            <Separator />
            <div className="flex items-start justify-between">
              <span className="text-muted-foreground text-sm">{t("prevHash")}</span>
              <HashDisplay
                hash={ledger.prev_hash}
                truncate
                startLength={12}
                endLength={8}
                linkTo={`/ledger/${ledger.sequence - 1}`}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LedgerTransactions({ sequence }: { sequence: number }) {
  const { data, isLoading, error, refetch } = useLedgerTransactions(sequence);
  const t = useTranslations("ledgerDetails");

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
    return <ErrorState title={t("failedToLoadTx")} message={error.message} onRetry={refetch} />;
  }

  if (!data?.records?.length) {
    return <EmptyState title={t("noTransactions")} description={t("noTransactionsDesc")} />;
  }

  return (
    <div className="space-y-2">
      {data.records.map(
        (tx: import("@stellar/stellar-sdk").Horizon.ServerApi.TransactionRecord) => (
          <TransactionCard key={tx.hash} transaction={tx} />
        )
      )}
    </div>
  );
}

export function LedgerContent({ sequence }: LedgerContentProps) {
  const { data: ledger, isLoading, error, refetch } = useLedger(sequence);
  const t = useTranslations("ledgerDetails");
  const tCommon = useTranslations("common");

  if (isNaN(sequence) || sequence <= 0) {
    return notFound();
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        </div>
        <LoadingCard rows={6} />
        <LoadingCard rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${t("title")} #${formatLedgerSequence(sequence)}`}
          backHref="/"
          backLabel={tCommon("home")}
        />
        <ErrorState title={t("notFound")} message={t("notFoundMessage")} onRetry={refetch} />
      </div>
    );
  }

  if (!ledger) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("title")} #${formatLedgerSequence(sequence)}`}
        backHref="/"
        backLabel={tCommon("home")}
        showCopy={false}
        actions={<LedgerNavigation sequence={sequence} />}
      />

      <LedgerSummary ledger={ledger} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("transactionsInLedger")} ({ledger.successful_transaction_count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LedgerTransactions sequence={sequence} />
        </CardContent>
      </Card>
    </div>
  );
}
