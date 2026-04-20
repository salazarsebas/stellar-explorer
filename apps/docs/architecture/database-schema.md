# Database Schema: Soroban-First Block Explorer

> Complete PostgreSQL + TimescaleDB schema for the Stellar block explorer.
> Companion document to [architecture.md](./architecture.md).

## Schema Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    ledgers       │────▶│  transactions   │────▶│   operations    │
│  (hypertable)    │     │  (hypertable)    │     │  (hypertable)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                ┌─────────────────┐
                                                │    effects       │
                                                │  (hypertable)    │
                                                └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    accounts      │────▶│   trustlines    │     │ account_signers │
│  (regular)       │     │  (regular)       │     │  (regular)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   contracts      │────▶│contract_storage │     │ contract_code   │
│  (regular)       │     │  (regular)       │     │  (regular)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ contract_events  │     │  token_events   │     │     assets      │
│  (hypertable)    │     │  (hypertable)    │     │  (regular)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ known_accounts  │     │ ingestion_state │
│  (regular)       │     │  (regular)       │
└─────────────────┘     └─────────────────┘
```

## Table Definitions

### Ledgers

```sql
CREATE TABLE ledgers (
    sequence            BIGINT PRIMARY KEY,
    hash                CHAR(64) NOT NULL UNIQUE,
    prev_hash           CHAR(64) NOT NULL,
    closed_at           TIMESTAMPTZ NOT NULL,
    total_coins         BIGINT NOT NULL,
    fee_pool            BIGINT NOT NULL,
    base_fee            INTEGER NOT NULL,
    base_reserve        INTEGER NOT NULL,
    max_tx_set_size     INTEGER NOT NULL,
    protocol_version    INTEGER NOT NULL,
    transaction_count   INTEGER NOT NULL DEFAULT 0,
    operation_count     INTEGER NOT NULL DEFAULT 0,
    successful_tx_count INTEGER NOT NULL DEFAULT 0,
    failed_tx_count     INTEGER NOT NULL DEFAULT 0,
    tx_set_operation_count INTEGER,
    header_xdr          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TimescaleDB hypertable with monthly chunks
SELECT create_hypertable('ledgers', 'closed_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

-- Compression policy: compress chunks older than 3 months
ALTER TABLE ledgers SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = '',
    timescaledb.compress_orderby = 'closed_at DESC'
);
SELECT add_compression_policy('ledgers', INTERVAL '3 months');
```

### Transactions

```sql
CREATE TABLE transactions (
    id                  BIGSERIAL,
    hash                CHAR(64) NOT NULL,
    ledger_sequence     BIGINT NOT NULL,
    application_order   INTEGER NOT NULL,
    account             VARCHAR(56) NOT NULL,
    account_muxed       VARCHAR(69),          -- M-address if muxed
    account_sequence    BIGINT NOT NULL,
    fee_charged         BIGINT NOT NULL,
    max_fee             BIGINT NOT NULL,
    operation_count     INTEGER NOT NULL,
    memo_type           SMALLINT NOT NULL DEFAULT 0,
    memo_text           TEXT,
    memo_hash           CHAR(64),
    time_bounds_min     TIMESTAMPTZ,
    time_bounds_max     TIMESTAMPTZ,
    status              SMALLINT NOT NULL,     -- 0=failed, 1=success
    -- Soroban-specific fields
    is_soroban          BOOLEAN NOT NULL DEFAULT FALSE,
    soroban_resources   JSONB,                 -- instruction count, read/write bytes
    -- Raw XDR for full fidelity
    envelope_xdr        TEXT NOT NULL,
    result_xdr          TEXT NOT NULL,
    result_meta_xdr     TEXT,
    fee_meta_xdr        TEXT,
    created_at          TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('transactions', 'created_at',
    chunk_time_interval => INTERVAL '1 week'
);

-- Core lookup indexes
CREATE UNIQUE INDEX idx_tx_hash ON transactions (hash, created_at);
CREATE INDEX idx_tx_account ON transactions (account, created_at DESC);
CREATE INDEX idx_tx_ledger ON transactions (ledger_sequence, created_at);
CREATE INDEX idx_tx_soroban ON transactions (is_soroban, created_at DESC)
    WHERE is_soroban = TRUE;

-- Compression
ALTER TABLE transactions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'account',
    timescaledb.compress_orderby = 'created_at DESC'
);
SELECT add_compression_policy('transactions', INTERVAL '2 months');
```

### Operations

```sql
CREATE TABLE operations (
    id                  BIGSERIAL,
    transaction_id      BIGINT NOT NULL,
    transaction_hash    CHAR(64) NOT NULL,
    application_order   INTEGER NOT NULL,
    type                SMALLINT NOT NULL,
    type_name           VARCHAR(64) NOT NULL,  -- human-readable type name
    source_account      VARCHAR(56),
    -- Denormalized fields for common query patterns
    asset_code          VARCHAR(12),
    asset_issuer        VARCHAR(56),
    amount              NUMERIC(38, 7),        -- 38 digits to support i128
    destination         VARCHAR(56),
    -- Soroban-specific denormalized fields
    contract_id         VARCHAR(56),
    function_name       VARCHAR(128),
    -- Full details as JSONB
    details             JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('operations', 'created_at',
    chunk_time_interval => INTERVAL '1 week'
);

CREATE INDEX idx_op_tx_hash ON operations (transaction_hash, created_at);
CREATE INDEX idx_op_source ON operations (source_account, created_at DESC);
CREATE INDEX idx_op_type ON operations (type, created_at DESC);
CREATE INDEX idx_op_destination ON operations (destination, created_at DESC)
    WHERE destination IS NOT NULL;
CREATE INDEX idx_op_asset ON operations (asset_code, asset_issuer, created_at DESC)
    WHERE asset_code IS NOT NULL;
CREATE INDEX idx_op_contract ON operations (contract_id, created_at DESC)
    WHERE contract_id IS NOT NULL;
CREATE INDEX idx_op_function ON operations (contract_id, function_name, created_at DESC)
    WHERE function_name IS NOT NULL;

-- Compression
ALTER TABLE operations SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'type',
    timescaledb.compress_orderby = 'created_at DESC'
);
SELECT add_compression_policy('operations', INTERVAL '2 months');
```

### Effects

```sql
CREATE TABLE effects (
    id                  BIGSERIAL,
    operation_id        BIGINT NOT NULL,
    transaction_hash    CHAR(64) NOT NULL,
    type                SMALLINT NOT NULL,
    type_name           VARCHAR(64) NOT NULL,
    account             VARCHAR(56) NOT NULL,
    details             JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('effects', 'created_at',
    chunk_time_interval => INTERVAL '1 week'
);

CREATE INDEX idx_effect_account ON effects (account, created_at DESC);
CREATE INDEX idx_effect_type ON effects (type, created_at DESC);
CREATE INDEX idx_effect_op ON effects (operation_id, created_at);
CREATE INDEX idx_effect_tx ON effects (transaction_hash, created_at);

-- Compression
ALTER TABLE effects SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'account',
    timescaledb.compress_orderby = 'created_at DESC'
);
SELECT add_compression_policy('effects', INTERVAL '2 months');
```

### Accounts (Current State)

```sql
CREATE TABLE accounts (
    id                  VARCHAR(56) PRIMARY KEY,
    sequence            BIGINT NOT NULL,
    balance             NUMERIC(20, 7) NOT NULL,
    buying_liabilities  NUMERIC(20, 7) NOT NULL DEFAULT 0,
    selling_liabilities NUMERIC(20, 7) NOT NULL DEFAULT 0,
    num_subentries      INTEGER NOT NULL DEFAULT 0,
    home_domain         VARCHAR(256),
    flags               INTEGER NOT NULL DEFAULT 0,
    inflation_dest      VARCHAR(56),
    thresholds          JSONB,                 -- low, med, high
    last_modified_ledger BIGINT NOT NULL,
    sponsor             VARCHAR(56),
    num_sponsored       INTEGER NOT NULL DEFAULT 0,
    num_sponsoring      INTEGER NOT NULL DEFAULT 0,
    data_entries        JSONB,                 -- account data name:value pairs
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_home_domain ON accounts (home_domain)
    WHERE home_domain IS NOT NULL;
CREATE INDEX idx_account_updated ON accounts (updated_at DESC);
CREATE INDEX idx_account_balance ON accounts (balance DESC);
```

### Trustlines

```sql
CREATE TABLE trustlines (
    account_id          VARCHAR(56) NOT NULL,
    asset_type          SMALLINT NOT NULL,      -- 1=credit_alphanum4, 2=credit_alphanum12, 3=pool_share
    asset_code          VARCHAR(12) NOT NULL,
    asset_issuer        VARCHAR(56) NOT NULL,
    balance             NUMERIC(20, 7) NOT NULL DEFAULT 0,
    limit_amount        NUMERIC(20, 7) NOT NULL,
    buying_liabilities  NUMERIC(20, 7) NOT NULL DEFAULT 0,
    selling_liabilities NUMERIC(20, 7) NOT NULL DEFAULT 0,
    flags               INTEGER NOT NULL DEFAULT 0,
    last_modified_ledger BIGINT NOT NULL,
    sponsor             VARCHAR(56),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, asset_code, asset_issuer)
);

CREATE INDEX idx_trustline_asset ON trustlines (asset_code, asset_issuer);
CREATE INDEX idx_trustline_balance ON trustlines (asset_code, asset_issuer, balance DESC)
    WHERE balance > 0;
```

### Account Signers

```sql
CREATE TABLE account_signers (
    account_id          VARCHAR(56) NOT NULL,
    signer_key          VARCHAR(56) NOT NULL,
    weight              INTEGER NOT NULL,
    type                VARCHAR(32) NOT NULL,   -- ed25519_public_key, sha256_hash, preauth_tx
    sponsor             VARCHAR(56),
    last_modified_ledger BIGINT NOT NULL,
    PRIMARY KEY (account_id, signer_key)
);

CREATE INDEX idx_signer_key ON account_signers (signer_key);
```

### Assets

```sql
CREATE TABLE assets (
    id                  SERIAL PRIMARY KEY,
    asset_type          SMALLINT NOT NULL,
    asset_code          VARCHAR(12) NOT NULL,
    asset_issuer        VARCHAR(56) NOT NULL,
    -- Aggregated stats (updated by ingestion pipeline)
    num_accounts        INTEGER NOT NULL DEFAULT 0,
    total_supply        NUMERIC(38, 7) NOT NULL DEFAULT 0,
    num_claimable_balances INTEGER NOT NULL DEFAULT 0,
    num_liquidity_pools INTEGER NOT NULL DEFAULT 0,
    num_contracts       INTEGER NOT NULL DEFAULT 0,
    -- Flags from issuer account
    flags               INTEGER NOT NULL DEFAULT 0,
    auth_required       BOOLEAN NOT NULL DEFAULT FALSE,
    auth_revocable      BOOLEAN NOT NULL DEFAULT FALSE,
    auth_immutable      BOOLEAN NOT NULL DEFAULT FALSE,
    clawback_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    -- Metadata from stellar.toml
    home_domain         VARCHAR(256),
    toml_name           VARCHAR(256),
    toml_description    TEXT,
    toml_image_url      VARCHAR(1024),
    toml_conditions     TEXT,
    toml_metadata       JSONB,
    -- SAC (Stellar Asset Contract) mapping
    sac_contract_id     VARCHAR(56),
    -- Stats
    last_trade_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (asset_code, asset_issuer)
);

CREATE INDEX idx_asset_code ON assets (asset_code);
CREATE INDEX idx_asset_issuer ON assets (asset_issuer);
CREATE INDEX idx_asset_accounts ON assets (num_accounts DESC);
CREATE INDEX idx_asset_domain ON assets (home_domain) WHERE home_domain IS NOT NULL;
CREATE INDEX idx_asset_sac ON assets (sac_contract_id) WHERE sac_contract_id IS NOT NULL;
```

### Contracts

```sql
CREATE TABLE contracts (
    contract_id         VARCHAR(56) PRIMARY KEY,
    wasm_hash           CHAR(64),
    creator_account     VARCHAR(56),
    created_ledger      BIGINT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL,
    last_modified_ledger BIGINT NOT NULL,
    -- Contract classification
    contract_type       SMALLINT NOT NULL DEFAULT 0,  -- 0=wasm, 1=stellar_asset, 2=custom
    is_sep41_token      BOOLEAN NOT NULL DEFAULT FALSE,
    is_sep50_nft        BOOLEAN NOT NULL DEFAULT FALSE,
    -- SEP-41 metadata (cached from simulateTransaction)
    token_name          VARCHAR(256),
    token_symbol        VARCHAR(32),
    token_decimals      INTEGER,
    -- Contract spec (parsed from WASM custom section)
    contract_spec       JSONB,                 -- function signatures, types, docs
    -- Stats
    storage_entry_count INTEGER NOT NULL DEFAULT 0,
    event_count         BIGINT NOT NULL DEFAULT 0,
    invocation_count    BIGINT NOT NULL DEFAULT 0,
    -- Labels
    label               VARCHAR(256),           -- human-readable name (from directory)
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_creator ON contracts (creator_account);
CREATE INDEX idx_contract_wasm ON contracts (wasm_hash) WHERE wasm_hash IS NOT NULL;
CREATE INDEX idx_contract_type ON contracts (contract_type);
CREATE INDEX idx_contract_token ON contracts (is_sep41_token) WHERE is_sep41_token = TRUE;
CREATE INDEX idx_contract_nft ON contracts (is_sep50_nft) WHERE is_sep50_nft = TRUE;
CREATE INDEX idx_contract_invocations ON contracts (invocation_count DESC);
```

### Contract Code (WASM)

```sql
CREATE TABLE contract_code (
    wasm_hash           CHAR(64) PRIMARY KEY,
    wasm_bytecode       BYTEA NOT NULL,
    wasm_size           INTEGER NOT NULL,
    -- Parsed from WASM custom section
    spec_xdr            TEXT,                   -- raw XDR of contract spec
    spec_parsed         JSONB,                  -- parsed function signatures
    -- Verification (future: link to source code)
    verified            BOOLEAN NOT NULL DEFAULT FALSE,
    source_url          VARCHAR(1024),
    source_commit       VARCHAR(64),
    -- Stats
    contract_count      INTEGER NOT NULL DEFAULT 1,
    created_ledger      BIGINT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Contract Storage

```sql
CREATE TABLE contract_storage (
    contract_id         VARCHAR(56) NOT NULL,
    key_xdr             TEXT NOT NULL,
    key_decoded         JSONB,                  -- decoded ScVal
    value_xdr           TEXT NOT NULL,
    value_decoded       JSONB,                  -- decoded ScVal
    durability          SMALLINT NOT NULL,       -- 0=temporary, 1=persistent, 2=instance
    ttl_ledger          BIGINT,                 -- expiration ledger
    last_modified_ledger BIGINT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (contract_id, key_xdr)
);

CREATE INDEX idx_storage_contract ON contract_storage (contract_id);
CREATE INDEX idx_storage_ttl ON contract_storage (ttl_ledger)
    WHERE ttl_ledger IS NOT NULL;
```

### Contract Events

```sql
CREATE TABLE contract_events (
    id                  BIGSERIAL,
    contract_id         VARCHAR(56) NOT NULL,
    transaction_hash    CHAR(64) NOT NULL,
    ledger_sequence     BIGINT NOT NULL,
    type                SMALLINT NOT NULL,       -- 0=contract, 1=system, 2=diagnostic
    -- Topics (up to 4, decoded from ScVal)
    topic_1             TEXT,                    -- e.g., "transfer", "swap", "mint"
    topic_2             TEXT,                    -- e.g., from address
    topic_3             TEXT,                    -- e.g., to address
    topic_4             TEXT,                    -- e.g., asset identifier
    -- Raw + decoded
    topics_xdr          TEXT NOT NULL,
    value_xdr           TEXT NOT NULL,
    topics_decoded      JSONB,
    value_decoded       JSONB,
    created_at          TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('contract_events', 'created_at',
    chunk_time_interval => INTERVAL '1 week'
);

CREATE INDEX idx_event_contract ON contract_events (contract_id, created_at DESC);
CREATE INDEX idx_event_topic1 ON contract_events (topic_1, created_at DESC);
CREATE INDEX idx_event_contract_topic ON contract_events (contract_id, topic_1, created_at DESC);
CREATE INDEX idx_event_tx ON contract_events (transaction_hash, created_at);
CREATE INDEX idx_event_ledger ON contract_events (ledger_sequence, created_at);

-- Compression
ALTER TABLE contract_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'contract_id',
    timescaledb.compress_orderby = 'created_at DESC'
);
SELECT add_compression_policy('contract_events', INTERVAL '2 months');
```

### Token Events (CAP-67 Unified)

```sql
CREATE TABLE token_events (
    id                  BIGSERIAL,
    event_type          SMALLINT NOT NULL,       -- 0=transfer, 1=mint, 2=burn, 3=clawback, 4=fee
    event_type_name     VARCHAR(16) NOT NULL,
    -- Participants
    from_address        VARCHAR(56),
    from_muxed          VARCHAR(69),
    to_address          VARCHAR(56),
    to_muxed            VARCHAR(69),
    to_muxed_id         BIGINT,                 -- muxed account ID for custodial
    -- Asset
    asset_type          SMALLINT NOT NULL,       -- 0=native, 1=credit, 2=soroban_token
    asset_code          VARCHAR(12),
    asset_issuer        VARCHAR(56),
    asset_contract_id   VARCHAR(56),
    -- Amount
    amount              NUMERIC(38, 0) NOT NULL, -- i128 raw amount
    amount_formatted    NUMERIC(38, 7),          -- formatted with decimals
    -- Context
    transaction_hash    CHAR(64) NOT NULL,
    ledger_sequence     BIGINT NOT NULL,
    operation_index     INTEGER,
    created_at          TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('token_events', 'created_at',
    chunk_time_interval => INTERVAL '1 week'
);

-- Query: "all transfers for account X"
CREATE INDEX idx_token_from ON token_events (from_address, created_at DESC);
CREATE INDEX idx_token_to ON token_events (to_address, created_at DESC);
-- Query: "all events for asset Y"
CREATE INDEX idx_token_asset ON token_events (asset_code, asset_issuer, created_at DESC);
CREATE INDEX idx_token_contract_asset ON token_events (asset_contract_id, created_at DESC)
    WHERE asset_contract_id IS NOT NULL;
-- Query: "all mints/burns for asset Y"
CREATE INDEX idx_token_type_asset ON token_events (event_type, asset_code, asset_issuer, created_at DESC);
CREATE INDEX idx_token_tx ON token_events (transaction_hash, created_at);
CREATE INDEX idx_token_ledger ON token_events (ledger_sequence, created_at);

-- Compression
ALTER TABLE token_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'event_type',
    timescaledb.compress_orderby = 'created_at DESC'
);
SELECT add_compression_policy('token_events', INTERVAL '2 months');
```

### Known Accounts (Directory)

```sql
CREATE TABLE known_accounts (
    address             VARCHAR(56) PRIMARY KEY,
    label               VARCHAR(256) NOT NULL,
    category            VARCHAR(64),            -- exchange, anchor, validator, scam, etc.
    domain              VARCHAR(256),
    description         TEXT,
    tags                TEXT[],
    verified            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_known_category ON known_accounts (category);
CREATE INDEX idx_known_label ON known_accounts USING GIN (to_tsvector('english', label));
```

### Liquidity Pools

```sql
CREATE TABLE liquidity_pools (
    pool_id             CHAR(64) PRIMARY KEY,
    fee_bp              INTEGER NOT NULL,        -- fee in basis points
    -- Reserve A
    asset_a_type        SMALLINT NOT NULL,
    asset_a_code        VARCHAR(12),
    asset_a_issuer      VARCHAR(56),
    reserve_a           NUMERIC(20, 7) NOT NULL DEFAULT 0,
    -- Reserve B
    asset_b_type        SMALLINT NOT NULL,
    asset_b_code        VARCHAR(12),
    asset_b_issuer      VARCHAR(56),
    reserve_b           NUMERIC(20, 7) NOT NULL DEFAULT 0,
    -- Stats
    total_shares        NUMERIC(20, 7) NOT NULL DEFAULT 0,
    total_trustlines    INTEGER NOT NULL DEFAULT 0,
    last_modified_ledger BIGINT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pool_asset_a ON liquidity_pools (asset_a_code, asset_a_issuer);
CREATE INDEX idx_pool_asset_b ON liquidity_pools (asset_b_code, asset_b_issuer);
```

### Offers (DEX)

```sql
CREATE TABLE offers (
    offer_id            BIGINT PRIMARY KEY,
    seller_id           VARCHAR(56) NOT NULL,
    selling_asset_type  SMALLINT NOT NULL,
    selling_asset_code  VARCHAR(12),
    selling_asset_issuer VARCHAR(56),
    buying_asset_type   SMALLINT NOT NULL,
    buying_asset_code   VARCHAR(12),
    buying_asset_issuer VARCHAR(56),
    amount              NUMERIC(20, 7) NOT NULL,
    price_n             BIGINT NOT NULL,
    price_d             BIGINT NOT NULL,
    price               NUMERIC(20, 10) NOT NULL,
    flags               INTEGER NOT NULL DEFAULT 0,
    last_modified_ledger BIGINT NOT NULL,
    sponsor             VARCHAR(56),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offer_seller ON offers (seller_id);
CREATE INDEX idx_offer_selling ON offers (selling_asset_code, selling_asset_issuer);
CREATE INDEX idx_offer_buying ON offers (buying_asset_code, buying_asset_issuer);
CREATE INDEX idx_offer_pair ON offers (
    selling_asset_code, selling_asset_issuer,
    buying_asset_code, buying_asset_issuer,
    price
);
```

### Trades (TimescaleDB hypertable)

```sql
CREATE TABLE trades (
    id                  BIGSERIAL,
    ledger_sequence     BIGINT NOT NULL,
    offer_id            BIGINT,
    -- Base
    base_account        VARCHAR(56) NOT NULL,
    base_asset_type     SMALLINT NOT NULL,
    base_asset_code     VARCHAR(12),
    base_asset_issuer   VARCHAR(56),
    base_amount         NUMERIC(20, 7) NOT NULL,
    -- Counter
    counter_account     VARCHAR(56) NOT NULL,
    counter_asset_type  SMALLINT NOT NULL,
    counter_asset_code  VARCHAR(12),
    counter_asset_issuer VARCHAR(56),
    counter_amount      NUMERIC(20, 7) NOT NULL,
    -- Price
    price_n             BIGINT NOT NULL,
    price_d             BIGINT NOT NULL,
    base_is_seller      BOOLEAN NOT NULL,
    trade_type          SMALLINT NOT NULL DEFAULT 0,  -- 0=orderbook, 1=liquidity_pool
    liquidity_pool_id   CHAR(64),
    created_at          TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('trades', 'created_at',
    chunk_time_interval => INTERVAL '1 week'
);

CREATE INDEX idx_trade_base ON trades (base_account, created_at DESC);
CREATE INDEX idx_trade_counter ON trades (counter_account, created_at DESC);
CREATE INDEX idx_trade_pair ON trades (
    base_asset_code, base_asset_issuer,
    counter_asset_code, counter_asset_issuer,
    created_at DESC
);
CREATE INDEX idx_trade_ledger ON trades (ledger_sequence, created_at);

-- Compression
ALTER TABLE trades SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = '',
    timescaledb.compress_orderby = 'created_at DESC'
);
SELECT add_compression_policy('trades', INTERVAL '2 months');
```

### Network Stats (Materialized)

```sql
CREATE TABLE network_stats (
    id                  SERIAL PRIMARY KEY,
    stat_date           DATE NOT NULL UNIQUE,
    total_accounts      BIGINT NOT NULL,
    total_ledgers       BIGINT NOT NULL,
    total_transactions  BIGINT NOT NULL,
    total_operations    BIGINT NOT NULL,
    total_contracts     INTEGER NOT NULL,
    daily_transactions  BIGINT NOT NULL,
    daily_operations    BIGINT NOT NULL,
    daily_new_accounts  INTEGER NOT NULL,
    daily_new_contracts INTEGER NOT NULL,
    avg_ledger_time_ms  INTEGER,
    avg_fee             NUMERIC(20, 7),
    soroban_tx_pct      NUMERIC(5, 2),          -- % of transactions that are Soroban
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stats_date ON network_stats (stat_date DESC);
```

### Ingestion State

```sql
CREATE TABLE ingestion_state (
    key                 VARCHAR(64) PRIMARY KEY,
    value               TEXT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracking entries:
-- 'last_ingested_ledger' = '55000000'
-- 'backfill_start_ledger' = '50000000'
-- 'backfill_current_ledger' = '52500000'
-- 'backfill_complete' = 'false'
-- 'hubble_export_complete' = 'true'
```

## Index Strategy Summary

### Primary Access Patterns → Index Mapping

| Query Pattern                 | Table           | Index Used                                                         |
| ----------------------------- | --------------- | ------------------------------------------------------------------ |
| Transaction by hash           | transactions    | `idx_tx_hash (hash, created_at)`                                   |
| Transactions for account      | transactions    | `idx_tx_account (account, created_at DESC)`                        |
| Transactions in ledger        | transactions    | `idx_tx_ledger (ledger_sequence, created_at)`                      |
| Operations for transaction    | operations      | `idx_op_tx_hash (transaction_hash, created_at)`                    |
| Operations by source account  | operations      | `idx_op_source (source_account, created_at DESC)`                  |
| Operations for contract       | operations      | `idx_op_contract (contract_id, created_at DESC)`                   |
| Operations by function name   | operations      | `idx_op_function (contract_id, function_name, created_at DESC)`    |
| Effects for account           | effects         | `idx_effect_account (account, created_at DESC)`                    |
| Events for contract           | contract_events | `idx_event_contract (contract_id, created_at DESC)`                |
| Events by function/event type | contract_events | `idx_event_contract_topic (contract_id, topic_1, created_at DESC)` |
| Token transfers for account   | token_events    | `idx_token_from / idx_token_to`                                    |
| Token events for asset        | token_events    | `idx_token_asset (asset_code, asset_issuer, created_at DESC)`      |
| Trades for asset pair         | trades          | `idx_trade_pair (base_asset, counter_asset, created_at DESC)`      |
| Asset by code                 | assets          | `idx_asset_code (asset_code)`                                      |
| Contract by creator           | contracts       | `idx_contract_creator (creator_account)`                           |

### Performance Notes

1. **All time-series indexes include `created_at DESC`** for efficient "latest first" queries
2. **Partial indexes** exclude NULL values to reduce index size (e.g., `WHERE destination IS NOT NULL`)
3. **Composite indexes** are ordered to match the most common query patterns
4. **TimescaleDB compression** reduces storage by ~90% for chunks older than 2 months
5. **Avoid `COUNT(*)`** on large tables — use `network_stats` for approximate counts
6. **Cursor-based pagination** using `(created_at, id)` composite cursor, never OFFSET/LIMIT

## Data Retention Policy

| Data                     | Retention  | Strategy                            |
| ------------------------ | ---------- | ----------------------------------- |
| Ledgers                  | Indefinite | Compressed after 3 months           |
| Transactions             | Indefinite | Compressed after 2 months           |
| Operations               | Indefinite | Compressed after 2 months           |
| Effects                  | Indefinite | Compressed after 2 months           |
| Contract events          | Indefinite | Compressed after 2 months           |
| Token events             | Indefinite | Compressed after 2 months           |
| Trades                   | Indefinite | Compressed after 2 months           |
| Accounts (current state) | Indefinite | No compression (frequently updated) |
| Contract storage         | Indefinite | No compression (frequently updated) |
| Network stats            | Indefinite | Small table, no compression needed  |

## Migration Strategy

Migrations managed via a Go migration tool (e.g., `golang-migrate/migrate` or `pressly/goose`) embedded in the ingestion pipeline binary:

```
migrations/
├── 001_create_ledgers.up.sql
├── 001_create_ledgers.down.sql
├── 002_create_transactions.up.sql
├── 002_create_transactions.down.sql
├── 003_create_operations.up.sql
├── ...
└── 015_create_network_stats.up.sql
```

Migrations run automatically on pipeline startup, with a lock to prevent concurrent migration by multiple instances.
