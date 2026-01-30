"use client";

import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "@/lib/providers";
import { stellarQueries } from "@/lib/stellar";

// Hook for latest ledger
export function useLatestLedger() {
  const { network } = useNetwork();
  return useQuery(stellarQueries.latestLedger(network));
}

// Hook for a specific ledger
export function useLedger(sequence: number) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.ledger(network, sequence),
    enabled: sequence > 0,
  });
}

// Hook for ledger transactions
export function useLedgerTransactions(sequence: number, limit?: number) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.ledgerTransactions(network, sequence, limit),
    enabled: sequence > 0,
  });
}

// Hook for recent transactions
export function useRecentTransactions(limit?: number) {
  const { network } = useNetwork();
  return useQuery(stellarQueries.recentTransactions(network, limit));
}

// Hook for a specific transaction
export function useTransaction(hash: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.transaction(network, hash),
    enabled: !!hash && hash.length === 64,
  });
}

// Hook for transaction operations
export function useTransactionOperations(hash: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.transactionOperations(network, hash),
    enabled: !!hash && hash.length === 64,
  });
}

// Hook for transaction effects
export function useTransactionEffects(hash: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.transactionEffects(network, hash),
    enabled: !!hash && hash.length === 64,
  });
}

// Hook for account details
export function useAccount(id: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.account(network, id),
    enabled: !!id && id.startsWith("G") && id.length === 56,
  });
}

// Hook for account transactions
export function useAccountTransactions(id: string, cursor?: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.accountTransactions(network, id, cursor),
    enabled: !!id && id.startsWith("G") && id.length === 56,
  });
}

// Hook for account operations
export function useAccountOperations(id: string, cursor?: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.accountOperations(network, id, cursor),
    enabled: !!id && id.startsWith("G") && id.length === 56,
  });
}

// Hook for asset details
export function useAsset(code: string, issuer: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.asset(network, code, issuer),
    enabled: !!code && !!issuer,
  });
}

// Hook for fee stats
export function useFeeStats() {
  const { network } = useNetwork();
  return useQuery(stellarQueries.feeStats(network));
}

// Hook for contract info
export function useContractInfo(contractId: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.contractInfo(network, contractId),
    enabled: !!contractId && contractId.startsWith("C") && contractId.length === 56,
  });
}

// Hook for contract events
export function useContractEvents(contractId: string, startLedger?: number) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.contractEvents(network, contractId, startLedger),
    enabled: !!contractId && contractId.startsWith("C") && contractId.length === 56,
  });
}

// Hook for contract code (WASM)
export function useContractCode(contractId: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.contractCode(network, contractId),
    enabled: !!contractId && contractId.startsWith("C") && contractId.length === 56,
  });
}

// Hook for contract storage
export function useContractStorage(contractId: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.contractStorage(network, contractId),
    enabled: !!contractId && contractId.startsWith("C") && contractId.length === 56,
  });
}

// Hook for assets list with pagination
export function useAssetsList(cursor?: string) {
  const { network } = useNetwork();
  return useQuery(stellarQueries.assetsList(network, cursor));
}

// Hook for asset trade aggregations (24h volume, price change)
export function useAssetTrades(code: string, issuer: string) {
  const { network } = useNetwork();
  const isNative = code === "XLM" && issuer === "native";
  return useQuery({
    ...stellarQueries.assetTradeAggregations(network, code, issuer),
    enabled: !isNative && !!code && !!issuer,
  });
}

// Hook for asset orderbook
export function useAssetOrderbook(sellingCode: string, sellingIssuer: string) {
  const { network } = useNetwork();
  const isNative = sellingCode === "XLM" && sellingIssuer === "native";
  return useQuery({
    ...stellarQueries.assetOrderbook(network, sellingCode, sellingIssuer),
    enabled: !isNative && !!sellingCode && !!sellingIssuer,
  });
}

// Hook for top assets
export function useTopAssets() {
  const { network } = useNetwork();
  return useQuery(stellarQueries.topAssets(network));
}

// ============================================
// Stellar Expert Hooks (Enriched Data)
// ============================================

// Hook for network statistics (from Stellar Expert)
export function useNetworkStats() {
  const { network } = useNetwork();
  return useQuery(stellarQueries.networkStats(network));
}

// Hook for enriched asset data (from Stellar Expert)
export function useEnrichedAsset(code: string, issuer: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.enrichedAsset(network, code, issuer),
    enabled: !!code && !!issuer,
  });
}

// Hook for top assets from Stellar Expert (with ratings)
export function useTopAssetsExpert(options?: {
  sort?: "rating" | "trustlines" | "volume" | "trades";
  limit?: number;
}) {
  const { network } = useNetwork();
  return useQuery(stellarQueries.topAssetsExpert(network, options));
}

// Hook for contract verification status
export function useContractVerification(contractId: string) {
  const { network } = useNetwork();
  return useQuery({
    ...stellarQueries.contractVerification(network, contractId),
    enabled: !!contractId && contractId.startsWith("C") && contractId.length === 56,
  });
}
