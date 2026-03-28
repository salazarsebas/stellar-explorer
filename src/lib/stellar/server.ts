import { cache } from "react";
import type { Horizon } from "@stellar/stellar-sdk";
import { getHorizonClient } from "@/lib/stellar/client";
import { POPULAR_ASSETS } from "@/lib/constants";
import type { NetworkKey } from "@/types";
import { getRpcClient } from "./client";

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

export const getContractCodeSnapshot = cache(async (network: NetworkKey, contractId: string) => {
  const { Contract, xdr } = await import("@stellar/stellar-sdk");

  const contract = new Contract(contractId);
  const contractInstanceKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: contract.address().toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );

  const rpc = getRpcClient(network);
  const instanceResponse = await rpc.getLedgerEntries(contractInstanceKey);

  if (!instanceResponse.entries || instanceResponse.entries.length === 0) {
    return null;
  }

  const instanceEntry = instanceResponse.entries[0];
  const contractData = instanceEntry.val.contractData();
  const contractInstance = contractData.val().instance();
  const executable = contractInstance.executable();

  if (executable.switch().name !== "contractExecutableWasm") {
    return {
      type: "sac" as const,
      codeSize: 0,
    };
  }

  const wasmHash = executable.wasmHash();
  const wasmCodeKey = xdr.LedgerKey.contractCode(new xdr.LedgerKeyContractCode({ hash: wasmHash }));
  const codeResponse = await rpc.getLedgerEntries(wasmCodeKey);

  if (!codeResponse.entries || codeResponse.entries.length === 0) {
    return null;
  }

  const codeEntry = codeResponse.entries[0];
  const contractCode = codeEntry.val.contractCode();

  return {
    type: "wasm" as const,
    codeSize: contractCode.code().length,
  };
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
