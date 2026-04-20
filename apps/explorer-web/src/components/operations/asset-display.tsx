import { HashDisplay } from "@/components/common/hash-display";
import { formatNumber } from "@/lib/utils";

interface AssetDisplayProps {
  amount?: string;
  assetType?: string;
  assetCode?: string;
  assetIssuer?: string;
  className?: string;
}

export function AssetDisplay({
  amount,
  assetType,
  assetCode,
  assetIssuer,
  className,
}: AssetDisplayProps) {
  const isNative = !assetType || assetType === "native";
  const code = isNative ? "XLM" : assetCode || "unknown";

  return (
    <span className={className}>
      {amount && <span className="font-mono">{formatNumber(amount)}</span>}{" "}
      <span className="font-medium">{code}</span>
      {!isNative && assetIssuer && (
        <>
          {" "}
          <span className="text-muted-foreground text-xs">
            (
            <HashDisplay
              hash={assetIssuer}
              truncate
              startLength={4}
              endLength={4}
              copyable={false}
              className="text-xs"
            />
            )
          </span>
        </>
      )}
    </span>
  );
}
