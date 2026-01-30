# Investigación: Indexer Propio para Stellar Explorer

## Resumen Ejecutivo

Este documento analiza las dependencias del proyecto Stellar Explorer con APIs no oficiales (principalmente Stellar Expert) y propone la arquitectura de un indexer propio en Golang para eliminar estas dependencias.

### Decisiones Confirmadas

| Decisión | Selección |
|----------|-----------|
| **Modo de almacenamiento** | Híbrido (agregaciones históricas + detalle 90 días) |
| **Verificación de contratos** | Diferida (no prioritaria) |
| **Lenguaje** | Golang |
| **Almacenamiento estimado** | ~50-100GB |
| **Costo infraestructura** | ~$80-120/mes |

---

## 1. Estado Actual: Dependencias de APIs

### 1.1 APIs Oficiales de Stellar (Mantenidas por SDF)

| API | URL | Uso en el Proyecto |
|-----|-----|-------------------|
| **Horizon** | `horizon.stellar.org` | Ledgers, transacciones, cuentas, assets, streaming |
| **Soroban RPC** | `soroban-rpc.mainnet.stellar.gateway.fm` | Contratos, eventos, storage, código WASM |

### 1.2 APIs No Oficiales (Dependencia a Eliminar)

| API | URL | Datos Obtenidos |
|-----|-----|-----------------|
| **Stellar Expert** | `api.stellar.expert/explorer` | Stats de red, verificación de contratos, ratings de assets |

---

## 2. Datos que Requieren Indexación Propia

### 2.1 Estadísticas de Red (actualmente de Stellar Expert)

```typescript
// Datos que NO provee Horizon directamente:
interface NetworkStats {
  ledgers: number;              // Total histórico
  accounts: {
    total: number;              // Todas las cuentas creadas
    funded: number;             // Con balance > 0
    deleted: number;            // Merged/eliminadas
  };
  assets: number;               // Total de assets únicos
  trustlines: number;           // Total de trustlines
  operations: number;           // Total histórico
  transactions: number;         // Total histórico
  successful_transactions: number;
  failed_transactions: number;
  trades: number;               // Total de trades
  payments: number;             // Total de pagos
  dex_volume: string;           // Volumen acumulado
}
```

**Por qué Horizon no lo provee:**
- Horizon está diseñado para consultas en tiempo real, no agregaciones históricas
- No mantiene contadores globales
- Rate limits estrictos para queries masivas

### 2.2 Verificación de Contratos (actualmente de Stellar Expert)

```typescript
interface ContractVerification {
  contractId: string;
  isVerified: boolean;
  repository?: string;          // GitHub repo
  commit?: string;              // Commit verificado
  wasmHash?: string;
  verifiedAt?: number;          // Timestamp
  method?: string;              // github-actions, manual
  invocations?: number;         // Contador de llamadas
}
```

**Por qué necesita indexación:**
- Stellar Expert verifica código fuente contra WASM compilado
- Esto requiere infraestructura de compilación y almacenamiento
- No es parte del protocolo Stellar

### 2.3 Métricas de Assets (actualmente de Stellar Expert)

```typescript
interface EnrichedAsset {
  rating: { average: number; votes: number };
  trades24h: number;
  volume24h: string;
  price?: number;
  priceChange7d?: number[];
  trustlinesCount: number;      // Horizon lo tiene pero paginado
}
```

---

## 3. Alternativas Oficiales de Stellar

### 3.1 Mercury (Indexer Oficial de SDF)

**URL:** https://mercurydata.app/

**Ventajas:**
- Queries SQL arbitrarias sobre datos históricos
- Suscripciones en tiempo real
- Datos pre-agregados
- Mantenido por SDF

**Desventajas:**
- Servicio de pago ($99-499/mes)
- Dependencia de terceros
- No incluye verificación de contratos

**Funcionalidades:**
- Full ledger history
- Account history
- Transaction/operation search
- Custom aggregations via SQL

### 3.2 Horizon Propio

**Ventajas:**
- Control total
- Sin rate limits
- Mismo API que el público

**Desventajas:**
- Requiere Stellar Core
- ~1TB+ de storage para mainnet
- Sincronización inicial lenta (semanas)
- Alta complejidad operacional

### 3.3 Stellar Core + Ingestion Pipeline

**Componentes:**
1. Stellar Core - Nodo completo
2. Captive Core - Modo ligero para ingestion
3. Pipeline personalizado

---

## 4. Propuesta: Indexer Propio en Golang

### 4.1 Justificación de Golang

| Aspecto | Golang | Alternativas |
|---------|--------|--------------|
| **Performance** | Compilado, bajo overhead | Node.js más lento |
| **Concurrencia** | Goroutines nativas | Threads complejos |
| **Ecosystem Stellar** | stellar/go SDK oficial | Menos maduro en otros |
| **Deployment** | Binary único, Docker simple | Más dependencias |
| **Memory** | Eficiente | Node.js GC overhead |

### 4.2 Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────────┐
│                     STELLAR INDEXER (Golang)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Ingester   │    │  Aggregator  │    │  API Server  │       │
│  │              │    │              │    │   (REST/WS)  │       │
│  │ - Ledgers    │───▶│ - Stats      │───▶│              │       │
│  │ - Txs        │    │ - Counters   │    │ /stats       │       │
│  │ - Operations │    │ - Rankings   │    │ /assets      │       │
│  │ - Events     │    │              │    │ /contracts   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   ▲               │
│         │                   │                   │               │
│         ▼                   ▼                   │               │
│  ┌─────────────────────────────────────────────┴──────┐        │
│  │                    PostgreSQL                       │        │
│  │                                                     │        │
│  │  - ledgers          - network_stats                │        │
│  │  - transactions     - asset_stats                  │        │
│  │  - operations       - contract_invocations         │        │
│  │  - accounts         - hourly_aggregates            │        │
│  │  - assets           - daily_aggregates             │        │
│  │  - contract_events                                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Horizon    │    │  Soroban RPC │    │ Captive Core │       │
│  │   (Stream)   │    │   (Events)   │    │  (Optional)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Componentes del Indexer

#### 4.3.1 Ingester Service

```go
package ingester

type LedgerIngester struct {
    horizonClient *horizonclient.Client
    db            *sqlx.DB
    lastLedger    uint32
}

// Métodos principales:
func (i *LedgerIngester) Start(ctx context.Context) error
func (i *LedgerIngester) ProcessLedger(ledger horizon.Ledger) error
func (i *LedgerIngester) ProcessTransactions(txs []horizon.Transaction) error
func (i *LedgerIngester) ProcessOperations(ops []horizon.Operation) error
```

**Responsabilidades:**
1. Conectar al stream de Horizon
2. Procesar cada ledger nuevo
3. Extraer transacciones y operaciones
4. Persistir en PostgreSQL
5. Manejar reconexiones y gaps

#### 4.3.2 Aggregator Service

```go
package aggregator

type StatsAggregator struct {
    db          *sqlx.DB
    updateTick  time.Duration
}

// Agregaciones:
func (a *StatsAggregator) UpdateNetworkStats() error      // Cada 1 min
func (a *StatsAggregator) UpdateHourlyStats() error       // Cada hora
func (a *StatsAggregator) UpdateDailyStats() error        // Cada día
func (a *StatsAggregator) UpdateAssetRankings() error     // Cada 5 min
```

**Agregaciones calculadas:**

```sql
-- Network Stats (actualizado cada minuto)
CREATE TABLE network_stats (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    total_ledgers BIGINT,
    total_accounts BIGINT,
    funded_accounts BIGINT,
    total_assets INT,
    total_trustlines BIGINT,
    total_transactions BIGINT,
    successful_transactions BIGINT,
    failed_transactions BIGINT,
    total_operations BIGINT,
    total_trades BIGINT,
    total_payments BIGINT,
    dex_volume_xlm NUMERIC(20,7)
);

-- Asset Stats (actualizado cada 5 minutos)
CREATE TABLE asset_stats (
    asset_code VARCHAR(12),
    asset_issuer VARCHAR(56),
    PRIMARY KEY (asset_code, asset_issuer),
    total_supply NUMERIC(20,7),
    num_accounts INT,
    num_trustlines INT,
    volume_24h NUMERIC(20,7),
    trades_24h INT,
    price_xlm NUMERIC(20,7),
    price_change_24h NUMERIC(10,4),
    last_updated TIMESTAMPTZ
);
```

#### 4.3.3 API Server

```go
package api

type Server struct {
    db     *sqlx.DB
    router *chi.Mux
}

// Endpoints:
// GET /api/v1/stats/network
// GET /api/v1/stats/assets?sort=volume&limit=20
// GET /api/v1/assets/{code}-{issuer}
// GET /api/v1/contracts/{id}/stats
// GET /api/v1/search?q={query}&type={type}
// WS  /api/v1/stream/stats
```

### 4.4 Esquema de Base de Datos

```sql
-- Core tables (populated by ingester)
CREATE TABLE ledgers (
    sequence BIGINT PRIMARY KEY,
    hash VARCHAR(64) NOT NULL,
    prev_hash VARCHAR(64),
    transaction_count INT,
    operation_count INT,
    successful_tx_count INT,
    failed_tx_count INT,
    closed_at TIMESTAMPTZ,
    total_coins NUMERIC(20,7),
    fee_pool NUMERIC(20,7),
    base_fee INT,
    base_reserve INT,
    protocol_version INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    hash VARCHAR(64) PRIMARY KEY,
    ledger_sequence BIGINT REFERENCES ledgers(sequence),
    source_account VARCHAR(56),
    fee_charged BIGINT,
    operation_count INT,
    successful BOOLEAN,
    created_at TIMESTAMPTZ,
    memo_type VARCHAR(20),
    memo TEXT,
    INDEX idx_tx_account (source_account),
    INDEX idx_tx_ledger (ledger_sequence),
    INDEX idx_tx_created (created_at)
);

CREATE TABLE operations (
    id VARCHAR(64) PRIMARY KEY,
    transaction_hash VARCHAR(64) REFERENCES transactions(hash),
    type VARCHAR(50),
    source_account VARCHAR(56),
    details JSONB,
    created_at TIMESTAMPTZ,
    INDEX idx_op_type (type),
    INDEX idx_op_account (source_account)
);

CREATE TABLE accounts (
    id VARCHAR(56) PRIMARY KEY,
    created_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    transaction_count INT DEFAULT 0,
    operation_count INT DEFAULT 0,
    is_funded BOOLEAN DEFAULT true
);

CREATE TABLE contract_invocations (
    id SERIAL PRIMARY KEY,
    contract_id VARCHAR(56),
    ledger_sequence BIGINT,
    transaction_hash VARCHAR(64),
    function_name VARCHAR(100),
    successful BOOLEAN,
    created_at TIMESTAMPTZ,
    INDEX idx_contract_invocations (contract_id)
);

-- Aggregation tables
CREATE TABLE hourly_stats (
    hour TIMESTAMPTZ PRIMARY KEY,
    transactions INT,
    successful_tx INT,
    failed_tx INT,
    operations INT,
    new_accounts INT,
    trades INT,
    payments INT,
    dex_volume NUMERIC(20,7)
);

CREATE TABLE daily_stats (
    day DATE PRIMARY KEY,
    transactions INT,
    operations INT,
    active_accounts INT,
    new_accounts INT,
    trades INT,
    dex_volume NUMERIC(20,7)
);
```

### 4.5 Flujo de Datos

```
1. STREAMING (tiempo real)
   Horizon Stream → Ingester → PostgreSQL
                            ↓
                      Network Stats (1 min cache)
                            ↓
                      API Response

2. BACKFILL (histórico)
   Horizon Paginado → Batch Ingester → PostgreSQL
   (rate limited)                    ↓
                              Aggregator Jobs
                                    ↓
                              Historical Stats

3. AGGREGATION (periódico)
   PostgreSQL → Aggregator Jobs → Materialized Views
                               ↓
                         Pre-computed Stats
```

### 4.6 Estructura del Proyecto Golang

```
stellar-indexer/
├── cmd/
│   ├── indexer/          # Binary principal
│   │   └── main.go
│   ├── backfill/         # Herramienta de backfill
│   │   └── main.go
│   └── api/              # API server standalone
│       └── main.go
├── internal/
│   ├── config/           # Configuración
│   │   └── config.go
│   ├── ingester/         # Lógica de ingestion
│   │   ├── ledger.go
│   │   ├── transaction.go
│   │   ├── operation.go
│   │   └── stream.go
│   ├── aggregator/       # Lógica de agregación
│   │   ├── network.go
│   │   ├── asset.go
│   │   ├── contract.go
│   │   └── scheduler.go
│   ├── api/              # HTTP/WebSocket API
│   │   ├── server.go
│   │   ├── handlers/
│   │   │   ├── stats.go
│   │   │   ├── assets.go
│   │   │   └── contracts.go
│   │   └── middleware/
│   ├── storage/          # Capa de persistencia
│   │   ├── postgres.go
│   │   └── queries/
│   │       ├── ledgers.sql
│   │       ├── stats.sql
│   │       └── assets.sql
│   └── models/           # Modelos de dominio
│       ├── ledger.go
│       ├── transaction.go
│       └── stats.go
├── migrations/           # SQL migrations
│   ├── 001_initial.up.sql
│   └── 001_initial.down.sql
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── go.mod
├── go.sum
└── README.md
```

### 4.7 Dependencias Golang

```go
// go.mod
module github.com/stellar-explorer/indexer

go 1.22

require (
    github.com/stellar/go v0.0.0-latest        // SDK Stellar oficial
    github.com/jmoiron/sqlx v1.3.5             // SQL extensions
    github.com/lib/pq v1.10.9                  // PostgreSQL driver
    github.com/go-chi/chi/v5 v5.0.12           // HTTP router
    github.com/gorilla/websocket v1.5.1        // WebSocket
    github.com/rs/zerolog v1.32.0              // Logging
    github.com/spf13/viper v1.18.2             // Configuration
    github.com/golang-migrate/migrate/v4       // DB migrations
    github.com/prometheus/client_golang        // Metrics
)
```

---

## 5. Verificación de Contratos (DIFERIDA)

> **Nota:** Esta funcionalidad no es prioritaria. Se puede mantener el link a Stellar Expert para verificación hasta una fase posterior.

### 5.1 Enfoque Temporal

Mientras no se implemente verificación propia:
- El componente `ContractVerification` mostrará un mensaje indicando que la verificación está disponible en Stellar Expert
- Link directo a `https://stellar.expert/explorer/public/contract/{contractId}`

### 5.2 Implementación Futura (Fase 2+)

Cuando sea prioritario, la verificación requiere:
1. **Servicio de compilación** con soroban-cli en Docker
2. **Almacenamiento** de resultados de verificación
3. **API** para submit de verificaciones

```sql
-- Tabla para fase futura
CREATE TABLE contract_verifications (
    contract_id VARCHAR(56) PRIMARY KEY,
    wasm_hash VARCHAR(64),
    is_verified BOOLEAN DEFAULT false,
    repository VARCHAR(255),
    commit_hash VARCHAR(40),
    verified_at TIMESTAMPTZ
);
```

---

## 6. Modo Híbrido: Arquitectura Detallada (SELECCIONADO)

### 6.1 Concepto del Modo Híbrido

El modo híbrido separa los datos en dos categorías:

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODO HÍBRIDO                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INDEXER PROPIO (Hot Data):                                     │
│  ├─ Detalle completo últimos 90 días                            │
│  │   ├─ Ledgers: ~800K registros (~2GB)                         │
│  │   ├─ Transactions: ~50M registros (~30GB)                    │
│  │   └─ Operations: ~150M registros (~50GB)                     │
│  │                                                               │
│  ├─ Agregaciones históricas (desde 2015)                        │
│  │   ├─ daily_stats: ~3,500 registros (~10MB)                   │
│  │   ├─ monthly_stats: ~120 registros (~1MB)                    │
│  │   └─ asset_daily_stats: ~500K registros (~200MB)             │
│  │                                                               │
│  ├─ Stats en tiempo real                                        │
│  │   ├─ network_stats_current (actualizado cada minuto)         │
│  │   ├─ hourly_stats: últimas 720 horas (~30 días)              │
│  │   └─ asset_rankings: ~10K activos (~50MB)                    │
│  │                                                               │
│  └─ Total Storage: ~50-100GB                                    │
│                                                                  │
│  HORIZON PÚBLICO (Cold Data - bajo demanda):                    │
│  └─ Consultas de transacciones específicas > 90 días            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Tablas de Agregación para Gráficos Históricos

```sql
-- Estadísticas diarias (desde 2015, ~3,500 registros)
-- Permite gráficos históricos de años sin almacenar cada tx
CREATE TABLE daily_stats (
    date DATE PRIMARY KEY,
    ledger_count INT,
    transaction_count INT,
    successful_tx_count INT,
    failed_tx_count INT,
    operation_count INT,
    new_accounts INT,
    funded_accounts INT,
    deleted_accounts INT,
    trade_count INT,
    payment_count INT,
    dex_volume_xlm NUMERIC(20,7),
    avg_fee NUMERIC(10,2),
    avg_tps NUMERIC(10,4),
    max_tps NUMERIC(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estadísticas mensuales (desde 2015, ~120 registros)
CREATE TABLE monthly_stats (
    month DATE PRIMARY KEY,  -- Primer día del mes
    transaction_count BIGINT,
    operation_count BIGINT,
    active_accounts INT,
    new_accounts INT,
    trade_count BIGINT,
    dex_volume_xlm NUMERIC(20,7),
    avg_daily_tps NUMERIC(10,4)
);

-- Estadísticas por hora (últimos 30 días, rotativo)
CREATE TABLE hourly_stats (
    hour TIMESTAMPTZ PRIMARY KEY,
    transaction_count INT,
    successful_tx_count INT,
    failed_tx_count INT,
    operation_count INT,
    avg_tps NUMERIC(10,4),
    max_tps NUMERIC(10,4),
    trade_count INT
);

-- Stats de activos diarios (para gráficos de precio/volumen)
CREATE TABLE asset_daily_stats (
    date DATE,
    asset_code VARCHAR(12),
    asset_issuer VARCHAR(56),
    PRIMARY KEY (date, asset_code, asset_issuer),
    volume_xlm NUMERIC(20,7),
    trade_count INT,
    price_xlm NUMERIC(20,10),
    price_open NUMERIC(20,10),
    price_high NUMERIC(20,10),
    price_low NUMERIC(20,10),
    price_close NUMERIC(20,10),
    trustline_count INT
);
```

### 6.3 Proceso de Backfill (Solo Agregaciones)

```go
// El backfill de agregaciones NO requiere almacenar cada transacción
// Solo calcula resúmenes diarios consultando Horizon paginado

func (b *Backfiller) BackfillDailyStats(ctx context.Context, fromDate time.Time) error {
    currentDate := fromDate

    for currentDate.Before(time.Now()) {
        // Obtener stats del día de Horizon (ledger por ledger)
        stats, err := b.calculateDayStats(ctx, currentDate)
        if err != nil {
            return err
        }

        // Insertar solo el resumen (1 registro por día)
        err = b.db.InsertDailyStats(stats)
        if err != nil {
            return err
        }

        currentDate = currentDate.Add(24 * time.Hour)

        // Rate limiting para no saturar Horizon
        time.Sleep(100 * time.Millisecond)
    }

    return nil
}
```

**Tiempo estimado de backfill:**
- Agregaciones históricas (2015-2025): ~2-4 horas
- Detalle últimos 90 días: ~1-2 horas
- **Total:** ~4-6 horas (en background, explorer funciona desde minuto 1)

### 6.4 Rotación de Datos (Mantener 90 Días)

```sql
-- Job diario para limpiar datos antiguos
CREATE OR REPLACE FUNCTION rotate_old_data() RETURNS void AS $$
BEGIN
    -- Eliminar transacciones > 90 días
    DELETE FROM transactions
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Eliminar operaciones > 90 días
    DELETE FROM operations
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Eliminar ledgers > 90 días
    DELETE FROM ledgers
    WHERE closed_at < NOW() - INTERVAL '90 days';

    -- Mantener hourly_stats de últimos 30 días
    DELETE FROM hourly_stats
    WHERE hour < NOW() - INTERVAL '30 days';

    -- Las daily_stats y monthly_stats se mantienen para siempre (son pequeñas)
END;
$$ LANGUAGE plpgsql;

-- Ejecutar diariamente
SELECT cron.schedule('rotate-old-data', '0 3 * * *', 'SELECT rotate_old_data()');
```

### 6.5 Fallback a Horizon para Datos Antiguos

```go
// Cuando se consulta una transacción antigua, fallback a Horizon
func (s *Service) GetTransaction(ctx context.Context, hash string) (*Transaction, error) {
    // Primero buscar en el indexer local
    tx, err := s.db.GetTransaction(hash)
    if err == nil {
        return tx, nil
    }

    if err == sql.ErrNoRows {
        // Fallback a Horizon público para transacciones antiguas
        horizonTx, err := s.horizonClient.TransactionDetail(hash)
        if err != nil {
            return nil, err
        }
        return mapHorizonToLocal(horizonTx), nil
    }

    return nil, err
}
```

### 6.6 Infraestructura Modo Híbrido

| Componente | Especificación | Costo Estimado |
|------------|---------------|----------------|
| **Server Indexer** | 2 vCPU, 4GB RAM | $20-40/mes |
| **PostgreSQL** | 2 vCPU, 4GB RAM, 150GB SSD | $40-80/mes |
| **Total** | | **$60-120/mes** |

**Proveedores recomendados:**
- **DigitalOcean:** Droplet $24/mes + Managed DB $15/mes = ~$40/mes (mínimo)
- **Railway:** ~$50/mes todo incluido
- **Render:** ~$60/mes todo incluido
- **AWS (RDS + EC2):** ~$80-120/mes

---

## 7. Comparativa: Indexer Propio vs Mercury vs Stellar Expert

| Aspecto | Indexer Propio (Híbrido) | Mercury | Seguir con Stellar Expert |
|---------|--------------------------|---------|---------------------------|
| **Costo mensual** | $60-120 (infra) | $99-499 | $0 (pero sin control) |
| **Costo inicial** | Alto (desarrollo) | Bajo | $0 |
| **Control de datos** | Total | Parcial (SQL) | Ninguno |
| **Disponibilidad** | Tu responsabilidad | SDF mantiene | Terceros |
| **Custom aggregations** | Total libertad | Sí (SQL) | No |
| **Latencia** | Baja (tu infra) | Media | Variable |
| **Riesgo de discontinuidad** | Ninguno | Bajo | Alto |
| **Verificación contratos** | Implementar después | No incluido | Incluido |

**Decisión:** Indexer propio en modo híbrido ofrece el mejor balance entre control, costo y funcionalidad.

---

## 8. Plan de Implementación

### Fase 1: MVP (4-6 semanas)

1. **Semana 1-2:** Setup proyecto Golang + PostgreSQL
   - Estructura del proyecto
   - Migraciones de DB
   - Configuración

2. **Semana 3-4:** Ingester básico
   - Stream de Horizon
   - Persistencia de ledgers/txs
   - Manejo de reconexiones

3. **Semana 5-6:** Agregador + API
   - Network stats
   - Endpoints REST básicos
   - Integración con frontend

### Fase 2: Funcionalidad Completa (4-6 semanas)

1. Asset rankings y métricas
2. Contract invocation tracking
3. WebSocket para updates en tiempo real
4. Backfill histórico
5. Verificación de contratos (opcional)

### Fase 3: Producción (2-4 semanas)

1. Testing exhaustivo
2. Monitoring (Prometheus/Grafana)
3. CI/CD pipeline
4. Documentación
5. Deployment

---

## 9. Integración con el Frontend

### 9.1 Cambios en el Frontend

```typescript
// Nuevo cliente para el indexer
// src/lib/stellar/indexer-client.ts

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL;

export const indexerClient = {
  getNetworkStats: () =>
    fetch(`${INDEXER_URL}/api/v1/stats/network`).then(r => r.json()),

  getTopAssets: (options) =>
    fetch(`${INDEXER_URL}/api/v1/assets?${new URLSearchParams(options)}`).then(r => r.json()),

  getContractStats: (contractId) =>
    fetch(`${INDEXER_URL}/api/v1/contracts/${contractId}/stats`).then(r => r.json()),
};

// Reemplazar llamadas a Stellar Expert
// src/lib/stellar/queries.ts

networkStats: (network) => ({
  queryKey: stellarKeys.networkStats(network),
  queryFn: () => indexerClient.getNetworkStats(), // Antes: stellarExpert.getNetworkStats()
  staleTime: 60 * 1000,
}),
```

### 9.2 Variables de Entorno Nuevas

```env
# .env.local
NEXT_PUBLIC_INDEXER_URL=https://indexer.stellar-explorer.com
```

---

## 10. Conclusiones y Decisiones Finales

### 10.1 Arquitectura Seleccionada

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA FINAL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INDEXER GOLANG (Modo Híbrido)                                  │
│  ├─ Detalle: últimos 90 días (~80GB)                            │
│  ├─ Agregaciones: historial completo (~500MB)                   │
│  ├─ API: REST + WebSocket                                       │
│  └─ Costo: ~$60-120/mes                                         │
│                                                                  │
│  STELLAR EXPERT (Solo verificación de contratos)                │
│  └─ Enlace externo hasta implementación propia                  │
│                                                                  │
│  HORIZON PÚBLICO (Fallback datos > 90 días)                     │
│  └─ Consultas bajo demanda para txs antiguas                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Datos que el Indexer Proveerá

| Dato | Prioridad | Fuente Actual | Nueva Fuente |
|------|-----------|---------------|--------------|
| Network stats (totales históricos) | Alta | Stellar Expert | Indexer (agregaciones) |
| TPS histórico / gráficos | Alta | Stellar Expert | Indexer (daily_stats) |
| Asset rankings | Alta | Stellar Expert | Indexer (asset_stats) |
| Volumen 24h por asset | Alta | Stellar Expert | Indexer (cálculo en vivo) |
| Contract invocation counts | Media | Stellar Expert | Indexer |
| Búsqueda avanzada txs recientes | Media | N/A | Indexer (90 días) |
| Verificación de contratos | Baja | Stellar Expert | Stellar Expert (temporal) |
| Txs antiguas (>90 días) | Baja | Horizon | Horizon (fallback) |

### 10.3 Stack Tecnológico Final

```yaml
Lenguaje: Golang 1.22+
Base de datos: PostgreSQL 16
Cache: Redis (opcional, para rate limiting y sessions)
API: REST (chi router) + WebSocket (gorilla)
Deployment: Docker Compose (desarrollo) / Kubernetes (producción)
Monitoring: Prometheus + Grafana
CI/CD: GitHub Actions
```

### 10.4 Beneficios del Enfoque Seleccionado

1. **Independencia:** Elimina dependencia de Stellar Expert para datos críticos
2. **Costo controlado:** ~$60-120/mes vs $99-499/mes de Mercury
3. **Gráficos históricos:** Completos desde 2015 con solo ~500MB de agregaciones
4. **Rendimiento:** API propia sin rate limits de terceros
5. **Escalabilidad:** Arquitectura preparada para crecimiento
6. **Flexibilidad:** Custom queries y agregaciones según necesidades

### 10.5 Limitaciones Aceptadas

1. Transacciones > 90 días requieren consulta a Horizon (más lento)
2. Verificación de contratos sigue dependiendo de Stellar Expert temporalmente
3. Backfill inicial toma 4-6 horas (explorer funciona desde el inicio)

### 10.6 Próximos Pasos (Si se Aprueba)

1. **Setup inicial:** Estructura del proyecto Golang + PostgreSQL
2. **Ingester:** Streaming de Horizon → PostgreSQL
3. **Aggregator:** Jobs para calcular stats diarias/mensuales
4. **API:** Endpoints REST para reemplazar Stellar Expert
5. **Backfill:** Script para poblar agregaciones históricas
6. **Integración:** Actualizar frontend para usar nuevo indexer
7. **Deploy:** Docker Compose para desarrollo, preparar para producción
