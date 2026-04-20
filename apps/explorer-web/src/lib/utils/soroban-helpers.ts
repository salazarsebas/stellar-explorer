import { formatNumber } from "./format";

export interface DecodedScVal {
  type: string;
  value: unknown;
}

export type EventPattern = "transfer" | "mint" | "burn" | "approve" | "unknown";
export type EventCategory = "transfer" | "admin" | "error" | "generic";

/**
 * Format a decoded ScVal for display.
 */
export function formatScValDisplay(type: string, value: unknown): string {
  if (type === "scvVoid") return "void";
  if (value === null || value === undefined) return "null";

  switch (type) {
    case "scvAddress":
      return typeof value === "string" ? value : String(value);
    case "scvI128":
    case "scvU128":
    case "scvI256":
    case "scvU256":
      if (typeof value === "bigint") return formatNumber(Number(value));
      if (typeof value === "number") return formatNumber(value);
      return String(value);
    case "scvI64":
    case "scvU64":
    case "scvI32":
    case "scvU32":
      if (typeof value === "number" || typeof value === "bigint")
        return formatNumber(Number(value));
      return String(value);
    case "scvSymbol":
    case "scvString":
      return String(value);
    case "scvBool":
      return value ? "true" : "false";
    case "scvBytes":
      if (value instanceof Uint8Array) {
        return Array.from(value)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
      return String(value);
    case "scvVoid":
      return "void";
    case "scvMap":
    case "scvVec":
      return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
    default:
      return String(value);
  }
}

/**
 * Get the first topic's symbol value (event name) from decoded topics.
 */
function getEventName(topics: DecodedScVal[]): string | null {
  if (topics.length === 0) return null;
  const first = topics[0];
  if (first.type === "scvSymbol" && typeof first.value === "string") {
    return first.value.toLowerCase();
  }
  return null;
}

/**
 * Detect known event pattern from decoded topics.
 */
export function detectEventPattern(topics: DecodedScVal[]): {
  pattern: EventPattern;
  summary: string;
} {
  const name = getEventName(topics);

  if (!name) return { pattern: "unknown", summary: "Event" };

  switch (name) {
    case "transfer": {
      const from = topics[1] ? formatScValDisplay(topics[1].type, topics[1].value) : "?";
      const to = topics[2] ? formatScValDisplay(topics[2].type, topics[2].value) : "?";
      return {
        pattern: "transfer",
        summary: `Transfer: ${truncateAddr(from)} → ${truncateAddr(to)}`,
      };
    }
    case "mint": {
      const to = topics[1] ? formatScValDisplay(topics[1].type, topics[1].value) : "?";
      return { pattern: "mint", summary: `Mint to ${truncateAddr(to)}` };
    }
    case "burn": {
      const from = topics[1] ? formatScValDisplay(topics[1].type, topics[1].value) : "?";
      return { pattern: "burn", summary: `Burn from ${truncateAddr(from)}` };
    }
    case "approve": {
      const from = topics[1] ? formatScValDisplay(topics[1].type, topics[1].value) : "?";
      const spender = topics[2] ? formatScValDisplay(topics[2].type, topics[2].value) : "?";
      return {
        pattern: "approve",
        summary: `Approve: ${truncateAddr(spender)} for ${truncateAddr(from)}`,
      };
    }
    default:
      return { pattern: "unknown", summary: name };
  }
}

function truncateAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/**
 * Categorize event type for color-coding.
 */
export function categorizeEventType(topics: DecodedScVal[]): EventCategory {
  const name = getEventName(topics);
  if (!name) return "generic";

  switch (name) {
    case "transfer":
    case "mint":
    case "burn":
      return "transfer";
    case "approve":
    case "set_admin":
    case "set_authorized":
      return "admin";
    case "error":
      return "error";
    default:
      return "generic";
  }
}

/**
 * Get color classes for an event category.
 */
export function getEventCategoryColor(category: EventCategory): {
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case "transfer":
      return {
        bg: "bg-green-500/10",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-500/25",
      };
    case "admin":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/25",
      };
    case "error":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/25",
      };
    case "generic":
    default:
      return { bg: "bg-chart-1/10", text: "text-chart-1", border: "border-chart-1/25" };
  }
}

/**
 * Check if a string looks like a Stellar address (G...) or contract ID (C...).
 */
export function isAddress(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return (value.startsWith("G") || value.startsWith("C")) && value.length === 56;
}

/**
 * Determine the link path for an address value.
 */
export function getAddressLink(value: string): string {
  if (value.startsWith("C")) return `contract/${value}`;
  return `account/${value}`;
}
