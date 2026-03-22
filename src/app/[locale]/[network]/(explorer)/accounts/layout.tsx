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
  const t = await getTranslations({ locale, namespace: "accounts" });

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/accounts",
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
    },
  });
}

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
