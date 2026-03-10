"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { RefreshCw, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetworkSelector } from "./network-selector";
import { MobileNav } from "./mobile-nav";
import { GlobalSearch } from "@/components/search/global-search";
import { LocaleSwitcher } from "@/components/common/locale-switcher";
import { ViewModesToggle } from "@/components/common/view-modes-toggle";
import { useTheme } from "@/lib/providers";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const t = useTranslations("header");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-white/5">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6 lg:px-8">
        {/* Mobile menu */}
        <MobileNav />

        {/* Logo (mobile only) */}
        <Link href="/" className="group flex items-center gap-2.5 font-semibold md:hidden">
          <Image
            src="/stellar-explorer.png"
            alt="Stellar Explorer"
            width={32}
            height={32}
            className="rounded-lg"
          />
        </Link>

        {/* Spacer for mobile to push actions to right */}
        <div className="flex-1 md:hidden" />

        {/* Global Search */}
        <GlobalSearch className="md:flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Network Selector */}
          <NetworkSelector />

          {/* View Modes (Dev + Analytics) */}
          <ViewModesToggle />

          {/* Refresh (hidden on mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden transition-colors hover:bg-white/10 md:inline-flex"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            <span className="sr-only">{t("refreshData")}</span>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="transition-colors hover:bg-white/10"
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="sr-only">{t("toggleTheme")}</span>
          </Button>

          {/* Language switcher */}
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
