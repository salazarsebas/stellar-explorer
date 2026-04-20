---
title: "Contract Event Extraction & Decoding"
description: How the indexer extracts, decodes, and stores raw Soroban contract events emitted during transaction execution.
---

## What This Enables

Every Soroban smart contract can emit arbitrary events during execution. These are the primary mechanism contracts use to signal state changes to the outside world: a DEX emits a `swap` event, an NFT contract emits a `transfer` event, a governance contract emits a `vote` event.

Without indexing these, it is impossible to build a contract activity feed, search events by topic, or reconstruct what a contract has been doing over time.

With this feature in place, the explorer can:

- Display the full event log for any contract, paginated and searchable
- Show human-readable decoded topics alongside the raw XDR
- Filter events by topic string (e.g. find all `swap` events across a DEX contract)
- Link events back to the transaction and ledger that produced them

## How It Works

Soroban contract events live inside the `TransactionMeta` XDR returned in the `resultMetaXdr` field of `getTransactions`. The location depends on the meta version:

| Meta version | Event location |
|---|---|
| V3 | `meta.V3.SorobanMeta.Events[]` |
| V4 | `meta.V4.Operations[i].Events[]` (per-operation) |

For each transaction, `ContractEventsFromTransaction` in `transform/contract_events.go` decodes the meta, walks the event list, and for each `ContractEvent`:

1. Encodes the topic list as a JSON array of base64 XDR strings (`topics_xdr`)
2. Encodes the event value as base64 XDR (`value_xdr`)
3. Converts topics to human-readable strings via `scValToString` and stores them in `topic_1`–`topic_4` for indexed lookups
4. Stores the decoded value as a JSON string (`value_decoded`)

`scValToString` handles all ScVal types: symbols, strings, booleans, integers (i64, u64, i128, u128), addresses (account G-addresses and contract C-addresses), bytes, maps, and vecs.

Events are batch-inserted into the `contract_events` TimescaleDB hypertable after every ledger.

**Code path:**

```
source/rpc.go (getTransactions resultMetaXdr)
  → transform/contract_events.go ContractEventsFromTransaction()
    → contractEventFromXDR() per event
      → store/postgres.go InsertContractEventBatch()
        → contract_events (TimescaleDB hypertable)
```

## Schema

```sql
contract_events (
  contract_id       TEXT,        -- C-address of the emitting contract
  transaction_hash  TEXT,        -- source transaction
  ledger_sequence   INT,
  type              SMALLINT,    -- 0 contract, 1 system, 2 diagnostic
  topic_1..topic_4  TEXT,        -- decoded, indexed for search
  topics_xdr        TEXT,        -- JSON array of base64 XDR strings
  value_xdr         TEXT,        -- base64 XDR of the event value
  topics_decoded    TEXT,        -- JSON array of human-readable strings
  value_decoded     TEXT,        -- human-readable value string
  created_at        TIMESTAMPTZ
)
```

## Verifying It Works

### Prerequisites

Docker services running and migrations applied. The testnet has active Soroban contracts — any ledger range with Soroban activity will produce events.

### 1. Run the indexer

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet ./bin/indexer live
```

### 2. Check that contract events landed

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT contract_id, topic_1, topic_2, topic_3, value_decoded, transaction_hash
FROM contract_events
ORDER BY created_at DESC
LIMIT 10;
"
```

Most events will have a `topic_1` that is the function name or event name (e.g. `transfer`, `swap`, `mint`).

### 3. Filter by topic to find specific event types

```bash
# Find all transfer events across all contracts
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT contract_id, topic_1, topic_2, topic_3, value_decoded
FROM contract_events
WHERE topic_1 = 'transfer'
ORDER BY created_at DESC
LIMIT 10;
"
```

### 4. Inspect raw XDR alongside decoded output

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT
  contract_id,
  topics_decoded,
  value_decoded,
  topics_xdr
FROM contract_events
WHERE topic_1 IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
"
```

### 5. Count events per contract

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U explorer -d stellar_explorer -c "
SELECT contract_id, COUNT(*) as event_count
FROM contract_events
GROUP BY contract_id
ORDER BY event_count DESC
LIMIT 10;
"
```

### 6. Run the unit tests

```bash
go test ./internal/transform/ -run TestScValToString -v
go test ./internal/transform/ -run TestContractEvents -v
```

These tests cover ScVal decoding for all primitive types (symbol, bool, void, i64, account address) and the empty-meta fast path.

## Notes

- Events with no `contract_id` in the XDR are skipped (they cannot be attributed to a contract).
- `topic_1`–`topic_4` cover the first four topics. Contracts emitting more than four topics will have the extras only in `topics_decoded` and `topics_xdr`.
- Diagnostic events (`type = 2`) are included. They are usually emitted by the Soroban runtime itself, not the contract code.
- A transaction that fails execution still produces no contract events (failed Soroban calls do not emit events).
- Event extraction failures for a single transaction are non-fatal: the ledger is still fully ingested and a warning is logged.
