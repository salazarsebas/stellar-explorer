"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { HashDisplay } from "@/components/common/hash-display";
import { OperationBadge } from "@/components/common/operation-badge";
import { LoadingCard } from "@/components/common/loading-card";
import { ErrorState } from "@/components/common/error-state";
import { DeveloperPanel } from "@/components/common/developer-panel";
import { useTransaction, useTransactionOperations, useTransactionEffects } from "@/lib/hooks";
import { useNetwork } from "@/lib/providers";
import { NETWORKS } from "@/lib/constants";
import {
  formatDateTime,
  formatLedgerSequence,
  stroopsToXLM,
  formatNumber,
  truncateHash,
} from "@/lib/utils";
import { ArrowRight, Code } from "lucide-react";
import type { Horizon } from "@stellar/stellar-sdk";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { useTranslations } from "next-intl";

interface TransactionContentProps {
  hash: string;
}

function TransactionSummary({ transaction }: { transaction: Horizon.ServerApi.TransactionRecord }) {
  const t = useTranslations("transaction");

  return (
    <Card variant="elevated" className="animate-fade-in-up border-0">
      <CardHeader>
        <CardTitle className="text-base">{t("details")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("status")}</span>
              <StatusBadge status={transaction.successful ? "success" : "failed"} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("ledger")}</span>
              <Link
                href={`/ledger/${transaction.ledger_attr}`}
                className="text-primary text-sm font-medium hover:underline"
              >
                #{formatLedgerSequence(transaction.ledger_attr)}
              </Link>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("timestamp")}</span>
              <span className="text-sm">{formatDateTime(transaction.created_at)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("operationsCount")}</span>
              <span className="text-sm font-medium">{transaction.operation_count}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("feePaid")}</span>
              <span className="font-mono text-sm">{stroopsToXLM(transaction.fee_charged)} XLM</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("maxFee")}</span>
              <span className="font-mono text-sm">{stroopsToXLM(transaction.max_fee)} XLM</span>
            </div>
            <Separator />
            <div className="flex items-start justify-between">
              <span className="text-muted-foreground text-sm">{t("source")}</span>
              <HashDisplay
                hash={transaction.source_account}
                truncate
                linkTo={`/account/${transaction.source_account}`}
                className="text-sm"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("memo")}</span>
              <span className="font-mono text-sm">{transaction.memo || "-"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OperationsTimeline({ hash }: { hash: string }) {
  const { data, isLoading, error, refetch } = useTransactionOperations(hash);
  const t = useTranslations("transaction");

  if (isLoading) {
    return <LoadingCard rows={5} />;
  }

  if (error) {
    return <ErrorState title={t("failedToLoadOps")} message={error.message} onRetry={refetch} />;
  }

  if (!data?.records?.length) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">
          {t("noOperations")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("operations")} ({data.records.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.records.map((op: Horizon.ServerApi.OperationRecord, index: number) => (
            <div key={op.id} className="relative">
              {/* Timeline connector */}
              {index < data.records.length - 1 && (
                <div className="bg-border absolute top-8 left-3 h-full w-0.5" />
              )}

              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="bg-primary text-primary-foreground relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {index + 1}
                </div>

                {/* Operation content */}
                <div className="min-w-0 flex-1 pb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <OperationBadge type={op.type} />
                  </div>

                  <OperationDetails operation={op} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OperationDetails({ operation }: { operation: Horizon.ServerApi.OperationRecord }) {
  // Operation records have varying shapes depending on operation.type;
  // cast through unknown to access operation-specific properties safely as a generic record
  const op = operation as unknown as Record<string, unknown>;
  const t = useTranslations("account");

  switch (operation.type) {
    case "payment":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <HashDisplay
              hash={op.from as string}
              truncate
              startLength={6}
              endLength={4}
              linkTo={`/account/${op.from}`}
            />
            <ArrowRight className="text-muted-foreground size-4" />
            <HashDisplay
              hash={op.to as string}
              truncate
              startLength={6}
              endLength={4}
              linkTo={`/account/${op.to}`}
            />
          </div>
          <div className="text-foreground font-mono">
            {formatNumber(op.amount as string)}{" "}
            {op.asset_type === "native" ? "XLM" : (op.asset_code as string)}
          </div>
        </div>
      );

    case "create_account":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("newAccount")}</span>
            <HashDisplay hash={op.account as string} truncate linkTo={`/account/${op.account}`} />
          </div>
          <div className="text-foreground font-mono">
            {t("startingBalance", { amount: formatNumber(op.starting_balance as string) })}
          </div>
        </div>
      );

    case "change_trust":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("asset")}</span>
            <span className="font-medium">
              {op.asset_type === "native" ? "XLM" : (op.asset_code as string)}
            </span>
            {typeof op.asset_issuer === "string" && (
              <HashDisplay hash={op.asset_issuer} truncate startLength={4} endLength={4} />
            )}
          </div>
          {typeof op.limit === "string" && (
            <div className="text-muted-foreground">
              {t("limit")} {op.limit === "922337203685.4775807" ? t("max") : formatNumber(op.limit)}
            </div>
          )}
        </div>
      );

    case "invoke_host_function":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Code className="text-muted-foreground size-4" />
            <span className="text-muted-foreground">{t("sorobanCall")}</span>
          </div>
          {typeof op.function === "string" && (
            <div className="bg-muted/50 rounded p-2 font-mono text-xs">{op.function}</div>
          )}
        </div>
      );

    default:
      return (
        <div className="text-muted-foreground text-sm">{operation.type.replace(/_/g, " ")}</div>
      );
  }
}

function TransactionEffects({ hash }: { hash: string }) {
  const { data, isLoading, error, refetch } = useTransactionEffects(hash);
  const t = useTranslations("transaction");

  if (isLoading) {
    return <LoadingCard rows={5} />;
  }

  if (error) {
    return (
      <ErrorState title={t("failedToLoadEffects")} message={error.message} onRetry={refetch} />
    );
  }

  if (!data?.records?.length) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">
          {t("noEffects")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("effects")} ({data.records.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.records.map((effect: Horizon.ServerApi.EffectRecord) => (
            <div
              key={effect.id}
              className="bg-card/50 flex items-center justify-between rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize">
                  {effect.type.replace(/_/g, " ")}
                </Badge>
                {(effect as Horizon.ServerApi.EffectRecord & { account?: string }).account && (
                  <HashDisplay
                    hash={
                      (effect as Horizon.ServerApi.EffectRecord & { account?: string }).account!
                    }
                    truncate
                    startLength={6}
                    endLength={4}
                    linkTo={`/account/${(effect as Horizon.ServerApi.EffectRecord & { account?: string }).account}`}
                    className="text-sm"
                  />
                )}
              </div>
              {(effect as Horizon.ServerApi.EffectRecord & { amount?: string }).amount && (
                <span className="font-mono text-sm">
                  {formatNumber(
                    (effect as Horizon.ServerApi.EffectRecord & { amount?: string }).amount!
                  )}{" "}
                  {(effect as Horizon.ServerApi.EffectRecord & { asset_type?: string })
                    .asset_type === "native"
                    ? "XLM"
                    : (effect as Horizon.ServerApi.EffectRecord & { asset_code?: string })
                        .asset_code || ""}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RawData({ transaction }: { transaction: Horizon.ServerApi.TransactionRecord }) {
  const t = useTranslations("transaction");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("rawData")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">{t("envelopeXdr")}</h4>
            <pre className="bg-muted/50 overflow-x-auto rounded-lg p-3 font-mono text-xs break-all whitespace-pre-wrap">
              {transaction.envelope_xdr}
            </pre>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium">{t("resultXdr")}</h4>
            <pre className="bg-muted/50 overflow-x-auto rounded-lg p-3 font-mono text-xs break-all whitespace-pre-wrap">
              {transaction.result_xdr}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TransactionContent({ hash }: TransactionContentProps) {
  const { data: transaction, isLoading, error, refetch } = useTransaction(hash);
  const { network } = useNetwork();
  const networkConfig = NETWORKS[network];
  const t = useTranslations("transaction");
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-4 w-96 animate-pulse rounded" />
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
          title={t("title")}
          subtitle={t("notFound")}
          backHref="/"
          backLabel={tCommon("home")}
        />
        <ErrorState title={t("notFound")} message={t("notFoundMessage")} onRetry={refetch} />
      </div>
    );
  }

  if (!transaction) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: tNav("transactions"), href: "/transactions" },
          { label: truncateHash(transaction.hash, 8, 8), href: `/tx/${transaction.hash}` },
        ]}
      />

      <PageHeader
        title={t("title")}
        hash={transaction.hash}
        backHref="/transactions"
        backLabel={tNav("transactions")}
        showQr={false}
        badge={<StatusBadge status={transaction.successful ? "success" : "failed"} />}
      />

      <TransactionSummary transaction={transaction} />

      {/* Developer Panel */}
      <DeveloperPanel
        xdrData={{
          envelope: transaction.envelope_xdr,
          result: transaction.result_xdr,
        }}
        additionalEndpoints={[
          {
            label: "Transaction API",
            url: `${networkConfig.horizonUrl}/transactions/${transaction.hash}`,
          },
          {
            label: "Operations API",
            url: `${networkConfig.horizonUrl}/transactions/${transaction.hash}/operations`,
          },
        ]}
        internalIds={[
          { label: "Ledger Sequence", value: transaction.ledger_attr },
          { label: "Source Account Sequence", value: transaction.source_account_sequence },
          { label: "Paging Token", value: transaction.paging_token },
        ]}
      />

      <Tabs defaultValue="operations" className="w-full">
        <TabsList>
          <TabsTrigger value="operations">{t("operations")}</TabsTrigger>
          <TabsTrigger value="effects">{t("effects")}</TabsTrigger>
          <TabsTrigger value="raw">{t("rawData")}</TabsTrigger>
        </TabsList>
        <TabsContent value="operations" className="mt-4">
          <OperationsTimeline hash={hash} />
        </TabsContent>
        <TabsContent value="effects" className="mt-4">
          <TransactionEffects hash={hash} />
        </TabsContent>
        <TabsContent value="raw" className="mt-4">
          <RawData transaction={transaction} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
