import { describe, it, expect } from "vitest";
import {
  formatScValDisplay,
  detectEventPattern,
  categorizeEventType,
  isAddress,
  getAddressLink,
} from "./soroban-helpers";

describe("formatScValDisplay", () => {
  it("formats addresses as-is", () => {
    expect(formatScValDisplay("scvAddress", "GABC1234")).toBe("GABC1234");
  });

  it("formats bigint numbers", () => {
    expect(formatScValDisplay("scvI128", BigInt(1000000))).toBe("1,000,000");
  });

  it("formats regular numbers", () => {
    expect(formatScValDisplay("scvU64", 42)).toBe("42");
  });

  it("formats symbols", () => {
    expect(formatScValDisplay("scvSymbol", "transfer")).toBe("transfer");
  });

  it("formats booleans", () => {
    expect(formatScValDisplay("scvBool", true)).toBe("true");
    expect(formatScValDisplay("scvBool", false)).toBe("false");
  });

  it("formats void", () => {
    expect(formatScValDisplay("scvVoid", null)).toBe("void");
  });

  it("formats null", () => {
    expect(formatScValDisplay("scvString", null)).toBe("null");
  });

  it("formats bytes as hex", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(formatScValDisplay("scvBytes", bytes)).toBe("deadbeef");
  });
});

describe("detectEventPattern", () => {
  it("detects transfer pattern", () => {
    const topics = [
      { type: "scvSymbol", value: "transfer" },
      { type: "scvAddress", value: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV" },
      { type: "scvAddress", value: "GXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJ" },
    ];
    const result = detectEventPattern(topics);
    expect(result.pattern).toBe("transfer");
    expect(result.summary).toContain("Transfer");
  });

  it("detects mint pattern", () => {
    const topics = [
      { type: "scvSymbol", value: "mint" },
      { type: "scvAddress", value: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV" },
    ];
    const result = detectEventPattern(topics);
    expect(result.pattern).toBe("mint");
    expect(result.summary).toContain("Mint");
  });

  it("detects burn pattern", () => {
    const topics = [
      { type: "scvSymbol", value: "burn" },
      { type: "scvAddress", value: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV" },
    ];
    const result = detectEventPattern(topics);
    expect(result.pattern).toBe("burn");
  });

  it("detects approve pattern", () => {
    const topics = [
      { type: "scvSymbol", value: "approve" },
      { type: "scvAddress", value: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV" },
      { type: "scvAddress", value: "GXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJ" },
    ];
    const result = detectEventPattern(topics);
    expect(result.pattern).toBe("approve");
  });

  it("returns unknown for empty topics", () => {
    expect(detectEventPattern([]).pattern).toBe("unknown");
  });

  it("returns unknown for non-symbol first topic", () => {
    const topics = [{ type: "scvI32", value: 42 }];
    expect(detectEventPattern(topics).pattern).toBe("unknown");
  });

  it("returns unknown pattern with name for unrecognized symbols", () => {
    const topics = [{ type: "scvSymbol", value: "custom_event" }];
    const result = detectEventPattern(topics);
    expect(result.pattern).toBe("unknown");
    expect(result.summary).toBe("custom_event");
  });
});

describe("categorizeEventType", () => {
  it("categorizes transfer events", () => {
    expect(categorizeEventType([{ type: "scvSymbol", value: "transfer" }])).toBe("transfer");
    expect(categorizeEventType([{ type: "scvSymbol", value: "mint" }])).toBe("transfer");
    expect(categorizeEventType([{ type: "scvSymbol", value: "burn" }])).toBe("transfer");
  });

  it("categorizes admin events", () => {
    expect(categorizeEventType([{ type: "scvSymbol", value: "approve" }])).toBe("admin");
    expect(categorizeEventType([{ type: "scvSymbol", value: "set_admin" }])).toBe("admin");
  });

  it("categorizes error events", () => {
    expect(categorizeEventType([{ type: "scvSymbol", value: "error" }])).toBe("error");
  });

  it("categorizes generic events", () => {
    expect(categorizeEventType([{ type: "scvSymbol", value: "something" }])).toBe("generic");
    expect(categorizeEventType([])).toBe("generic");
  });
});

describe("isAddress", () => {
  it("recognizes G addresses", () => {
    // 56 chars: G + 55
    expect(isAddress("G" + "A".repeat(55))).toBe(true);
  });

  it("recognizes C addresses", () => {
    expect(isAddress("C" + "A".repeat(55))).toBe(true);
  });

  it("rejects short strings", () => {
    expect(isAddress("GABC")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isAddress(42)).toBe(false);
  });
});

describe("getAddressLink", () => {
  it("links C addresses to contract", () => {
    expect(getAddressLink("CABC")).toBe("contract/CABC");
  });

  it("links G addresses to account", () => {
    expect(getAddressLink("GABC")).toBe("account/GABC");
  });
});
