"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { detectEntityType, getEntityRoute } from "@/lib/utils";
import { Search, ArrowRightLeft, Users, FileCode, Coins, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { EntityType } from "@/types";
import { useTranslations } from "next-intl";

const entityIcons: Record<EntityType, typeof Search> = {
  transaction: ArrowRightLeft,
  account: Users,
  contract: FileCode,
  asset: Coins,
  ledger: Layers,
  unknown: Search,
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const t = useTranslations("searchPage");
  const tEntity = useTranslations("entityTypes");

  if (!query) {
    return <EmptyState title={t("noQuery")} description={t("noQueryHint")} icon="search" />;
  }

  const detectedType = detectEntityType(query);
  const route = getEntityRoute(detectedType, query);

  // If we can determine the type, redirect directly
  if (route && detectedType !== "unknown") {
    router.replace(route);
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse">
            <p className="text-muted-foreground">{t("redirecting")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show search results for ambiguous queries
  const Icon = entityIcons[detectedType];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-card/50 flex items-center gap-3 rounded-lg p-4">
              <Icon className="text-muted-foreground size-5" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm break-all">{query}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("detectedAs")} {tEntity(detectedType)}
                </p>
              </div>
            </div>

            {/* Possible interpretations */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("trySearchingAs")}</p>

              {/* Transaction */}
              {query.length === 64 && (
                <Link
                  href={`/tx/${query}`}
                  className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="text-primary size-4" />
                    <span className="text-sm">{tEntity("transaction")}</span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              )}

              {/* Account */}
              {query.startsWith("G") && query.length === 56 && (
                <Link
                  href={`/account/${query}`}
                  className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="text-chart-2 size-4" />
                    <span className="text-sm">{tEntity("account")}</span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              )}

              {/* Contract */}
              {query.startsWith("C") && query.length === 56 && (
                <Link
                  href={`/contract/${query}`}
                  className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="text-chart-4 size-4" />
                    <span className="text-sm">{tEntity("contract")}</span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              )}

              {/* Ledger */}
              {/^\d+$/.test(query) && (
                <Link
                  href={`/ledger/${query}`}
                  className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="text-chart-1 size-4" />
                    <span className="text-sm">{tEntity("ledger")}</span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {detectedType === "unknown" && (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title={t("couldntIdentify")}
              description={t("couldntIdentifyMessage")}
              icon="search"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SearchPage() {
  const t = useTranslations("searchPage");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} backHref="/" backLabel={tCommon("home")} showCopy={false} />

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <p className="text-muted-foreground">{tCommon("loading")}</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <SearchResultsContent />
      </Suspense>
    </div>
  );
}
