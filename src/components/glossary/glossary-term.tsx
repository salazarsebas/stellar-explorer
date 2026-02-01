"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { glossaryTermsMeta, type GlossaryLevel } from "@/lib/glossary";
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

export function GlossaryTerm({
  term,
  children,
  className,
  variant = "inline",
  showFull = false,
}: GlossaryTermProps) {
  const t = useTranslations("learn");
  const tGlossary = useTranslations("glossary");
  const meta = glossaryTermsMeta[term];

  if (!meta) {
    // If term not found, just render children or term name without tooltip
    return <span className={className}>{children || term}</span>;
  }

  // Get translated content
  const termName = tGlossary(`terms.${term}.term`);
  const shortDefinition = tGlossary(`terms.${term}.short`);
  const fullDefinition = tGlossary(`terms.${term}.full`);

  const triggerContent = children || termName;

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
              <h4 className="text-sm font-semibold">{termName}</h4>
              <Badge
                variant="outline"
                className={cn("px-1.5 py-0 text-[10px]", levelColors[meta.level])}
              >
                {t(meta.level)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {showFull ? fullDefinition : shortDefinition}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                <Link href={`/learn#${meta.id}`}>
                  <BookOpen className="mr-1 size-3" />
                  {t("learnMore")}
                </Link>
              </Button>
              {meta.learnMoreUrl && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                  <a href={meta.learnMoreUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 size-3" />
                    {t("docs")}
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
