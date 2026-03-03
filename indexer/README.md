# Stellar Explorer Indexer

Go service that ingests Stellar network data (ledgers, transactions, operations) from the Stellar RPC into PostgreSQL, with real-time event publishing via Redis.

## Prerequisites

- Go 1.24+ (managed via asdf, see `.tool-versions`)
- Docker Compose services running:

```bash
# from project root
docker compose up -d
```

This starts PostgreSQL+TimescaleDB (port 54320), Redis (port 63790), and Typesense (port 18108).

- Database migrations applied:

```bash
for f in ../migrations/*.up.sql; do
  cat "$f" | docker compose exec -T postgres psql -U explorer -d stellar_explorer
done
```

## Configuration

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `RPC_ENDPOINT` | — | **Yes** | Stellar RPC endpoint |
| `NETWORK` | `public` | No | `public`, `testnet`, or `futurenet` |
| `DATABASE_URL` | `postgresql://explorer:explorer_dev@localhost:54320/stellar_explorer?sslmode=disable` | No | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:63790` | No | Redis connection (optional — logs warning if unavailable) |
| `BATCH_SIZE` | `100` | No | Ledgers per batch |
| `WORKER_COUNT` | `8` | No | Parallel workers for backfill |

## Commands

```bash
make build          # Compile to bin/indexer
make test           # Run all tests
make fmt            # Format code
make lint           # Run go vet
make clean          # Remove bin/
```

### Live ingestion

Continuously polls the RPC for new ledgers and ingests them in real-time (~1 ledger every 5 seconds):

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org NETWORK=testnet make run-live
```

Or directly:

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org ./bin/indexer live
```

Stop with `Ctrl+C` — the indexer shuts down gracefully and resumes from the last ingested ledger on restart.

### Historical backfill

Processes a range of ledgers using parallel workers:

```bash
RPC_ENDPOINT=https://soroban-testnet.stellar.org ./bin/indexer backfill --start 1288000 --end 1288100
```

## Validating it works

After running the indexer for a few seconds, check that data landed in PostgreSQL:

```bash
# Ledgers
docker compose exec postgres psql -U explorer -d stellar_explorer \
  -c "SELECT sequence, transaction_count, operation_count, protocol_version FROM ledgers ORDER BY sequence DESC LIMIT 5;"

# Transactions
docker compose exec postgres psql -U explorer -d stellar_explorer \
  -c "SELECT hash, ledger_sequence, account, operation_count, is_soroban FROM transactions ORDER BY created_at DESC LIMIT 5;"

# Operations
docker compose exec postgres psql -U explorer -d stellar_explorer \
  -c "SELECT transaction_hash, type_name, destination, amount FROM operations ORDER BY created_at DESC LIMIT 5;"

# Ingestion cursor
docker compose exec postgres psql -U explorer -d stellar_explorer \
  -c "SELECT * FROM ingestion_state;"
```

To verify Redis pub/sub, subscribe in one terminal:

```bash
docker compose exec redis redis-cli SUBSCRIBE stream:ledgers
```

Then run the indexer in another terminal — you should see JSON messages as ledgers are ingested.

## Testing

Tests run against a live Stellar testnet RPC and local Docker services:

```bash
make test
```

Run a specific package:

```bash
go test ./internal/source/ -v      # RPC client (hits testnet)
go test ./internal/transform/ -v   # XDR parsing (hits testnet)
go test ./internal/store/ -v       # PostgreSQL (requires Docker)
go test ./internal/publisher/ -v   # Redis pub/sub (requires Docker)
go test ./internal/pipeline/ -v    # End-to-end (requires both)
```

Tests skip gracefully if Docker services are unavailable. Override connection strings with `TEST_DATABASE_URL` and `TEST_RPC_ENDPOINT`.

## Architecture

```
Stellar RPC ──> source/rpc.go ──> transform/ ──> store/postgres.go ──> PostgreSQL
                (JSON-RPC 2.0)    (XDR parsing)   (batch inserts)
                                                         │
                                                         ▼
                                                  publisher/redis.go ──> Redis pub/sub
                                                  (stream:ledgers,
                                                   stream:transactions)
```

| Package | Purpose |
|---------|---------|
| `cmd/indexer` | Entry point with `live`, `backfill`, `migrate` commands |
| `internal/config` | Environment variable loading and validation |
| `internal/source` | Stellar RPC client (`getLedgers`, `getTransactions`, `getLatestLedger`) |
| `internal/transform` | XDR parsing into database models (ledgers, transactions, operations) |
| `internal/store` | PostgreSQL writer with batch inserts and ingestion cursor |
| `internal/pipeline` | Live ingestion loop and parallel backfill orchestration |
| `internal/publisher` | Redis pub/sub for real-time event streaming |
