"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  variant?: "icon" | "text";
  label?: string;
  className?: string;
  isLink?: boolean;
}

export function CopyButton({
  value,
  variant = "icon",
  label = "Copy",
  className,
  isLink = false,
}: CopyButtonProps) {
  const { copy, copied } = useCopy();

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => copy(value)}
        className={cn("shrink-0", className)}
      >
        {copied ? (
          <Check className="text-success size-3.5" />
        ) : isLink ? (
          <Link2 className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copy(value)}
      className={cn("gap-2", className)}
    >
      {copied ? (
        <>
          <Check className="text-success size-3.5" />
          Copied
        </>
      ) : (
        <>
          {isLink ? <Link2 className="size-3.5" /> : <Copy className="size-3.5" />}
          {label}
        </>
      )}
    </Button>
  );
}
