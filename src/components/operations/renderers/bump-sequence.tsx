import { useTranslations } from "next-intl";

export function BumpSequenceRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{t("bumpedTo")}:</span>{" "}
      <span className="font-mono font-medium">{op.bump_to as string}</span>
    </div>
  );
}
