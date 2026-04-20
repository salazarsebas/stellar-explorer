import { describe, expect, it } from "vitest";
import {
  formatAssetFromFields,
  decodeDataValue,
  parseSorobanFunctionType,
  formatAccountFlags,
  formatTrustLineFlags,
} from "./operation-helpers";

describe("formatAssetFromFields", () => {
  it("returns XLM for native asset type", () => {
    expect(formatAssetFromFields("native")).toEqual({
      code: "XLM",
      issuer: null,
      isNative: true,
    });
  });

  it("returns XLM when no asset type provided", () => {
    expect(formatAssetFromFields()).toEqual({
      code: "XLM",
      issuer: null,
      isNative: true,
    });
  });

  it("returns asset code and issuer for credit_alphanum4", () => {
    expect(
      formatAssetFromFields(
        "credit_alphanum4",
        "USDC",
        "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
      )
    ).toEqual({
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      isNative: false,
    });
  });
});

describe("decodeDataValue", () => {
  it("returns empty for null", () => {
    expect(decodeDataValue(null)).toEqual({ decoded: "", encoding: "empty" });
  });

  it("decodes UTF-8 base64", () => {
    const encoded = btoa("hello world");
    expect(decodeDataValue(encoded)).toEqual({ decoded: "hello world", encoding: "utf8" });
  });

  it("returns hex for binary data", () => {
    const encoded = btoa("\x00\x01\x02");
    const result = decodeDataValue(encoded);
    expect(result.encoding).toBe("hex");
    expect(result.decoded).toBe("0x000102");
  });
});

describe("parseSorobanFunctionType", () => {
  it("returns invoke by default", () => {
    expect(parseSorobanFunctionType()).toEqual({
      type: "invoke",
      displayName: "Invoke Contract",
    });
  });

  it("detects upload wasm", () => {
    expect(parseSorobanFunctionType("HostFunctionTypeUploadContractWasm")).toEqual({
      type: "upload",
      displayName: "Upload WASM",
    });
  });

  it("detects create contract", () => {
    expect(parseSorobanFunctionType("HostFunctionTypeCreateContract")).toEqual({
      type: "create",
      displayName: "Create Contract",
    });
  });

  it("defaults to invoke for unknown strings", () => {
    expect(parseSorobanFunctionType("HostFunctionTypeInvokeContract")).toEqual({
      type: "invoke",
      displayName: "Invoke Contract",
    });
  });
});

describe("formatAccountFlags", () => {
  it("returns empty array for undefined", () => {
    expect(formatAccountFlags(undefined)).toEqual([]);
  });

  it("returns enabled flags", () => {
    expect(
      formatAccountFlags({
        auth_required: true,
        auth_revocable: false,
        auth_immutable: true,
        auth_clawback_enabled: false,
      })
    ).toEqual(["auth_required", "auth_immutable"]);
  });
});

describe("formatTrustLineFlags", () => {
  it("returns set and cleared flags", () => {
    expect(formatTrustLineFlags(1, 4)).toEqual({
      set: ["authorized"],
      cleared: ["clawback_enabled"],
    });
  });

  it("handles no flags", () => {
    expect(formatTrustLineFlags()).toEqual({ set: [], cleared: [] });
  });
});
