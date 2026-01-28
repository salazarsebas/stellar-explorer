"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRightLeft, Users, FileCode, Coins, Layers, Clock } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { detectEntityType, getEntityRoute, truncateHash } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types";

const entityIcons: Record<EntityType, typeof Search> = {
  transaction: ArrowRightLeft,
  account: Users,
  contract: FileCode,
  asset: Coins,
  ledger: Layers,
  unknown: Search,
};

const entityLabels: Record<EntityType, string> = {
  transaction: "Transaction",
  account: "Account",
  contract: "Contract",
  asset: "Asset",
  ledger: "Ledger",
  unknown: "Search",
};

const RECENT_SEARCHES_KEY = "stellar-explorer-recent-searches";
const MAX_RECENT = 5;

interface RecentSearch {
  query: string;
  type: EntityType;
  timestamp: number;
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const saveRecentSearch = useCallback((search: RecentSearch) => {
    setRecentSearches((prev) => {
      // Remove duplicates and add new search at the beginning
      const filtered = prev.filter((s) => s.query !== search.query);
      const updated = [search, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      const type = detectEntityType(searchQuery);
      const route = getEntityRoute(type, searchQuery);

      // Save to recent searches
      saveRecentSearch({
        query: searchQuery,
        type,
        timestamp: Date.now(),
      });

      setOpen(false);
      setQuery("");

      if (route) {
        router.push(route);
      } else {
        // Go to search results page for unknown types
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    },
    [router, saveRecentSearch]
  );

  const detectedType = query ? detectEntityType(query) : "unknown";
  const Icon = entityIcons[detectedType];

  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        className={cn(
          "text-muted-foreground relative justify-start",
          "h-9 w-full px-3 md:w-64 lg:w-80",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 size-4" />
        <span className="flex-1 truncate text-left">Search transactions, accounts...</span>
        <kbd className="bg-muted text-muted-foreground hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none md:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by tx hash, account, asset, contract, or ledger..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center">
              <p className="text-muted-foreground text-sm">No results found.</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Try a transaction hash, account address, or ledger number.
              </p>
            </div>
          </CommandEmpty>

          {/* Current query suggestion */}
          {query && (
            <CommandGroup heading="Search">
              <CommandItem onSelect={() => handleSearch(query)} className="gap-3">
                <Icon className="size-4" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-mono text-sm">{truncateHash(query, 16, 16)}</p>
                  <p className="text-muted-foreground text-xs">
                    Search as {entityLabels[detectedType]}
                  </p>
                </div>
              </CommandItem>
            </CommandGroup>
          )}

          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <>
              <CommandGroup
                heading={
                  <div className="flex items-center justify-between">
                    <span>Recent</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-auto px-1.5 py-0.5 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearRecentSearches();
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                }
              >
                {recentSearches.map((search) => {
                  const SearchIcon = entityIcons[search.type];
                  return (
                    <CommandItem
                      key={search.query}
                      onSelect={() => handleSearch(search.query)}
                      className="gap-3"
                    >
                      <Clock className="text-muted-foreground size-4" />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-mono text-sm">
                          {truncateHash(search.query, 12, 12)}
                        </p>
                        <p className="text-muted-foreground text-xs">{entityLabels[search.type]}</p>
                      </div>
                      <SearchIcon className="text-muted-foreground size-4" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {/* Quick links when empty */}
          {!query && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quick Access">
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    router.push("/transactions");
                  }}
                >
                  <ArrowRightLeft className="mr-3 size-4" />
                  Recent Transactions
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    router.push("/ledgers");
                  }}
                >
                  <Layers className="mr-3 size-4" />
                  Latest Ledgers
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    router.push("/contracts");
                  }}
                >
                  <FileCode className="mr-3 size-4" />
                  Smart Contracts
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
