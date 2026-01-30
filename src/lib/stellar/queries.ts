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
  assetsList: (network: NetworkKey, cursor?: string) =>
    [...stellarKeys.assets(network), "list", cursor] as const,
  assetTrades: (network: NetworkKey, code: string, issuer: string) =>
    [...stellarKeys.asset(network, code, issuer), "trades"] as const,
  assetOrderbook: (network: NetworkKey, code: string, issuer: string) =>
    [...stellarKeys.asset(network, code, issuer), "orderbook"] as const,
  topAssets: (network: NetworkKey) => [...stellarKeys.assets(network), "top"] as const,

  // Contracts (Soroban)
  contracts: (network: NetworkKey) => [...stellarKeys.network(network), "contracts"] as const,
  contract: (network: NetworkKey, id: string) => [...stellarKeys.contracts(network), id] as const,
  contractEvents: (network: NetworkKey, id: string) =>
    [...stellarKeys.contract(network, id), "events"] as const,
  contractCode: (network: NetworkKey, id: string) =>
    [...stellarKeys.contract(network, id), "code"] as const,
  contractStorage: (network: NetworkKey, id: string) =>
    [...stellarKeys.contract(network, id), "storage"] as const,

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

  // Assets list with pagination
  assetsList: (network: NetworkKey, cursor?: string, limit = 20) => ({
    queryKey: stellarKeys.assetsList(network, cursor),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      let builder = horizon.assets().order("desc").limit(limit);
      if (cursor) {
        builder = builder.cursor(cursor);
      }
      return builder.call();
    },
    staleTime: STALE_TIME,
  }),

  // Trade aggregations for an asset (24h volume)
  assetTradeAggregations: (
    network: NetworkKey,
    baseCode: string,
    baseIssuer: string,
    counterCode = "XLM",
    counterIssuer?: string
  ) => ({
    queryKey: stellarKeys.assetTrades(network, baseCode, baseIssuer),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      const { Asset } = await import("@stellar/stellar-sdk");

      const baseAsset =
        baseCode === "XLM" ? Asset.native() : new Asset(baseCode, baseIssuer);
      const counterAsset =
        counterCode === "XLM" ? Asset.native() : new Asset(counterCode, counterIssuer!);

      // Get 24h trade aggregations (1 hour resolution)
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const response = await horizon
        .tradeAggregation(baseAsset, counterAsset, oneDayAgo, now, 3600000, 0)
        .limit(24)
        .call();

      // Calculate 24h stats
      let volume24h = 0;
      let high24h = 0;
      let low24h = Infinity;
      let open24h = 0;
      let close24h = 0;

      if (response.records.length > 0) {
        open24h = parseFloat(response.records[0].open);
        close24h = parseFloat(response.records[response.records.length - 1].close);

        for (const record of response.records) {
          volume24h += parseFloat(record.base_volume);
          const recordHigh = parseFloat(record.high);
          const recordLow = parseFloat(record.low);
          if (recordHigh > high24h) high24h = recordHigh;
          if (recordLow < low24h) low24h = recordLow;
        }
      }

      const priceChange24h = open24h > 0 ? ((close24h - open24h) / open24h) * 100 : 0;

      return {
        records: response.records,
        volume24h,
        high24h: high24h === 0 ? null : high24h,
        low24h: low24h === Infinity ? null : low24h,
        open24h: open24h || null,
        close24h: close24h || null,
        priceChange24h,
        tradeCount: response.records.reduce(
          (acc, r) => acc + (typeof r.trade_count === 'string' ? parseInt(r.trade_count, 10) : r.trade_count),
          0
        ),
      };
    },
    staleTime: 60000, // 1 minute
  }),

  // Orderbook for an asset pair
  assetOrderbook: (
    network: NetworkKey,
    sellingCode: string,
    sellingIssuer: string,
    buyingCode = "XLM",
    buyingIssuer?: string
  ) => ({
    queryKey: stellarKeys.assetOrderbook(network, sellingCode, sellingIssuer),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      const { Asset } = await import("@stellar/stellar-sdk");

      const sellingAsset =
        sellingCode === "XLM" ? Asset.native() : new Asset(sellingCode, sellingIssuer);
      const buyingAsset =
        buyingCode === "XLM" ? Asset.native() : new Asset(buyingCode, buyingIssuer!);

      const response = await horizon
        .orderbook(sellingAsset, buyingAsset)
        .limit(10)
        .call();

      // Calculate spread and mid price
      const bestBid = response.bids[0] ? parseFloat(response.bids[0].price) : null;
      const bestAsk = response.asks[0] ? parseFloat(response.asks[0].price) : null;
      const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
      const spread = bestBid && bestAsk ? ((bestAsk - bestBid) / bestAsk) * 100 : null;

      return {
        bids: response.bids,
        asks: response.asks,
        bestBid,
        bestAsk,
        midPrice,
        spread,
      };
    },
    staleTime: 10000, // 10 seconds
  }),

  // Top assets - fetch popular assets and enrich with data
  topAssets: (network: NetworkKey) => ({
    queryKey: stellarKeys.topAssets(network),
    queryFn: async () => {
      const horizon = getHorizonClient(network);
      const { Asset } = await import("@stellar/stellar-sdk");

      // Known popular assets to fetch
      const popularAssets = [
        { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
        { code: "yXLM", issuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55" },
        { code: "AQUA", issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA" },
        { code: "SHX", issuer: "GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEZ6XKRCLJKFX3VZC5ZCWHQC5C" },
        { code: "EURC", issuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2" },
        { code: "BTC", issuer: "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM" },
      ];

      // Fetch asset info for each
      const assetsData = await Promise.all(
        popularAssets.map(async ({ code, issuer }) => {
          try {
            const assetResponse = await horizon.assets().forCode(code).forIssuer(issuer).call();
            const assetRecord = assetResponse.records[0];

            if (!assetRecord) return null;

            // Get 24h trade data against XLM
            const baseAsset = new Asset(code, issuer);
            const counterAsset = Asset.native();
            const now = Date.now();
            const oneDayAgo = now - 24 * 60 * 60 * 1000;

            let volume24h = 0;
            let priceChange24h = 0;
            let currentPrice = 0;

            try {
              const trades = await horizon
                .tradeAggregation(baseAsset, counterAsset, oneDayAgo, now, 86400000, 0)
                .limit(1)
                .call();

              if (trades.records.length > 0) {
                const record = trades.records[0];
                volume24h = parseFloat(record.base_volume);
                const open = parseFloat(record.open);
                const close = parseFloat(record.close);
                currentPrice = close;
                priceChange24h = open > 0 ? ((close - open) / open) * 100 : 0;
              }
            } catch {
              // Trade data not available
            }

            // Calculate total accounts (authorized + authorized_to_maintain_liabilities)
            const numAccounts =
              assetRecord.accounts.authorized +
              assetRecord.accounts.authorized_to_maintain_liabilities;

            return {
              code: assetRecord.asset_code,
              issuer: assetRecord.asset_issuer,
              assetType: assetRecord.asset_type,
              numAccounts,
              amount: parseFloat(assetRecord.balances.authorized),
              volume24h,
              priceChange24h,
              currentPrice,
              flags: assetRecord.flags,
            };
          } catch {
            return null;
          }
        })
      );

      // Filter out null values and sort by num_accounts
      return assetsData.filter(Boolean).sort((a, b) => b!.numAccounts - a!.numAccounts);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  contractStorage: (network: NetworkKey, contractId: string) => ({
    queryKey: stellarKeys.contractStorage(network, contractId),
    queryFn: async () => {
      const rpc = getRpcClient(network);
      const { Contract, xdr, scValToNative } = await import("@stellar/stellar-sdk");

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

      const instanceEntry = instanceResponse.entries[0];
      const contractData = instanceEntry.val.contractData();
      const contractInstance = contractData.val().instance();

      // Helper to decode ScVal to readable format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decodeScVal = (val: any): { type: string; value: unknown; raw: string } => {
        const type = val.switch().name;
        let value: unknown;
        const raw = val.toXDR("base64");

        try {
          value = scValToNative(val);
        } catch {
          // If native conversion fails, try to get a string representation
          value = raw;
        }

        return { type, value, raw };
      };

      // Extract instance storage
      const instanceStorage: Array<{
        key: { type: string; value: unknown; raw: string };
        value: { type: string; value: unknown; raw: string };
        durability: "instance";
      }> = [];

      const storage = contractInstance.storage();
      if (storage && storage.length > 0) {
        for (const entry of storage) {
          instanceStorage.push({
            key: decodeScVal(entry.key()),
            value: decodeScVal(entry.val()),
            durability: "instance",
          });
        }
      }

      // Get live until ledger (TTL info)
      const liveUntilLedger = instanceEntry.liveUntilLedgerSeq;

      // Get latest ledger for TTL calculation
      const latestLedger = await rpc.getLatestLedger();

      return {
        instanceStorage,
        totalEntries: instanceStorage.length,
        liveUntilLedger,
        currentLedger: latestLedger.sequence,
        ttlLedgers: liveUntilLedger ? liveUntilLedger - latestLedger.sequence : null,
      };
    },
    staleTime: STALE_TIME,
  }),
};
