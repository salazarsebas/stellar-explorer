"use client";

import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { glossaryTerms, type GlossaryLevel } from "@/lib/glossary";
import { ExternalLink, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GlossaryTermProps {
  /** The glossary term ID to look up */
  term: string;
  /** Optional children to wrap (if not provided, uses the term name) */
  children?: ReactNode;
  /** Additional CSS classes for the trigger */
  className?: string;
  /** Whether to show as inline text or a badge */
  variant?: "inline" | "badge";
  /** Whether to show the full definition or just short */
  showFull?: boolean;
}

const levelColors: Record<GlossaryLevel, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  advanced: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const levelLabels: Record<GlossaryLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function GlossaryTerm({
  term,
  children,
  className,
  variant = "inline",
  showFull = false,
}: GlossaryTermProps) {
  const entry = glossaryTerms[term];

  if (!entry) {
    // If term not found, just render children or term name without tooltip
    return <span className={className}>{children || term}</span>;
  }

  const triggerContent = children || entry.term;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {variant === "badge" ? (
            <Badge
              variant="outline"
              className={cn(
                "cursor-help border-dashed transition-colors hover:border-solid",
                className
              )}
            >
              <BookOpen className="mr-1 size-3" />
              {triggerContent}
            </Badge>
          ) : (
            <span
              className={cn(
                "border-muted-foreground/50 hover:border-primary cursor-help border-b border-dashed transition-colors",
                className
              )}
            >
              {triggerContent}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-sm p-0" sideOffset={8}>
          <div className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold">{entry.term}</h4>
              <Badge
                variant="outline"
                className={cn("px-1.5 py-0 text-[10px]", levelColors[entry.level])}
              >
                {levelLabels[entry.level]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {showFull ? entry.fullDefinition : entry.shortDefinition}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                <Link href={`/learn#${entry.id}`}>
                  <BookOpen className="mr-1 size-3" />
                  Learn more
                </Link>
              </Button>
              {entry.learnMoreUrl && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                  <a href={entry.learnMoreUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 size-3" />
                    Docs
                  </a>
                </Button>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
