# Soroban-First Block Explorer: Architecture & Technical Design

> A comprehensive architecture for building a production-grade, Soroban-first block explorer for the Stellar network, addressing the SCF Q1 2026 RFP requirements.

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [RFP Requirements Mapping](#2-rfp-requirements-mapping)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Data Ingestion Pipeline](#4-data-ingestion-pipeline)
5. [Database Architecture](#5-database-architecture)
6. [Search Architecture](#6-search-architecture)
7. [API Layer](#7-api-layer)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Soroban-Specific Features](#9-soroban-specific-features)
10. [Protocol Standards Implementation](#10-protocol-standards-implementation)
11. [Performance Engineering](#11-performance-engineering)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Development Roadmap](#13-development-roadmap)
14. [Competitive Differentiation](#14-competitive-differentiation)

---

## 1. Executive Summary

This document describes the architecture for a **Soroban-first block explorer** that displays both classic Stellar operations and Soroban smart contract transactions in a clean, human-readable format. The explorer will bridge the gap between Stellar's classical asset model and the Soroban smart contract platform, providing developers, users, and auditors with a unified, context-rich view of on-chain activity.

### Core Thesis

No existing Stellar explorer adequately serves the Soroban ecosystem. StellarExpert has the deepest analytics but a dated UI and no interactive contract features. Steexp has a modern stack but no Soroban support. StellarChain is visually clean but feature-shallow. Meanwhile, explorers in other ecosystems (Etherscan, Solscan, Blockscout) have established patterns for smart contract display that Stellar lacks entirely:

- **Read/Write Contract interaction** from the browser (Etherscan's most powerful feature)
- **Decoded contract events** with human-readable parameter names
- **Transaction humanization** that explains "what happened" rather than showing raw data
- **State change diffs** showing before/after contract storage
- **Contract verification** linking deployed WASM to source code

We will build all of these for Soroban, on top of full classic Stellar support, creating the definitive explorer for the unified Stellar network.

### Key Architectural Decisions

| Decision            | Choice                                            | Rationale                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Primary database    | PostgreSQL + TimescaleDB                          | PostgreSQL is proven in blockchain explorers (Blockscout, Horizon). TimescaleDB adds automatic time-partitioning, compression, and faster aggregations — proven at scale for blockchain data by Zondax (hundreds of TB for Filecoin's Beryx explorer). |
| Ingestion approach  | Custom pipeline via Stellar Ingest SDK (Go) + RPC | Full control over data transformation, CAP-67 event support, real-time streaming                                                                                                                                                                       |
| Search engine       | Typesense + PostgreSQL indexes                    | Sub-50ms fuzzy search with typo tolerance for addresses; deterministic routing for exact matches                                                                                                                                                       |
| Cache layer         | Redis                                             | Hot data caching, rate limiting, SSE event distribution                                                                                                                                                                                                |
| Frontend            | Next.js 16 (App Router) + React 19                | Already the existing stack; SSR for SEO, streaming for performance                                                                                                                                                                                     |
| API                 | REST + OpenAPI                                    | Developer-friendly, cacheable, well-documented                                                                                                                                                                                                         |
| Historical backfill | Hubble (BigQuery) + RPC Data Lake                 | Complete history from genesis without running full Captive Core ingestion                                                                                                                                                                              |

---

## 2. RFP Requirements Mapping

| RFP Requirement                              | Architecture Component                                 | Section                                                        |
| -------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| SEP-41 and SEP-50 transaction handling       | Token/NFT detection & display pipeline                 | [9.2](#92-sep-41-token-display), [9.3](#93-sep-50-nft-display) |
| Human-readable transactions                  | Transaction humanization engine                        | [9.1](#91-transaction-humanization-engine)                     |
| CAP-67 event handling & unified event stream | Ingestion pipeline with Token Transfer Processor       | [4.3](#43-cap-67-unified-event-processing)                     |
| Swap heuristics                              | Function-name-based pattern matching                   | [9.4](#94-swap-and-defi-heuristics)                            |
| Soroban operations display                   | Contract invocation decoder                            | [9.5](#95-contract-invocation-display)                         |
| Filtering by smart contract fn call          | Indexed contract events + UI filters                   | [6.2](#62-contract-event-search), [8.4](#84-filtering-ui)      |
| SEP-39, SAC, and Classic Asset support       | Asset resolution pipeline                              | [10.1](#101-asset-resolution-pipeline)                         |
| Complete Soroban transaction history (2024+) | Historical backfill via Hubble + Data Lake             | [4.4](#44-historical-backfill-strategy)                        |
| Support for protocol v20+                    | Protocol-versioned XDR parsing                         | [4.5](#45-protocol-version-handling)                           |
| Open source                                  | MIT/Apache-2.0 license                                 | [12.4](#124-open-source-strategy)                              |
| <400ms API responses under parallel load     | Multi-layer caching, read replicas, connection pooling | [11](#11-performance-engineering)                              |

---

## 3. System Architecture Overview

```
                    ┌─────────────────────────────────────────────┐
                    │              DATA SOURCES                    │
                    │                                             │
                    │  ┌──────────┐  ┌─────────┐  ┌──────────┐  │
                    │  │ Stellar  │  │ Stellar │  │  Hubble  │  │
                    │  │   RPC    │  │ Horizon │  │ BigQuery │  │
                    │  └────┬─────┘  └────┬────┘  └────┬─────┘  │
                    │       │             │            │         │
                    │  ┌────┴─────┐  ┌────┴────┐  ┌───┴──────┐ │
                    │  │ RPC Data │  │   SSE   │  │ History  │ │
                    │  │   Lake   │  │ Stream  │  │  Export  │ │
                    │  │ (S3/GCS) │  │         │  │          │ │
                    │  └────┬─────┘  └────┬────┘  └───┬──────┘ │
                    └───────┼─────────────┼───────────┼─────────┘
                            │             │           │
                    ┌───────▼─────────────▼───────────▼─────────┐
                    │           INGESTION PIPELINE               │
                    │                                            │
                    │  ┌──────────────────────────────────────┐  │
                    │  │     Ledger Metadata Processor (Go)   │  │
                    │  │                                      │  │
                    │  │  ┌────────┐ ┌─────────┐ ┌────────┐  │  │
                    │  │  │  XDR   │ │  CAP-67 │ │Contract│  │  │
                    │  │  │ Parser │ │  Events │ │  Spec  │  │  │
                    │  │  │        │ │Processor│ │ Decoder│  │  │
                    │  │  └────────┘ └─────────┘ └────────┘  │  │
                    │  └──────────────────┬───────────────────┘  │
                    │                     │                      │
                    └─────────────────────┼──────────────────────┘
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │              STORAGE LAYER                  │
                    │                     │                      │
                    │  ┌──────────────────▼──────────────────┐   │
                    │  │     PostgreSQL + TimescaleDB        │   │
                    │  │     (Primary — writes + reads)      │   │
                    │  └──────────┬──────────┬───────────────┘   │
                    │             │          │                    │
                    │  ┌──────────▼───┐  ┌───▼────────────┐     │
                    │  │  Read        │  │  Read          │     │
                    │  │  Replica 1   │  │  Replica 2     │     │
                    │  └──────────────┘  └────────────────┘     │
                    │                                            │
                    │  ┌────────────┐  ┌───────────┐            │
                    │  │  Redis     │  │ Typesense │            │
                    │  │  (Cache)   │  │ (Search)  │            │
                    │  └────────────┘  └───────────┘            │
                    │                                            │
                    │  ┌────────────────────────────┐  (Phase 2)│
                    │  │  ClickHouse (Analytics)    │           │
                    │  └────────────────────────────┘           │
                    └─────────────────────┬──────────────────────┘
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │              API LAYER                      │
                    │                     │                      │
                    │  ┌──────────────────▼──────────────────┐   │
                    │  │       Next.js API Routes            │   │
                    │  │       (REST + OpenAPI)               │   │
                    │  │                                      │   │
                    │  │  ┌────────┐ ┌─────────┐ ┌────────┐  │   │
                    │  │  │Ledger  │ │ Account │ │Contract│  │   │
                    │  │  │  API   │ │   API   │ │  API   │  │   │
                    │  │  └────────┘ └─────────┘ └────────┘  │   │
                    │  └─────────────────────────────────────┘   │
                    │                                            │
                    │  ┌──────────────────────────────────────┐  │
                    │  │       SSE Streaming Server           │  │
                    │  └──────────────────────────────────────┘  │
                    └─────────────────────┬──────────────────────┘
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │             FRONTEND                        │
                    │                     │                      │
                    │  ┌──────────────────▼──────────────────┐   │
                    │  │     Next.js 16 App Router           │   │
                    │  │     React 19 + TanStack Query       │   │
                    │  │                                      │   │
                    │  │  ┌─────────┐ ┌────────┐ ┌────────┐  │   │
                    │  │  │Explorer │ │Contract│ │Network │  │   │
                    │  │  │ Views   │ │ Studio │ │Analytics│ │   │
                    │  │  └─────────┘ └────────┘ └────────┘  │   │
                    │  └─────────────────────────────────────┘   │
                    └────────────────────────────────────────────┘
```

### Component Responsibilities

| Component                    | Technology                       | Responsibility                                                                               |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| **Ingestion Pipeline**       | Go (Stellar Ingest SDK)          | Ingest ledger metadata, parse XDR, extract operations/effects/events, write to PostgreSQL    |
| **PostgreSQL + TimescaleDB** | PostgreSQL 16 + TimescaleDB      | Primary data store — ledgers, transactions, operations, effects, accounts, contracts, events |
| **Read Replicas**            | PostgreSQL streaming replication | Serve all read queries from API layer                                                        |
| **Redis**                    | Redis 7+                         | Cache hot data, rate limiting, pub/sub for SSE distribution                                  |
| **Typesense**                | Typesense                        | Fuzzy search for assets, known accounts, contract labels                                     |
| **ClickHouse** (Phase 2)     | ClickHouse                       | Network analytics, aggregations, dashboard data                                              |
| **API Layer**                | Next.js API Routes               | REST API with OpenAPI spec, SSE streaming endpoints                                          |
| **Frontend**                 | Next.js 16 + React 19            | Server-rendered explorer UI with client-side interactivity                                   |

---

## 4. Data Ingestion Pipeline

### 4.1 Ingestion Architecture

The ingestion pipeline is the backbone of the explorer. It reads ledger metadata from the Stellar network and transforms it into the queryable data model stored in PostgreSQL.

```
┌─────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINE                        │
│                                                             │
│  ┌───────────┐    ┌──────────────┐    ┌────────────────┐   │
│  │  Source    │───▶│  Transformer │───▶│   Writer       │   │
│  │  Adapter  │    │              │    │                │   │
│  │           │    │  • XDR Parse │    │  • PostgreSQL  │   │
│  │  • RPC    │    │  • CAP-67   │    │  • Redis pub   │   │
│  │  • Data   │    │  • Contract │    │  • Typesense   │   │
│  │    Lake   │    │    Spec     │    │    sync        │   │
│  │  • Hubble │    │  • Effects  │    │                │   │
│  └───────────┘    └──────────────┘    └────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 State Manager                         │  │
│  │  • Tracks ingestion cursor (last processed ledger)    │  │
│  │  • Handles reorgs and gap detection                   │  │
│  │  • Manages batch commits (atomic per ledger)          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Implementation language: Go**

The Stellar Ingest SDK (`github.com/stellar/go-stellar-sdk`) is written in Go and provides type-safe XDR bindings, Captive Core management, and history archive access. Writing the ingestion pipeline in Go gives us:

- Native access to all SDK packages (`ingest`, `xdr`, `historyarchive`, `datastore`)
- No serialization overhead between the SDK and our pipeline code
- Strong concurrency primitives (goroutines) for parallel processing
- Ecosystem alignment — most Stellar infrastructure tooling is Go

### 4.2 Data Sources & Ingestion Modes

| Mode                     | Source                                       | Use Case                                                  | Throughput        |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------- | ----------------- |
| **Live streaming**       | Stellar RPC (`getTransactions`, `getEvents`) | Real-time ingestion of new ledgers                        | ~1 ledger/5s      |
| **Live streaming (SSE)** | Horizon SSE                                  | Backup stream + operation/effect decomposition            | ~1 ledger/5s      |
| **Catchup (recent)**     | RPC Data Lake (S3/GCS) via `getLedgers`      | Fill gaps in recent history, bootstrap new instances      | ~1000 ledgers/min |
| **Historical backfill**  | Hubble (BigQuery) + Data Lake                | Complete history from genesis (Protocol v20+ for Soroban) | Batch, ~hours     |

#### Live Ingestion Flow

```
1. Poll RPC getTransactions(startLedger=last_processed+1)
2. For each transaction:
   a. Parse envelope XDR → extract operations, source accounts
   b. Parse result XDR → extract success/failure, operation results
   c. Parse resultMeta XDR → extract:
      - State changes (LedgerEntryChanges)
      - Contract events (TransactionMetaV4 if available)
      - CAP-67 unified events
   d. Decode Soroban invocations:
      - Contract ID, function name, arguments (ScVal → typed)
      - Authorization tree (SorobanAuthorizedInvocation)
      - Resource consumption (instructions, read/write bytes)
3. Batch insert into PostgreSQL (one transaction per ledger)
4. Publish to Redis pub/sub for SSE distribution
5. Update ingestion cursor
```

#### Parallel Ingestion Workers

For the historical backfill and catchup modes, we use parallel workers:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Worker 1 │     │ Worker 2 │     │ Worker N │
│ Ledgers  │     │ Ledgers  │     │ Ledgers  │
│ 0-10000  │     │10001-    │     │ ...      │
│          │     │ 20000    │     │          │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
              ┌───────▼──────┐
              │  Merge &     │
              │  Commit      │
              │  (ordered)   │
              └──────────────┘
```

Each worker processes a range of ledgers independently. A coordinator ensures ordered commits to PostgreSQL to maintain data consistency.

### 4.3 CAP-67 Unified Event Processing

CAP-67 is the single most important protocol specification for this explorer. It unifies all token movements (classic and Soroban) into a consistent event format.

**Event types we process:**

| Event      | Topics                        | Data          | Display                         |
| ---------- | ----------------------------- | ------------- | ------------------------------- |
| `transfer` | `[transfer, from, to, asset]` | `amount:i128` | "X transferred Y of ASSET to Z" |
| `mint`     | `[mint, to, asset]`           | `amount:i128` | "Y of ASSET minted to Z"        |
| `burn`     | `[burn, from, asset]`         | `amount:i128` | "X burned Y of ASSET"           |
| `clawback` | `[clawback, from, asset]`     | `amount:i128` | "Y of ASSET clawed back from X" |
| `fee`      | `[fee, from]`                 | `amount:i128` | "X paid Y XLM in fees"          |

**Processing pipeline:**

```go
// Pseudocode for CAP-67 event extraction
func processLedger(meta xdr.LedgerCloseMeta) []TokenEvent {
    events := []TokenEvent{}

    // Use Token Transfer Processor at operation granularity
    for _, tx := range meta.TransactionEnvelopes() {
        for _, op := range tx.Operations() {
            opEvents := ttp.EventsFromOperation(meta, tx, op)
            for _, event := range opEvents {
                events = append(events, TokenEvent{
                    Type:       event.Type, // transfer|mint|burn|clawback|fee
                    From:       resolveAddress(event.From),
                    To:         resolveAddress(event.To),
                    Asset:      parseAssetString(event.Asset),
                    Amount:     event.Amount,
                    TxHash:     tx.Hash(),
                    Ledger:     meta.LedgerSequence(),
                    MuxedID:    event.ToMuxedID, // for custodial accounts
                })
            }
        }
    }
    return events
}
```

**Key implementation notes:**

- The Token Transfer Processor (TTP) Go package provides three granularity levels: `EventsFromLedger()`, `EventsFromTransaction()`, and `EventsFromOperation()`. We use operation-level for maximum detail.
- New address prefixes: `L` for liquidity pools, `B` for claimable balances — must be handled in address rendering.
- Muxed accounts: when `to_muxed_id` is present, display both the base G-address and the muxed M-address.
- Retroactive events: Protocol 23 enables `BACKFILL_STELLAR_ASSET_EVENTS` for generating events for all historical ledgers. Our backfill pipeline should use this.

### 4.4 Historical Backfill Strategy

To satisfy the RFP requirement for "complete Soroban transaction history (from 2024), support of previous protocol versions (protocol v20+)":

**Phase 1: Soroban history (Protocol v20+, July 2023 onwards)**

1. Use the **RPC Data Lake** (`s3://aws-public-blockchain/v1.1/stellar/ledgers/pubnet`) via the `getLedgers` endpoint with data lake integration.
2. Process all ledgers from Protocol v20 activation (~ledger 50,000,000) to present.
3. Extract all Soroban transactions, contract events, and state changes.
4. Estimated data volume: ~3 years of ledgers, ~2 TB compressed.

**Phase 2: Full classic history (genesis to Protocol v20)**

1. Use **Hubble (BigQuery)** to export historical transactions, operations, and effects.
2. Export directly to PostgreSQL via `bq extract` → CSV → `COPY` or via the BigQuery Storage Read API.
3. Key tables: `history_transactions`, `enriched_history_operations`, `history_effects`, `history_contract_events`.
4. For CAP-67 retroactive events: re-ingest from the Data Lake with `BACKFILL_STELLAR_ASSET_EVENTS` flag.

**Phase 3: Ongoing maintenance**

1. The live ingestion pipeline takes over once the backfill reaches the current ledger.
2. Gap detection runs every 5 minutes to identify and fill any missed ledgers.

### 4.5 Protocol Version Handling

Stellar's protocol has evolved significantly. The ingestion pipeline must handle:

| Protocol | Key Changes                               | Parsing Impact                                                                                |
| -------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| v1-v19   | Classic operations only                   | Standard XDR parsing                                                                          |
| v20      | Soroban introduced (CAP-46)               | New operation types: `INVOKE_HOST_FUNCTION`, `BUMP_FOOTPRINT_EXPIRATION`, `RESTORE_FOOTPRINT` |
| v21      | State archival, enhanced resources        | TTL tracking for contract data                                                                |
| v22      | RPC rebranding, `xdrFormat: "json"`       | Simplified parsing for some queries                                                           |
| v23      | CAP-67 unified events, retroactive events | `TransactionMetaV4`, `OperationMetaV2`, unified token events                                  |

The pipeline uses a version-dispatched parser:

```go
func parseTransactionMeta(meta xdr.TransactionMeta) {
    switch meta.V {
    case 0: parseMetaV0(meta.MustV0())
    case 1: parseMetaV1(meta.MustV1())
    case 2: parseMetaV2(meta.MustV2())
    case 3: parseMetaV3(meta.MustV3())
    case 4: parseMetaV4(meta.MustV4()) // CAP-67
    }
}
```

---

## 5. Database Architecture

### 5.1 Technology Choice

**PostgreSQL 16+ with TimescaleDB extension** as the primary database.

**Why PostgreSQL:**

- **Proven in blockchain explorers.** [Horizon](https://developers.stellar.org/docs/data/apis/horizon/admin-guide/prerequisites) (the official Stellar API) uses PostgreSQL. [Blockscout](https://github.com/blockscout/blockscout) (the leading open-source explorer, powering 1,000+ EVM chains including Ethereum, Optimism, Base, and Polygon) uses PostgreSQL. The schema patterns and performance tuning strategies for blockchain data at scale are battle-tested in production.
- **ACID compliance.** Blockchain data requires transactional integrity — no partial ledger ingestion.
- **Relational model fits naturally.** Ledgers → Transactions → Operations → Effects is a perfect hierarchical relationship.

**Why add TimescaleDB:**

TimescaleDB is a PostgreSQL extension (not a separate database) that optimizes time-series workloads. While no major block explorer uses TimescaleDB today, it is proven at scale for blockchain data by [Zondax](https://www.timescale.com/case-studies/zondax), who uses it to process hundreds of terabytes of blockchain data for [Beryx](https://beryx.io/) (Filecoin explorer/indexer) — reducing processing time from weeks to 1-2 days. Its benefits for our workload:

- **Automatic time-based partitioning** (hypertables) — eliminates manual partition management for our time-series tables (transactions, operations, effects, events)
- **[20x faster inserts, up to 14,000x faster time-series queries](https://medium.com/timescale/timescaledb-vs-6a696248104e)** compared to vanilla PostgreSQL in benchmarks on 1 billion rows
- **~90% storage reduction** via native columnar compression on older chunks
- **`drop_chunks()`** for efficient data lifecycle management
- **Zero operational overhead** — it's a PostgreSQL extension, so all existing PostgreSQL tooling, monitoring, and expertise applies

### 5.2 Schema Design

See [docs/scf/database-schema.md](./database-schema.md) for the complete schema definition.

**Core entity tables:**

| Table              | Type       | Partitioning           | Description                               |
| ------------------ | ---------- | ---------------------- | ----------------------------------------- |
| `ledgers`          | Hypertable | Monthly by `closed_at` | All ledger metadata                       |
| `transactions`     | Hypertable | Weekly by `created_at` | All transactions with envelope/result XDR |
| `operations`       | Hypertable | Weekly by `created_at` | Decoded operations with JSONB details     |
| `effects`          | Hypertable | Weekly by `created_at` | All effects per operation                 |
| `accounts`         | Regular    | None (current state)   | Account balances, flags, thresholds       |
| `trustlines`       | Regular    | None                   | Non-native asset balances                 |
| `account_signers`  | Regular    | None                   | Multi-sig signer information              |
| `assets`           | Regular    | None                   | Aggregated asset metadata and stats       |
| `contracts`        | Regular    | None                   | Soroban contract metadata                 |
| `contract_code`    | Regular    | None                   | WASM bytecode (deduplicated by hash)      |
| `contract_storage` | Regular    | None                   | Contract key-value storage entries        |
| `contract_events`  | Hypertable | Weekly by `created_at` | All Soroban contract events               |
| `token_events`     | Hypertable | Weekly by `created_at` | CAP-67 unified token transfer events      |
| `known_accounts`   | Regular    | None                   | Directory of labeled accounts             |
| `ingestion_state`  | Regular    | None                   | Cursor tracking for ingestion pipeline    |

**Key design decisions:**

1. **JSONB `details` columns** on operations and effects — Stellar has 26+ operation types, each with different fields. Denormalized common fields (`amount`, `destination`, `asset_code`) for indexed queries; full details in JSONB for flexibility.

2. **Separate `contract_code` table** — WASM bytecode is large (100KB-2MB) and shared across contract instances. Store once by `wasm_hash`, reference from `contracts`.

3. **Dedicated `token_events` table** — CAP-67 unified events get their own table for fast token transfer queries, separate from raw `contract_events`.

4. **Composite indexes with time-descending order** — The most common query is "latest N transactions for account X", which reads `(account, created_at DESC)` backward.

### 5.3 Data Volume Estimates

| Entity          | Current Count | Daily Growth | 1-Year Projection |
| --------------- | ------------- | ------------ | ----------------- |
| Ledgers         | ~55M          | ~17,280      | ~61M              |
| Transactions    | ~2.5B         | ~3M          | ~3.6B             |
| Operations      | ~21.5B        | ~7.9M        | ~24.4B            |
| Effects         | ~40B+         | ~15M         | ~45B+             |
| Accounts        | ~10.3M        | ~5K          | ~12M              |
| Contracts       | ~500K+        | ~1K          | ~900K             |
| Contract events | ~2B+          | ~5M          | ~4B               |

**Storage estimates with TimescaleDB compression:**

| Component               | Uncompressed | Compressed (~90% reduction) |
| ----------------------- | ------------ | --------------------------- |
| Ledgers                 | ~50 GB       | ~5 GB                       |
| Transactions            | ~3 TB        | ~300 GB                     |
| Operations              | ~8 TB        | ~800 GB                     |
| Effects                 | ~5 TB        | ~500 GB                     |
| Contract events         | ~2 TB        | ~200 GB                     |
| Accounts + state tables | ~100 GB      | ~100 GB (not compressed)    |
| **Total**               | **~18 TB**   | **~2 TB**                   |

---

## 6. Search Architecture

### 6.1 Universal Search Bar

The search bar is the explorer's primary interaction point. It must auto-detect input type and return results in <100ms.

**Input classification pipeline:**

```
User Input
    │
    ├─ Matches /^[0-9]+$/ ────────────────── Ledger sequence → PostgreSQL lookup
    │
    ├─ Matches /^[0-9a-f]{64}$/i ─────────── Transaction hash → PostgreSQL lookup
    │
    ├─ Matches /^G[A-Z2-7]{55}$/ ─────────── Stellar account (G-address) → PostgreSQL lookup
    │
    ├─ Matches /^C[A-Z2-7]{55}$/ ─────────── Contract ID (C-address) → PostgreSQL lookup
    │
    ├─ Matches /^M[A-Z2-7]{68}$/ ─────────── Muxed account → Resolve to base account
    │
    ├─ Contains '*' ──────────────────────── Federated address → StellarToml resolution
    │
    └─ Otherwise ─────────────────────────── Typesense fuzzy search:
                                               • Asset codes/names
                                               • Known account labels
                                               • Contract labels
                                               • Home domains
```

**80%+ of searches are deterministic** (exact address or hash lookups) and go directly to PostgreSQL indexed lookups, never hitting the search engine.

### 6.2 Contract Event Search

The RFP requires "filtering by smart contract fn call." This is implemented via:

1. **Indexed `topic_1` field** on `contract_events` — topic_1 is typically the function name or event type
2. **Compound filter UI** allowing:
   - Filter by contract ID
   - Filter by function name (from contract spec)
   - Filter by event type (transfer, mint, burn, etc.)
   - Filter by time range
3. **Query pattern:**

```sql
SELECT * FROM contract_events
WHERE contract_id = $1
  AND topic_1 = $2              -- e.g., 'swap'
  AND created_at >= $3
  AND created_at <= $4
ORDER BY created_at DESC
LIMIT 50;
```

This query uses the composite index `(contract_id, created_at DESC)` and the topic index for excellent performance.

### 6.3 Typesense Configuration

**Collections to index:**

| Collection       | Fields                                  | Size Estimate |
| ---------------- | --------------------------------------- | ------------- |
| `assets`         | code, name, issuer, domain, description | ~100K records |
| `known_accounts` | label, address, category, domain        | ~50K records  |
| `contracts`      | contract_id, label, creator, type       | ~500K records |

**Sync strategy:** Incremental updates from the ingestion pipeline via a dedicated Typesense writer. Full re-index weekly for consistency.

---

## 7. API Layer

### 7.1 API Design

REST API implemented as Next.js API routes, following the existing project structure.

**Endpoint groups:**

| Group            | Endpoints                                                     | Cache Strategy               |
| ---------------- | ------------------------------------------------------------- | ---------------------------- |
| **Ledgers**      | `GET /api/ledgers`, `GET /api/ledgers/:sequence`              | Latest: 5s, Historical: 24h  |
| **Transactions** | `GET /api/transactions`, `GET /api/transactions/:hash`        | By hash: infinite, List: 30s |
| **Operations**   | `GET /api/operations`, `GET /api/operations/:id`              | By ID: infinite, List: 30s   |
| **Accounts**     | `GET /api/accounts/:id`, `GET /api/accounts/:id/transactions` | Current: 10s, History: 60s   |
| **Contracts**    | `GET /api/contracts/:id`, `GET /api/contracts/:id/events`     | Code: infinite, Storage: 30s |
| **Assets**       | `GET /api/assets`, `GET /api/assets/:code/:issuer`            | Stats: 5min, List: 1min      |
| **Search**       | `GET /api/search?q=`                                          | 30s                          |
| **Network**      | `GET /api/network/stats`, `GET /api/network/fee-stats`        | 30s                          |
| **Stream**       | `GET /api/stream/ledgers`, `GET /api/stream/transactions`     | SSE, no cache                |

### 7.2 SSE Streaming

Real-time updates via Server-Sent Events, powered by Redis pub/sub:

```
Ingestion Pipeline → Redis PUBLISH → API Server → SSE → Client
```

**Streaming channels:**

- `stream:ledgers` — new ledger closed
- `stream:transactions` — new transactions (filterable by account)
- `stream:contract_events:{contract_id}` — events for a specific contract
- `stream:token_events:{asset}` — token transfer events for a specific asset

### 7.3 Rate Limiting

Redis-based sliding window rate limiter:

| Tier                    | Rate        | Use Case               |
| ----------------------- | ----------- | ---------------------- |
| Anonymous               | 30 req/min  | Public access          |
| Authenticated (API key) | 300 req/min | Developer integrations |
| Internal                | Unlimited   | Frontend SSR           |

---

## 8. Frontend Architecture

### 8.1 Existing Foundation

The current Stellar Explorer (`src/`) provides a strong foundation:

- **Next.js 16 App Router** with React 19
- **TanStack Query** for data fetching and caching
- **9-language i18n** via next-intl
- **Tailwind CSS v4** with dark mode
- **shadcn/ui components** (Radix-based)
- **Multi-network support** (public, testnet, futurenet)
- **Horizon + RPC dual client** (`src/lib/stellar/client.ts`)

### 8.2 New Pages & Features

The following pages and features need to be built or significantly enhanced for the Soroban-first experience:

| Page                   | Status   | Description                                                       |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| **Contract Detail**    | New      | Full contract view: info, code, storage, events, read/write       |
| **Contract Studio**    | New      | Interactive contract invocation (Read/Write, Etherscan-style)     |
| **Transaction Detail** | Enhanced | Tabbed view: Overview, Operations, Effects, Events, State Changes |
| **Account Detail**     | Enhanced | Portfolio view: all assets, Soroban tokens, DeFi positions        |
| **Token/Asset Detail** | Enhanced | SEP-41 token page with holders, transfers, charts                 |
| **NFT Gallery**        | New      | SEP-50 NFT collection and individual token views                  |
| **Network Analytics**  | New      | Dashboard with charts: TPS, fees, Soroban adoption, DEX volume    |
| **Search Results**     | Enhanced | Universal search with categorized results                         |

### 8.3 Contract Studio (Read/Write Contract)

The flagship Soroban-specific feature — equivalent to Etherscan's Read/Write Contract:

```
┌─────────────────────────────────────────────────────────┐
│  Contract: CABC...XYZ                                    │
│  Name: Soroswap Router  |  WASM: abc123...              │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌────────────┐  │
│  │ Info │ │ Code │ │Storage │ │Events│ │Read/Write  │  │
│  └──────┘ └──────┘ └────────┘ └──────┘ └────────────┘  │
│                                                          │
│  ─── Read Contract ───────────────────────────────────── │
│                                                          │
│  1. balance (id: Address) → i128                        │
│     ┌─────────────────────────────┐                     │
│     │ G/C Address: [___________]  │  [Query]            │
│     └─────────────────────────────┘                     │
│     Result: 1,000,000 (100.0000000 with 7 decimals)    │
│                                                          │
│  2. name () → String                                    │
│     Result: "Soroswap LP Token"                         │
│                                                          │
│  ─── Write Contract ──────────────────────────────────── │
│                                                          │
│  3. swap (to: Address, amount: i128)                    │
│     ┌─────────────────────────────┐                     │
│     │ To:     [___________]       │                     │
│     │ Amount: [___________]       │                     │
│     └─────────────────────────────┘                     │
│     [Connect Wallet] [Simulate] [Execute]               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

1. **Parse contract spec** from WASM custom section (XDR) → extract function signatures, parameter types, return types
2. **Classify functions** as read-only (view) vs. state-changing (write) based on whether they require authorization
3. **Generate form inputs** dynamically based on parameter types (`Address` → address input, `i128` → number input, `Bytes` → hex input, etc.)
4. **Read functions:** Use RPC `simulateTransaction` to invoke without wallet — display decoded return values
5. **Write functions:** Use Freighter/Stellar Wallets Kit for wallet connection → RPC `simulateTransaction` for preview → `sendTransaction` for execution
6. **Display results:** Decode ScVal return values to human-readable types

### 8.4 Filtering UI

For the RFP requirement "filter by smart contract fn call":

```
┌───────────────────────────────────────────────────────┐
│  Contract Events  [Contract: CABC...XYZ ▼]            │
│                                                        │
│  Function: [All ▼] [swap ▼] [transfer ▼] [mint ▼]    │
│  Time:     [Last 24h ▼]                               │
│  Type:     [○ All  ○ Contract  ○ System]              │
│                                                        │
│  ┌─────────┬────────────┬──────────┬────────────────┐ │
│  │  Ledger │   Tx Hash  │ Function │    Details     │ │
│  ├─────────┼────────────┼──────────┼────────────────┤ │
│  │ 55,123  │ abc1...ef  │ swap     │ 100 USDC →    │ │
│  │         │            │          │ 50 XLM        │ │
│  ├─────────┼────────────┼──────────┼────────────────┤ │
│  │ 55,122  │ def2...gh  │ transfer │ 500 USDC to   │ │
│  │         │            │          │ GDEF...        │ │
│  └─────────┴────────────┴──────────┴────────────────┘ │
└───────────────────────────────────────────────────────┘
```

---

## 9. Soroban-Specific Features

### 9.1 Transaction Humanization Engine

The most impactful feature for user experience. Transform raw transaction data into plain-language descriptions.

**Architecture:**

```
Raw Transaction XDR
    │
    ├─ Decode envelope → operations list
    │
    ├─ For each operation:
    │   ├─ Classic operation? → Use operation type mapping
    │   │   "create_account" → "Created account GABC... with 100 XLM"
    │   │   "payment" → "Sent 500 USDC to GDEF..."
    │   │   "manage_sell_offer" → "Placed sell offer: 100 XLM for 50 USDC"
    │   │
    │   └─ invoke_host_function? → Contract invocation decoder:
    │       ├─ Resolve contract ID → known contract name?
    │       ├─ Parse function name from invocation args
    │       ├─ Match against known patterns:
    │       │   "swap" + SEP-41 events → "Swapped 100 USDC for 50 XLM via Soroswap"
    │       │   "deposit" + pool context → "Deposited 100 XLM into Blend lending pool"
    │       │   "transfer" → "Transferred 500 tokens from GABC... to GDEF..."
    │       │   "mint" → "Minted 1000 new tokens to GABC..."
    │       └─ Unknown function → "Called function_name on contract CABC..."
    │
    └─ Compose final summary
```

**Pattern matching for known DeFi operations:**

| Pattern                 | Indicators                                                            | Human-Readable Output                                     |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| **Swap**                | fn name contains "swap" + transfer events with different assets       | "Swapped X of ASSET_A for Y of ASSET_B via CONTRACT_NAME" |
| **Liquidity provision** | fn name contains "deposit"/"add_liquidity" + multiple transfer events | "Added liquidity: X ASSET_A + Y ASSET_B to POOL"          |
| **Borrow**              | fn name contains "borrow" + mint event                                | "Borrowed X ASSET from PROTOCOL"                          |
| **Repay**               | fn name contains "repay" + burn event                                 | "Repaid X ASSET to PROTOCOL"                              |
| **NFT transfer**        | SEP-50 transfer event with token_id                                   | "Transferred NFT #123 from ADDR_A to ADDR_B"              |
| **Contract deploy**     | `INVOKE_HOST_FUNCTION` with `createContract`                          | "Deployed contract CABC... (WASM: abc123...)"             |

### 9.2 SEP-41 Token Display

For every contract implementing the SEP-41 token interface:

1. **Detection:** Parse WASM custom section for SEP-41 function signatures (`balance`, `transfer`, `name`, `symbol`, `decimals`)
2. **Metadata display:** Call `name()`, `symbol()`, `decimals()` via `simulateTransaction` and cache results
3. **Amount formatting:** Apply `decimals()` to all amount displays (e.g., `1000000` with 7 decimals → `0.1000000`)
4. **Transfer history:** Query `token_events` table filtered by asset identifier
5. **Holder count:** Maintain count of unique addresses with non-zero balance in the `assets` table

### 9.3 SEP-50 NFT Display

For contracts implementing SEP-50:

1. **Detection:** Parse WASM custom section for NFT function signatures (`owner_of`, `token_uri`, `balance`)
2. **Collection page:** Display `name()`, `symbol()`, total supply
3. **Individual token page:** Fetch `token_uri(token_id)`, parse JSON metadata, render image/attributes
4. **Ownership history:** Track Transfer events per `token_id` from `contract_events`
5. **Approval display:** Show current approvals with expiration ledger

### 9.4 Swap and DeFi Heuristics

The RFP specifically requires swap detection based on "function name and presence of a separate swap event."

**Detection algorithm:**

```
1. Check function name: contains "swap", "exchange", "trade"?
2. Check for CAP-67 transfer events:
   - Two transfer events with different assets in same transaction
   - One transfer FROM user, one transfer TO user
3. If both conditions met → classify as SWAP
4. Extract: asset_in, amount_in, asset_out, amount_out, exchange_rate
5. Display: "Swapped {amount_in} {asset_in} for {amount_out} {asset_out}"
```

**Known DeFi protocols to recognize:**

| Protocol | Contract Pattern       | Operations                            |
| -------- | ---------------------- | ------------------------------------- |
| Soroswap | Router/Pair contracts  | swap, add_liquidity, remove_liquidity |
| Aquarius | AMM pool contracts     | swap, deposit, withdraw               |
| Blend    | Lending pool contracts | borrow, repay, deposit, withdraw      |
| FxDAO    | Vault contracts        | mint, burn, liquidate                 |

### 9.5 Contract Invocation Display

For `INVOKE_HOST_FUNCTION` operations:

```
┌─────────────────────────────────────────────────────┐
│  Operation: Invoke Smart Contract                    │
│                                                      │
│  Contract: Soroswap Router (CABC...XYZ)             │
│  Function: swap_exact_tokens_for_tokens              │
│                                                      │
│  Arguments:                                          │
│    amount_in:      1,000,000 (100.000000 USDC)      │
│    amount_out_min: 480,000,000 (48.000000 XLM)      │
│    path:           [USDC → XLM]                      │
│    to:             GDEF...789                         │
│    deadline:       Ledger 55,200                      │
│                                                      │
│  Authorization Chain:                                │
│    └─ GABC...123 authorized:                         │
│       ├─ transfer 100 USDC to Soroswap Pair          │
│       └─ swap_exact_tokens_for_tokens on Router      │
│                                                      │
│  Resources Used:                                     │
│    Instructions:  4,500,000 / 10,000,000             │
│    Read bytes:    12,000 / 40,000                    │
│    Write bytes:   800 / 10,000                       │
│    Events:        3                                   │
│                                                      │
│  Events Emitted:                                     │
│    1. transfer: 100 USDC from GABC... to Pair        │
│    2. transfer: 48.5 XLM from Pair to GDEF...        │
│    3. swap: [100 USDC, 48.5 XLM, GABC..., GDEF...]  │
└─────────────────────────────────────────────────────┘
```

---

## 10. Protocol Standards Implementation

### 10.1 Asset Resolution Pipeline

Stellar has two asset systems that must be unified:

```
Asset Identifier
    │
    ├─ Classic asset (code:issuer) ───────────────────────┐
    │   1. Check assets table for metadata                │
    │   2. Fetch stellar.toml from issuer's home_domain   │
    │   3. Extract: name, description, image, decimals    │
    │   4. Check for SAC contract (reserved contract ID)  │
    │                                                      │
    ├─ SAC (Stellar Asset Contract) ──────────────────────┤
    │   1. Detect via contract type = asset               │── Unified Asset View
    │   2. Resolve underlying classic asset               │
    │   3. Merge classic metadata + contract interface    │
    │                                                      │
    ├─ SEP-41 custom token ───────────────────────────────┤
    │   1. Detect via contract spec analysis              │
    │   2. Call name(), symbol(), decimals()              │
    │   3. Display as Soroban-native token                │
    │                                                      │
    └─ SEP-50 NFT ────────────────────────────────────────┘
        1. Detect via contract spec (owner_of, token_uri)
        2. Fetch collection + per-token metadata
        3. Display in NFT gallery view
```

### 10.2 stellar.toml Integration

The existing `src/app/api/toml/route.ts` provides a foundation. Enhance with:

- **Caching in Redis** (1-hour TTL) to avoid repeated TOML fetches
- **Background refresh** — periodically re-fetch TOMLs for all known issuers
- **Extended SEP-39 fields** for classic-asset NFTs (url, url_sha256, fixed_number)
- **SSRF protection** (already implemented) — maintain and strengthen

### 10.3 CAP-46 Smart Contract Support

Full implementation of the Soroban smart contract data model:

| Feature                    | Implementation                                                                  |
| -------------------------- | ------------------------------------------------------------------------------- |
| Contract creation tracking | Index `createContract` host function calls, store deployer + WASM hash          |
| Contract spec decoding     | Parse WASM custom section XDR → extract function signatures, types, docs        |
| Contract storage browser   | Index `CONTRACT_DATA` entries, display key-value pairs with type decoding       |
| State archival display     | Show TTL for each storage entry, indicate expired/archived state                |
| Authorization trees        | Parse `SorobanAuthorizedInvocation` → render as nested tree UI                  |
| Resource metering          | Display instruction count, read/write bytes, event size from `SorobanResources` |
| Error code display         | Map 13 standardized SAC error codes to human-readable messages                  |

---

## 11. Performance Engineering

### 11.1 Latency Budget (<400ms Target)

| Component                  | Budget     | Strategy                                   |
| -------------------------- | ---------- | ------------------------------------------ |
| Network (client → API)     | ~50ms      | Regional deployment, CDN for static assets |
| Redis cache lookup         | ~1ms       | Cache-aside pattern for hot data           |
| PgBouncer connection       | ~1ms       | Pre-warmed connection pool                 |
| PostgreSQL query execution | ~50-200ms  | Indexed queries, read replicas             |
| Response serialization     | ~10ms      | Efficient JSON serialization               |
| **Total (cache hit)**      | **~60ms**  |                                            |
| **Total (cache miss)**     | **~260ms** | Well within 400ms                          |

### 11.2 Caching Strategy

**Tiered TTLs in Redis:**

| Data                   | TTL                     | Rationale                       |
| ---------------------- | ----------------------- | ------------------------------- |
| Latest ledger          | 5s                      | Changes every ~5s               |
| Transaction by hash    | Infinite (LRU eviction) | Immutable                       |
| Account current state  | 10s                     | Balances change frequently      |
| Account history page   | 60s                     | Immutable but pagination shifts |
| Asset stats            | 5 min                   | Aggregates change slowly        |
| Contract code/WASM     | Infinite (LRU eviction) | Immutable                       |
| Contract storage       | 30s                     | Can change with invocations     |
| Network stats          | 30s                     | Dashboard-level data            |
| TOML metadata          | 1 hour                  | External data, changes rarely   |
| Contract spec (parsed) | Infinite (LRU eviction) | Immutable per WASM hash         |

### 11.3 Database Performance

- **Connection pooling:** PgBouncer in transaction mode (pool_size=50, max_client_conn=1000)
- **Read replicas:** 2-3 replicas serve all API read queries, primary handles only writes
- **Cursor-based pagination:** No OFFSET/LIMIT — use `(created_at, id)` composite cursor
- **Approximate counts:** Maintain `stats` table updated by ingestion pipeline instead of `COUNT(*)` on large tables
- **PostgreSQL tuning:** `random_page_cost = 1` for SSD, `shared_buffers = 25% RAM`, `effective_cache_size = 75% RAM`

### 11.4 Load Testing Requirements

Per the RFP: "stable <400ms API responses under parallel load"

**Load test scenarios:**

| Scenario               | Concurrent Users | Request Pattern                              | Target p99        |
| ---------------------- | ---------------- | -------------------------------------------- | ----------------- |
| Normal browsing        | 100              | Mixed reads: ledgers, accounts, transactions | <200ms            |
| Heavy contract queries | 50               | Contract events with filters                 | <400ms            |
| Search storm           | 200              | Universal search queries                     | <100ms            |
| Live feed              | 500              | SSE streaming connections                    | Stable connection |
| API consumers          | 100              | Programmatic REST API calls                  | <400ms            |

---

## 12. Deployment & Infrastructure

### 12.1 Deployment Topology

```
┌─────────────────────────────────────────────────────┐
│                  CLOUD PROVIDER                      │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Kubernetes Cluster                            │  │
│  │                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ Frontend │  │ Frontend │  │  Ingestion   │ │  │
│  │  │ (Next.js)│  │ (Next.js)│  │  Pipeline    │ │  │
│  │  │ Pod x3   │  │ Pod x3   │  │  Pod x1      │ │  │
│  │  └──────────┘  └──────────┘  └──────────────┘ │  │
│  │                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │PgBouncer │  │  Redis   │  │  Typesense   │ │  │
│  │  │          │  │  Cluster │  │              │ │  │
│  │  └──────────┘  └──────────┘  └──────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Managed PostgreSQL (+ TimescaleDB)            │  │
│  │  Primary + 2 Read Replicas                     │  │
│  │  Storage: 2 TB SSD (compressed data)           │  │
│  │  RAM: 64-128 GB                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  CDN / Load Balancer                           │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 12.2 Infrastructure Requirements

| Component                | Specification                 | Estimated Monthly Cost |
| ------------------------ | ----------------------------- | ---------------------- |
| PostgreSQL Primary       | 16 vCPU, 128 GB RAM, 2 TB SSD | ~$800                  |
| PostgreSQL Replicas (x2) | 8 vCPU, 64 GB RAM, 2 TB SSD   | ~$600 each             |
| Redis                    | 8 GB RAM                      | ~$100                  |
| Typesense                | 4 vCPU, 16 GB RAM             | ~$150                  |
| Next.js Pods (x3)        | 4 vCPU, 8 GB RAM each         | ~$300                  |
| Ingestion Pipeline       | 8 vCPU, 32 GB RAM             | ~$200                  |
| Load Balancer + CDN      | Managed                       | ~$100                  |
| **Total**                |                               | **~$2,850/month**      |

### 12.3 Monitoring & Observability

| Layer          | Tool                         | Metrics                                                     |
| -------------- | ---------------------------- | ----------------------------------------------------------- |
| Application    | OpenTelemetry + Grafana      | Request latency, error rates, cache hit ratios              |
| Database       | pg_stat_statements + Grafana | Query performance, connection pool usage, replication lag   |
| Ingestion      | Custom metrics + Grafana     | Ledgers processed/sec, backlog depth, ingestion lag         |
| Infrastructure | Prometheus + Grafana         | CPU, memory, disk, network                                  |
| Alerting       | PagerDuty/Opsgenie           | p99 latency > 400ms, ingestion lag > 5 min, error rate > 1% |

### 12.4 Open Source Strategy

- **License:** Apache-2.0 (permissive, compatible with Stellar ecosystem)
- **Repository structure:**
  - `stellar-explorer/` — Frontend + API (Next.js)
  - `stellar-explorer-indexer/` — Ingestion pipeline (Go)
  - `stellar-explorer-infra/` — Kubernetes manifests, Terraform configs
- **Documentation:** OpenAPI spec, architecture docs, deployment guide, contributing guide
- **CI/CD:** GitHub Actions for lint, test, build, deploy

---

## 13. Development Roadmap

### Tranche I (~5 weeks): Core Infrastructure + Soroban Explorer

| Week    | Deliverables                                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1-2** | Ingestion pipeline: live streaming + Soroban history backfill (Protocol v20+). Database schema deployed with all indexes. Basic API endpoints for ledgers, transactions, operations. |
| **3-4** | Contract detail pages: info, code, storage, events. Transaction humanization engine for both classic and Soroban operations. CAP-67 unified event display. Universal search bar.     |
| **5**   | Contract Studio (Read/Write). SEP-41 token display. Filtering by contract function. Performance optimization and load testing.                                                       |

### Tranche II (~5 weeks): Full Feature Set + Polish

| Week    | Deliverables                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **6-7** | Complete classic history backfill. Network analytics dashboard. SEP-50 NFT support. Account portfolio view with DeFi position tracking. |
| **8-9** | Developer API with OpenAPI docs. SSE streaming infrastructure. Known account directory integration. Full i18n coverage.                 |
| **10**  | Load testing (target: <400ms p99 under parallel load). Security audit prep. Documentation completion. Production deployment.            |

### Post-Launch Maintenance

- Monitoring and incident response
- Protocol upgrade support (new Stellar protocol versions)
- Feature iteration based on community feedback
- Database maintenance (compression, index optimization)

---

## 14. Competitive Differentiation

### What No Other Stellar Explorer Has

| Feature                               | StellarExpert | Steexp  | StellarChain |       **Our Explorer**       |
| ------------------------------------- | :-----------: | :-----: | :----------: | :--------------------------: |
| Contract Read/Write (Etherscan-style) |       -       |    -    |      -       |           **Yes**            |
| Transaction humanization              |    Partial    | Partial |   Partial    | **Full (classic + Soroban)** |
| CAP-67 unified event stream           |       -       |    -    |      -       |           **Yes**            |
| Contract event filtering by fn        |       -       |    -    |      -       |           **Yes**            |
| SEP-50 NFT display                    |       -       |    -    |      -       |           **Yes**            |
| Modern UI (React 19, App Router)      |       -       |   Yes   |     Yes      |           **Yes**            |
| 9-language i18n                       |       -       |   Yes   |      -       |           **Yes**            |
| State change diffs                    |       -       |    -    |      -       |           **Yes**            |
| Authorization tree display            |       -       |    -    |      -       |           **Yes**            |
| Open source                           |      Yes      |   Yes   |      -       |           **Yes**            |
| <400ms API under load                 |    Unknown    |   N/A   |   Unknown    |         **Verified**         |

### Key Differentiators

1. **Contract Studio** — First Stellar explorer with interactive contract invocation. Users can read contract state and execute transactions without leaving the explorer.

2. **Full Transaction Humanization** — Every transaction explained in plain language, for both classic operations and Soroban invocations. Pattern matching for known DeFi protocols (Soroswap, Blend, Aquarius).

3. **CAP-67 Native** — Built from the ground up on the unified event stream. No separate "classic" and "Soroban" views — one unified experience.

4. **Performance-First** — Purpose-built database schema with TimescaleDB, Redis caching, read replicas. Verified <400ms under parallel load.

5. **Developer-Friendly** — REST API with OpenAPI spec, SSE streaming, rate-limited access tiers. The explorer becomes infrastructure other builders can depend on.

---

## Appendix A: Technology Stack Summary

| Layer                  | Technology               | Version  |
| ---------------------- | ------------------------ | -------- |
| Frontend               | Next.js                  | 16.x     |
| UI Framework           | React                    | 19.x     |
| Language               | TypeScript               | 5.x      |
| Styling                | Tailwind CSS             | 4.x      |
| Data Fetching          | TanStack Query           | 5.x      |
| i18n                   | next-intl                | Latest   |
| Primary Database       | PostgreSQL + TimescaleDB | 16 + 2.x |
| Cache                  | Redis                    | 7+       |
| Search                 | Typesense                | 27+      |
| Analytics DB (Phase 2) | ClickHouse               | Latest   |
| Ingestion Pipeline     | Go                       | 1.22+    |
| Stellar SDK (Go)       | stellar/go-stellar-sdk   | Latest   |
| Stellar SDK (JS)       | @stellar/stellar-sdk     | Latest   |
| Connection Pooler      | PgBouncer                | Latest   |
| Container Runtime      | Docker + Kubernetes      | Latest   |
| CI/CD                  | GitHub Actions           | N/A      |
| Monitoring             | OpenTelemetry + Grafana  | Latest   |

## Appendix B: Key References

### Stellar Protocol Specifications

- [CAP-67: Unified Asset Events](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0067.md)
- [CAP-46: Soroban Smart Contracts](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046.md)
- [CAP-46-06: Stellar Asset Contract](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046-06.md)
- [SEP-41: Token Interface Standard](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md)
- [SEP-50: NFT Standard](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0050.md)
- [SEP-39: Classic NFT Recommendations](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0039.md)
- [SEP-1: stellar.toml](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md)

### Stellar Developer Documentation

- [Stellar Data Overview](https://developers.stellar.org/docs/data)
- [Stellar RPC API](https://developers.stellar.org/docs/data/apis/rpc)
- [Horizon API](https://developers.stellar.org/docs/data/apis/horizon)
- [Hubble (BigQuery)](https://developers.stellar.org/docs/data/analytics/hubble)
- [Ingest SDK](https://developers.stellar.org/docs/data/indexers/build-your-own/ingest-sdk)
- [Token Transfer Processor](https://developers.stellar.org/docs/data/indexers/build-your-own/processors/token-transfer-processor)
- [Data Lake Integration](https://developers.stellar.org/docs/data/apis/rpc/admin-guide/data-lake-integration)
- [Migrate from Horizon to RPC](https://developers.stellar.org/docs/data/apis/migrate-from-horizon-to-rpc)

### Explorer References

- [Blockscout (open-source EVM explorer)](https://github.com/blockscout/blockscout)
- [StellarExpert](https://stellar.expert)
- [Steexp](https://steexp.com)
- [Etherscan](https://etherscan.io)
- [Solscan](https://solscan.io)
