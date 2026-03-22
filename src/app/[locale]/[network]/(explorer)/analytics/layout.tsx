import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildExplorerMetadata } from "@/lib/seo";
import type { NetworkKey } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; network: string }>;
}): Promise<Metadata> {
  const { locale, network } = await params;
  const t = await getTranslations({ locale, namespace: "analytics" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/analytics",
    title: t("title"),
    description: t("subtitle"),
    index: false,
  });
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
