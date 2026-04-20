"use client";

import { useEffect, useState } from "react";
import { formatTimeAgo, formatDateTime } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TimeAgoProps {
  timestamp: string | Date;
  className?: string;
  showTooltip?: boolean;
}

export function TimeAgo({ timestamp, className, showTooltip = true }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState(() => formatTimeAgo(timestamp));

  // Update the relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(timestamp));
    }, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const content = (
    <span className={cn("text-muted-foreground tabular-nums", className)}>{timeAgo}</span>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {formatDateTime(timestamp)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
