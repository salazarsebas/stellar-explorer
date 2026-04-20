---
title: Exploring Smart Contracts
description: How to browse Soroban smart contracts on Stellar Explorer.
---

Soroban is Stellar's smart contract platform. Contracts are identified by a contract ID (starting with `C`).

## Finding a Contract

Paste a contract ID into the search bar, or navigate to the Contracts section.

## Contract Details

The contract page shows:

- **Contract ID** — The unique identifier
- **Code** — The deployed WASM binary information
- **Storage** — Key-value data stored by the contract
- **Events** — Contract events emitted during execution

## Contract Events

Events are emitted by contracts during transaction execution. Each event shows:

- **Topic** — What the event is about
- **Data** — The event payload
- **Transaction** — The transaction that triggered the event
- **Ledger** — When the event occurred

:::note
Contract data is fetched via Soroban RPC, which may not be available on all networks.
:::
