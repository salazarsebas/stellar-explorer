import { Metadata } from "next";
import { AssetContent } from "./asset-content";
import { buildAssetMetadataCopy } from "@/lib/entity-metadata";
import { parseAssetSlug } from "@/lib/utils";
import { buildExplorerMetadata } from "@/lib/seo";
import { getAssetSnapshot } from "@/lib/stellar/server";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, network, slug } = await params;
  const parsed = parseAssetSlug(slug);

  if (!parsed) {
    return {
      title: "Asset Not Found",
    };
  }

  const { code, issuer } = parsed;
  let copy = buildAssetMetadataCopy(code, issuer);

  if (issuer !== "native") {
    try {
      const asset = await getAssetSnapshot(network as NetworkKey, code, issuer);
      copy = buildAssetMetadataCopy(code, issuer, asset);
    } catch {
      // Keep generic metadata when server-side fetching fails.
    }
  }

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: `/asset/${slug}`,
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

export default async function AssetPage({ params }: Props) {
  const { slug } = await params;
  return <AssetContent slug={slug} />;
}
