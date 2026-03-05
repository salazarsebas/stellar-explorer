import { HashDisplay } from "@/components/common/hash-display";
import { AssetDisplay } from "../asset-display";
import { formatTrustLineFlags } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function TrustLineFlagsRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  const { set, cleared } = formatTrustLineFlags(
    op.set_flags as number | undefined,
    op.clear_flags as number | undefined
  );

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("trustor")}:</span>
        <HashDisplay
          hash={op.trustor as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.trustor}`}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("asset")}:</span>
        <AssetDisplay
          assetType={op.asset_type as string}
          assetCode={op.asset_code as string}
          assetIssuer={op.asset_issuer as string}
        />
      </div>
      {set.length > 0 && (
        <div className="text-success">
          {t("flagsSet")}: {set.join(", ")}
        </div>
      )}
      {cleared.length > 0 && (
        <div className="text-destructive">
          {t("flagsCleared")}: {cleared.join(", ")}
        </div>
      )}
    </div>
  );
}
