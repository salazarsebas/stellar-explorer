import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Stellar Explorer",
    template: "%s | Stellar Explorer",
  },
  description:
    "Explore the Stellar network. View transactions, accounts, assets, and smart contracts.",
  keywords: [
    "Stellar",
    "blockchain",
    "explorer",
    "XLM",
    "Soroban",
    "crypto",
    "Lumens",
    "Stellar Network",
  ],
  authors: [{ name: "Stellar Explorer" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Stellar Explorer",
    title: "Stellar Explorer",
    description:
      "Explore the Stellar blockchain network. View transactions, accounts, assets, and smart contracts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stellar Explorer",
    description: "Explore the Stellar blockchain network",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
