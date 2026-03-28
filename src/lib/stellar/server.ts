import { cache } from "react";
import type { Horizon } from "@stellar/stellar-sdk";
import { getHorizonClient } from "@/lib/stellar/client";
import { POPULAR_ASSETS } from "@/lib/constants";
import type { NetworkKey } from "@/types";

export const getLatestLedgerSnapshot = cache(async (network: NetworkKey) => {
  const horizon = getHorizonClient(network);
  const response = await horizon.ledgers().order("desc").limit(1).call();
  return response.records[0] ?? null;
});

export const getRecentTransactionsSnapshot = cache(async (network: NetworkKey, limit = 5) => {
  const horizon = getHorizonClient(network);
  const response = await horizon.transactions().order("desc").limit(limit).call();
  return response.records;
});

export const getFeeStatsSnapshot = cache(async (network: NetworkKey) => {
  const horizon = getHorizonClient(network);
  return horizon.feeStats();
});

export const getTransactionSnapshot = cache(async (network: NetworkKey, hash: string) => {
  const horizon = getHorizonClient(network);
  return horizon.transactions().transaction(hash).call();
});

export const getAccountSnapshot = cache(async (network: NetworkKey, id: string) => {
  const horizon = getHorizonClient(network);
  return horizon.accounts().accountId(id).call();
});

export const getLedgerSnapshot = cache(async (network: NetworkKey, sequence: number) => {
  const horizon = getHorizonClient(network);
  const response = await horizon.ledgers().ledger(sequence).call();
  return response as unknown as Horizon.ServerApi.LedgerRecord;
});

export const getAssetSnapshot = cache(async (network: NetworkKey, code: string, issuer: string) => {
  const horizon = getHorizonClient(network);
  const response = await horizon.assets().forCode(code).forIssuer(issuer).call();
  return response.records[0] ?? null;
});

export const getTopAssetSnapshots = cache(async (network: NetworkKey) => {
  const assets = await Promise.all(
    POPULAR_ASSETS.map(async (asset) => {
      try {
        return await getAssetSnapshot(network, asset.code, asset.issuer);
      } catch {
        return null;
      }
    })
  );

  return assets.filter((asset): asset is NonNullable<typeof asset> => asset !== null);
});
