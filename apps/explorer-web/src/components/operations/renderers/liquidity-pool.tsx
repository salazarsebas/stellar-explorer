import { formatNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function LiquidityPoolDepositRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div className="font-mono text-xs break-all">
        <span className="text-muted-foreground">{t("poolId")}: </span>
        {op.liquidity_pool_id as string}
      </div>
      <div>
        <span className="text-muted-foreground">{t("maxReserves")}: </span>
        <span className="font-mono">
          {formatNumber(op.max_amount_a as string)} / {formatNumber(op.max_amount_b as string)}
        </span>
      </div>
      {typeof op.shares_received === "string" && (
        <div>
          <span className="text-muted-foreground">{t("sharesReceived")}: </span>
          <span className="font-mono">{formatNumber(op.shares_received as string)}</span>
        </div>
      )}
    </div>
  );
}

export function LiquidityPoolWithdrawRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div className="font-mono text-xs break-all">
        <span className="text-muted-foreground">{t("poolId")}: </span>
        {op.liquidity_pool_id as string}
      </div>
      <div>
        <span className="text-muted-foreground">{t("shares")}: </span>
        <span className="font-mono">{formatNumber(op.amount as string)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">{t("minReserves")}: </span>
        <span className="font-mono">
          {formatNumber(op.min_amount_a as string)} / {formatNumber(op.min_amount_b as string)}
        </span>
      </div>
    </div>
  );
}
