import { describe, it, expect } from "vitest";
import { decodeTransactionEnvelope } from "./xdr-decoder";

describe("decodeTransactionEnvelope", () => {
  it("returns null for empty/undefined input", () => {
    expect(decodeTransactionEnvelope("")).toBeNull();
    expect(decodeTransactionEnvelope(undefined as unknown as string)).toBeNull();
  });

  it("returns null for invalid XDR", () => {
    expect(decodeTransactionEnvelope("not-valid-xdr")).toBeNull();
  });

  it("accepts network parameter", () => {
    expect(decodeTransactionEnvelope("", "testnet")).toBeNull();
    expect(decodeTransactionEnvelope("", "futurenet")).toBeNull();
  });
});
