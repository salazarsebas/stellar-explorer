"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, ArrowRightLeft, Users, Coins, FileCode, Star, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StellarLogo } from "./stellar-icon";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", icon: Home, label: "Overview" },
  { href: "/ledgers", icon: Layers, label: "Ledgers" },
  { href: "/transactions", icon: ArrowRightLeft, label: "Transactions" },
  { href: "/accounts", icon: Users, label: "Accounts" },
  { href: "/assets", icon: Coins, label: "Assets" },
  { href: "/contracts", icon: FileCode, label: "Contracts" },
];

const bottomItems = [{ href: "/watchlist", icon: Star, label: "Watchlist" }];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-border border-b p-4">
          <SheetTitle className="flex items-center gap-3">
            <StellarLogo className="size-8" />
            <span>Stellar Explorer</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("size-5", isActive && "text-primary")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Separator className="my-2" />

          {bottomItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("size-5", isActive && "text-primary")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
