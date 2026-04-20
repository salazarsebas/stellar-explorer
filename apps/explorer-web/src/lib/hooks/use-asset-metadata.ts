"use client";

import { useQuery } from "@tanstack/react-query";
import type { AssetMetadata } from "@/types/toml";

export function useAssetMetadata(
  code: string | undefined,
  issuer: string | undefined,
  tomlUrl: string | undefined
) {
  return useQuery<AssetMetadata>({
    queryKey: ["assetMetadata", code, issuer],
    queryFn: async () => {
      if (!tomlUrl || !code || !issuer) {
        throw new Error("Missing required parameters");
      }

      const response = await fetch(
        `/api/toml?url=${encodeURIComponent(tomlUrl)}&code=${encodeURIComponent(code)}&issuer=${encodeURIComponent(issuer)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!tomlUrl && !!code && !!issuer,
    staleTime: Infinity, // TOML data rarely changes
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 1, // Only retry once on failure
  });
}
