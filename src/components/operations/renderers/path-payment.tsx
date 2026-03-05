import { HashDisplay } from "@/components/common/hash-display";
import { AssetDisplay } from "../asset-display";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function PathPaymentRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  const isStrictSend = op.type === "path_payment_strict_send";

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <HashDisplay
          hash={op.from as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.from}`}
        />
        <ArrowRight className="text-muted-foreground size-4" />
        <HashDisplay
          hash={op.to as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.to}`}
        />
      </div>
      <div className="space-y-1">
        <div>
          <span className="text-muted-foreground">{isStrictSend ? t("sent") : t("sentMax")}: </span>
          <AssetDisplay
            amount={isStrictSend ? (op.source_amount as string) : (op.source_max as string)}
            assetType={op.source_asset_type as string}
            assetCode={op.source_asset_code as string}
            assetIssuer={op.source_asset_issuer as string}
          />
        </div>
        <div>
          <span className="text-muted-foreground">
            {isStrictSend ? t("receivedMin") : t("received")}:{" "}
          </span>
          <AssetDisplay
            amount={isStrictSend ? (op.destination_min as string) : (op.amount as string)}
            assetType={op.asset_type as string}
            assetCode={op.asset_code as string}
            assetIssuer={op.asset_issuer as string}
          />
        </div>
      </div>
      {Array.isArray(op.path) && (op.path as unknown[]).length > 0 && (
        <div className="text-muted-foreground text-xs">
          {t("pathThrough", { count: (op.path as unknown[]).length })}
        </div>
      )}
    </div>
  );
}
