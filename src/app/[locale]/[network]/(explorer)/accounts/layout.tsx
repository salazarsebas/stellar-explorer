import type { Metadata } from "next";
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
  const t = await getTranslations({ locale, namespace: "accounts" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/accounts",
    title: t("title"),
    description: t("subtitle"),
    keywords: [
      "stellar accounts",
      "stellar address lookup",
      "stellar account balances",
      "stellar account explorer",
    ],
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
    },
  });
}

export default async function AccountsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; network: string }>;
}) {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "accounts" });

  return (
    <>
      <StructuredDataScript
        data={buildCollectionPageStructuredData({
          locale,
          network,
          pathname: "/accounts",
          name: t("title"),
          description: t("subtitle"),
          about: ["Stellar accounts", "account lookup", "account balances", "account signers"],
        })}
      />
      {children}
    </>
  );
}
