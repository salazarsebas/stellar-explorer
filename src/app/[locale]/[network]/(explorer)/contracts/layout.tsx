import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildExplorerMetadata } from "@/lib/seo";
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
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      type: "website",
    },
  });
}

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
