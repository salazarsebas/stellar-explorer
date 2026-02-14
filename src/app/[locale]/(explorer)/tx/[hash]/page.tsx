import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransactionContent } from "./transaction-content";

type Props = {
  params: Promise<{ hash: string }>;
};

function isValidTransactionHash(hash: string): boolean {
  return hash.length === 64 && /^[a-f0-9]+$/i.test(hash);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hash } = await params;
  const shortHash = `${hash.slice(0, 8)}...${hash.slice(-8)}`;

  return {
    title: `Transaction ${shortHash}`,
    description: `View details of Stellar transaction ${shortHash}. Explore operations, effects, and raw XDR data.`,
    openGraph: {
      title: `Stellar Transaction ${shortHash}`,
      description: `View transaction details on Stellar Explorer`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Stellar Transaction ${shortHash}`,
      description: `View transaction details on Stellar Explorer`,
    },
  };
}

export default async function TransactionPage({ params }: Props) {
  const { hash } = await params;

  if (!isValidTransactionHash(hash)) {
    return notFound();
  }

  return <TransactionContent hash={hash} />;
}
