import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="mb-1 h-7 w-24" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("hover:bg-card-hover transition-colors", className)}>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{title}</span>
          {Icon && <Icon className="text-muted-foreground size-4" />}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && <span className="text-muted-foreground text-xs">{subtitle}</span>}
      </CardContent>
    </Card>
  );
}
