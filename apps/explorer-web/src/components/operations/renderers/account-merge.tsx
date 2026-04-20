import { HashDisplay } from "@/components/common/hash-display";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function AccountMergeRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div>{t("mergedAccount")}</div>
      <div className="flex items-center gap-2">
        <HashDisplay
          hash={op.account as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.account}`}
        />
        <ArrowRight className="text-muted-foreground size-4" />
        <HashDisplay
          hash={op.into as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.into}`}
        />
      </div>
    </div>
  );
}
