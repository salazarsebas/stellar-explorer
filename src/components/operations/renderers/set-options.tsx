import { HashDisplay } from "@/components/common/hash-display";
import { useTranslations } from "next-intl";

export function SetOptionsRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  const changes: { label: string; value: React.ReactNode }[] = [];

  if (op.home_domain !== undefined) {
    changes.push({
      label: t("homeDomain"),
      value: (op.home_domain as string) || t("cleared"),
    });
  }
  if (op.inflation_dest) {
    changes.push({
      label: t("inflationDest"),
      value: (
        <HashDisplay
          hash={op.inflation_dest as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.inflation_dest}`}
        />
      ),
    });
  }
  if (op.signer_key) {
    const weight = op.signer_weight as number;
    changes.push({
      label: weight === 0 ? t("removedSigner") : t("addedSigner"),
      value: (
        <span className="inline-flex items-center gap-2">
          <HashDisplay hash={op.signer_key as string} truncate startLength={6} endLength={4} />
          {weight > 0 && (
            <span className="text-muted-foreground">
              ({t("weight")}: {weight})
            </span>
          )}
        </span>
      ),
    });
  }
  if (
    op.low_threshold !== undefined ||
    op.med_threshold !== undefined ||
    op.high_threshold !== undefined
  ) {
    changes.push({
      label: t("thresholds"),
      value: `L:${op.low_threshold ?? "-"} M:${op.med_threshold ?? "-"} H:${op.high_threshold ?? "-"}`,
    });
  }
  if (op.set_flags_s || op.clear_flags_s) {
    if (Array.isArray(op.set_flags_s)) {
      changes.push({ label: t("flagsSet"), value: (op.set_flags_s as string[]).join(", ") });
    }
    if (Array.isArray(op.clear_flags_s)) {
      changes.push({ label: t("flagsCleared"), value: (op.clear_flags_s as string[]).join(", ") });
    }
  }

  if (changes.length === 0) {
    changes.push({ label: t("optionsUpdated"), value: "" });
  }

  return (
    <div className="space-y-2 text-sm">
      {changes.map((change, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-muted-foreground">{change.label}:</span>
          <span className="font-medium">{change.value}</span>
        </div>
      ))}
    </div>
  );
}
