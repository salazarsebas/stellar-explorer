---
title: Pipeline del indexador
description: Cómo el indexador Go ingiere datos de la red Stellar.
---

El indexador es un servicio Go que procesa datos del ledger de Stellar en almacenes de datos locales para consultas avanzadas, búsqueda y analíticas.

![Indexer Pipeline](../../../../assets/diagrams/indexer-pipeline.svg)

## Almacenes de datos

| Almacén | Propósito |
|---|---|
| **PostgreSQL + TimescaleDB** | Datos estructurados de ledger, transacciones y operaciones con optimizaciones de series temporales |
| **Redis** | Pub/sub para distribución de eventos en tiempo real |
| **Typesense** | Búsqueda de texto completo en transacciones, cuentas y activos |

## Modos de ingestión

### Ingestión en vivo

Procesa nuevos ledgers a medida que se cierran (~1 cada 5 segundos). Se conecta a un endpoint RPC de Stellar y transmite nuevos datos continuamente.

```bash
make run-live
```

### Relleno histórico

Dos estrategias para importar datos históricos:

- **Relleno RPC** — Obtiene ledgers históricos desde un endpoint RPC. Funciona en cualquier red.
- **Relleno con lago de datos S3** — Lee desde el lago de datos S3 público de Stellar. Solo para pubnet, significativamente más rápido.

```bash
make backfill       # Relleno RPC
make s3backfill     # Relleno S3 (solo pubnet)
```

## Arquitectura

El indexador sigue un patrón pipeline: **Origen → Transformar → Almacenar → Publicar**.

Para opciones de configuración completas e instrucciones de configuración, consulta el [README del indexador](https://github.com/salazarsebas/stellar-explorer/blob/main/indexer/README.md).
