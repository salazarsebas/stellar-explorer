"use client";

import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { HashDisplay } from "@/components/common/hash-display";
import { LoadingCard } from "@/components/common/loading-card";
import { ErrorState } from "@/components/common/error-state";
import { AssetLogo } from "@/components/common/asset-logo";
import { useAsset, useAssetMetadata } from "@/lib/hooks";
import { formatNumber, formatCompactNumber } from "@/lib/utils";
import type { StellarAsset } from "@/types";
import {
  Coins,
  Users,
  TrendingUp,
  Lock,
  Unlock,
  Shield,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface AssetContentProps {
  slug: string;
}

function parseAssetSlug(slug: string): { code: string; issuer: string } | null {
  // Handle native XLM
  if (slug === "XLM-native" || slug === "native") {
    return { code: "XLM", issuer: "native" };
  }

  // Parse CODE-ISSUER format
  const parts = slug.split("-");
  if (parts.length < 2) return null;

  const code = parts[0];
  const issuer = parts.slice(1).join("-"); // Handle edge case where issuer might have dashes

  if (!issuer.startsWith("G") || issuer.length !== 56) {
    return null;
  }

  return { code, issuer };
}

function FlagBadge({
  enabled,
  label,
  enabledIcon: EnabledIcon = CheckCircle2,
  disabledIcon: DisabledIcon = XCircle,
}: {
  enabled: boolean;
  label: string;
  enabledIcon?: typeof CheckCircle2;
  disabledIcon?: typeof XCircle;
}) {
  const t = useTranslations("assetDetails");

  return (
    <div className="bg-card/50 flex items-center justify-between rounded-lg p-3">
      <span className="text-sm">{label}</span>
      <Badge
        variant="outline"
        className={
          enabled
            ? "bg-success/15 text-success border-success/25"
            : "bg-muted text-muted-foreground"
        }
      >
        {enabled ? (
          <EnabledIcon className="mr-1 size-3" />
        ) : (
          <DisabledIcon className="mr-1 size-3" />
        )}
        {enabled ? t("enabled") : t("disabled")}
      </Badge>
    </div>
  );
}

function AssetSummary({ asset }: { asset: StellarAsset }) {
  const t = useTranslations("assetDetails");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("information")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column - Stats */}
          <div className="space-y-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-4">
              <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
                <Coins className="size-4" />
                {t("totalSupply")}
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatNumber(asset.amount)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-card/50 rounded-lg p-4">
                <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
                  <Users className="size-4" />
                  {t("accounts")}
                </div>
                <div className="text-xl font-semibold tabular-nums">
                  {formatCompactNumber(asset.num_accounts)}
                </div>
              </div>

              <div className="bg-card/50 rounded-lg p-4">
                <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4" />
                  {t("claimableBalances")}
                </div>
                <div className="text-xl font-semibold tabular-nums">
                  {formatCompactNumber(asset.claimable_balances_amount || "0")}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("assetCode")}</span>
              <span className="font-medium">{asset.asset_code}</span>
            </div>
            <Separator />
            <div className="flex items-start justify-between">
              <span className="text-muted-foreground text-sm">{t("issuer")}</span>
              <HashDisplay
                hash={asset.asset_issuer}
                truncate
                linkTo={`/account/${asset.asset_issuer}`}
                className="text-sm"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("assetType")}</span>
              <Badge variant="secondary">{asset.asset_type}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("liquidityPools")}</span>
              <span className="text-sm font-medium">{asset.num_liquidity_pools || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetFlags({ asset }: { asset: StellarAsset }) {
  const flags = asset.flags;
  const t = useTranslations("assetDetails");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="size-4" />
          {t("flags")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <FlagBadge
          enabled={flags.auth_required}
          label={t("authRequired")}
          enabledIcon={Lock}
          disabledIcon={Unlock}
        />
        <FlagBadge
          enabled={flags.auth_revocable}
          label={t("authRevocable")}
          enabledIcon={Lock}
          disabledIcon={Unlock}
        />
        <FlagBadge
          enabled={flags.auth_immutable}
          label={t("authImmutable")}
          enabledIcon={Lock}
          disabledIcon={Unlock}
        />
        <FlagBadge enabled={flags.auth_clawback_enabled} label={t("clawbackEnabled")} />
      </CardContent>
    </Card>
  );
}

function AssetStats({ asset }: { asset: StellarAsset }) {
  const t = useTranslations("assetDetails");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("statistics")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="bg-card/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold tabular-nums">
              {formatCompactNumber(asset.num_accounts)}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">{t("totalHolders")}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold tabular-nums">
              {formatCompactNumber(asset.amount)}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">{t("circulating")}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold tabular-nums">
              {formatCompactNumber(asset.num_liquidity_pools || 0)}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">{t("liquidityPools")}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold tabular-nums">
              {formatCompactNumber(asset.accounts?.authorized || 0)}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">{t("authorized")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssetContent({ slug }: AssetContentProps) {
  const parsed = parseAssetSlug(decodeURIComponent(slug));
  const t = useTranslations("assetDetails");
  const tCommon = useTranslations("common");

  // Handle native XLM separately
  const isNative = parsed?.issuer === "native";

  const {
    data: asset,
    isLoading,
    error,
    refetch,
  } = useAsset(parsed?.code || "", isNative ? "" : parsed?.issuer || "");

  // Fetch metadata from stellar.toml - must be called unconditionally (React hooks rules)
  const tomlUrl = (asset as unknown as StellarAsset)?._links?.toml?.href;
  const { data: metadata } = useAssetMetadata(asset?.asset_code, asset?.asset_issuer, tomlUrl);

  if (!parsed) {
    return notFound();
  }

  // For native XLM, show a simplified view
  if (isNative) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <AssetLogo code="XLM" size="xl" />
          <div>
            <h1 className="text-2xl font-bold">{t("xlmTitle")}</h1>
            <p className="text-muted-foreground">{t("xlmSubtitle")}</p>
          </div>
        </div>

        <Card variant="elevated" className="border-0">
          <CardHeader>
            <CardTitle className="text-base">{t("aboutXlm")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t("xlmDescription")}</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>{t("xlmPurpose1")}</li>
              <li>{t("xlmPurpose2")}</li>
              <li>{t("xlmPurpose3")}</li>
              <li>{t("xlmPurpose4")}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </div>
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={parsed.code}
          subtitle={t("notFound")}
          backHref="/"
          backLabel={tCommon("home")}
        />
        <ErrorState title={t("notFound")} message={t("notFoundMessage")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Asset Header with Logo */}
      <div className="flex items-start gap-4">
        <AssetLogo
          code={asset.asset_code}
          issuer={asset.asset_issuer}
          tomlUrl={tomlUrl}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{metadata?.name || asset.asset_code}</h1>
            {!asset.flags.auth_required && !asset.flags.auth_revocable && (
              <Badge className="bg-success/15 text-success border-success/25">
                <CheckCircle2 className="mr-1 size-3" />
                {t("verified")}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {asset.asset_code} • {asset.asset_type.replace("credit_alphanum", "Alpha ")}
          </p>
          {metadata?.description && (
            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
              {metadata.description}
            </p>
          )}
          {metadata?.orgName && (
            <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
              <Building2 className="size-4" />
              <span>
                {t("issuer")} {metadata.orgName}
              </span>
            </div>
          )}
        </div>
      </div>

      <AssetSummary asset={asset as unknown as StellarAsset} />

      <Tabs defaultValue="stats" className="w-full">
        <TabsList>
          <TabsTrigger value="stats">{t("statistics")}</TabsTrigger>
          <TabsTrigger value="flags">{t("flags")}</TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="mt-4">
          <AssetStats asset={asset as unknown as StellarAsset} />
        </TabsContent>
        <TabsContent value="flags" className="mt-4">
          <AssetFlags asset={asset as unknown as StellarAsset} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
