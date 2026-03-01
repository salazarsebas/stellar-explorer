import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const VALID_NETWORKS = ["public", "testnet", "futurenet"];

export function generateStaticParams() {
  return VALID_NETWORKS.map((network) => ({ network }));
}

export default async function NetworkLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ network: string }>;
}) {
  const { network } = await params;

  if (!VALID_NETWORKS.includes(network)) {
    notFound();
  }

  return children;
}
