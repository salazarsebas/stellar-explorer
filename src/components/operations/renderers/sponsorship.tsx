import { HashDisplay } from "@/components/common/hash-display";
import { useTranslations } from "next-intl";

export function BeginSponsoringRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div>{t("beginSponsoring")}</div>
      <HashDisplay
        hash={op.sponsored_id as string}
        truncate
        startLength={6}
        endLength={4}
        linkTo={`/account/${op.sponsored_id}`}
      />
    </div>
  );
}

export function EndSponsoringRenderer({}: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  return (
    <div className="text-sm">
      <span>{t("endSponsoring")}</span>
    </div>
  );
}

export function RevokeSponsorshipRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div>{t("revokedSponsorship")}</div>
      {typeof op.account_id === "string" && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("account")}:</span>
          <HashDisplay
            hash={op.account_id as string}
            truncate
            startLength={6}
            endLength={4}
            linkTo={`/account/${op.account_id}`}
          />
        </div>
      )}
    </div>
  );
}
