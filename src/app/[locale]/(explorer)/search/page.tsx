"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { detectEntityType, getEntityRoute, getEntityTypeName } from "@/lib/utils";
import { Search, ArrowRightLeft, Users, FileCode, Coins, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { EntityType } from "@/types";

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

  if (!query) {
    return (
      <EmptyState
        title="No search query"
        description="Enter a transaction hash, account address, or ledger number to search."
        icon="search"
      />
    );
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
            <p className="text-muted-foreground">Redirecting...</p>
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
          <CardTitle className="text-base">Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-card/50 flex items-center gap-3 rounded-lg p-4">
              <Icon className="text-muted-foreground size-5" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm break-all">{query}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Detected as: {getEntityTypeName(detectedType)}
                </p>
              </div>
            </div>

            {/* Possible interpretations */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Try searching as:</p>

              {/* Transaction */}
              {query.length === 64 && (
                <Link
                  href={`/tx/${query}`}
                  className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="text-primary size-4" />
                    <span className="text-sm">Transaction</span>
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
                    <span className="text-sm">Account</span>
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
                    <span className="text-sm">Contract</span>
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
                    <span className="text-sm">Ledger</span>
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
              title="Couldn't identify query type"
              description="The search query doesn't match any known Stellar entity format. Please check your input."
              icon="search"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Search Results" backHref="/" backLabel="Home" showCopy={false} />

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <p className="text-muted-foreground">Searching...</p>
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
