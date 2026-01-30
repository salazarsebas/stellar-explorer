/**
 * Stellar Expert API Client
 *
 * Provides enriched data that Horizon doesn't offer directly:
 * - Asset rankings and statistics
 * - Network statistics
 * - Contract verification status
 * - Historical data
 *
 * API Docs: https://stellar.expert/explorer/public/api
 */

import type { NetworkKey } from "@/types";

// Base URLs for Stellar Expert API
const STELLAR_EXPERT_BASE = "https://api.stellar.expert/explorer";

function getNetworkPath(network: NetworkKey): string {
  switch (network) {
    case "public":
      return "public";
    case "testnet":
      return "testnet";
    case "futurenet":
      return "futurenet";
    default:
      return "public";
  }
}

// Types for Stellar Expert API responses
export interface StellarExpertAsset {
  asset: string;
  domain?: string;
  tomlInfo?: {
    name?: string;
    desc?: string;
    image?: string;
    orgName?: string;
    orgUrl?: string;
  };
  rating?: {
    average: number;
    votes: number;
  };
  supply: string;
  trustlines: {
    total: number;
    authorized: number;
    funded: number;
  };
  trades24h: number;
  traded_amount: string;
  volume24h: string;
  price?: number;
  price7d?: number[];
  interop?: {
    deposit?: boolean;
    withdrawal?: boolean;
  };
}

export interface StellarExpertAssetListItem {
  asset: string;
  domain?: string;
  rating?: number;
  supply?: string;
  trustlines?: number;
  trades?: number;
  volume?: string;
  price?: number;
  priceChange?: number;
}

export interface StellarExpertNetworkStats {
  generated: number;
  ledgers: number;
  accounts: {
    total: number;
    funded: number;
    deleted: number;
  };
  assets: number;
  trustlines: number;
  operations: number;
  transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  trades: number;
  payments: number;
  dex_volume: string;
  fee_pool: string;
  inflation_pool: string;
}

export interface StellarExpertContract {
  contract: string;
  creator?: string;
  created?: number;
  wasm_hash?: string;
  verified?: boolean;
  repository?: string;
  validation?: {
    status: "verified" | "unverified" | "failed";
    timestamp?: number;
  };
  invocations?: number;
  subinvocations?: number;
}

// API Client
class StellarExpertClient {
  private baseUrl: string;

  constructor(network: NetworkKey) {
    this.baseUrl = `${STELLAR_EXPERT_BASE}/${getNetworkPath(network)}`;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Stellar Expert API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get enriched asset data
   */
  async getAsset(code: string, issuer: string): Promise<StellarExpertAsset | null> {
    try {
      const assetId = issuer === "native" ? "XLM" : `${code}-${issuer}`;
      return await this.fetch<StellarExpertAsset>(`/asset/${assetId}`);
    } catch {
      return null;
    }
  }

  /**
   * Get top assets list
   */
  async getAssetList(
    options: {
      sort?: "rating" | "trustlines" | "volume" | "trades";
      order?: "asc" | "desc";
      limit?: number;
    } = {}
  ): Promise<StellarExpertAssetListItem[]> {
    const { sort = "rating", order = "desc", limit = 20 } = options;
    try {
      const response = await this.fetch<{ _embedded: { records: StellarExpertAssetListItem[] } }>(
        `/asset?sort=${sort}&order=${order}&limit=${limit}`
      );
      return response._embedded?.records || [];
    } catch {
      return [];
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<StellarExpertNetworkStats | null> {
    try {
      return await this.fetch<StellarExpertNetworkStats>(`/ledger/stats`);
    } catch {
      return null;
    }
  }

  /**
   * Get contract information (verification status)
   */
  async getContract(contractId: string): Promise<StellarExpertContract | null> {
    try {
      return await this.fetch<StellarExpertContract>(`/contract/${contractId}`);
    } catch {
      return null;
    }
  }

  /**
   * Check if a contract is verified
   */
  async isContractVerified(contractId: string): Promise<{
    isVerified: boolean;
    repository?: string;
    wasmHash?: string;
  }> {
    const contract = await this.getContract(contractId);
    return {
      isVerified: contract?.verified === true,
      repository: contract?.repository,
      wasmHash: contract?.wasm_hash,
    };
  }
}

// Factory function to get client for a specific network
export function getStellarExpertClient(network: NetworkKey): StellarExpertClient {
  return new StellarExpertClient(network);
}

// Direct export for simpler usage
export const stellarExpert = {
  getClient: getStellarExpertClient,
};
