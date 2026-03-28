import { MetadataRoute } from "next";
import { EXPLORER_STATIC_PATHS, INDEXABLE_NETWORKS, buildExplorerUrl } from "@/lib/seo";
import { locales } from "@/i18n/config";
import {
  getLatestLedgerSnapshot,
  getRecentTransactionsSnapshot,
  getTopAssetSnapshots,
} from "@/lib/stellar/server";
import { POPULAR_ASSETS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const network of INDEXABLE_NETWORKS) {
      for (const path of EXPLORER_STATIC_PATHS) {
        staticEntries.push({
          url: buildExplorerUrl(locale, network, path),
          priority: path === "" ? 1.0 : 0.8,
          changeFrequency: path === "" ? "hourly" : "daily",
        });
      }
    }
  }

  const dynamicEntries = await Promise.all(
    INDEXABLE_NETWORKS.map(async (network) => {
      let latestLedger = null;
      let recentTransactions: Awaited<ReturnType<typeof getRecentTransactionsSnapshot>> = [];
      let topAssets: Awaited<ReturnType<typeof getTopAssetSnapshots>> = [];

      try {
        [latestLedger, recentTransactions, topAssets] = await Promise.all([
          getLatestLedgerSnapshot(network),
          getRecentTransactionsSnapshot(network, 25),
          getTopAssetSnapshots(network),
        ]);
      } catch {
        latestLedger = null;
        recentTransactions = [];
        topAssets = [];
      }

      const ledgerEntries: MetadataRoute.Sitemap = latestLedger
        ? locales.map((locale) => ({
            url: buildExplorerUrl(locale, network, `/ledger/${latestLedger.sequence}`),
            lastModified: latestLedger.closed_at,
            changeFrequency: "hourly",
            priority: 0.9,
          }))
        : [];

      const transactionEntries: MetadataRoute.Sitemap = recentTransactions.flatMap((tx) =>
        locales.map((locale) => ({
          url: buildExplorerUrl(locale, network, `/tx/${tx.hash}`),
          lastModified: tx.created_at,
          changeFrequency: "hourly",
          priority: 0.7,
        }))
      );

      const accountIds = dedupe(recentTransactions.map((tx) => tx.source_account)).slice(0, 20);
      const accountEntries: MetadataRoute.Sitemap = accountIds.flatMap((accountId) =>
        locales.map((locale) => ({
          url: buildExplorerUrl(locale, network, `/account/${accountId}`),
          changeFrequency: "daily",
          priority: 0.6,
        }))
      );

      const assetSlugs = dedupe(
        [...topAssets, ...POPULAR_ASSETS]
          .map((asset) => {
            if (!asset) return null;
            const code = "asset_code" in asset ? asset.asset_code : asset.code;
            const issuer = "asset_issuer" in asset ? asset.asset_issuer : asset.issuer;
            if (!code || !issuer) return null;
            return `${code}-${issuer}`;
          })
          .filter((slug): slug is string => slug !== null)
      );

      const assetEntries: MetadataRoute.Sitemap = assetSlugs.flatMap((slug) =>
        locales.map((locale) => ({
          url: buildExplorerUrl(locale, network, `/asset/${slug}`),
          changeFrequency: "daily",
          priority: 0.7,
        }))
      );

      return [...ledgerEntries, ...transactionEntries, ...accountEntries, ...assetEntries];
    })
  );

  return [...staticEntries, ...dynamicEntries.flat()];
}
