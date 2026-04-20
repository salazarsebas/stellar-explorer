---
title: Flujo de datos
description: Cómo fluyen los datos desde la red Stellar hasta la interfaz.
---

Los datos siguen un pipeline de cuatro capas desde la red Stellar hasta la interfaz de usuario.

![Data Flow](../../../../assets/diagrams/data-flow.svg)

## 1. Clientes SDK (`client.ts`)

Las funciones de fábrica crean y almacenan en caché las instancias del SDK de Stellar:

- `getHorizonClient(network)` — Devuelve una instancia `Horizon.Server` en caché
- `getRpcClient(network)` — Devuelve una instancia `rpc.Server` en caché

Los clientes se almacenan en un `Map<NetworkKey, StellarClients>` y se reutilizan en toda la aplicación.

**Fuente:** [`apps/explorer-web/src/lib/stellar/client.ts`](https://github.com/salazarsebas/stellar-explorer/blob/main/apps/explorer-web/src/lib/stellar/client.ts)

## 2. Definiciones de consulta (`queries.ts`)

Las fábricas de opciones de TanStack Query definen cómo obtener y cachear cada tipo de dato:

- `stellarKeys` — Fábrica de claves de caché jerárquica: `["stellar", network, "transactions", hash]`
- `stellarQueries` — Fábricas de opciones de consulta que combinan claves con funciones de obtención

Las entidades inmutables (ledgers, transacciones finalizadas, código de contrato) usan `staleTime: Infinity`. Los datos mutables usan `staleTime: 10_000` (10 segundos).

**Fuente:** [`apps/explorer-web/src/lib/stellar/queries.ts`](https://github.com/salazarsebas/stellar-explorer/blob/main/apps/explorer-web/src/lib/stellar/queries.ts)

## 3. Hooks personalizados (`hooks/`)

Los hooks envuelven TanStack Query y proporcionan acceso a datos con conciencia de red:

- Hooks `useStellarQuery` (p. ej., `useLatestLedger()`, `useLedger(sequence)`) — Hooks de consulta estándar
- Hooks `useStreaming` (p. ej., `useLedgerStream()`) — Datos en tiempo real vía la API de streaming de Horizon

Todos los hooks leen la red actual desde el contexto `useNetwork()` automáticamente.

**Fuente:** [`apps/explorer-web/src/lib/hooks/`](https://github.com/salazarsebas/stellar-explorer/tree/main/apps/explorer-web/src/lib/hooks)

## 4. Componentes React

Los componentes consumen hooks y renderizan los datos. Gestionan estados de carga, errores y paginación a través de la gestión de estado integrada de TanStack Query.
