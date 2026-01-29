"use client";

import { useTranslations } from "next-intl";
import { Code, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useDeveloperMode } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function DeveloperModeToggle() {
  const t = useTranslations("developerMode");
  const { isDevMode, toggleDevMode, settings, updateSettings } = useDeveloperMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-colors hover:bg-white/10",
            isDevMode && "text-chart-1"
          )}
        >
          <Code className="size-4" />
          {isDevMode && (
            <Badge
              className="bg-chart-1 absolute -top-1 -right-1 h-4 w-auto px-1 text-[9px] font-bold"
              variant="default"
            >
              DEV
            </Badge>
          )}
          <span className="sr-only">{t("title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="size-4" />
          {t("title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem checked={isDevMode} onCheckedChange={toggleDevMode}>
          {t("enableDevMode")}
        </DropdownMenuCheckboxItem>

        {isDevMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              {t("options")}
            </DropdownMenuLabel>

            <DropdownMenuCheckboxItem
              checked={settings.showXdrRaw}
              onCheckedChange={(checked) => updateSettings({ showXdrRaw: checked })}
            >
              {t("showXdr")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={settings.showApiEndpoints}
              onCheckedChange={(checked) => updateSettings({ showApiEndpoints: checked })}
            >
              {t("showApiEndpoints")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={settings.showInternalIds}
              onCheckedChange={(checked) => updateSettings({ showInternalIds: checked })}
            >
              {t("showInternalIds")}
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
