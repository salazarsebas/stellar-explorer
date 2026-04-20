import { HashDisplay } from "@/components/common/hash-display";
import { formatNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function CreateAccountRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("newAccount")}</span>
        <HashDisplay hash={op.account as string} truncate linkTo={`/account/${op.account}`} />
      </div>
      <div className="text-foreground font-mono">
        {t("startingBalance", { amount: formatNumber(op.starting_balance as string) })}
      </div>
      {typeof op.funder === "string" && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("funder")}</span>
          <HashDisplay
            hash={op.funder as string}
            truncate
            startLength={6}
            endLength={4}
            linkTo={`/account/${op.funder}`}
          />
        </div>
      )}
    </div>
  );
}
