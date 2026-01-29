"use client";

import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { HashDisplay } from "@/components/common/hash-display";
import { LoadingCard } from "@/components/common/loading-card";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { useContractEvents } from "@/lib/hooks";
import { isValidContractId } from "@/lib/utils";
import { Activity, Database, Code, AlertTriangle, Hash } from "lucide-react";

interface ContractContentProps {
  id: string;
}

function ContractSummary({ contractId }: { contractId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contract Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Hash className="size-4" />
                Contract ID
              </span>
              <HashDisplay
                hash={contractId}
                truncate
                startLength={12}
                endLength={8}
                className="text-sm"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Type</span>
              <Badge variant="secondary">Soroban Contract</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Status</span>
              <Badge className="bg-success/15 text-success border-success/25">Active</Badge>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="bg-warning/10 border-warning/20 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-warning text-sm font-medium">Unverified Contract</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    This contract has not been verified. Interact with caution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractEvents({ contractId }: { contractId: string }) {
  const { data, isLoading, error, refetch } = useContractEvents(contractId);

  if (isLoading) {
    return <LoadingCard rows={5} />;
  }

  if (error) {
    return <ErrorState title="Failed to load events" message={error.message} onRetry={refetch} />;
  }

  if (!data?.events?.length) {
    return (
      <EmptyState
        title="No recent events"
        description="This contract hasn't emitted any events in the recent ledgers."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Events ({data.events.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.events.map(
            (event: { id?: string; type?: string; ledger?: number }, index: number) => (
              <div
                key={`${event.id || index}`}
                className="bg-card/50 flex items-center justify-between rounded-lg p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-chart-1/10 flex size-8 items-center justify-center rounded-md">
                    <Activity className="text-chart-1 size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.type || "Contract Event"}</p>
                    <p className="text-muted-foreground text-xs">Ledger {event.ledger}</p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {event.type === "contract" ? "Contract" : "System"}
                </Badge>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ContractStorage() {
  return (
    <Card>
      <CardContent className="py-12">
        <EmptyState
          title="Storage inspection coming soon"
          description="Contract storage viewing is under development."
          icon="file"
        />
      </CardContent>
    </Card>
  );
}

function ContractCode() {
  return (
    <Card>
      <CardContent className="py-12">
        <EmptyState
          title="Code inspection coming soon"
          description="Contract code viewing and verification is under development."
          icon="file"
        />
      </CardContent>
    </Card>
  );
}

export function ContractContent({ id }: ContractContentProps) {
  if (!isValidContractId(id)) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract"
        hash={id}
        backHref="/"
        backLabel="Home"
        showQr={false}
        badge={
          <Badge variant="outline" className="bg-warning/15 text-warning border-warning/25">
            <AlertTriangle className="mr-1 size-3" />
            Unverified
          </Badge>
        }
      />

      <ContractSummary contractId={id} />

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">
            <Activity className="mr-2 size-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="storage">
            <Database className="mr-2 size-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="mr-2 size-4" />
            Code
          </TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-4">
          <ContractEvents contractId={id} />
        </TabsContent>
        <TabsContent value="storage" className="mt-4">
          <ContractStorage />
        </TabsContent>
        <TabsContent value="code" className="mt-4">
          <ContractCode />
        </TabsContent>
      </Tabs>
    </div>
  );
}
