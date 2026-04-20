import { HashDisplay } from "@/components/common/hash-display";
import { AssetDisplay } from "../asset-display";
import { useTranslations } from "next-intl";

export function ClawbackRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-destructive">{t("clawedBack")}</span>{" "}
        <AssetDisplay
          amount={op.amount as string}
          assetType={op.asset_type as string}
          assetCode={op.asset_code as string}
          assetIssuer={op.asset_issuer as string}
        />
      </div>
      {typeof op.from === "string" && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("from")}:</span>
          <HashDisplay
            hash={op.from as string}
            truncate
            startLength={6}
            endLength={4}
            linkTo={`/account/${op.from}`}
          />
        </div>
      )}
    </div>
  );
}

export function ClawbackClaimableBalanceRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div className="text-destructive">{t("clawedBackBalance")}</div>
      <div className="font-mono text-xs break-all">{op.balance_id as string}</div>
    </div>
  );
}
