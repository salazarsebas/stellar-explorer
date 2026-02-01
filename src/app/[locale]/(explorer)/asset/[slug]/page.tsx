import { Metadata } from "next";
import { AssetContent } from "./asset-content";

type Props = {
  params: Promise<{ slug: string }>;
};

function parseAssetSlug(slug: string): { code: string; issuer: string } | null {
  const decodedSlug = decodeURIComponent(slug);

  // Handle native XLM
  if (decodedSlug === "XLM-native" || decodedSlug === "native") {
    return { code: "XLM", issuer: "native" };
  }

  // Parse CODE-ISSUER format
  const parts = decodedSlug.split("-");
  if (parts.length < 2) return null;

  const code = parts[0];
  const issuer = parts.slice(1).join("-");

  if (!issuer.startsWith("G") || issuer.length !== 56) {
    return null;
  }

  return { code, issuer };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseAssetSlug(slug);

  if (!parsed) {
    return {
      title: "Asset Not Found",
    };
  }

  const { code, issuer } = parsed;
  const isNative = issuer === "native";
  const shortIssuer = isNative ? "Native" : `${issuer.slice(0, 4)}...${issuer.slice(-4)}`;

  return {
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
  };
}

export default async function AssetPage({ params }: Props) {
  const { slug } = await params;
  return <AssetContent slug={slug} />;
}
