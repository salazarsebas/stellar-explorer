---
title: "CAP-67 Token Event Processing"
description: How the indexer extracts unified token transfer events from every ledger using the Stellar Token Transfer Processor.
---

## What This Enables

Before CAP-67, tracking token movements on Stellar required separate pipelines: ledger state diffs for classic assets and contract event logs for Soroban tokens. They used different formats, different APIs, and had no common schema.

CAP-67 introduces a **single unified event stream** that covers every token value movement on the network regardless of whether the asset is a classic Stellar asset (XLM, USDC) or a pure Soroban token. This task implements the indexer side of that stream.

With this in place, the explorer can:

- Show a complete transfer history for any account without merging two different data sources
- Display mint, burn, and clawback events alongside regular transfers in a single unified feed
- Track fee payments as first-class events, not as metadata buried inside transaction envelopes
- Compute circulating supply for any token as `SUM(mint) - SUM(burn)`, directly from the database

## How It Works

The indexer uses the **Token Transfer Processor** (TTP) from `github.com/stellar/go-stellar-sdk/processors/token_transfer`. For each ledger, `TokenEventsFromLedgerMeta` decodes the `LedgerCloseMeta` XDR that the RPC returns in the `metadataXdr` field of `getLedgers`, and feeds it to `EventsProcessor.EventsFromLedger()`.

The TTP normalises everything into `TokenTransferEvent` protobuf messages. Each event carries:

| Field | Description |
|---|---|
| `event_type` | `0` transfer · `1` mint · `2` burn · `3` clawback · `4` fee |
| `from_address` / `to_address` | Sender and receiver (with muxed variants) |
| `asset_type` | `0` native · `1` classic credit · `2` pure Soroban token |
| `asset_code` / `asset_issuer` | Present for credit assets |
| `asset_contract_id` | Present for Soroban tokens and SAC-wrapped classic assets |
| `amount` | i128 raw value as a decimal string |
| `ledger_sequence` / `transaction_hash` | Traceability back to the source |

These are batch-inserted into the `token_events` TimescaleDB hypertable after every ledger.

**Code path:**

```
source/rpc.go (getLedgers metadataXdr)
  → transform/token_events.go TokenEventsFromLedgerMeta()
    → TTP EventsProcessor.EventsFromLedger()
      → store/postgres.go InsertTokenEventBatch()
        → token_events (TimescaleDB hypertable)
```

## Verifying It Works

### Prerequisites

Docker services running and migrations applied (see the [indexer README](https://github.com/salazarsebas/stellar-explorer/blob/main/indexer/README.md)).

### 1. Run the indexer against testnet

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet ./bin/indexer live
```

Wait for a few ledgers to be ingested (watch for `ingested ledger XXXXXXX` in the logs).

### 2. Check that token events landed

```bash
docker compose exec postgres psql -U explorer -d stellar_explorer -c "
SELECT event_type_name, from_address, to_address, asset_code, amount, transaction_hash
FROM token_events
ORDER BY created_at DESC
LIMIT 10;
"
```

You should see rows with `transfer`, `fee`, `mint`, or `burn` in the `event_type_name` column.

### 3. Inspect a specific event type

```bash
# Native XLM fee events (present in almost every ledger)
docker compose exec postgres psql -U explorer -d stellar_explorer -c "
SELECT event_type_name, from_address, asset_code, amount, ledger_sequence
FROM token_events
WHERE event_type_name = 'fee'
ORDER BY created_at DESC
LIMIT 5;
"

# Transfers (classic + Soroban)
docker compose exec postgres psql -U explorer -d stellar_explorer -c "
SELECT event_type_name, from_address, to_address, asset_type, asset_code, asset_contract_id, amount
FROM token_events
WHERE event_type_name = 'transfer'
ORDER BY created_at DESC
LIMIT 10;
"

# Transfers involving a contract address on either side (Soroban-native activity)
docker compose exec postgres psql -U explorer -d stellar_explorer -c "
SELECT
  event_type_name,
  from_address,
  CASE WHEN from_address LIKE 'C%' THEN true ELSE false END AS from_is_contract,
  to_address,
  CASE WHEN to_address LIKE 'C%' THEN true ELSE false END AS to_is_contract,
  asset_type,
  asset_code,
  asset_contract_id,
  amount,
  transaction_hash
FROM token_events
WHERE event_type_name = 'transfer'
  AND (from_address LIKE 'C%' OR to_address LIKE 'C%')
ORDER BY created_at DESC
LIMIT 10;
"
```

### 4. Count by type to see the breakdown

```bash
docker compose exec postgres psql -U explorer -d stellar_explorer -c "
SELECT event_type_name, COUNT(*) as total
FROM token_events
GROUP BY event_type_name
ORDER BY total DESC;
"
```

### 5. Run the unit tests

```bash
go test ./internal/transform/ -run TestTokenEvent -v
```

These tests exercise the proto-to-store mapping for transfer, mint, Soroban token, and fee events without hitting the network.

## Notes

- Fee events have no `operation_index` (they are not tied to a specific operation).
- Pure Soroban tokens (`asset_type = 2`) have no `asset_code` or `asset_issuer` — only `asset_contract_id`.
- `amount` is stored as a raw i128 decimal string. Formatting it for display requires the token's `decimals` value from the `contracts` table (populated by Task 3.3).
- If `metadataXdr` is missing from a ledger (possible on older protocol versions), the processor returns an empty list and the ledger is still ingested without error.
