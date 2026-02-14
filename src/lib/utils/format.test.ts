import { describe, it, expect } from "vitest";
import {
  truncateHash,
  stroopsToXLM,
  formatNumber,
  formatCompactNumber,
  parseAssetString,
} from "./format";

describe("truncateHash", () => {
  it("truncates long hashes", () => {
    const hash = "GABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOP";
    const result = truncateHash(hash);
    expect(result).toContain("...");
    expect(result.startsWith("GABCDEFG")).toBe(true);
  });

  it("returns short strings as-is", () => {
    expect(truncateHash("short")).toBe("short");
  });

  it("respects custom lengths", () => {
    const hash = "GABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOP";
    const result = truncateHash(hash, 4, 4);
    expect(result).toBe("GABC...MNOP");
  });
});

describe("stroopsToXLM", () => {
  it("converts stroops to XLM", () => {
    expect(stroopsToXLM(10000000)).toBe("1");
    expect(stroopsToXLM("10000000")).toBe("1");
  });

  it("handles decimal amounts", () => {
    expect(stroopsToXLM(5000000)).toBe("0.5");
    expect(stroopsToXLM(100)).toBe("0.00001");
  });

  it("handles zero", () => {
    expect(stroopsToXLM(0)).toBe("0");
  });
});

describe("formatNumber", () => {
  it("formats numbers with locale", () => {
    const result = formatNumber(1234567);
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("567");
  });

  it("handles string input", () => {
    const result = formatNumber("1234.5678");
    expect(result).toContain("1");
  });
});

describe("formatCompactNumber", () => {
  it("formats millions", () => {
    const result = formatCompactNumber(1500000);
    expect(result).toContain("1.5");
    expect(result).toContain("M");
  });

  it("formats thousands", () => {
    const result = formatCompactNumber(1500);
    expect(result).toContain("1.5");
    expect(result).toContain("K");
  });
});

describe("parseAssetString", () => {
  it("parses native asset", () => {
    expect(parseAssetString("native")).toEqual({ code: "XLM", issuer: null, isNative: true });
    expect(parseAssetString("XLM")).toEqual({ code: "XLM", issuer: null, isNative: true });
  });

  it("parses asset with issuer", () => {
    const result = parseAssetString(
      "USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(result.code).toBe("USDC");
    expect(result.issuer).toBe("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
    expect(result.isNative).toBe(false);
  });

  it("parses code-only asset", () => {
    const result = parseAssetString("USDC");
    expect(result.code).toBe("USDC");
    expect(result.issuer).toBeNull();
    expect(result.isNative).toBe(false);
  });
});
