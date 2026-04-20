import { HashDisplay } from "@/components/common/hash-display";
import { AssetDisplay } from "../asset-display";
import { ArrowRight } from "lucide-react";
export function PaymentRenderer({ operation: op }: { operation: Record<string, unknown> }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <HashDisplay
          hash={op.from as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.from}`}
        />
        <ArrowRight className="text-muted-foreground size-4" />
        <HashDisplay
          hash={op.to as string}
          truncate
          startLength={6}
          endLength={4}
          linkTo={`/account/${op.to}`}
        />
      </div>
      <AssetDisplay
        amount={op.amount as string}
        assetType={op.asset_type as string}
        assetCode={op.asset_code as string}
        assetIssuer={op.asset_issuer as string}
      />
    </div>
  );
}
