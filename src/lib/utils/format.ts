import { STROOPS_PER_XLM, HASH_TRUNCATE_LENGTH } from "@/lib/constants";

/**
 * Truncate a hash or address for display
 * Example: "GABCD...WXYZ"
 */
export function truncateHash(
  hash: string,
  startLength = HASH_TRUNCATE_LENGTH,
  endLength = HASH_TRUNCATE_LENGTH
): string {
  if (hash.length <= startLength + endLength + 3) {
    return hash;
  }
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

/**
 * Format stroops to XLM
 */
export function stroopsToXLM(stroops: string | number): string {
  const value = typeof stroops === "string" ? parseInt(stroops, 10) : stroops;
  return (value / STROOPS_PER_XLM).toFixed(7).replace(/\.?0+$/, "");
}

/**
 * Format a number with locale-aware formatting
 */
export function formatNumber(value: string | number, options?: Intl.NumberFormatOptions): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 7,
    ...options,
  }).format(num);
}

/**
 * Format a large number with suffix (K, M, B, T)
 */
export function formatCompactNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a balance with asset code
 */
export function formatBalance(amount: string | number, assetCode = "XLM"): string {
  return `${formatNumber(amount)} ${assetCode}`;
}

/**
 * Parse an asset string in format "CODE-ISSUER" or "native"
 */
export function parseAssetString(assetString: string): {
  code: string;
  issuer: string | null;
  isNative: boolean;
} {
  if (assetString === "native" || assetString === "XLM") {
    return { code: "XLM", issuer: null, isNative: true };
  }

  const parts = assetString.split("-");
  if (parts.length === 2) {
    return { code: parts[0], issuer: parts[1], isNative: false };
  }

  // Assume it's just a code
  return { code: assetString, issuer: null, isNative: false };
}

/**
 * Format a date to relative time (e.g., "5m ago", "2h ago")
 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  // For older dates, show the actual date
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: then.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format a date to full timestamp
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Format ledger sequence number with commas
 */
export function formatLedgerSequence(sequence: number | string): string {
  const num = typeof sequence === "string" ? parseInt(sequence, 10) : sequence;
  return num.toLocaleString("en-US");
}
