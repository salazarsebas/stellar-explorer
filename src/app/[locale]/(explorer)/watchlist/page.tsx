"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { HashDisplay } from "@/components/common/hash-display";
import { useWatchlist } from "@/lib/hooks";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import { Star, Trash2, Users, FileCode, Coins } from "lucide-react";
import Link from "next/link";

const typeIcons = {
  account: Users,
  contract: FileCode,
  asset: Coins,
};

const typeColors = {
  account: "bg-chart-2/10 text-chart-2",
  contract: "bg-chart-4/10 text-chart-4",
  asset: "bg-chart-3/10 text-chart-3",
};

const typeRoutes = {
  account: (id: string) => `/account/${id}`,
  contract: (id: string) => `/contract/${id}`,
  asset: (id: string) => `/asset/${id}`,
};

export default function WatchlistPage() {
  const { network } = useNetwork();
  const { items, remove, clear, isHydrated } = useWatchlist();

  if (!isHydrated) {
    return (
      <div className="space-y-6">
        <PageHeader title="Watchlist" backHref="/" backLabel="Home" showCopy={false} />
        <Card>
          <CardContent className="py-12">
            <div className="text-muted-foreground animate-pulse text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watchlist"
        subtitle="Track your favorite accounts, contracts, and assets"
        backHref="/"
        backLabel="Home"
        showCopy={false}
        badge={<NetworkBadge network={network} />}
        actions={
          items.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clear}>
              <Trash2 className="mr-2 size-4" />
              Clear All
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="size-4" />
            Saved Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title="Your watchlist is empty"
              description="Add accounts, contracts, or assets to your watchlist to quickly access them later."
              icon="file"
            />
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = typeIcons[item.type];
                const colorClass = typeColors[item.type];
                const href = typeRoutes[item.type](item.id);

                return (
                  <div
                    key={item.id}
                    className="bg-card/50 hover:bg-card-hover group flex items-center justify-between rounded-lg p-4 transition-colors"
                  >
                    <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-md ${colorClass}`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        {item.label && <p className="truncate font-medium">{item.label}</p>}
                        <HashDisplay
                          hash={item.id}
                          truncate
                          startLength={8}
                          endLength={6}
                          copyable={false}
                          className="text-sm"
                        />
                        <p className="text-muted-foreground mt-0.5 text-xs capitalize">
                          {item.type}
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
