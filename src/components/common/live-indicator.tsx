"use client";

import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default";
}

export function LiveIndicator({
  className,
  showLabel = true,
  size = "default",
}: LiveIndicatorProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center gap-2",
        size === "sm" ? "text-[10px]" : "text-xs",
        className
      )}
    >
      <span className="relative flex">
        <span
          className={cn(
            "bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
          )}
        />
        <span
          className={cn(
            "bg-success relative inline-flex rounded-full",
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
          )}
        />
      </span>
      {showLabel && <span className="font-medium">Live</span>}
    </div>
  );
}
