import { HashDisplay } from "@/components/common/hash-display";
import { AssetDisplay } from "../asset-display";
import { useTranslations } from "next-intl";

export function CreateClaimableBalanceRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const t = useTranslations("operations");
  const claimants = op.claimants as Array<{ destination: string }> | undefined;

  return (
    <div className="space-y-2 text-sm">
      <div>
        <AssetDisplay
          amount={op.amount as string}
          assetType={op.asset_type as string}
          assetCode={op.asset_code as string}
          assetIssuer={op.asset_issuer as string}
        />
      </div>
      {claimants && claimants.length > 0 && (
        <div>
          <span className="text-muted-foreground">{t("claimants")}:</span>
          <div className="mt-1 space-y-1">
            {claimants.map((c, i) => (
              <div key={i}>
                <HashDisplay
                  hash={c.destination}
                  truncate
                  startLength={6}
                  endLength={4}
                  linkTo={`/account/${c.destination}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ClaimClaimableBalanceRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-muted-foreground">{t("claimedBalance")}</span>
      </div>
      <div className="font-mono text-xs break-all">{op.balance_id as string}</div>
      {typeof op.claimant === "string" && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("claimant")}:</span>
          <HashDisplay
            hash={op.claimant as string}
            truncate
            startLength={6}
            endLength={4}
            linkTo={`/account/${op.claimant}`}
          />
        </div>
      )}
    </div>
  );
}
