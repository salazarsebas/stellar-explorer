import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import type { NetworkKey } from "@/types";

export const INDEXABLE_NETWORKS: NetworkKey[] = ["public"];
export const NON_INDEXABLE_NETWORKS: NetworkKey[] = ["testnet", "futurenet"];
export const EXPLORER_STATIC_PATHS = [
  "",
  "/transactions",
  "/ledgers",
  "/accounts",
  "/assets",
  "/contracts",
  "/learn",
] as const;

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://stellar-explorer.acachete.xyz";
}

export function isIndexableNetwork(network: NetworkKey): boolean {
  return INDEXABLE_NETWORKS.includes(network);
}

export function normalizePath(pathname = ""): string {
  if (!pathname || pathname === "/") return "";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function buildExplorerUrl(locale: string, network: string, pathname = ""): string {
  const path = normalizePath(pathname);
  return `${getBaseUrl()}/${locale}/${network}${path}`;
}

export function buildLanguageAlternates(network: string, pathname = ""): Record<string, string> {
  const path = normalizePath(pathname);

  return Object.fromEntries(
    locales.map((locale) => [locale, buildExplorerUrl(locale, network, path)])
  );
}

export function buildExplorerMetadata({
  locale,
  network,
  pathname,
  title,
  description,
  openGraph,
  twitter,
  keywords,
  index = true,
}: {
  locale: string;
  network: NetworkKey;
  pathname?: string;
  title: Metadata["title"];
  description: string;
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
  keywords?: Metadata["keywords"];
  index?: boolean;
}): Metadata {
  const shouldIndex = index && isIndexableNetwork(network);
  const canonical = buildExplorerUrl(locale, network, pathname);
  const alternates = shouldIndex
    ? {
        canonical,
        languages: {
          ...buildLanguageAlternates(network, pathname),
          "x-default": buildExplorerUrl(defaultLocale, network, pathname),
        },
      }
    : {
        canonical,
      };

  return {
    title,
    description,
    keywords,
    alternates,
    openGraph: {
      url: canonical,
      ...openGraph,
    },
    twitter,
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      googleBot: {
        index: shouldIndex,
        follow: shouldIndex,
      },
    },
  };
}

export function getLocaleOgTag(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    en: "en_US",
    es: "es_ES",
    pt: "pt_PT",
    fr: "fr_FR",
    de: "de_DE",
    zh: "zh_CN",
    ja: "ja_JP",
    ko: "ko_KR",
    it: "it_IT",
  };

  return localeMap[locale];
}
