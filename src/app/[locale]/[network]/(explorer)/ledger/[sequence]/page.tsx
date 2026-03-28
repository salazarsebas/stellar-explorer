import { Metadata } from "next";
import { notFound } from "next/navigation";
import { LedgerContent } from "./ledger-content";
import { buildLedgerMetadataCopy } from "@/lib/entity-metadata";
import { buildExplorerMetadata } from "@/lib/seo";
import { getLedgerSnapshot } from "@/lib/stellar/server";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string; sequence: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, network, sequence } = await params;
  const sequenceNum = parseInt(sequence, 10);

  if (isNaN(sequenceNum) || sequenceNum <= 0) {
    return {
      title: "Ledger Not Found",
    };
  }

  let copy = buildLedgerMetadataCopy(sequenceNum);

  try {
    const ledger = await getLedgerSnapshot(network as NetworkKey, sequenceNum);
    copy = buildLedgerMetadataCopy(sequenceNum, ledger);
  } catch {
    // Keep generic metadata when server-side fetching fails.
  }

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: `/ledger/${sequenceNum}`,
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

export default async function LedgerPage({ params }: Props) {
  const { sequence } = await params;
  const sequenceNum = parseInt(sequence, 10);

  if (isNaN(sequenceNum) || sequenceNum <= 0) {
    return notFound();
  }

  return <LedgerContent sequence={sequenceNum} />;
}
