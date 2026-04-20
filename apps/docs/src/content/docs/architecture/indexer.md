---
title: Indexer Pipeline
description: How the Go indexer ingests Stellar network data.
---

The indexer is a Go service that processes Stellar ledger data into local data stores for advanced queries, search, and analytics.

![Indexer Pipeline](../../../assets/diagrams/indexer-pipeline.svg)

## Data Stores

| Store | Purpose |
|---|---|
| **PostgreSQL + TimescaleDB** | Structured ledger, transaction, and operation data with time-series optimizations |
| **Redis** | Pub/sub for real-time event distribution |
| **Typesense** | Full-text search across transactions, accounts, and assets |

## Ingestion Modes

### Live Ingestion

Processes new ledgers as they close (~1 every 5 seconds). Connects to a Stellar RPC endpoint and streams new data continuously.

```bash
make run-live
```

### Backfill

Two strategies for importing historical data:

- **RPC Backfill** — Fetches historical ledgers from an RPC endpoint. Works on any network.
- **S3 Data Lake Backfill** — Reads from Stellar's public S3 data lake. Pubnet only, significantly faster.

```bash
make backfill       # RPC backfill
make s3backfill     # S3 backfill (pubnet only)
```

## Architecture

The indexer follows a pipeline pattern: **Source → Transform → Store → Publish**.

For full configuration options and setup instructions, see the [indexer README](https://github.com/salazarsebas/stellar-explorer/blob/main/services/indexer/README.md).
