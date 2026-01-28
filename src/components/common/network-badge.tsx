import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NetworkKey } from "@/types";

interface NetworkBadgeProps {
  network: NetworkKey;
  className?: string;
}

const networkStyles: Record<NetworkKey, string> = {
  public: "bg-success/15 text-success border-success/25",
  testnet: "bg-warning/15 text-warning border-warning/25",
  futurenet: "bg-primary/15 text-primary border-primary/25",
};

const networkLabels: Record<NetworkKey, string> = {
  public: "Mainnet",
  testnet: "Testnet",
  futurenet: "Futurenet",
};

export function NetworkBadge({ network, className }: NetworkBadgeProps) {
  return (
    <Badge variant="outline" className={cn(networkStyles[network], "font-medium", className)}>
      {networkLabels[network]}
    </Badge>
  );
}
