import { Metadata } from "next";
import { ContractContent } from "./contract-content";
import { buildContractMetadataCopy } from "@/lib/entity-metadata";
import { buildExplorerMetadata } from "@/lib/seo";
import { getContractCodeSnapshot } from "@/lib/stellar/server";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, network, id } = await params;
  let copy = buildContractMetadataCopy(id);

  try {
    const contractCode = await getContractCodeSnapshot(network as NetworkKey, id);
    copy = buildContractMetadataCopy(id, contractCode);
  } catch {
    // Keep generic metadata when server-side fetching fails.
  }

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: `/contract/${id}`,
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

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  return <ContractContent id={id} />;
}
