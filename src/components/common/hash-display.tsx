"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { cn, truncateHash } from "@/lib/utils";
import { useCopy } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HashDisplayProps {
  hash: string;
  truncate?: boolean;
  startLength?: number;
  endLength?: number;
  copyable?: boolean;
  linkTo?: string;
  className?: string;
  mono?: boolean;
}

export function HashDisplay({
  hash,
  truncate: shouldTruncate = true,
  startLength = 8,
  endLength = 8,
  copyable = true,
  linkTo,
  className,
  mono = true,
}: HashDisplayProps) {
  const { copy, copied } = useCopy();
  const displayHash = shouldTruncate ? truncateHash(hash, startLength, endLength) : hash;

  const hashElement = (
    <span
      className={cn(
        mono && "font-mono",
        "text-foreground",
        linkTo && "hover:text-primary transition-colors",
        className
      )}
    >
      {displayHash}
    </span>
  );

  const content = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5">
            {linkTo ? (
              <Link href={linkTo} className="underline-offset-4 hover:underline">
                {hashElement}
              </Link>
            ) : (
              hashElement
            )}
            {copyable && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copy(hash);
                }}
                className={cn(
                  "opacity-0 transition-all duration-200 group-hover:opacity-100",
                  "rounded-md hover:bg-white/10",
                  copied && "opacity-100"
                )}
              >
                {copied ? (
                  <Check className="text-success animate-scale-in size-3" />
                ) : (
                  <Copy className="text-muted-foreground size-3" />
                )}
              </Button>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md font-mono text-xs break-all">
          {hash}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return <span className="group inline-flex items-center">{content}</span>;
}
