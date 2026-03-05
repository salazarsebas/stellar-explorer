import { Badge } from "@/components/ui/badge";
import { OPERATION_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface OperationBadgeProps {
  type: string;
  className?: string;
}

const operationColors: Record<string, string> = {
  payment: "bg-primary/15 text-primary border-primary/25",
  path_payment_strict_receive: "bg-primary/15 text-primary border-primary/25",
  path_payment_strict_send: "bg-primary/15 text-primary border-primary/25",
  create_account: "bg-success/15 text-success border-success/25",
  account_merge: "bg-destructive/15 text-destructive border-destructive/25",
  change_trust: "bg-warning/15 text-warning border-warning/25",
  allow_trust: "bg-warning/15 text-warning border-warning/25",
  set_trust_line_flags: "bg-warning/15 text-warning border-warning/25",
  manage_sell_offer: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  manage_buy_offer: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  create_passive_sell_offer: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  set_options: "bg-secondary text-secondary-foreground border-secondary/25",
  manage_data: "bg-secondary text-secondary-foreground border-secondary/25",
  bump_sequence: "bg-secondary text-secondary-foreground border-secondary/25",
  inflation: "bg-secondary text-secondary-foreground border-secondary/25",
  clawback: "bg-destructive/15 text-destructive border-destructive/25",
  clawback_claimable_balance: "bg-destructive/15 text-destructive border-destructive/25",
  create_claimable_balance: "bg-success/15 text-success border-success/25",
  claim_claimable_balance: "bg-success/15 text-success border-success/25",
  begin_sponsoring_future_reserves: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  end_sponsoring_future_reserves: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  revoke_sponsorship: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  liquidity_pool_deposit: "bg-chart-5/15 text-chart-5 border-chart-5/25",
  liquidity_pool_withdraw: "bg-chart-5/15 text-chart-5 border-chart-5/25",
  invoke_host_function: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  extend_footprint_ttl: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  restore_footprint: "bg-chart-1/15 text-chart-1 border-chart-1/25",
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
