"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionCard, TransactionCardSkeleton } from "@/components/cards/transaction-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import {
  TransactionSearch,
  TransactionFilters,
  type StatusFilter,
} from "@/components/transactions";
import { useRecentTransactions, useAccountTransactions, useLedgerTransactions } from "@/lib/hooks";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import { X, User, Layers } from "lucide-react";
import { Link } from "@/i18n/navigation";

type SearchMode = "recent" | "account" | "ledger";

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const tSearch = useTranslations("transactionSearch");
  const { network } = useNetwork();

  // Search state
  const [searchMode, setSearchMode] = useState<SearchMode>("recent");
  const [searchAccount, setSearchAccount] = useState<string | null>(null);
  const [searchLedger, setSearchLedger] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Queries
  const recentQuery = useRecentTransactions(50);
  const accountQuery = useAccountTransactions(searchAccount ?? "", undefined);
  const ledgerQuery = useLedgerTransactions(searchLedger ?? 0, 50);

  // Get the active query based on search mode
  const activeQuery = useMemo(() => {
    switch (searchMode) {
      case "account":
        return accountQuery;
      case "ledger":
        return ledgerQuery;
      default:
        return recentQuery;
    }
  }, [searchMode, accountQuery, ledgerQuery, recentQuery]);

  const { data, isLoading, error, refetch } = activeQuery;

  // Filter and count transactions by status
  const { filteredRecords, totalCount, successCount, failedCount } = useMemo(() => {
    const records = data?.records ?? [];
    const total = records.length;
    const success = records.filter((tx) => tx.successful).length;
    const failed = total - success;

    let filtered = records;
    if (statusFilter === "success") {
      filtered = records.filter((tx) => tx.successful);
    } else if (statusFilter === "failed") {
      filtered = records.filter((tx) => !tx.successful);
    }

    return {
      filteredRecords: filtered,
      totalCount: total,
      successCount: success,
      failedCount: failed,
    };
  }, [data?.records, statusFilter]);

  // Handle search callbacks
  const handleAccountSearch = (accountId: string) => {
    setSearchAccount(accountId);
    setSearchLedger(null);
    setSearchMode("account");
    setStatusFilter("all");
  };

  const handleLedgerSearch = (sequence: number) => {
    setSearchLedger(sequence);
    setSearchAccount(null);
    setSearchMode("ledger");
    setStatusFilter("all");
  };

  const handleClearSearch = () => {
    setSearchMode("recent");
    setSearchAccount(null);
    setSearchLedger(null);
    setStatusFilter("all");
  };

  // Get card title based on search mode
  const getCardTitle = () => {
    switch (searchMode) {
      case "account":
        return (
          <div className="flex items-center gap-2">
            <User className="size-4" />
            <span>{tSearch("searchingFor")}</span>
            <Link
              href={`/account/${searchAccount}`}
              className="text-primary font-mono text-sm hover:underline"
            >
              {searchAccount?.slice(0, 8)}...{searchAccount?.slice(-8)}
            </Link>
          </div>
        );
      case "ledger":
        return (
          <div className="flex items-center gap-2">
            <Layers className="size-4" />
            <span>{tSearch("searchingFor")}</span>
            <Link href={`/ledger/${searchLedger}`} className="text-primary hover:underline">
              #{searchLedger?.toLocaleString()}
            </Link>
          </div>
        );
      default:
        return t("recentTransactions");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        backHref="/"
        backLabel="Home"
        showCopy={false}
        badge={<NetworkBadge network={network} />}
      />

      {/* Search Form */}
      <TransactionSearch
        onAccountSearch={handleAccountSearch}
        onLedgerSearch={handleLedgerSearch}
      />

      {/* Results Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{getCardTitle()}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filters */}
            {totalCount > 0 && (
              <TransactionFilters
                status={statusFilter}
                onStatusChange={setStatusFilter}
                totalCount={totalCount}
                successCount={successCount}
                failedCount={failedCount}
              />
            )}
            {/* Clear Search Button */}
            {searchMode !== "recent" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="h-7 gap-1.5 text-xs"
              >
                <X className="size-3" />
                {tSearch("clearSearch")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <TransactionCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState title={t("failedToLoad")} message={error.message} onRetry={refetch} />
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              title={t("noTransactions")}
              description={
                searchMode !== "recent"
                  ? tSearch("noTransactionsFor", {
                      type:
                        searchMode === "account"
                          ? tSearch("accountLabel").toLowerCase()
                          : tSearch("ledgerLabel").toLowerCase(),
                    })
                  : t("noRecentFound")
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredRecords.map((tx) => (
                <TransactionCard key={tx.hash} transaction={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
