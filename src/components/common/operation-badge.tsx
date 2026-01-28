import { Badge } from "@/components/ui/badge";
import { OPERATION_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface OperationBadgeProps {
  type: string;
  className?: string;
}

const operationColors: Record<string, string> = {
  payment: "bg-primary/15 text-primary border-primary/25",
  create_account: "bg-success/15 text-success border-success/25",
  account_merge: "bg-destructive/15 text-destructive border-destructive/25",
  change_trust: "bg-warning/15 text-warning border-warning/25",
  manage_sell_offer: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  manage_buy_offer: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  invoke_host_function: "bg-chart-1/15 text-chart-1 border-chart-1/25",
};

export function OperationBadge({ type, className }: OperationBadgeProps) {
  const label = OPERATION_LABELS[type] || type.replace(/_/g, " ");
  const colorClass = operationColors[type] || "bg-secondary text-secondary-foreground";

  return (
    <Badge variant="outline" className={cn(colorClass, "capitalize", className)}>
      {label}
    </Badge>
  );
}
