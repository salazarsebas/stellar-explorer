---
title: Data Flow
description: How data flows from the Stellar network to the UI.
---

Data follows a four-layer pipeline from the Stellar network to the user interface.

![Data Flow](../../../assets/diagrams/data-flow.svg)

## 1. SDK Clients (`client.ts`)

Factory functions create and cache Stellar SDK instances:

- `getHorizonClient(network)` — Returns a cached `Horizon.Server` instance
- `getRpcClient(network)` — Returns a cached `rpc.Server` instance

Clients are stored in a `Map<NetworkKey, StellarClients>` and reused across the application.

**Source:** [`src/lib/stellar/client.ts`](https://github.com/salazarsebas/stellar-explorer/blob/main/src/lib/stellar/client.ts)

## 2. Query Definitions (`queries.ts`)

TanStack Query option factories define how to fetch and cache each type of data:

- `stellarKeys` — Hierarchical cache key factory: `["stellar", network, "transactions", hash]`
- `stellarQueries` — Query option factories that combine keys with fetch functions

Immutable entities (ledgers, finalized transactions, contract code) use `staleTime: Infinity`. Mutable data (account balances, latest ledger) uses `staleTime: 10_000` (10 seconds).

**Source:** [`src/lib/stellar/queries.ts`](https://github.com/salazarsebas/stellar-explorer/blob/main/src/lib/stellar/queries.ts)

## 3. Custom Hooks (`hooks/`)

Hooks wrap TanStack Query and provide network-aware data access:

- `useStellarQuery` hooks (e.g., `useLatestLedger()`, `useLedger(sequence)`) — Standard query hooks
- `useStreaming` hooks (e.g., `useLedgerStream()`) — Real-time data via Horizon's streaming API

All hooks read the current network from `useNetwork()` context automatically.

**Source:** [`src/lib/hooks/`](https://github.com/salazarsebas/stellar-explorer/tree/main/src/lib/hooks)

## 4. React Components

Components consume hooks and render the data. They handle loading states, errors, and pagination through TanStack Query's built-in state management.
