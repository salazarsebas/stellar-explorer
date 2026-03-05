import { AssetDisplay } from "../asset-display";
import { formatNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ManageOfferRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  const isBuy = op.type === "manage_buy_offer";
  const isPassive = op.type === "create_passive_sell_offer";
  const amount = op.amount as string;
  const price = op.price as string;
  const offerId = op.offer_id as string;

  const isDelete = amount === "0" && !isPassive;

  if (isDelete) {
    return (
      <div className="space-y-2 text-sm">
        <div className="text-foreground">{t("cancelOffer", { id: offerId })}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-muted-foreground">
          {isPassive ? t("passiveSelling") : isBuy ? t("buying") : t("selling")}:{" "}
        </span>
        {isBuy ? (
          <AssetDisplay
            amount={amount}
            assetType={op.buying_asset_type as string}
            assetCode={op.buying_asset_code as string}
            assetIssuer={op.buying_asset_issuer as string}
          />
        ) : (
          <AssetDisplay
            amount={amount}
            assetType={op.selling_asset_type as string}
            assetCode={op.selling_asset_code as string}
            assetIssuer={op.selling_asset_issuer as string}
          />
        )}
      </div>
      <div>
        <span className="text-muted-foreground">{t("atPrice")}: </span>
        <span className="font-mono">{formatNumber(price)}</span>{" "}
        {isBuy ? (
          <AssetDisplay
            assetType={op.selling_asset_type as string}
            assetCode={op.selling_asset_code as string}
          />
        ) : (
          <AssetDisplay
            assetType={op.buying_asset_type as string}
            assetCode={op.buying_asset_code as string}
          />
        )}
        <span className="text-muted-foreground">/{t("unit")}</span>
      </div>
      {offerId && offerId !== "0" && (
        <div className="text-muted-foreground text-xs">
          {t("offerId")}: {offerId}
        </div>
      )}
    </div>
  );
}
