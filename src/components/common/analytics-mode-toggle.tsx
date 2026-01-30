"use client";

import { useTranslations } from "next-intl";
import { BarChart3, Settings, TrendingUp, Download, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useAnalyticsMode } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function AnalyticsModeToggle() {
  const t = useTranslations("analyticsMode");
  const { isAnalyticsMode, toggleAnalyticsMode, settings, updateSettings } = useAnalyticsMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-colors hover:bg-white/10",
            isAnalyticsMode && "text-chart-2"
          )}
        >
          <BarChart3 className="size-4" />
          {isAnalyticsMode && (
            <Badge
              className="bg-chart-2 absolute -top-1 -right-1 h-4 w-auto px-1 text-[9px] font-bold"
              variant="default"
            >
              PRO
            </Badge>
          )}
          <span className="sr-only">{t("title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="size-4" />
          {t("title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem checked={isAnalyticsMode} onCheckedChange={toggleAnalyticsMode}>
          {t("enableAnalyticsMode")}
        </DropdownMenuCheckboxItem>

        {isAnalyticsMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              {t("features")}
            </DropdownMenuLabel>

            <DropdownMenuCheckboxItem
              checked={settings.showStatistics}
              onCheckedChange={(checked) => updateSettings({ showStatistics: checked })}
            >
              <TrendingUp className="mr-2 size-4" />
              {t("showStatistics")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={settings.showTrendlines}
              onCheckedChange={(checked) => updateSettings({ showTrendlines: checked })}
            >
              <Gauge className="mr-2 size-4" />
              {t("showTrendlines")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={settings.enableDataExport}
              onCheckedChange={(checked) => updateSettings({ enableDataExport: checked })}
            >
              <Download className="mr-2 size-4" />
              {t("enableExport")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              {t("chartDensity")}
            </DropdownMenuLabel>

            <DropdownMenuRadioGroup
              value={settings.chartDensity}
              onValueChange={(value) =>
                updateSettings({ chartDensity: value as "compact" | "normal" | "expanded" })
              }
            >
              <DropdownMenuRadioItem value="compact">{t("compact")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="normal">{t("normal")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="expanded">{t("expanded")}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
