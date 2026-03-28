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
  const t = await getTranslations({ locale, namespace: "assets" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/assets",
    title: t("title"),
    description: t("metaDescription"),
    keywords: [
      "stellar assets",
      "stellar tokens",
      "stellar asset explorer",
      "stellar issuer lookup",
    ],
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      type: "website",
    },
  });
}

export default async function AssetsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; network: string }>;
}) {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "assets" });

  return (
    <>
      <StructuredDataScript
        data={buildCollectionPageStructuredData({
          locale,
          network,
          pathname: "/assets",
          name: t("title"),
          description: t("metaDescription"),
          about: ["Stellar assets", "asset search", "asset issuers", "token holders"],
        })}
      />
      {children}
    </>
  );
}
