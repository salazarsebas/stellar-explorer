"use client";

import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Status = "success" | "failed" | "pending" | "warning";

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: "sm" | "default";
  className?: string;
}

const statusStyles: Record<
  Status,
  {
    icon: typeof CheckCircle2;
    className: string;
    glowClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className: "bg-gradient-to-r from-success/20 to-success/10 text-success border-success/30",
    glowClass: "shadow-[0_0_10px_rgba(34,197,94,0.2)]",
  },
  failed: {
    icon: XCircle,
    className:
      "bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive border-destructive/30",
    glowClass: "shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  },
  pending: {
    icon: Clock,
    className:
      "bg-gradient-to-r from-warning/20 to-warning/10 text-warning border-warning/30 animate-pulse",
    glowClass: "shadow-[0_0_10px_rgba(234,179,8,0.2)]",
  },
  warning: {
    icon: AlertCircle,
    className: "bg-gradient-to-r from-warning/20 to-warning/10 text-warning border-warning/30",
    glowClass: "shadow-[0_0_10px_rgba(234,179,8,0.2)]",
  },
};

export function StatusBadge({
  status,
  showIcon = true,
  showLabel = true,
  size = "default",
  className,
}: StatusBadgeProps) {
  const t = useTranslations("status");
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        config.glowClass,
        "transition-all duration-200",
        size === "sm" && "px-1.5 py-0 text-[10px]",
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn("shrink-0", size === "sm" ? "size-2.5" : "size-3", !showLabel && "mr-0")}
        />
      )}
      {showLabel && <span>{t(status)}</span>}
    </Badge>
  );
}
