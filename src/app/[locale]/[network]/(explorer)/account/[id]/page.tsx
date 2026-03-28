import { Metadata } from "next";
import { AccountContent } from "./account-content";
import { buildAccountMetadataCopy } from "@/lib/entity-metadata";
import { buildExplorerMetadata } from "@/lib/seo";
import { getAccountSnapshot } from "@/lib/stellar/server";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, network, id } = await params;
  let copy = buildAccountMetadataCopy(id);

  try {
    const account = await getAccountSnapshot(network as NetworkKey, id);
    copy = buildAccountMetadataCopy(id, account);
  } catch {
    // Keep generic metadata when server-side fetching fails.
  }

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: `/account/${id}`,
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

export default async function AccountPage({ params }: Props) {
  const { id } = await params;
  return <AccountContent id={id} />;
}
