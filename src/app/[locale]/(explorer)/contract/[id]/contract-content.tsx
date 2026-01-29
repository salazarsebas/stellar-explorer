"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { HashDisplay } from "@/components/common/hash-display";
import { LoadingCard } from "@/components/common/loading-card";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { useContractEvents, useContractCode } from "@/lib/hooks";
import { isValidContractId, formatCompactNumber } from "@/lib/utils";
import {
  Activity,
  Database,
  Code,
  AlertTriangle,
  Hash,
  Copy,
  Check,
  FileCode,
  Box,
} from "lucide-react";

interface ContractContentProps {
  id: string;
}

function ContractSummary({ contractId }: { contractId: string }) {
  const t = useTranslations("contract");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("information")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Hash className="size-4" />
                {t("contractId")}
              </span>
              <HashDisplay
                hash={contractId}
                truncate
                startLength={12}
                endLength={8}
                className="text-sm"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("type")}</span>
              <Badge variant="secondary">{t("sorobanContract")}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("status")}</span>
              <Badge className="bg-success/15 text-success border-success/25">{t("active")}</Badge>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="bg-warning/10 border-warning/20 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-warning text-sm font-medium">{t("unverified")}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{t("unverifiedDescription")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractEvents({ contractId }: { contractId: string }) {
  const t = useTranslations("contract");
  const { data, isLoading, error, refetch } = useContractEvents(contractId);

  if (isLoading) {
    return <LoadingCard rows={5} />;
  }

  if (error) {
    return <ErrorState title={t("failedToLoadEvents")} message={error.message} onRetry={refetch} />;
  }

  if (!data?.events?.length) {
    return <EmptyState title={t("noEvents")} description={t("noEventsDescription")} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("recentEvents")} ({data.events.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.events.map(
            (event: { id?: string; type?: string; ledger?: number }, index: number) => (
              <div
                key={`${event.id || index}`}
                className="bg-card/50 flex items-center justify-between rounded-lg p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-chart-1/10 flex size-8 items-center justify-center rounded-md">
                    <Activity className="text-chart-1 size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {event.type || t("contractEvent")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t("ledger")} {event.ledger}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {event.type === "contract" ? t("contract") : t("system")}
                </Badge>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ContractStorage() {
  const t = useTranslations("contract");

  return (
    <Card>
      <CardContent className="py-12">
        <EmptyState
          title={t("storageComingSoon")}
          description={t("storageComingSoonDescription")}
          icon="file"
        />
      </CardContent>
    </Card>
  );
}

function ContractCode({ contractId }: { contractId: string }) {
  const t = useTranslations("contract");
  const { data, isLoading, error, refetch } = useContractCode(contractId);
  const [copied, setCopied] = useState<"hash" | "code" | null>(null);
  const [showFullCode, setShowFullCode] = useState(false);

  const handleCopy = async (text: string, type: "hash" | "code") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return <LoadingCard rows={5} />;
  }

  if (error) {
    return <ErrorState title={t("failedToLoadCode")} message={error.message} onRetry={refetch} />;
  }

  if (!data) {
    return <EmptyState title={t("noCode")} description={t("noCodeDescription")} icon="file" />;
  }

  // Stellar Asset Contract (SAC)
  if (data.type === "sac") {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="bg-chart-4/10 flex size-16 items-center justify-center rounded-full">
              <Box className="text-chart-4 size-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium">{t("stellarAssetContract")}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{t("sacDescription")}</p>
            </div>
            <Badge variant="secondary">{t("nativeContract")}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format hex code for display (groups of 8 bytes per line, 32 chars)
  const formatHexCode = (hex: string, fullView: boolean) => {
    const lines: string[] = [];
    const charsPerLine = 64; // 32 bytes = 64 hex chars
    const maxLines = fullView ? Infinity : 20;

    for (let i = 0; i < hex.length && lines.length < maxLines; i += charsPerLine) {
      const line = hex.slice(i, i + charsPerLine);
      // Add space every 8 chars for readability
      const formatted = line.match(/.{1,8}/g)?.join(" ") || line;
      lines.push(formatted);
    }

    return lines;
  };

  const codeLines = formatHexCode(data.wasmCodeHex || "", showFullCode);
  const totalLines = Math.ceil((data.wasmCodeHex?.length || 0) / 64);
  const hasMoreLines = totalLines > 20 && !showFullCode;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCode className="size-4" />
          {t("wasmBytecode")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WASM Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">{t("wasmHash")}</span>
            <div className="flex items-center gap-2">
              <code className="bg-muted truncate rounded px-2 py-1 font-mono text-xs">
                {data.wasmHash?.slice(0, 16)}...{data.wasmHash?.slice(-16)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => handleCopy(data.wasmHash || "", "hash")}
              >
                {copied === "hash" ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">{t("codeSize")}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {formatCompactNumber(data.codeSize)} {t("bytes")}
              </Badge>
              <span className="text-muted-foreground text-xs">
                ({(data.codeSize / 1024).toFixed(2)} KB)
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bytecode viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">{t("hexBytecode")}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => handleCopy(data.wasmCodeHex || "", "code")}
            >
              {copied === "code" ? (
                <>
                  <Check className="size-3.5 text-green-500" />
                  {t("copied")}
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  {t("copyCode")}
                </>
              )}
            </Button>
          </div>
          <div className="bg-muted/50 relative rounded-lg border">
            <div className="overflow-x-auto">
              <pre className="p-4 font-mono text-xs leading-relaxed">
                {codeLines.map((line, index) => (
                  <div key={index} className="flex">
                    <span className="text-muted-foreground mr-4 w-8 text-right select-none">
                      {String((index + 1) * 32).padStart(6, "0")}
                    </span>
                    <span className="text-foreground">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
            {hasMoreLines && (
              <div className="from-muted/80 to-muted absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t pb-4">
                <Button variant="secondary" size="sm" onClick={() => setShowFullCode(true)}>
                  {t("showFullCode")} ({totalLines - 20} {t("moreLines")})
                </Button>
              </div>
            )}
          </div>
          {showFullCode && totalLines > 20 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowFullCode(false)}
            >
              {t("collapseCode")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ContractContent({ id }: ContractContentProps) {
  const t = useTranslations("contract");

  if (!isValidContractId(id)) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        hash={id}
        backHref="/"
        backLabel="Home"
        showQr={false}
        badge={
          <Badge variant="outline" className="bg-warning/15 text-warning border-warning/25">
            <AlertTriangle className="mr-1 size-3" />
            {t("unverified")}
          </Badge>
        }
      />

      <ContractSummary contractId={id} />

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">
            <Activity className="mr-2 size-4" />
            {t("events")}
          </TabsTrigger>
          <TabsTrigger value="storage">
            <Database className="mr-2 size-4" />
            {t("storage")}
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="mr-2 size-4" />
            {t("code")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-4">
          <ContractEvents contractId={id} />
        </TabsContent>
        <TabsContent value="storage" className="mt-4">
          <ContractStorage />
        </TabsContent>
        <TabsContent value="code" className="mt-4">
          <ContractCode contractId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
