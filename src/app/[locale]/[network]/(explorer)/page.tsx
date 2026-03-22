import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import HomePageClient from "./home-page-client";
import { buildExplorerMetadata } from "@/lib/seo";
import {
  getFeeStatsSnapshot,
  getLatestLedgerSnapshot,
  getRecentTransactionsSnapshot,
} from "@/lib/stellar/server";
import { formatLedgerSequence, stroopsToXLM, truncateHash } from "@/lib/utils";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "",
    title: "Stellar Blockchain Explorer",
    description: t("subtitle"),
    keywords: [
      "stellar blockchain explorer",
      "xlm explorer",
      "stellar transactions",
      "stellar ledgers",
      "soroban explorer",
    ],
    openGraph: {
      title: "Stellar Blockchain Explorer",
      description: t("subtitle"),
      type: "website",
    },
  });
}

export default async function HomePage({ params }: Props) {
  const { locale, network } = await params;
  const typedNetwork = network as NetworkKey;

  const [tHome, tStats] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "stats" }),
  ]);

  let latestLedger = null;
  let feeStats = null;
  let recentTransactions: Awaited<ReturnType<typeof getRecentTransactionsSnapshot>> = [];

  try {
    [latestLedger, feeStats, recentTransactions] = await Promise.all([
      getLatestLedgerSnapshot(typedNetwork),
      getFeeStatsSnapshot(typedNetwork),
      getRecentTransactionsSnapshot(typedNetwork, 5),
    ]);
  } catch {
    latestLedger = null;
    feeStats = null;
    recentTransactions = [];
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Stellar Explorer",
        url: `https://stellar-explorer.acachete.xyz/${locale}/${network}`,
        description: tHome("subtitle"),
      },
      {
        "@type": "Dataset",
        name: "Stellar Network Activity Feed",
        description:
          "Real-time Stellar blockchain data including ledgers, transactions, accounts, assets, and Soroban contracts.",
        url: `https://stellar-explorer.acachete.xyz/${locale}/${network}`,
        creator: {
          "@type": "Organization",
          name: "Stellar Explorer",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="bg-card/40 border-border/60 mb-8 rounded-2xl border px-5 py-5">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Search Overview</h2>
          <p className="text-muted-foreground">
            Stellar Explorer exposes server-rendered blockchain context for crawlers before the
            interactive dashboard hydrates. This page summarizes live Stellar network activity,
            recent transactions, current ledger state, and fee conditions.
          </p>
          <p className="text-muted-foreground">
            The current {network} snapshot includes the latest closed ledger, protocol version, and
            direct links to recent verified Stellar transactions.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="bg-background rounded-xl border p-4">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">
              {tStats("latestLedger")}
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {latestLedger ? formatLedgerSequence(latestLedger.sequence) : "-"}
            </div>
            {latestLedger && (
              <p className="text-muted-foreground mt-2 text-sm">
                {latestLedger.successful_transaction_count} successful transactions in the latest
                closed ledger.
              </p>
            )}
          </div>

          <div className="bg-background rounded-xl border p-4">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">
              {tStats("protocolVersion")}
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {latestLedger?.protocol_version?.toString() || "-"}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {tStats("baseFee")}:{" "}
              {feeStats?.fee_charged?.mode ? `${stroopsToXLM(feeStats.fee_charged.mode)} XLM` : "-"}
            </p>
          </div>

          <div className="bg-background rounded-xl border p-4">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">
              Recent Transactions
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              {recentTransactions.map((tx) => (
                <li key={tx.hash}>
                  <Link
                    href={`/${locale}/${network}/tx/${tx.hash}`}
                    className="text-primary hover:underline"
                  >
                    {truncateHash(tx.hash, 10, 6)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <HomePageClient />
    </>
  );
}
