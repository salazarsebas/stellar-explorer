import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransactionContent } from "./transaction-content";
import { buildTransactionMetadataCopy } from "@/lib/entity-metadata";
import { buildExplorerMetadata } from "@/lib/seo";
import { getTransactionSnapshot } from "@/lib/stellar/server";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string; hash: string }>;
};

function isValidTransactionHash(hash: string): boolean {
  return hash.length === 64 && /^[a-f0-9]+$/i.test(hash);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, network, hash } = await params;
  let copy = buildTransactionMetadataCopy(hash);

  try {
    const transaction = await getTransactionSnapshot(network as NetworkKey, hash);
    copy = buildTransactionMetadataCopy(hash, transaction);
  } catch {
    // Keep generic metadata when server-side fetching fails.
  }

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: `/tx/${hash}`,
    title: copy.title,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: copy.title,
      description: copy.description,
    },
  });
}

export default async function TransactionPage({ params }: Props) {
  const { hash } = await params;

  if (!isValidTransactionHash(hash)) {
    return notFound();
  }

  return <TransactionContent hash={hash} />;
}
