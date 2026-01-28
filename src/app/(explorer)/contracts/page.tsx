"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { useNetwork } from "@/lib/providers";
import { NetworkBadge } from "@/components/common/network-badge";
import { FileCode, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidContractId } from "@/lib/utils";

export default function ContractsPage() {
  const { network } = useNetwork();
  const router = useRouter();
  const [contractId, setContractId] = useState("");
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId.trim()) {
      setError("Please enter a contract ID");
      return;
    }
    if (!isValidContractId(contractId.trim())) {
      setError("Invalid contract ID format. Must start with C and be 56 characters.");
      return;
    }
    router.push(`/contract/${contractId.trim()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Contracts"
        subtitle="Explore Soroban smart contracts on the Stellar network"
        backHref="/"
        backLabel="Home"
        showCopy={false}
        badge={<NetworkBadge network={network} />}
      />

      {/* Search for a contract */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find a Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter contract ID (C...)"
                value={contractId}
                onChange={(e) => {
                  setContractId(e.target.value);
                  setError("");
                }}
                className="font-mono"
              />
              <Button type="submit">
                <Search className="mr-2 size-4" />
                Search
              </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Info about Soroban */}
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="bg-primary/10 flex size-16 items-center justify-center rounded-2xl">
                <FileCode className="text-primary size-8" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Soroban Smart Contracts</h3>
              <p className="text-muted-foreground mx-auto mt-2 max-w-md">
                Soroban is Stellar&apos;s smart contract platform. Search for a contract by its ID
                to view events, storage, and invocations.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <a href="https://soroban.stellar.org/" target="_blank" rel="noopener noreferrer">
                  Learn about Soroban
                  <ExternalLink className="ml-2 size-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular contracts placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Popular Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Coming soon"
            description="A curated list of popular Soroban contracts will be available here."
            icon="file"
          />
        </CardContent>
      </Card>
    </div>
  );
}
