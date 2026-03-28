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
  const t = await getTranslations({ locale, namespace: "transactions" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/transactions",
    title: t("title"),
    description: t("metaDescription"),
    keywords: [
      "stellar transactions",
      "stellar transaction search",
      "stellar account activity",
      "stellar ledger transactions",
    ],
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      type: "website",
    },
  });
}

export default async function TransactionsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; network: string }>;
}) {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "transactions" });

  return (
    <>
      <StructuredDataScript
        data={buildCollectionPageStructuredData({
          locale,
          network,
          pathname: "/transactions",
          name: t("title"),
          description: t("metaDescription"),
          about: ["Stellar transactions", "transaction search", "ledger activity", "account activity"],
        })}
      />
      {children}
    </>
  );
}
