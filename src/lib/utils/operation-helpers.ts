/**
 * Pure utility functions for formatting operation data from Horizon API responses.
 */

export function formatAssetFromFields(
  assetType?: string,
  assetCode?: string,
  assetIssuer?: string
): { code: string; issuer: string | null; isNative: boolean } {
  if (!assetType || assetType === "native") {
    return { code: "XLM", issuer: null, isNative: true };
  }
  return { code: assetCode || "unknown", issuer: assetIssuer || null, isNative: false };
}

export function decodeDataValue(base64Value: string | null | undefined): {
  decoded: string;
  encoding: "utf8" | "hex" | "empty";
} {
  if (!base64Value) {
    return { decoded: "", encoding: "empty" };
  }

  try {
    const decoded = atob(base64Value);
    // Check if it's printable UTF-8
    const isPrintable = /^[\x20-\x7E\t\n\r]*$/.test(decoded);
    if (isPrintable && decoded.length > 0) {
      return { decoded, encoding: "utf8" };
    }
    // Fall back to hex
    const hex = Array.from(decoded)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    return { decoded: `0x${hex}`, encoding: "hex" };
  } catch {
    return { decoded: base64Value, encoding: "hex" };
  }
}

export function parseSorobanFunctionType(functionString?: string): {
  type: "invoke" | "upload" | "create";
  displayName: string;
} {
  if (!functionString) {
    return { type: "invoke", displayName: "Invoke Contract" };
  }
  if (functionString.includes("HostFunctionTypeUploadContractWasm")) {
    return { type: "upload", displayName: "Upload WASM" };
  }
  if (functionString.includes("HostFunctionTypeCreateContract")) {
    return { type: "create", displayName: "Create Contract" };
  }
  return { type: "invoke", displayName: "Invoke Contract" };
}

export function formatAccountFlags(flags: Record<string, boolean> | undefined): string[] {
  if (!flags) return [];
  const result: string[] = [];
  if (flags.auth_required) result.push("auth_required");
  if (flags.auth_revocable) result.push("auth_revocable");
  if (flags.auth_immutable) result.push("auth_immutable");
  if (flags.auth_clawback_enabled) result.push("clawback_enabled");
  return result;
}

const TRUST_LINE_FLAG_NAMES: Record<number, string> = {
  1: "authorized",
  2: "authorized_to_maintain_liabilities",
  4: "clawback_enabled",
};

export function formatTrustLineFlags(
  setFlags?: number,
  clearFlags?: number
): { set: string[]; cleared: string[] } {
  const set: string[] = [];
  const cleared: string[] = [];

  for (const [bit, name] of Object.entries(TRUST_LINE_FLAG_NAMES)) {
    const bitNum = Number(bit);
    if (setFlags && (setFlags & bitNum) !== 0) set.push(name);
    if (clearFlags && (clearFlags & bitNum) !== 0) cleared.push(name);
  }

  return { set, cleared };
}
