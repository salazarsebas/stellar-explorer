"use client";

import { useTranslations } from "next-intl";
import { Sliders, Code, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useDeveloperMode, useAnalyticsMode } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function ViewModesToggle() {
  const tDev = useTranslations("developerMode");
  const tAnalytics = useTranslations("analyticsMode");
  const { isDevMode, toggleDevMode } = useDeveloperMode();
  const { isAnalyticsMode, toggleAnalyticsMode } = useAnalyticsMode();

  const anyActive = isDevMode || isAnalyticsMode;
  const badgeLabel =
    isDevMode && isAnalyticsMode
      ? "DEV·PRO"
      : isDevMode
        ? "DEV"
        : "PRO";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-colors hover:bg-white/10",
            anyActive && "text-primary"
          )}
        >
          <Sliders className="size-4" />
          {anyActive && (
            <Badge
              className="bg-chart-1 absolute -top-1 -right-1 h-4 w-auto px-1 text-[9px] font-bold"
              variant="default"
            >
              {badgeLabel}
            </Badge>
          )}
          <span className="sr-only">View Modes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuCheckboxItem
          checked={isDevMode}
          onCheckedChange={toggleDevMode}
        >
          <Code className="mr-2 size-4" />
          {tDev("title")}
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={isAnalyticsMode}
          onCheckedChange={toggleAnalyticsMode}
        >
          <BarChart3 className="mr-2 size-4" />
          {tAnalytics("title")}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
