import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HomePageClient from "./home-page-client";
import { buildExplorerMetadata } from "@/lib/seo";
import { StructuredDataScript } from "@/components/common";
import type { NetworkKey } from "@/types";

type Props = {
  params: Promise<{ locale: string; network: string }>;
};

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
      "stellar accounts",
      "stellar assets",
      "stellar ledgers",
      "soroban explorer",
      "soroban contracts",
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
  const tHome = await getTranslations({ locale, namespace: "home" });

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
      <StructuredDataScript data={structuredData} />

      <HomePageClient />
    </>
  );
}
