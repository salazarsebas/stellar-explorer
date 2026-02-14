"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { LedgerCard, LedgerCardSkeleton } from "@/components/cards/ledger-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useLatestLedger } from "@/lib/hooks";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import { formatLedgerSequence } from "@/lib/utils";
import { isValidLedgerSequence } from "@/lib/utils/entity";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LedgersPage() {
  const router = useRouter();
  const { network } = useNetwork();
  const { data: latestLedger, isLoading, error, refetch } = useLatestLedger();
  const t = useTranslations("ledgers");
  const tCommon = useTranslations("common");

  const [ledgerSequence, setLedgerSequence] = useState("");
  const [searchError, setSearchError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    const trimmed = ledgerSequence.trim();

    if (!trimmed) {
      setSearchError(t("enterSequenceError"));
      return;
    }

    if (!isValidLedgerSequence(trimmed)) {
      setSearchError(t("invalidSequence"));
      return;
    }

    router.push(`/ledger/${trimmed}`);
  };

  // Generate a list of recent ledger sequences
  const recentSequences = latestLedger
    ? Array.from({ length: 20 }, (_, i) => latestLedger.sequence - i)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        backHref="/"
        backLabel={tCommon("home")}
        showCopy={false}
        badge={<NetworkBadge network={network} />}
      />

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("searchLedger")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={t("enterSequence")}
                aria-label={t("enterSequence")}
                value={ledgerSequence}
                onChange={(e) => {
                  setLedgerSequence(e.target.value);
                  setSearchError("");
                }}
                className="font-mono"
              />
              <Button type="submit">
                <Search className="mr-2 size-4" />
                {tCommon("search")}
              </Button>
            </div>
            {searchError && <p className="text-destructive text-sm">{searchError}</p>}
            {latestLedger && (
              <p className="text-muted-foreground text-sm">
                {t("latestLedger", { sequence: formatLedgerSequence(latestLedger.sequence) })}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("recentLedgers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <LedgerCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState title={t("failedToLoad")} message={error.message} onRetry={refetch} />
          ) : !latestLedger ? (
            <EmptyState title={t("noLedgers")} description={t("noLedgersFound")} />
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
