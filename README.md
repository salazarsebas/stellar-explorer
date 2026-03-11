# Stellar Explorer

> A premium block explorer for the Stellar network — built for developers, traders, and ecosystem builders.

[![Live](https://img.shields.io/badge/status-live-brightgreen)](#) [![Next.js](https://img.shields.io/badge/Next.js-16-black)](#) [![Go](https://img.shields.io/badge/Indexer-Go-00ADD8)](#)

---

## What is Stellar Explorer?

Stellar Explorer gives you a fast, clean window into the Stellar blockchain. Browse ledgers, transactions, accounts, assets, and Soroban smart contracts across **Public**, **Testnet**, and **Futurenet** — all in one place, with a UI that doesn't get in your way.

The app is **live today**, powered entirely by the Stellar Horizon API and Soroban RPC. We're also building a custom **indexer** that will bring historical depth, richer analytics, and a broader data panorama that the Horizon API alone can't provide.

---

## Live App

The current version is fully operational and covers:

| Feature                  | Details                                            |
| ------------------------ | -------------------------------------------------- |
| 🔴 **Real-time data**    | Live ledger and transaction streaming from Horizon |
| 🌐 **Multi-network**     | Public mainnet, Testnet, and Futurenet             |
| 🪙 **Asset discovery**   | Token metadata and logos via `stellar.toml`        |
| 📜 **Smart contracts**   | Browse Soroban contract events, code, and storage  |
| 📌 **Watchlist**         | Track accounts and assets across sessions          |
| 🌗 **Dark / Light mode** | Optimized for both themes                          |
| 🌍 **9 languages**       | EN, ES, PT, FR, DE, ZH, JA, KO, RU                 |

---

## The Indexer — Expanding Our Data Horizon

The Horizon API is great for recent data, but it has limits: no deep historical coverage, no custom aggregations, and no way to serve analytics at scale. That's where the indexer comes in.

The **Stellar Explorer Indexer** is a Go service that ingests Stellar network data — ledgers, transactions, and operations — into **PostgreSQL + TimescaleDB**, with real-time event publishing via **Redis**. Once fully deployed, it will power:

- ⏳ **Full historical coverage** — from ledger 3 to present (60M+ ledgers on pubnet)
- 📊 **Richer analytics** — charts and aggregations that live APIs can't support
- 🔍 **Full-text search** — powered by Typesense
- ⚡ **Real-time event streams** — Redis pub/sub for live updates

### Architecture

```
Stellar RPC ──► source/rpc.go ──────► transform/ ──► store/postgres.go ──► PostgreSQL
                (JSON-RPC 2.0)         (XDR parsing)   (batch inserts)
                                           ▲                   │
AWS S3 ────► source/datalake.go ──────────┘                   ▼
              (public data lake)                    publisher/redis.go ──► Redis pub/sub
```

### Three Indexer Modes

The indexer ships with three operating modes designed to cover every scenario — from bootstrapping to production:

---

#### 🟢 `live` — Real-time Ingestion

Continuously polls the Stellar RPC for new ledgers and ingests them as they close (~1 ledger every 5 seconds). Designed to run indefinitely in production.

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet make run-live
```

Shuts down gracefully on `Ctrl+C` and resumes from the last ingested ledger on restart — no duplicates, no gaps.

---

#### 🔵 `backfill` — Historical Backfill via RPC

Processes a specific range of ledgers in parallel. Works on any network (pubnet, testnet, futurenet). Ideal for catching up after a gap or indexing a targeted range.

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet \
  ./bin/indexer backfill --start 1288000 --end 1288100
```

Controlled by `WORKER_COUNT` (default: 8) for parallel throughput.

---

#### 🟠 `s3backfill` — Mass Historical Backfill from AWS Data Lake

The fastest way to index the entire Stellar pubnet history. Reads directly from the [Stellar public AWS data lake](https://github.com/stellar/stellar-etl) — no RPC endpoint and no AWS credentials required. Covers ledger 3 through the latest pubnet ledger (60M+).

```bash
# Index a million ledgers
./bin/indexer s3backfill --start 3 --end 1000000

# Resume from a checkpoint
./bin/indexer s3backfill --start 500001 --end 1000000

# Crank up workers for maximum throughput
WORKER_COUNT=16 ./bin/indexer s3backfill --start 3 --end 5000000
```

> **Note:** `s3backfill` is pubnet-only. For testnet/futurenet historical data, use `backfill` with an RPC endpoint.

---

## Tech Stack

**Frontend**

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- [TanStack Query](https://tanstack.com/query) for data fetching and caching
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Stellar SDK](https://stellar.github.io/js-stellar-sdk/)
- [Bun](https://bun.sh/) as package manager and runtime

**Indexer**

- [Go 1.24](https://go.dev/)
- [PostgreSQL](https://www.postgresql.org/) + [TimescaleDB](https://www.timescale.com/) for time-series data
- [Redis](https://redis.io/) for real-time pub/sub
- [Typesense](https://typesense.org/) for full-text search

---

## Getting Started

### Frontend

```bash
bun install       # Install dependencies
bun run dev       # Start dev server at http://localhost:3000
bun run build     # Production build
```

### Indexer

Requires Docker Compose to be running:

```bash
# From project root — starts PostgreSQL, Redis, and Typesense
docker compose up -d

# Apply database migrations
for f in migrations/*.up.sql; do
  cat "$f" | docker compose exec -T postgres psql -U explorer -d stellar_explorer
done

# Build and run the indexer
cd indexer
make build
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet make run-live
```

See [`indexer/README.md`](./indexer/README.md) for the full configuration reference and all available commands.

---

## Scripts

| Command          | Description               |
| ---------------- | ------------------------- |
| `bun run dev`    | Start development server  |
| `bun run build`  | Build for production      |
| `bun run start`  | Start production server   |
| `bun run lint`   | Run ESLint                |
| `bun run format` | Format code with Prettier |
| `bun run test`   | Run tests with Vitest     |

---

## License

MIT
