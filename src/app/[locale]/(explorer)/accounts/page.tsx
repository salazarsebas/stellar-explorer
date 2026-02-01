"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import { Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidPublicKey } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function AccountsPage() {
  const { network } = useNetwork();
  const router = useRouter();
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const t = useTranslations("accounts");
  const tCommon = useTranslations("common");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) {
      setError(t("enterAddressError"));
      return;
    }
    if (!isValidPublicKey(accountId.trim())) {
      setError(t("invalidAddress"));
      return;
    }
    router.push(`/account/${accountId.trim()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref="/"
        backLabel={tCommon("home")}
        showCopy={false}
        badge={<NetworkBadge network={network} />}
      />

      {/* Search for an account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("findAccount")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t("enterAddress")}
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setError("");
                }}
                className="font-mono"
              />
              <Button type="submit">
                <Search className="mr-2 size-4" />
                {tCommon("search")}
              </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="bg-chart-2/10 flex size-16 items-center justify-center rounded-2xl">
                <Users className="text-chart-2 size-8" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t("stellarAccounts")}</h3>
              <p className="text-muted-foreground mx-auto mt-2 max-w-md">
                {t("accountsDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
