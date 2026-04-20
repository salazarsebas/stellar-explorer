import { parseSorobanFunctionType } from "@/lib/utils";
import { Code } from "lucide-react";
import { useTranslations } from "next-intl";

export function InvokeHostFunctionRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const { displayName } = parseSorobanFunctionType(op.function as string);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <Code className="text-muted-foreground size-4" />
        <span className="font-medium">{displayName}</span>
      </div>
      {typeof op.function === "string" && (
        <div className="bg-muted/50 rounded p-2 font-mono text-xs break-all">{op.function}</div>
      )}
    </div>
  );
}

export function ExtendFootprintTtlRenderer({
  operation: op,
}: {
  operation: Record<string, unknown>;
}) {
  const t = useTranslations("operations");
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <Code className="text-muted-foreground size-4" />
        <span>{t("extendedTtl")}</span>
      </div>
      {typeof op.extend_to === "string" && (
        <div className="text-muted-foreground">
          {t("extendToLedger")}: <span className="font-mono">{op.extend_to as string}</span>
        </div>
      )}
    </div>
  );
}

export function RestoreFootprintRenderer() {
  const t = useTranslations("operations");
  return (
    <div className="flex items-center gap-2 text-sm">
      <Code className="text-muted-foreground size-4" />
      <span>{t("restoredFootprint")}</span>
    </div>
  );
}
