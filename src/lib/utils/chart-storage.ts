import type { NetworkKey } from "@/types";

// Storage keys with network namespace
const STORAGE_KEYS = {
  tpsData: (network: NetworkKey) => `stellar_charts_tps_${network}`,
  txHourly: (network: NetworkKey) => `stellar_charts_tx_hourly_${network}`,
} as const;

export interface TPSDataPoint {
  timestamp: number;
  tps: number;
}

export interface TxHourlyDataPoint {
  timestamp: number; // Hour start timestamp
  count: number;
}

// Check if localStorage is available (SSR-safe)
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Generic get function
function getStoredData<T>(key: string): T | null {
  if (!isStorageAvailable()) return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Generic set function
function setStoredData<T>(key: string, data: T): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or other error - silently fail
  }
}

// TPS Data functions
export function getTPSData(network: NetworkKey): TPSDataPoint[] {
  return getStoredData<TPSDataPoint[]>(STORAGE_KEYS.tpsData(network)) || [];
}

export function setTPSData(network: NetworkKey, data: TPSDataPoint[]): void {
  // Keep only last 30 points (~2.5 minutes)
  const trimmed = data.slice(-30);
  setStoredData(STORAGE_KEYS.tpsData(network), trimmed);
}

// Transaction hourly data functions
export function getTxHourlyData(network: NetworkKey): TxHourlyDataPoint[] {
  return getStoredData<TxHourlyDataPoint[]>(STORAGE_KEYS.txHourly(network)) || [];
}

export function setTxHourlyData(network: NetworkKey, data: TxHourlyDataPoint[]): void {
  // Keep only last 24 hours
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const pruned = data.filter((d) => d.timestamp > cutoff);
  setStoredData(STORAGE_KEYS.txHourly(network), pruned);
}

// Get hour start timestamp
export function getHourTimestamp(date: Date = new Date()): number {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}
