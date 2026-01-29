import type { NetworkKey } from "@/types";
import type { Horizon } from "@stellar/stellar-sdk";
import { getHorizonClient, getRpcClient } from "./client";
import { LIVE_LEDGER_POLL_INTERVAL, DEFAULT_PAGE_SIZE, STALE_TIME } from "@/lib/constants";

// Query key factory for consistent cache keys
export const stellarKeys = {
  all: ["stellar"] as const,
  network: (network: NetworkKey) => [...stellarKeys.all, network] as const,

  // Ledgers
  ledgers: (network: NetworkKey) => [...stellarKeys.network(network), "ledgers"] as const,
  ledger: (network: NetworkKey, sequence: number) =>
    [...stellarKeys.ledgers(network), sequence] as const,
  latestLedger: (network: NetworkKey) => [...stellarKeys.ledgers(network), "latest"] as const,

  // Transactions
  transactions: (network: NetworkKey) => [...stellarKeys.network(network), "transactions"] as const,
  transaction: (network: NetworkKey, hash: string) =>
    [...stellarKeys.transactions(network), hash] as const,
  transactionOperations: (network: NetworkKey, hash: string) =>
    [...stellarKeys.transaction(network, hash), "operations"] as const,
  transactionEffects: (network: NetworkKey, hash: string) =>
    [...stellarKeys.transaction(network, hash), "effects"] as const,
  recentTransactions: (network: NetworkKey, limit?: number) =>
    [...stellarKeys.transactions(network), "recent", limit] as const,

  // Accounts
  accounts: (network: NetworkKey) => [...stellarKeys.network(network), "accounts"] as const,
  account: (network: NetworkKey, id: string) => [...stellarKeys.accounts(network), id] as const,
  accountTransactions: (network: NetworkKey, id: string, cursor?: string) =>
    [...stellarKeys.account(network, id), "transactions", cursor] as const,
  accountOperations: (network: NetworkKey, id: string, cursor?: string) =>
    [...stellarKeys.account(network, id), "operations", cursor] as const,
  accountEffects: (network: NetworkKey, id: string, cursor?: string) =>
    [...stellarKeys.account(network, id), "effects", cursor] as const,

  // Assets
  assets: (network: NetworkKey) => [...stellarKeys.network(network), "assets"] as const,
  asset: (network: NetworkKey, code: string, issuer: string) =>
    [...stellarKeys.assets(network), code, issuer] as const,

  // Contracts (Soroban)
  contracts: (network: NetworkKey) => [...stellarKeys.network(network), "contracts"] as const,
  contract: (network: NetworkKey, id: string) => [...stellarKeys.contracts(network), id] as const,
  contractEvents: (network: NetworkKey, id: string) =>
    [...stellarKeys.contract(network, id), "events"] as const,
  contractCode: (network: NetworkKey, id: string) =>
    [...stellarKeys.contract(network, id), "code"] as const,

  // Fee stats
  feeStats: (network: NetworkKey) => [...stellarKeys.network(network), "feeStats"] as const,
};

// Query option factories for TanStack Query
export const stellarQueries = {
  // Ledgers
  latestLedger: (network: NetworkKey) => ({
    queryKey: stellarKeys.latestLedger(network),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      const response = await horizon.ledgers().order("desc").limit(1).call();
      return response.records[0];
    },
    refetchInterval: LIVE_LEDGER_POLL_INTERVAL,
    staleTime: 0,
  }),

  ledger: (network: NetworkKey, sequence: number) => ({
    queryKey: stellarKeys.ledger(network, sequence),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      // Get a specific ledger by fetching from the sequence
      const response = await horizon.ledgers().ledger(sequence).call();
      // The call returns the ledger record directly
      return response as unknown as Horizon.ServerApi.LedgerRecord;
    },
    staleTime: Infinity, // Ledgers are immutable
  }),

  ledgerTransactions: (network: NetworkKey, sequence: number, limit = DEFAULT_PAGE_SIZE) => ({
    queryKey: [...stellarKeys.ledger(network, sequence), "transactions"],
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      return horizon.transactions().forLedger(sequence).limit(limit).order("desc").call();
    },
    staleTime: Infinity,
  }),

  // Transactions
  recentTransactions: (network: NetworkKey, limit = 10) => ({
    queryKey: stellarKeys.recentTransactions(network, limit),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      return horizon.transactions().order("desc").limit(limit).call();
    },
    refetchInterval: LIVE_LEDGER_POLL_INTERVAL,
    staleTime: STALE_TIME,
  }),

  transaction: (network: NetworkKey, hash: string) => ({
    queryKey: stellarKeys.transaction(network, hash),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      return horizon.transactions().transaction(hash).call();
    },
    staleTime: Infinity, // Transactions are immutable
  }),

  transactionOperations: (network: NetworkKey, hash: string) => ({
    queryKey: stellarKeys.transactionOperations(network, hash),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      return horizon.operations().forTransaction(hash).limit(200).call();
    },
    staleTime: Infinity,
  }),

  transactionEffects: (network: NetworkKey, hash: string) => ({
    queryKey: stellarKeys.transactionEffects(network, hash),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      return horizon.effects().forTransaction(hash).limit(200).call();
    },
    staleTime: Infinity,
  }),

  // Accounts
  account: (network: NetworkKey, id: string) => ({
    queryKey: stellarKeys.account(network, id),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      return horizon.accounts().accountId(id).call();
    },
    staleTime: STALE_TIME,
  }),

  accountTransactions: (
    network: NetworkKey,
    id: string,
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE
  ) => ({
    queryKey: stellarKeys.accountTransactions(network, id, cursor),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      let builder = horizon.transactions().forAccount(id).order("desc").limit(limit);
      if (cursor) {
        builder = builder.cursor(cursor);
      }
      return builder.call();
    },
    staleTime: STALE_TIME,
  }),

  accountOperations: (
    network: NetworkKey,
    id: string,
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE
  ) => ({
    queryKey: stellarKeys.accountOperations(network, id, cursor),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      let builder = horizon.operations().forAccount(id).order("desc").limit(limit);
      if (cursor) {
        builder = builder.cursor(cursor);
      }
      return builder.call();
    },
    staleTime: STALE_TIME,
  }),

  // Assets
  asset: (network: NetworkKey, code: string, issuer: string) => ({
    queryKey: stellarKeys.asset(network, code, issuer),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      const response = await horizon.assets().forCode(code).forIssuer(issuer).call();
      return response.records[0];
    },
    staleTime: STALE_TIME,
  }),

  assetAccounts: (
    network: NetworkKey,
    code: string,
    issuer: string,
    limit = DEFAULT_PAGE_SIZE
  ) => ({
    queryKey: [...stellarKeys.asset(network, code, issuer), "accounts"],
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      const { Asset } = await import("@stellar/stellar-sdk");
      // Get accounts that hold this asset
      const asset = code === "XLM" ? Asset.native() : new Asset(code, issuer);
      return horizon.accounts().forAsset(asset).limit(limit).call();
    },
    staleTime: STALE_TIME,
  }),

  // Fee stats
  feeStats: (network: NetworkKey) => ({
    queryKey: stellarKeys.feeStats(network),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      return horizon.feeStats();
    },
    refetchInterval: LIVE_LEDGER_POLL_INTERVAL,
    staleTime: STALE_TIME,
  }),

  // Soroban contract data
  contractInfo: (network: NetworkKey, contractId: string) => ({
    queryKey: stellarKeys.contract(network, contractId),
    queryFn: async () => {
      const rpc = getRpcClient(network);
      const { Contract } = await import("@stellar/stellar-sdk");
      const contract = new Contract(contractId);

      // Get ledger entries for the contract
      const ledgerKey = contract.getFootprint();
      const response = await rpc.getLedgerEntries(ledgerKey);

      return response.entries;
    },
    staleTime: STALE_TIME,
  }),

  contractEvents: (network: NetworkKey, contractId: string, startLedger?: number) => ({
    queryKey: stellarKeys.contractEvents(network, contractId),
    queryFn: async () => {
      const rpc = getRpcClient(network);

      // Get latest ledger if startLedger not provided
      let ledger = startLedger;
      if (!ledger) {
        const latestLedger = await rpc.getLatestLedger();
        ledger = latestLedger.sequence - 1000; // Last ~1000 ledgers
      }

      return rpc.getEvents({
        startLedger: ledger,
        filters: [
          {
            type: "contract",
            contractIds: [contractId],
          },
        ],
        limit: 100,
      });
    },
    staleTime: STALE_TIME,
  }),

  contractCode: (network: NetworkKey, contractId: string) => ({
    queryKey: stellarKeys.contractCode(network, contractId),
    queryFn: async () => {
      const rpc = getRpcClient(network);
      const { Contract, xdr } = await import("@stellar/stellar-sdk");

      // Create contract instance
      const contract = new Contract(contractId);

      // Get the contract instance ledger entry
      const contractInstanceKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: contract.address().toScAddress(),
          key: xdr.ScVal.scvLedgerKeyContractInstance(),
          durability: xdr.ContractDataDurability.persistent(),
        })
      );

      const instanceResponse = await rpc.getLedgerEntries(contractInstanceKey);

      if (!instanceResponse.entries || instanceResponse.entries.length === 0) {
        throw new Error("Contract instance not found");
      }

      // Extract the WASM hash from the contract instance
      const instanceEntry = instanceResponse.entries[0];
      const contractData = instanceEntry.val.contractData();
      const contractInstance = contractData.val().instance();
      const executable = contractInstance.executable();

      // Check if it's a WASM contract (not a Stellar Asset Contract)
      if (executable.switch().name !== "contractExecutableWasm") {
        return {
          type: "sac" as const,
          wasmHash: null,
          wasmCode: null,
          wasmCodeHex: null,
          codeSize: 0,
        };
      }

      const wasmHash = executable.wasmHash();
      const wasmHashHex = wasmHash.toString("hex");

      // Now get the WASM code using the hash
      const wasmCodeKey = xdr.LedgerKey.contractCode(
        new xdr.LedgerKeyContractCode({
          hash: wasmHash,
        })
      );

      const codeResponse = await rpc.getLedgerEntries(wasmCodeKey);

      if (!codeResponse.entries || codeResponse.entries.length === 0) {
        throw new Error("Contract WASM code not found");
      }

      const codeEntry = codeResponse.entries[0];
      const contractCode = codeEntry.val.contractCode();
      const wasmCode = contractCode.code();
      const wasmCodeHex = wasmCode.toString("hex");

      return {
        type: "wasm" as const,
        wasmHash: wasmHashHex,
        wasmCode: wasmCode,
        wasmCodeHex: wasmCodeHex,
        codeSize: wasmCode.length,
      };
    },
    staleTime: Infinity, // Contract code is immutable
  }),
};
