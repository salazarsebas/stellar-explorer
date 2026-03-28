import type { Horizon } from "@stellar/stellar-sdk";
import {
  formatCompactNumber,
  formatLedgerSequence,
  formatNumber,
  stroopsToXLM,
  truncateHash,
} from "@/lib/utils";

type AssetRecordExtended = Horizon.ServerApi.AssetRecord & {
  amount?: string;
  num_accounts?: number;
};

export function buildTransactionMetadataCopy(
  hash: string,
  transaction?: Horizon.ServerApi.TransactionRecord | null
) {
  const shortHash = truncateHash(hash, 8, 8);

  if (!transaction) {
    return {
      title: `Transaction ${shortHash}`,
      description: `View details of Stellar transaction ${shortHash}. Explore operations, effects, and raw XDR data.`,
    };
  }

  const status = transaction.successful ? "Successful" : "Failed";
  const ledger = formatLedgerSequence(transaction.ledger_attr);
  const fee = stroopsToXLM(transaction.fee_charged);

  return {
    title: `${status} Transaction ${shortHash}`,
    description: `${status} Stellar transaction ${shortHash} closed in ledger #${ledger} with ${transaction.operation_count} operations and ${fee} XLM in fees.`,
  };
}

export function buildAccountMetadataCopy(
  id: string,
  account?: Horizon.ServerApi.AccountRecord | null
) {
  const shortId = truncateHash(id, 6, 6);

  if (!account) {
    return {
      title: `Account ${shortId}`,
      description: `View Stellar account ${shortId}. Explore balances, transactions, operations, and signers.`,
    };
  }

  const xlmBalance = account.balances.find((balance) => balance.asset_type === "native");
  const assetCount = account.balances.filter((balance) => balance.asset_type !== "native").length;

  return {
    title: `Account ${shortId} | ${formatNumber(xlmBalance?.balance ?? 0)} XLM`,
    description: `Inspect Stellar account ${shortId} with ${formatNumber(xlmBalance?.balance ?? 0)} XLM, ${assetCount} non-native assets, and ${account.signers.length} signers.`,
  };
}

export function buildLedgerMetadataCopy(
  sequence: number,
  ledger?: Horizon.ServerApi.LedgerRecord | null
) {
  const formattedSequence = formatLedgerSequence(sequence);

  if (!ledger) {
    return {
      title: `Ledger #${formattedSequence}`,
      description: `View details of Stellar ledger #${formattedSequence}. Explore transactions, operations, and protocol information.`,
    };
  }

  const totalTransactions = ledger.successful_transaction_count + ledger.failed_transaction_count;

  return {
    title: `Ledger #${formattedSequence} | ${formatCompactNumber(totalTransactions)} txs`,
    description: `Review Stellar ledger #${formattedSequence}, which closed with ${ledger.successful_transaction_count} successful transactions, ${ledger.failed_transaction_count} failed transactions, and ${ledger.operation_count} operations.`,
  };
}

export function buildAssetMetadataCopy(
  code: string,
  issuer: string,
  asset?: AssetRecordExtended | null
) {
  const isNative = issuer === "native";

  if (isNative) {
    return {
      title: "XLM - Stellar Lumens",
      description: "XLM (Stellar Lumens) is the native asset of the Stellar network.",
    };
  }

  const shortIssuer = truncateHash(issuer, 4, 4);

  if (!asset) {
    return {
      title: `${code} Asset`,
      description: `View details of ${code} asset on Stellar. Issuer: ${shortIssuer}. Explore supply, holders, and flags.`,
    };
  }

  return {
    title: `${code} Asset | ${formatCompactNumber(asset.num_accounts ?? 0)} holders`,
    description: `Explore ${code} on Stellar with ${formatCompactNumber(asset.num_accounts ?? 0)} holding accounts, ${formatCompactNumber(asset.amount ?? 0)} estimated supply, and issuer ${shortIssuer}.`,
  };
}

export function buildContractMetadataCopy(
  id: string,
  contractCode?: { type: "sac" | "wasm"; codeSize: number } | null
) {
  const shortId = truncateHash(id, 6, 6);

  if (!contractCode) {
    return {
      title: `Contract ${shortId}`,
      description: `View Soroban smart contract ${shortId}. Explore events, storage, and contract code on Stellar.`,
    };
  }

  if (contractCode.type === "sac") {
    return {
      title: `Contract ${shortId} | Stellar Asset Contract`,
      description: `Inspect Stellar Asset Contract ${shortId}. Review standard token activity, storage, and recent transactions on Stellar.`,
    };
  }

  return {
    title: `Contract ${shortId} | Custom Soroban WASM`,
    description: `Inspect Soroban contract ${shortId} with custom WASM bytecode (${formatCompactNumber(contractCode.codeSize)} bytes), storage, events, and recent transaction activity.`,
  };
}
