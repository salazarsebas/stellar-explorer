---
title: "Contract Spec Decoder & Classification"
description: How the indexer fetches WASM bytecode, parses the contract spec, and classifies contracts as SEP-41 tokens or SEP-50 NFTs.
---

## What This Enables

Every Soroban WASM contract can embed a machine-readable specification directly in the binary, in a custom section called `contractspecv0`. This spec describes the contract's public interface: its functions, their input/output types, custom structs, enums, and error types.

The indexer extracts that spec automatically whenever a new contract is deployed, and use it to:

- **Classify SEP-41 tokens** — contracts with `balance`, `transfer`, `name`, `symbol`, and `decimals` functions, the Soroban equivalent of ERC-20
- **Classify SEP-50 NFTs** — contracts with `owner_of`, `token_uri`, and `balance` functions
- **Store the parsed spec as JSON** — so the explorer's Contract Studio can render a live UI for calling any function on any contract without the user having to know the ABI manually
- **Store the raw WASM bytecode** — for size tracking, hash verification, and future decompilation features

## How It Works

### Detection

When a new contract is created, the Stellar ledger records a `LedgerEntryCreated` change with a `ContractData` entry whose key is `ScvLedgerKeyContractInstance`. `DetectNewContracts` scans all ledger entry changes in the `LedgerCloseMeta` and collects the C-addresses of every new contract instance.

### Spec fetching (async)

For each detected contract, `ProcessContractSpec` runs in a background goroutine so it never blocks ledger ingestion:

1. **Fetch the instance** — `getLedgerEntries` with the contract instance `LedgerKey` → extract the `wasm_hash`
2. **Fetch the code** — `getLedgerEntries` with the `ContractCode` `LedgerKey` for that hash → raw WASM bytes
3. **Parse the `contractspecv0` section** — minimal WASM binary format parser that walks section headers (type byte + LEB128 size) to find the custom section named `contractspecv0`
4. **Decode the spec entries** — the section body is a concatenated sequence of XDR-encoded `SCSpecEntry` values, decoded iteratively with `xdr.NewBytesDecoder`
5. **Classify** — check function names against the required sets for SEP-41 and SEP-50
6. **Upsert** — write to `contract_code` (bytecode, spec XDR, parsed JSON) and `contracts` (classification, token metadata flags)

**Code path:**

```
pipeline/live.go ProcessOneLedger()
  → transform/contract_spec.go DetectNewContracts()     ← synchronous
    → go ProcessContractSpec()                           ← async goroutine
      → source/rpc.go GetLedgerEntries()  (×2: instance + code)
        → extractContractSpecSection()    (WASM parser)
          → decodeContractSpec()          (XDR decoder)
            → classifyAsSep41/Sep50()
              → store/postgres.go UpsertContractCode()
              → store/postgres.go UpsertContract()
```

### WASM binary format

The WASM module format is: `\x00asm` magic + 4-byte version, followed by sections. Each section is:

```
[section_type: u8] [section_size: ULEB128] [section_data: bytes]
```

Section type `0` is a custom section. Its data starts with a length-prefixed name string, followed by the payload. The indexer scans sections until it finds one named `contractspecv0`.

### Spec decoding

`SCSpecEntry` is an XDR union with four kinds:

| Kind | Description |
|---|---|
| `FunctionV0` | A callable function with name, doc, inputs, outputs |
| `UdtStructV0` | A custom struct type |
| `UdtUnionV0` | A custom union/enum type |
| `UdtEnumV0` | An integer enum |
| `UdtErrorEnumV0` | An error enum |

The parsed spec is stored as a JSON array of objects in `contracts.contract_spec` and `contract_code.spec_parsed`.

## Schema

```sql
-- contracts table (key classification fields)
contracts (
  contract_id          TEXT PRIMARY KEY,
  wasm_hash            TEXT,
  is_sep41_token       BOOLEAN,   -- true if implements SEP-41 interface
  is_sep50_nft         BOOLEAN,   -- true if implements SEP-50 interface
  token_name           TEXT,      -- populated later from token metadata calls
  token_symbol         TEXT,
  token_decimals       INT,
  contract_spec        JSONB,     -- parsed spec entries
  contract_type        SMALLINT   -- 0=wasm, 1=stellar_asset, 2=custom
)

-- contract_code table
contract_code (
  wasm_hash      TEXT PRIMARY KEY,
  wasm_bytecode  BYTEA,
  wasm_size      INT,
  spec_xdr       TEXT,   -- base64 raw spec XDR
  spec_parsed    JSONB,  -- parsed function/type list
  contract_count INT     -- how many contracts share this WASM
)
```

## Verifying It Works

### Prerequisites

Docker services running and migrations applied. You need a testnet RPC endpoint since `getLedgerEntries` is not available from the S3 data lake.

### 1. Run the indexer

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet ./bin/indexer live
```

Contract spec processing runs asynchronously. Watch the logs for:

```
contract_spec: processed C1ABC...XYZ (sep41=true sep50=false wasm=34562 bytes)
```

### 2. Check that contracts were detected and stored

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT contract_id, is_sep41_token, is_sep50_nft, contract_type, wasm_hash
FROM contracts
ORDER BY created_at DESC
LIMIT 10;
"
```

### 3. Inspect the parsed contract spec

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT contract_id, jsonb_array_length(contract_spec) as fn_count, contract_spec
FROM contracts
WHERE contract_spec IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;
" 2>/dev/null | head -60
```

Each entry in `contract_spec` has a `kind` and a `name`, for example:

```json
[
  { "kind": "ScSpecEntryKindScSpecEntryFunctionV0", "name": "transfer", "inputs": [...], "outputs": [...] },
  { "kind": "ScSpecEntryKindScSpecEntryFunctionV0", "name": "balance", "inputs": [...], "outputs": [...] },
  ...
]
```

### 4. Find SEP-41 tokens

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT contract_id, wasm_hash, token_name, token_symbol, token_decimals
FROM contracts
WHERE is_sep41_token = true
ORDER BY created_at DESC;
"
```

### 5. Check stored WASM bytecode

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT wasm_hash, wasm_size, contract_count, spec_xdr IS NOT NULL as has_spec
FROM contract_code
ORDER BY created_at DESC
LIMIT 5;
"
```

### 6. Backfill a known ledger range to trigger contract creation

If you want to guarantee contract creation events, backfill a range you know contains deployments:

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet \
  ./bin/indexer backfill --start 1000000 --end 1000500
```

## Notes

- **Async processing**: `ProcessContractSpec` runs in a goroutine and never blocks ledger ingestion. If the RPC call fails (node is slow or the entry has expired), the error is logged and the contract remains in the database with `wasm_hash = NULL`. The spec can be backfilled separately when the RPC is available.
- **Stellar Asset Contracts (SACs)**: SACs are created by the protocol itself when a classic asset is wrapped for Soroban. They do not contain a WASM spec section. The WASM parse will log "contractspecv0 section not found" and the contract is stored with `contract_spec = NULL` and `is_sep41_token = false`. SAC classification (type `1`) will be handled in a future update.
- **Shared WASM**: Many contracts can share the same `wasm_hash` (same bytecode, different instances). The `contract_code.contract_count` field increments on each upsert so you can see how many contracts use each WASM.
- **`wasm_hash` format**: Stored as a lowercase hex string (64 characters), which is the SHA-256 hash of the raw WASM bytecode.
