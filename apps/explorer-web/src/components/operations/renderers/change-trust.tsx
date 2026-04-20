import { AssetDisplay } from "../asset-display";
import { formatNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ChangeTrustRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  const limit = op.limit as string | undefined;
  const isRemoval = limit === "0";
  const isMaxLimit = limit === "922337203685.4775807";

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          {isRemoval ? t("removedTrustline") : t("trustlineFor")}
        </span>
        <AssetDisplay
          assetType={op.asset_type as string}
          assetCode={op.asset_code as string}
          assetIssuer={op.asset_issuer as string}
        />
      </div>
      {!isRemoval && limit && (
        <div className="text-muted-foreground">
          {t("limitLabel")}: {isMaxLimit ? t("max") : formatNumber(limit)}
        </div>
      )}
    </div>
  );
}

export function AllowTrustRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  const authorize = op.authorize as boolean;

  return (
    <div className="space-y-2 text-sm">
      <div>
        {authorize ? t("authorized") : t("deauthorized")}{" "}
        <span className="font-medium">{op.asset_code as string}</span> {t("forTrustor")}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("trustor")}:</span>
        <span className="font-medium">
          {typeof op.trustor === "string" && (
            <span className="font-mono text-xs">
              {(op.trustor as string).slice(0, 10)}...{(op.trustor as string).slice(-4)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
