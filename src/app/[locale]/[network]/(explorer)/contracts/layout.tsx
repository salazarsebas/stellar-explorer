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
  const t = await getTranslations({ locale, namespace: "contracts" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/contracts",
    title: t("title"),
    description: t("metaDescription"),
    keywords: [
      "soroban contracts",
      "stellar smart contracts",
      "soroban explorer",
      "contract events",
    ],
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      type: "website",
    },
  });
}

export default async function ContractsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; network: string }>;
}) {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "contracts" });

  return (
    <>
      <StructuredDataScript
        data={buildCollectionPageStructuredData({
          locale,
          network,
          pathname: "/contracts",
          name: t("title"),
          description: t("metaDescription"),
          about: ["Soroban contracts", "smart contracts", "contract events", "contract verification"],
        })}
      />
      {children}
    </>
  );
}
