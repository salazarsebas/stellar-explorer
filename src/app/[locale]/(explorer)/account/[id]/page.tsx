import { Metadata } from "next";
import { AccountContent } from "./account-content";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const shortId = `${id.slice(0, 6)}...${id.slice(-6)}`;

  return {
    title: `Account ${shortId}`,
    description: `View Stellar account ${shortId}. Explore balances, transactions, operations, and signers.`,
    openGraph: {
      title: `Stellar Account ${shortId}`,
      description: `View account details on Stellar Explorer`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Stellar Account ${shortId}`,
      description: `View account details on Stellar Explorer`,
    },
  };
}

export default async function AccountPage({ params }: Props) {
  const { id } = await params;
  return <AccountContent id={id} />;
}
