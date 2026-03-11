import { decodeDataValue } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ManageDataRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  const t = useTranslations("operations");
  const name = op.name as string;
  const value = op.value as string | undefined;
  const isDelete = !value;

  if (isDelete) {
    return (
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-destructive">{t("deletedKey")}</span>{" "}
          <span className="font-mono font-medium">{name}</span>
        </div>
      </div>
    );
  }

  const { decoded, encoding } = decodeDataValue(value);

  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-muted-foreground">{t("key")}:</span>{" "}
        <span className="font-mono font-medium">{name}</span>
      </div>
      <div>
        <span className="text-muted-foreground">{t("value")}:</span>{" "}
        <span className="font-mono">{decoded}</span>
        {encoding === "hex" && <span className="text-muted-foreground ml-1 text-xs">(hex)</span>}
      </div>
    </div>
  );
}
