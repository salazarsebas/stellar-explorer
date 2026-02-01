"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./chart-wrapper";

// Lazy load charts for performance (ssr: false for Recharts)
const TPSChart = dynamic(() => import("./tps-chart"), {
  loading: () => <ChartSkeletonWrapper />,
  ssr: false,
});

const FeeChart = dynamic(() => import("./fee-chart"), {
  loading: () => <ChartSkeletonWrapper />,
  ssr: false,
});

const OperationsChart = dynamic(() => import("./operations-chart"), {
  loading: () => <ChartSkeletonWrapper />,
  ssr: false,
});

const TransactionsChart = dynamic(() => import("./transactions-chart"), {
  loading: () => <ChartSkeletonWrapper />,
  ssr: false,
});

function ChartSkeletonWrapper() {
  return (
    <div className="bg-card/50 rounded-lg p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="bg-muted h-7 w-7 animate-pulse rounded-lg" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </div>
      <ChartSkeleton />
    </div>
  );
}

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TPSChart />
      <OperationsChart />
      <FeeChart />
      <TransactionsChart />
    </div>
  );
}
