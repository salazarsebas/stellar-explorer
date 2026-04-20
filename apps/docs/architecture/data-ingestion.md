# Data Ingestion: Deep Dive

> How to access, ingest, and index the complete history of Stellar blockchain data.
> Companion document to [architecture.md](./architecture.md).

## Overview

The ingestion pipeline is the critical path between the Stellar network and our database. It must handle three distinct workloads:

1. **Live streaming** — Ingest new ledgers in real-time (~1 every 5 seconds)
2. **Historical backfill** — Import the full Soroban history (Protocol v20+, July 2023) and optionally all classic history from genesis
3. **Gap recovery** — Detect and fill any missed ledgers

## Data Sources

### 1. Stellar RPC (Primary for Live Data)

The Stellar RPC (JSON-RPC 2.0) is the recommended API for accessing current network data.

**Key methods used by the ingestion pipeline:**

| Method                | Purpose                                                      | Retention                            |
| --------------------- | ------------------------------------------------------------ | ------------------------------------ |
| `getTransactions`     | Paginated transaction list from a starting ledger            | 7 days                               |
| `getEvents`           | Contract events filtered by ledger range, contract ID, topic | 7 days                               |
| `getLedgers`          | Ledger metadata (supports Data Lake for full history)        | 7 days local, infinite via Data Lake |
| `getLedgerEntries`    | Live account/contract state (10 types)                       | Current state only                   |
| `getLatestLedger`     | Latest known ledger                                          | Current                              |
| `simulateTransaction` | Trial-run contract invocation (for Read Contract)            | N/A                                  |

**Limitations for indexing:**

- 7-day maximum history for transactions and events (local retention)
- No SSE/streaming — must poll (every ~5s)
- No operation/effect decomposition — raw XDR must be parsed
- No relationship queries (all txs for account X) — requires our index
- Maximum 200 transactions per `getTransactions` call (200 for `getLedgers` too; only `getEvents` allows up to 10,000)

**RPC providers:** See the full list at [Stellar RPC Providers](https://developers.stellar.org/docs/data/apis/rpc/providers). Includes Gateway, OBSRVR, QuickNode, Ankr, Blockdaemon, Validation Cloud, NowNodes, and others — some offering extended archive access beyond the default 7-day retention.

### 2. RPC Data Lake (Historical Ledgers)

Since RPC v23.0, the `getLedgers` endpoint supports **infinite scroll** via cloud storage integration.

**Public Data Lake:**

- **S3:** `s3://aws-public-blockchain/v1.1/stellar/ledgers/pubnet`
- **GCS:** Available via equivalent bucket
- **Size:** ~3.8 TB, growing ~0.5 TB/year
- **Format:** `LedgerCloseMeta` XDR files organized by ledger sequence ranges
- **Coverage:** Full history from genesis to present

**How it works:**

1. Configure the RPC server with `--data-lake-path` pointing to S3/GCS
2. Call `getLedgers(startLedger: X)` for any ledger, even years old
3. RPC fetches the `LedgerCloseMeta` from cloud storage and returns it
4. Only `getLedgers` supports this — other endpoints remain local-only

**For our pipeline:** We can use the Data Lake for the full backfill instead of running Captive Core or relying on Hubble for raw ledger data. The pipeline reads `LedgerCloseMeta` directly and processes it through our transformer.

### 3. Horizon SSE (Streaming Supplement)

Horizon's Server-Sent Events (SSE) provides real-time streaming for 8 resource types.

**Relevant streams:**

- `GET /ledgers` (cursor=now, stream) — new ledger notifications
- `GET /transactions` (cursor=now, stream) — new transactions with decoded operations
- `GET /operations` (cursor=now, stream) — new operations
- `GET /effects` (cursor=now, stream) — new effects
- `GET /payments` (cursor=now, stream) — payment operations only

**Why use Horizon alongside RPC:**

- Horizon provides **pre-decomposed operations and effects** — RPC only gives raw XDR
- Horizon SSE is push-based (no polling overhead)
- Horizon provides rich relationship endpoints (transactions for account, etc.)

**Limitation:** Horizon is deprecated; no new features, especially for Soroban. SDF's public Horizon retains only 1 year of history.

### 4. Hubble (BigQuery — Analytics & Backfill)

**Dataset:** `crypto-stellar.crypto_stellar` on Google BigQuery

**Key tables for backfill:**

| Table                     | Contents                                      | Partitioning     |
| ------------------------- | --------------------------------------------- | ---------------- |
| `history_transactions`    | All historical transactions                   | `batch_run_date` |
| `history_ledgers`         | All ledger metadata                           | `batch_run_date` |
| `history_contract_events` | Soroban contract events (decoded topics/data) | `batch_run_date` |

**Enriched tables** (`crypto_stellar_dbt`):

| Table                         | Contents                     |
| ----------------------------- | ---------------------------- |
| `enriched_history_operations` | Operations with full context |
| `contract_data_current`       | Current contract state       |
| `offers_current`              | Current active offers        |
| `liquidity_pools_current`     | Current pool state           |

**Access pattern:**

```sql
-- Example: Export all Soroban transactions from Hubble
SELECT
    transaction_hash,
    ledger_sequence,
    source_account,
    fee_charged,
    successful,
    created_at
FROM `crypto-stellar.crypto_stellar.history_transactions`
WHERE batch_run_date >= '2023-07-01'  -- Protocol v20 activation
  AND soroban_operation = TRUE
ORDER BY ledger_sequence ASC;
```

**Cost:** $5/TB scanned. First 1 TB/month free. Use date partitioning filters to minimize cost.

**Data freshness:** Intraday batches every ~30 minutes. Not suitable for real-time.

### 5. Stellar Ingest SDK (Direct Processing)

The Go-based Ingest SDK (`github.com/stellar/go-stellar-sdk`) provides programmatic access to ledger metadata.

**Key packages:**

| Package             | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `ingest`            | Parse `LedgerCloseMeta` into `LedgerTransaction` models |
| `xdr`               | Complete Go bindings to Stellar's XDR data model        |
| `historyarchive`    | Access history archive files                            |
| `datastore/storage` | Wrappers for cloud storage (S3/GCS)                     |
| `amount`            | Stroop ↔ decimal conversion                             |

**Two data access patterns:**

1. **Ledger Entries** (state snapshots) — checkpoint ledger state (every 64 ledgers)
2. **Ledger Metadata** (event log) — all transactions, operations, state changes, events

**Token Transfer Processor (TTP):**

A ready-made Go package for processing CAP-67 events:

```go
import "github.com/stellar/go-stellar-sdk/processors/token_transfer"

// Three granularity levels:
events := ttp.EventsFromLedger(ledgerCloseMeta)
events := ttp.EventsFromTransaction(ledgerCloseMeta, txIndex)
events := ttp.EventsFromOperation(ledgerCloseMeta, txIndex, opIndex)
```

---

## Ingestion Pipeline Architecture

### Component Design

```
┌──────────────────────────────────────────────────────────────────┐
│                      INGESTION PIPELINE (Go)                      │
│                                                                    │
│  ┌─────────────────────┐                                          │
│  │   Source Manager     │  Selects data source based on mode:     │
│  │                      │  • Live: RPC polling every 5s            │
│  │                      │  • Backfill: Data Lake sequential read   │
│  │                      │  • Recovery: targeted gap fills          │
│  └──────────┬───────────┘                                          │
│             │ LedgerCloseMeta                                      │
│             ▼                                                      │
│  ┌──────────────────────┐                                          │
│  │   XDR Parser         │  Decodes raw XDR into typed Go structs: │
│  │                      │  • TransactionEnvelope → operations      │
│  │                      │  • TransactionResult → success/failure   │
│  │                      │  • TransactionMeta → state changes       │
│  └──────────┬───────────┘                                          │
│             │ Parsed data                                          │
│             ▼                                                      │
│  ┌──────────────────────┐                                          │
│  │   Transformer        │  Extracts and enriches:                  │
│  │                      │  • Operations (26+ types → JSONB)        │
│  │                      │  • Effects (from state diffs)            │
│  │                      │  • CAP-67 token events (via TTP)         │
│  │                      │  • Contract events (topic/value decode)  │
│  │                      │  • Contract creation/invocation details  │
│  │                      │  • Account state updates                 │
│  │                      │  • Asset supply changes                  │
│  └──────────┬───────────┘                                          │
│             │ Transformed records                                  │
│             ▼                                                      │
│  ┌──────────────────────┐                                          │
│  │   Writer (Batch)     │  Writes to destinations:                 │
│  │                      │  • PostgreSQL (COPY for bulk, INSERT for │
│  │                      │    live) — one DB transaction per ledger  │
│  │                      │  • Redis PUBLISH for SSE distribution    │
│  │                      │  • Typesense for search index updates    │
│  └──────────┬───────────┘                                          │
│             │                                                      │
│             ▼                                                      │
│  ┌──────────────────────┐                                          │
│  │   State Manager      │  Cursor management:                      │
│  │                      │  • Updates ingestion_state table         │
│  │                      │  • Gap detection (every 5 minutes)       │
│  │                      │  • Reprocessing of failed ledgers        │
│  └──────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────┘
```

### Processing a Single Ledger

For each `LedgerCloseMeta` received:

```
1. Parse ledger header
   → ledger sequence, hash, closed_at, protocol_version, fees

2. For each transaction in the ledger:
   a. Parse TransactionEnvelope
      → source account, fee, memo, time bounds, operations list

   b. Parse TransactionResult
      → success/failure, per-operation results

   c. Parse TransactionMeta (version-dispatched)
      → V0/V1/V2: LedgerEntryChanges (state diffs)
      → V3: Soroban events, diagnostics
      → V4: CAP-67 unified events, OperationMetaV2

   d. For each operation:
      i.  Decode operation type and parameters
      ii. If INVOKE_HOST_FUNCTION:
          - Extract contract_id, function_name, arguments
          - Parse SorobanAuthorizedInvocation (auth tree)
          - Extract SorobanResources (CPU, read/write bytes)
      iii. Compute operation effects from state diffs

   e. Extract CAP-67 token events (via Token Transfer Processor)
      → transfer, mint, burn, clawback, fee events

   f. Extract Soroban contract events
      → topic decode (ScVal → typed), value decode

3. Compute account state updates
   → Balance changes, new accounts, trustline updates

4. Compute asset stats updates
   → Supply changes, holder count changes

5. Detect new contracts
   → Parse createContract invocations, store WASM hash
   → Fetch and parse contract spec from WASM custom section
   → Classify: is_sep41_token, is_sep50_nft

6. Batch write to PostgreSQL (single transaction)
   → INSERT ledger, transactions, operations, effects,
     contract_events, token_events
   → UPSERT accounts, trustlines, contracts, contract_storage

7. Publish events to Redis
   → PUBLISH stream:ledgers {ledger_summary}
   → PUBLISH stream:transactions {tx_summaries}
   → PUBLISH stream:contract_events:{contract_id} {events}

8. Update ingestion cursor
   → SET ingestion_state.last_ingested_ledger = sequence
```

### Live Mode (Steady State)

```
┌─────────────────────────────────────────────────────────────┐
│  Live Ingestion Loop                                         │
│                                                              │
│  while true:                                                 │
│    latestLedger = RPC.getLatestLedger()                     │
│    lastProcessed = DB.getIngestionState('last_ingested')    │
│                                                              │
│    if latestLedger > lastProcessed:                          │
│      for seq = lastProcessed+1 to latestLedger:             │
│        meta = RPC.getLedgers(startLedger=seq)                │
│        processLedger(meta)                                   │
│    else:                                                     │
│      sleep(1s)  // wait for new ledger                      │
│                                                              │
│    every 5 minutes:                                          │
│      detectAndFillGaps()                                     │
└─────────────────────────────────────────────────────────────┘
```

**Throughput:** ~1 ledger/5s = ~17,280 ledgers/day. With batch sizes of 10-100 ledgers, the pipeline comfortably keeps up.

### Backfill Mode (Historical Import)

```
┌─────────────────────────────────────────────────────────────┐
│  Historical Backfill (Parallel Workers)                      │
│                                                              │
│  totalRange = targetLedger - startLedger                     │
│  chunkSize = totalRange / numWorkers                         │
│                                                              │
│  for i = 0 to numWorkers-1:                                  │
│    start = startLedger + (i * chunkSize)                     │
│    end = start + chunkSize - 1                               │
│    go worker(i, start, end)                                  │
│                                                              │
│  worker(id, start, end):                                     │
│    for seq = start to end step batchSize:                    │
│      batch = DataLake.getLedgers(startLedger=seq, limit=100) │
│      for each meta in batch:                                 │
│        processLedger(meta)                                   │
│      reportProgress(id, seq)                                 │
│                                                              │
│  // Estimated time for full Soroban history:                 │
│  // ~5M ledgers / (100 ledgers/s * 8 workers) ≈ 1.7 hours  │
└─────────────────────────────────────────────────────────────┘
```

**Parallelism:** 8-16 workers, each processing a disjoint range of ledgers. Workers write directly to PostgreSQL via connection pool. No ordering conflicts because each worker writes different ledger ranges.

**Data Lake access:** The RPC Data Lake stores `LedgerCloseMeta` files in cloud storage, organized by ledger sequence ranges (e.g., `ledgers/50000000-50000063.xdr.zstd`). Each file contains 64 ledgers (one checkpoint). Workers can download and process these files in parallel.

---

## Contract Spec Processing

When a new contract is detected (via `createContract` invocation), the pipeline:

1. **Fetches WASM bytecode** via `getLedgerEntries` (two-step: instance → code)
2. **Parses the WASM custom section** containing the contract spec in XDR format
3. **Extracts function signatures:**
   ```
   {
     "functions": [
       {
         "name": "swap",
         "inputs": [
           {"name": "amount_in", "type": "i128"},
           {"name": "amount_out_min", "type": "i128"},
           {"name": "path", "type": "Vec<Address>"},
           {"name": "to", "type": "Address"},
           {"name": "deadline", "type": "u32"}
         ],
         "outputs": [{"type": "Vec<i128>"}]
       }
     ],
     "structs": [...],
     "enums": [...],
     "errors": [...]
   }
   ```
4. **Classifies the contract:**
   - Has `balance`, `transfer`, `name`, `symbol`, `decimals` → `is_sep41_token = true`
   - Has `owner_of`, `token_uri`, `balance` → `is_sep50_nft = true`
5. **Caches SEP-41 metadata** by calling `simulateTransaction` for `name()`, `symbol()`, `decimals()`
6. **Stores parsed spec** as JSONB in `contracts.contract_spec` and `contract_code.spec_parsed`

---

## Soroban Event Decoding

Contract events contain ScVal-encoded topics and values. The pipeline decodes these:

### Topic Decoding

```go
// Topics are ScVal arrays. Common patterns:
// topic[0] = Symbol (event name, e.g., "transfer", "swap", "mint")
// topic[1] = Address (from/to)
// topic[2] = Address (from/to)
// topic[3] = String (asset identifier for CAP-67)

func decodeTopics(topics []xdr.ScVal) DecodedTopics {
    result := DecodedTopics{}
    for i, topic := range topics {
        switch topic.Type {
        case xdr.ScValTypeScvSymbol:
            result[i] = string(topic.MustSym())
        case xdr.ScValTypeScvAddress:
            result[i] = addressToString(topic.MustAddress())
        case xdr.ScValTypeScvString:
            result[i] = string(topic.MustStr())
        case xdr.ScValTypeScvI128:
            result[i] = i128ToString(topic.MustI128())
        // ... other ScVal types
        }
    }
    return result
}
```

### Value Decoding

```go
// Values contain the event data (amounts, token IDs, etc.)
func decodeValue(val xdr.ScVal) interface{} {
    switch val.Type {
    case xdr.ScValTypeScvI128:
        return i128ToBigInt(val.MustI128())
    case xdr.ScValTypeScvMap:
        // Map with keys like "amount", "to_muxed_id"
        return decodeMap(val.MustMap())
    case xdr.ScValTypeScvU32:
        return val.MustU32()
    case xdr.ScValTypeScvBool:
        return val.MustB()
    // ... all ScVal types
    }
}
```

---

## Backfill Options Comparison

| Approach                                  | Coverage               | Speed                        | Cost                    | Complexity                |
| ----------------------------------------- | ---------------------- | ---------------------------- | ----------------------- | ------------------------- |
| **RPC Data Lake** (recommended)           | Full history (genesis) | ~2 hours (8 workers)         | Free (S3/GCS public)    | Medium — use Ingest SDK   |
| **Hubble BigQuery export**                | Full history (genesis) | ~4-8 hours (export + import) | ~$20-50 (BigQuery scan) | Low — SQL export to CSV   |
| **Captive Core replay**                   | Full history (genesis) | ~24-48 hours                 | Free (self-hosted)      | High — manage Core binary |
| **Galexie + Consumer**                    | Configurable range     | ~4-8 hours                   | Infrastructure cost     | High — manage pipeline    |
| **Third-party indexer** (Mercury, OBSRVR) | Varies                 | Instant (API call)           | Subscription            | Low — but dependency      |

**Recommended approach:**

1. Use **RPC Data Lake** for raw `LedgerCloseMeta` — fastest, free, and gives us full control over parsing
2. Supplement with **Hubble** for pre-computed analytics data (enriched operations, trade aggregations) that would be expensive to recompute
3. Use **Horizon SSE** for the real-time streaming supplement (operations, effects decomposition)

---

## Monitoring & Alerting

| Metric                                         | Threshold     | Alert                   |
| ---------------------------------------------- | ------------- | ----------------------- |
| Ingestion lag (current ledger - last ingested) | > 10 ledgers  | Warning                 |
| Ingestion lag                                  | > 100 ledgers | Critical                |
| Processing time per ledger                     | > 5 seconds   | Warning                 |
| Write errors                                   | Any           | Critical                |
| Gap count                                      | > 0           | Warning (auto-recovery) |
| Disk usage                                     | > 80%         | Warning                 |
| PostgreSQL replication lag                     | > 30 seconds  | Warning                 |
| Redis memory                                   | > 80%         | Warning                 |

**Health endpoint:** `GET /api/health/ingestion`

```json
{
  "status": "healthy",
  "latest_network_ledger": 55000100,
  "last_ingested_ledger": 55000098,
  "ingestion_lag_seconds": 10,
  "backfill_progress": "100%",
  "processing_rate_ledgers_per_sec": 0.2
}
```

---

## Disaster Recovery

| Scenario              | Recovery Strategy                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Pipeline crash        | Auto-restart via Kubernetes. Resumes from `ingestion_state.last_ingested_ledger`. No data loss. |
| Database failure      | Restore from point-in-time backup. Re-ingest from last checkpoint ledger.                       |
| Corrupted data        | Re-ingest affected ledger range from Data Lake. Idempotent writes (UPSERT) prevent duplicates.  |
| RPC provider outage   | Failover to backup RPC provider. Multiple providers configured.                                 |
| Data Lake unavailable | Fall back to Hubble BigQuery export for historical data. Use Horizon for recent data.           |

**Idempotency:** All writes are idempotent. Re-processing a ledger produces identical results. This is achieved via:

- `ON CONFLICT DO UPDATE` for state tables (accounts, trustlines, contracts, storage)
- `INSERT ... ON CONFLICT DO NOTHING` for immutable data (transactions, operations, effects, events)
- The `ingestion_state` cursor ensures we never skip a ledger
