import { Metadata } from "next";
import { AssetContent } from "./asset-content";
import { parseAssetSlug } from "@/lib/utils";
import { buildExplorerMetadata } from "@/lib/seo";
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
  const isNative = issuer === "native";
  const shortIssuer = isNative ? "Native" : `${issuer.slice(0, 4)}...${issuer.slice(-4)}`;

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: `/asset/${slug}`,
    title: isNative ? "XLM - Stellar Lumens" : `${code} Asset`,
    description: isNative
      ? "XLM (Stellar Lumens) is the native asset of the Stellar network."
      : `View details of ${code} asset on Stellar. Issuer: ${shortIssuer}. Explore supply, holders, and flags.`,
    openGraph: {
      title: isNative ? "Stellar Lumens (XLM)" : `${code} - Stellar Asset`,
      description: isNative
        ? "Native asset of the Stellar network"
        : `View ${code} asset details on Stellar Explorer`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: isNative ? "Stellar Lumens (XLM)" : `${code} - Stellar Asset`,
      description: isNative
        ? "Native asset of the Stellar network"
        : `View ${code} asset details on Stellar Explorer`,
    },
  });
}

export default async function AssetPage({ params }: Props) {
  const { slug } = await params;
  return <AssetContent slug={slug} />;
}
