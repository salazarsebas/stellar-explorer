import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildExplorerMetadata, isIndexableNetwork } from "@/lib/seo";
import type { NetworkKey } from "@/types";

const VALID_NETWORKS = ["public", "testnet", "futurenet"];

export function generateStaticParams() {
  return VALID_NETWORKS.map((network) => ({ network }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; network: string }>;
}): Promise<Metadata> {
  const { locale, network } = await params;

  if (!VALID_NETWORKS.includes(network)) {
    return {};
  }

  const typedNetwork = network as NetworkKey;
  const index = isIndexableNetwork(typedNetwork);

  return buildExplorerMetadata({
    locale,
    network: typedNetwork,
    title: "Stellar Explorer",
    description:
      typedNetwork === "public"
        ? "Explore the Stellar blockchain with server-rendered routes for transactions, ledgers, accounts, assets, and contracts."
        : `Explore the ${network} Stellar network in a non-indexed environment for testing and developer workflows.`,
    index,
  });
}

export default async function NetworkLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ network: string }>;
}) {
  const { network } = await params;

  if (!VALID_NETWORKS.includes(network)) {
    notFound();
  }

  return children;
}
