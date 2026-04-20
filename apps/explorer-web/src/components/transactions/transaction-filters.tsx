"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StatusFilter = "all" | "success" | "failed";

interface TransactionFiltersProps {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  totalCount: number;
  successCount: number;
  failedCount: number;
}

export function TransactionFilters({
  status,
  onStatusChange,
  totalCount,
  successCount,
  failedCount,
}: TransactionFiltersProps) {
  const t = useTranslations("transactionSearch");

  const filters: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: t("showAll"), count: totalCount },
    { value: "success", label: t("showSuccess"), count: successCount },
    { value: "failed", label: t("showFailed"), count: failedCount },
  ];

  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground mr-2 text-sm">{t("filterByStatus")}:</span>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={status === filter.value ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onStatusChange(filter.value)}
          className={cn("h-7 gap-1.5 text-xs", status === filter.value && "pointer-events-none")}
        >
          {filter.label}
          <span
            className={cn(
              "bg-muted rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
              status === filter.value && "bg-background"
            )}
          >
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  );
}
