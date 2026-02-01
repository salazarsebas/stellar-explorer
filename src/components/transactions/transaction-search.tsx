"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Hash, User, Layers, AlertCircle } from "lucide-react";

interface TransactionSearchProps {
  onAccountSearch: (accountId: string) => void;
  onLedgerSearch: (sequence: number) => void;
}

function isValidTransactionHash(value: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(value);
}

function isValidPublicKey(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value);
}

function isValidLedgerSequence(value: string): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0;
}

export function TransactionSearch({ onAccountSearch, onLedgerSearch }: TransactionSearchProps) {
  const t = useTranslations("transactionSearch");
  const router = useRouter();

  const [hashValue, setHashValue] = useState("");
  const [accountValue, setAccountValue] = useState("");
  const [ledgerValue, setLedgerValue] = useState("");
  const [hashError, setHashError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const handleHashSearch = () => {
    const trimmed = hashValue.trim();
    if (!trimmed) {
      setHashError(t("hashRequired"));
      return;
    }
    if (!isValidTransactionHash(trimmed)) {
      setHashError(t("invalidHash"));
      return;
    }
    setHashError(null);
    router.push(`/tx/${trimmed}`);
  };

  const handleAccountSearch = () => {
    const trimmed = accountValue.trim();
    if (!trimmed) {
      setAccountError(t("accountRequired"));
      return;
    }
    if (!isValidPublicKey(trimmed)) {
      setAccountError(t("invalidAccount"));
      return;
    }
    setAccountError(null);
    onAccountSearch(trimmed);
  };

  const handleLedgerSearch = () => {
    const trimmed = ledgerValue.trim();
    if (!trimmed) {
      setLedgerError(t("ledgerRequired"));
      return;
    }
    if (!isValidLedgerSequence(trimmed)) {
      setLedgerError(t("invalidLedger"));
      return;
    }
    setLedgerError(null);
    onLedgerSearch(parseInt(trimmed, 10));
  };

  const handleKeyDown = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === "Enter") {
      handler();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="size-4" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hash" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="hash" className="gap-1.5">
              <Hash className="size-3.5" />
              <span className="hidden sm:inline">{t("byHash")}</span>
              <span className="sm:hidden">Hash</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5">
              <User className="size-3.5" />
              <span className="hidden sm:inline">{t("byAccount")}</span>
              <span className="sm:hidden">Account</span>
            </TabsTrigger>
            <TabsTrigger value="ledger" className="gap-1.5">
              <Layers className="size-3.5" />
              <span className="hidden sm:inline">{t("byLedger")}</span>
              <span className="sm:hidden">Ledger</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hash" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={t("hashPlaceholder")}
                value={hashValue}
                onChange={(e) => {
                  setHashValue(e.target.value);
                  setHashError(null);
                }}
                onKeyDown={(e) => handleKeyDown(e, handleHashSearch)}
                className="font-mono text-sm"
                aria-invalid={!!hashError}
              />
              <Button onClick={handleHashSearch} className="shrink-0">
                <Search className="size-4" />
                <span className="sr-only">{t("search")}</span>
              </Button>
            </div>
            {hashError && (
              <p className="text-destructive flex items-center gap-1 text-sm">
                <AlertCircle className="size-3.5" />
                {hashError}
              </p>
            )}
          </TabsContent>

          <TabsContent value="account" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={t("accountPlaceholder")}
                value={accountValue}
                onChange={(e) => {
                  setAccountValue(e.target.value);
                  setAccountError(null);
                }}
                onKeyDown={(e) => handleKeyDown(e, handleAccountSearch)}
                className="font-mono text-sm"
                aria-invalid={!!accountError}
              />
              <Button onClick={handleAccountSearch} className="shrink-0">
                <Search className="size-4" />
                <span className="sr-only">{t("search")}</span>
              </Button>
            </div>
            {accountError && (
              <p className="text-destructive flex items-center gap-1 text-sm">
                <AlertCircle className="size-3.5" />
                {accountError}
              </p>
            )}
          </TabsContent>

          <TabsContent value="ledger" className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t("ledgerPlaceholder")}
                value={ledgerValue}
                onChange={(e) => {
                  setLedgerValue(e.target.value);
                  setLedgerError(null);
                }}
                onKeyDown={(e) => handleKeyDown(e, handleLedgerSearch)}
                className="text-sm"
                aria-invalid={!!ledgerError}
              />
              <Button onClick={handleLedgerSearch} className="shrink-0">
                <Search className="size-4" />
                <span className="sr-only">{t("search")}</span>
              </Button>
            </div>
            {ledgerError && (
              <p className="text-destructive flex items-center gap-1 text-sm">
                <AlertCircle className="size-3.5" />
                {ledgerError}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
