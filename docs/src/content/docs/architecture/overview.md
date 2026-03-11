---
title: Architecture Overview
description: High-level architecture of Stellar Explorer.
---

Stellar Explorer is a Next.js 16 application that reads data from the Stellar network through two APIs: Horizon (REST) and Soroban RPC (JSON-RPC).

![Architecture Overview](../../../assets/diagrams/architecture-overview.svg)

## Components

### Frontend

The frontend is a React 19 application built with the Next.js App Router. It uses TanStack Query for data fetching and caching, shadcn/ui for the component library, and Tailwind CSS 4 for styling.

All pages are server-side rendered on first load and then hydrated for client-side navigation.

### Stellar Network

The application connects directly to Stellar's public infrastructure:

- **Horizon API** — REST API for transactions, accounts, assets, ledgers, and effects
- **Soroban RPC** — JSON-RPC for smart contract data (code, storage, events)

No custom backend is required for basic explorer functionality.

### Backend Services (Indexer)

An optional Go-based indexer service processes Stellar ledger data into PostgreSQL (with TimescaleDB), Redis, and Typesense for advanced queries, full-text search, and analytics. See [Indexer Pipeline](/architecture/indexer/) for details.

## Key Design Decisions

- **No custom API server** — The frontend queries Stellar directly, reducing infrastructure
- **Network-agnostic** — All data fetching includes the network parameter, enabling seamless switching
- **Cached SDK clients** — Horizon and RPC clients are created once per network and reused
- **Immutable data caching** — Ledgers, transactions, and contract code use `staleTime: Infinity` since they never change
