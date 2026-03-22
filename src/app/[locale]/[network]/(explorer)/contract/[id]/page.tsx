import { Metadata } from "next";
import { ContractContent } from "./contract-content";
import { buildExplorerMetadata } from "@/lib/seo";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, network, id } = await params;
  const shortId = `${id.slice(0, 6)}...${id.slice(-6)}`;

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: `/contract/${id}`,
    title: `Contract ${shortId}`,
    description: `View Soroban smart contract ${shortId}. Explore events, storage, and contract code on Stellar.`,
    openGraph: {
      title: `Soroban Contract ${shortId}`,
      description: `View smart contract details on Stellar Explorer`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Soroban Contract ${shortId}`,
      description: `View smart contract details on Stellar Explorer`,
    },
  });
}

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  return <ContractContent id={id} />;
}
