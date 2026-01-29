"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNetwork } from "@/lib/providers";
import { useLatestLedger, useRecentTransactions } from "./use-stellar-query";
import {
  getTPSData,
  setTPSData,
  getTxHourlyData,
  setTxHourlyData,
  getHourTimestamp,
  type TPSDataPoint,
  type TxHourlyDataPoint,
} from "@/lib/utils/chart-storage";

export interface TPSChartData {
  data: TPSDataPoint[];
  currentTPS: number;
  isLoading: boolean;
}

export interface TxChartData {
  data: TxHourlyDataPoint[];
  isLoading: boolean;
  isCollecting: boolean;
}

export interface OperationsChartData {
  data: { name: string; value: number; color: string }[];
  total: number;
  successRate: number;
  isLoading: boolean;
}

// Hook for TPS chart data
export function useTPSChartData(): TPSChartData {
  const { network } = useNetwork();
  const { data: ledger, isLoading } = useLatestLedger();
  const [tpsData, setTpsDataState] = useState<TPSDataPoint[]>([]);
  const [currentTPS, setCurrentTPS] = useState(0);
  const prevLedgerRef = useRef<{ sequence: number; closedAt: string } | null>(null);

  useEffect(() => {
    // Load stored data on mount
    setTpsDataState(getTPSData(network));
  }, [network]);

  useEffect(() => {
    if (!ledger) return;

    const currentLedger = {
      sequence: ledger.sequence,
      closedAt: ledger.closed_at,
    };

    // Calculate TPS if we have previous ledger
    if (prevLedgerRef.current && prevLedgerRef.current.sequence !== currentLedger.sequence) {
      const prevTime = new Date(prevLedgerRef.current.closedAt).getTime();
      const currTime = new Date(currentLedger.closedAt).getTime();
      const timeDelta = (currTime - prevTime) / 1000; // seconds

      if (timeDelta > 0) {
        const tps = ledger.successful_transaction_count / timeDelta;
        const newPoint: TPSDataPoint = {
          timestamp: currTime,
          tps: Math.round(tps * 100) / 100, // Round to 2 decimal places
        };

        setTpsDataState((prev) => {
          const updated = [...prev, newPoint].slice(-30);
          setTPSData(network, updated);
          return updated;
        });

        setCurrentTPS(newPoint.tps);
      }
    }

    prevLedgerRef.current = currentLedger;
  }, [ledger, network]);

  return {
    data: tpsData,
    currentTPS,
    isLoading,
  };
}

// Hook for accumulated transaction chart data
export function useTxChartData(): TxChartData {
  const { network } = useNetwork();
  const { data: ledger, isLoading } = useLatestLedger();
  const [txData, setTxDataState] = useState<TxHourlyDataPoint[]>([]);
  const prevLedgerSeqRef = useRef<number | null>(null);

  useEffect(() => {
    // Load stored data on mount
    setTxDataState(getTxHourlyData(network));
  }, [network]);

  useEffect(() => {
    if (!ledger || prevLedgerSeqRef.current === ledger.sequence) return;
    prevLedgerSeqRef.current = ledger.sequence;

    const hourTimestamp = getHourTimestamp(new Date(ledger.closed_at));
    const txCount = ledger.successful_transaction_count;

    setTxDataState((prev) => {
      // Find or create hourly bucket
      const existingIndex = prev.findIndex((d) => d.timestamp === hourTimestamp);
      let updated: TxHourlyDataPoint[];

      if (existingIndex >= 0) {
        // Add to existing bucket
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + txCount,
        };
      } else {
        // Create new bucket
        updated = [...prev, { timestamp: hourTimestamp, count: txCount }];
      }

      // Sort by timestamp and prune old data
      updated.sort((a, b) => a.timestamp - b.timestamp);
      setTxHourlyData(network, updated);
      return updated;
    });
  }, [ledger, network]);

  return {
    data: txData,
    isLoading,
    isCollecting: txData.length < 2,
  };
}

// Hook for operations distribution chart
export function useOperationsChartData(): OperationsChartData {
  const { data: txs, isLoading } = useRecentTransactions(100);

  const chartData = useCallback(() => {
    if (!txs?.records?.length) {
      return { data: [], total: 0, successRate: 0 };
    }

    const successful = txs.records.filter((tx) => tx.successful).length;
    const failed = txs.records.length - successful;
    const total = txs.records.length;
    const successRate = Math.round((successful / total) * 100);

    return {
      data: [
        { name: "Successful", value: successful, color: "hsl(var(--chart-2))" },
        { name: "Failed", value: failed, color: "hsl(var(--chart-5))" },
      ],
      total,
      successRate,
    };
  }, [txs]);

  const result = chartData();

  return {
    ...result,
    isLoading,
  };
}
