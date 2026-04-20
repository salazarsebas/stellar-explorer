import { truncateHash, formatNumber, parseSorobanFunctionType } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface OperationSummaryProps {
  operation: Record<string, unknown> & { type: string };
}

function getAssetLabel(op: Record<string, unknown>, prefix = ""): string {
  const typeKey = prefix ? `${prefix}asset_type` : "asset_type";
  const codeKey = prefix ? `${prefix}asset_code` : "asset_code";
  return (op[typeKey] as string) === "native" ? "XLM" : (op[codeKey] as string) || "?";
}

export function OperationSummary({ operation: op }: OperationSummaryProps) {
  const t = useTranslations("operations");

  const summary = getSummaryText(op, t);
  if (!summary) return null;

  return <div className="text-muted-foreground mb-1 text-xs">{summary}</div>;
}

function getSummaryText(
  op: Record<string, unknown>,
  t: ReturnType<typeof useTranslations<"operations">>
): string | null {
  switch (op.type as string) {
    case "payment":
      return t("summaryPayment", {
        from: truncateHash(op.from as string, 4, 4),
        to: truncateHash(op.to as string, 4, 4),
        amount: formatNumber(op.amount as string),
        asset: getAssetLabel(op),
      });

    case "create_account":
      return t("summaryCreateAccount", {
        account: truncateHash(op.account as string, 4, 4),
        amount: formatNumber(op.starting_balance as string),
      });

    case "path_payment_strict_receive":
    case "path_payment_strict_send":
      return t("summaryPathPayment", {
        from: truncateHash(op.from as string, 4, 4),
        to: truncateHash(op.to as string, 4, 4),
        sourceAsset: getAssetLabel(op, "source_"),
        destAsset: getAssetLabel(op),
      });

    case "manage_sell_offer":
    case "create_passive_sell_offer":
      if ((op.amount as string) === "0") return t("summaryCancelOffer");
      return t("summarySellOffer", {
        amount: formatNumber(op.amount as string),
        selling: getAssetLabel(op, "selling_"),
        price: formatNumber(op.price as string),
        buying: getAssetLabel(op, "buying_"),
      });

    case "manage_buy_offer":
      if ((op.amount as string) === "0") return t("summaryCancelOffer");
      return t("summaryBuyOffer", {
        amount: formatNumber(op.amount as string),
        buying: getAssetLabel(op, "buying_"),
        price: formatNumber(op.price as string),
        selling: getAssetLabel(op, "selling_"),
      });

    case "change_trust":
      if ((op.limit as string) === "0")
        return t("summaryRemoveTrust", { asset: getAssetLabel(op) });
      return t("summaryChangeTrust", { asset: getAssetLabel(op) });

    case "allow_trust":
      return t("summaryAllowTrust", {
        asset: op.asset_code as string,
        authorized: op.authorize ? t("authorized") : t("deauthorized"),
      });

    case "account_merge":
      return t("summaryAccountMerge", {
        account: truncateHash(op.account as string, 4, 4),
        into: truncateHash(op.into as string, 4, 4),
      });

    case "manage_data":
      return op.value
        ? t("summarySetData", { key: op.name as string })
        : t("summaryDeleteData", { key: op.name as string });

    case "bump_sequence":
      return t("summaryBumpSequence", { to: op.bump_to as string });

    case "set_options":
      return t("summarySetOptions");

    case "create_claimable_balance":
      return t("summaryCreateClaimable", {
        amount: formatNumber(op.amount as string),
        asset: getAssetLabel(op),
      });

    case "claim_claimable_balance":
      return t("summaryClaimBalance");

    case "begin_sponsoring_future_reserves":
      return t("summaryBeginSponsoring", {
        account: truncateHash(op.sponsored_id as string, 4, 4),
      });

    case "end_sponsoring_future_reserves":
      return t("summaryEndSponsoring");

    case "revoke_sponsorship":
      return t("summaryRevokeSponsorship");

    case "clawback":
      return t("summaryClawback", {
        amount: formatNumber(op.amount as string),
        asset: getAssetLabel(op),
      });

    case "clawback_claimable_balance":
      return t("summaryClawbackBalance");

    case "set_trust_line_flags":
      return t("summarySetTrustLineFlags", { asset: getAssetLabel(op) });

    case "liquidity_pool_deposit":
      return t("summaryLpDeposit");

    case "liquidity_pool_withdraw":
      return t("summaryLpWithdraw");

    case "invoke_host_function": {
      const { displayName } = parseSorobanFunctionType(op.function as string);
      return t("summarySoroban", { type: displayName });
    }

    case "extend_footprint_ttl":
      return t("summaryExtendTtl");

    case "restore_footprint":
      return t("summaryRestoreFootprint");

    case "inflation":
      return t("summaryInflation");

    default:
      return null;
  }
}
