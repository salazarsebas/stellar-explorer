"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { AssetLogo } from "@/components/common/asset-logo";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import { Coins, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Known popular assets with their TOML URLs
const POPULAR_ASSETS = [
  {
    code: "XLM",
    issuer: "native",
    name: "Stellar Lumens",
    description: "Native Asset",
    href: "/asset/XLM-native",
  },
  {
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    name: "USD Coin",
    description: "Circle",
    href: "/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    tomlUrl: "https://www.centre.io/.well-known/stellar.toml",
  },
  {
    code: "yXLM",
    issuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
    name: "Ultra Stellar",
    description: "Liquid staking",
    href: "/asset/yXLM-GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
    tomlUrl: "https://ultrastellar.com/.well-known/stellar.toml",
  },
  {
    code: "AQUA",
    issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    name: "Aquarius",
    description: "Liquidity rewards",
    href: "/asset/AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    tomlUrl: "https://aqua.network/.well-known/stellar.toml",
  },
];

export default function AssetsPage() {
  const { network } = useNetwork();
  const router = useRouter();
  const [assetCode, setAssetCode] = useState("");
  const [issuer, setIssuer] = useState("");
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim()) {
      setError("Please enter an asset code");
      return;
    }
    if (!issuer.trim() && assetCode.toUpperCase() !== "XLM") {
      setError("Please enter the issuer address");
      return;
    }

    if (assetCode.toUpperCase() === "XLM") {
      router.push("/asset/XLM-native");
    } else {
      router.push(`/asset/${assetCode.trim()}-${issuer.trim()}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        subtitle="Explore tokens and assets on the Stellar network"
        backHref="/"
        backLabel="Home"
        showCopy={false}
        badge={<NetworkBadge network={network} />}
      />

      {/* Search for an asset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find an Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                placeholder="Asset code (e.g., USDC)"
                value={assetCode}
                onChange={(e) => {
                  setAssetCode(e.target.value);
                  setError("");
                }}
              />
              <Input
                placeholder="Issuer address (G...)"
                value={issuer}
                onChange={(e) => {
                  setIssuer(e.target.value);
                  setError("");
                }}
                className="font-mono md:col-span-2"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit">
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card variant="elevated" className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Popular Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {POPULAR_ASSETS.map((asset) => (
              <Link
                key={`${asset.code}-${asset.issuer}`}
                href={asset.href}
                className="bg-card/50 hover:bg-card-hover group flex items-center gap-3 rounded-xl p-4 transition-all hover:-translate-y-0.5"
              >
                <div className="relative">
                  <AssetLogo
                    code={asset.code}
                    issuer={asset.issuer === "native" ? undefined : asset.issuer}
                    tomlUrl={asset.tomlUrl}
                    size="md"
                  />
                  <div className="bg-primary/20 absolute inset-0 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60" />
                </div>
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-muted-foreground text-xs">{asset.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="bg-chart-3/10 flex size-16 items-center justify-center rounded-2xl">
                <Coins className="text-chart-3 size-8" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Stellar Assets</h3>
              <p className="text-muted-foreground mx-auto mt-2 max-w-md">
                Assets on Stellar are identified by their code and issuer. Search for an asset above
                to view supply, holders, and trading information.
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              Enter the asset code (e.g., USDC) and the issuer address to explore any asset on the
              network.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
