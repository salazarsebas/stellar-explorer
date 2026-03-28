import type { Metadata } from "next";
import { buildExplorerMetadata } from "@/lib/seo";
import type { NetworkKey } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; network: string }>;
}): Promise<Metadata> {
  const { locale, network } = await params;

  return buildExplorerMetadata({
    locale,
    network: network as NetworkKey,
    pathname: "/search",
    title: "Search",
    description: "Search results within Stellar Explorer.",
    index: false,
  });
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
