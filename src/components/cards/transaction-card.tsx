"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { HashDisplay } from "@/components/common/hash-display";
import { TimeAgo } from "@/components/common/time-ago";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import type { Horizon } from "@stellar/stellar-sdk";

interface TransactionCardProps {
  transaction: Horizon.ServerApi.TransactionRecord;
  className?: string;
  animationDelay?: number;
}

export function TransactionCard({ transaction, className, animationDelay }: TransactionCardProps) {
  const isSuccess = transaction.successful;

  return (
    <Link href={`/tx/${transaction.hash}`}>
      <Card
        variant="elevated"
        interactive
        className={cn("group animate-fade-in-up border-0 py-0", className)}
        style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex min-w-0 items-center gap-4">
            {/* Status icon with glow */}
            <div
              className={cn(
                "relative flex size-10 items-center justify-center rounded-xl transition-all duration-300",
                isSuccess ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {/* Glow effect */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60",
                  isSuccess ? "bg-success/30" : "bg-destructive/30"
                )}
              />
              {isSuccess ? (
                <CheckCircle2 className="relative size-5" />
              ) : (
                <XCircle className="relative size-5" />
              )}
            </div>

            {/* Transaction info */}
            <div className="min-w-0 space-y-1">
              <HashDisplay
                hash={transaction.hash}
                truncate
                startLength={10}
                endLength={6}
                copyable={false}
                className="font-mono text-sm font-medium"
              />
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span>
                  {transaction.operation_count} operation
                  {transaction.operation_count !== 1 ? "s" : ""}
                </span>
                <span className="opacity-30">|</span>
                <TimeAgo timestamp={transaction.created_at} />
              </div>
            </div>
          </div>

          {/* Arrow indicator */}
          <ChevronRight className="text-muted-foreground size-5 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </CardContent>
      </Card>
    </Link>
  );
}

interface TransactionCardSkeletonProps {
  className?: string;
}

export function TransactionCardSkeleton({ className }: TransactionCardSkeletonProps) {
  return (
    <Card variant="elevated" className={cn("border-0 py-0", className)}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="bg-muted/50 size-10 animate-pulse rounded-xl" />
          <div className="space-y-2">
            <div className="bg-muted/50 h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted/50 h-3 w-24 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-muted/50 h-4 w-4 animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
