import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StructuredDataScript } from "@/components/common";
import { buildCollectionPageStructuredData, buildExplorerMetadata } from "@/lib/seo";
import type { NetworkKey } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; network: string }>;
}): Promise<Metadata> {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "ledgers" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/ledgers",
    title: t("title"),
    description: t("metaDescription"),
    keywords: [
      "stellar ledgers",
      "stellar ledger explorer",
      "ledger sequence search",
      "stellar ledger history",
    ],
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      type: "website",
    },
  });
}

export default async function LedgersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; network: string }>;
}) {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "ledgers" });

  return (
    <>
      <StructuredDataScript
        data={buildCollectionPageStructuredData({
          locale,
          network,
          pathname: "/ledgers",
          name: t("title"),
          description: t("metaDescription"),
          about: ["Stellar ledgers", "ledger search", "ledger history", "ledger sequence"],
        })}
      />
      {children}
    </>
  );
}
