---
title: Exploring Transactions
description: How to find and understand transactions on Stellar Explorer.
---

Transactions are the fundamental units of change on the Stellar network. Each transaction contains one or more operations that modify the ledger state.

## Finding a Transaction

There are two ways to find a transaction:

1. **By hash** — Paste a transaction hash into the search bar
2. **By browsing** — Navigate to the Transactions page to see recent transactions

## Transaction Details

Each transaction page shows:

- **Status** — Whether the transaction succeeded or failed
- **Ledger** — The ledger that included this transaction
- **Source Account** — The account that submitted the transaction
- **Fee** — The fee paid in XLM (displayed in stroops in Developer Mode)
- **Operations** — The list of operations within the transaction
- **Effects** — The resulting changes to the ledger

## Operations

A transaction can contain up to 100 operations. Common operation types include:

| Operation | Description |
|---|---|
| `payment` | Transfer XLM or another asset |
| `createAccount` | Fund a new account |
| `changeTrust` | Add or remove a trustline |
| `manageData` | Set or clear account data entries |
| `invokeHostFunction` | Execute a Soroban smart contract |

Each operation is displayed in a card showing its type, parameters, and the accounts involved.
