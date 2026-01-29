"use client";

import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

interface LiveIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default";
  status?: ConnectionStatus;
  label?: string;
}

export function LiveIndicator({
  className,
  showLabel = true,
  size = "default",
  status = "connected",
  label,
}: LiveIndicatorProps) {
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  const statusConfig = {
    connected: {
      color: "bg-success",
      animate: true,
      label: label || "Live",
    },
    connecting: {
      color: "bg-warning",
      animate: true,
      label: label || "Connecting",
    },
    disconnected: {
      color: "bg-muted-foreground",
      animate: false,
      label: label || "Offline",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center gap-2",
        size === "sm" ? "text-[10px]" : "text-xs",
        className
      )}
    >
      <span className="relative flex">
        {config.animate && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.color,
              dotSize
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full", config.color, dotSize)} />
      </span>
      {showLabel && <span className="font-medium">{config.label}</span>}
    </div>
  );
}
