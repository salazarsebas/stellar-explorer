---
title: Routing
description: How URL routing works in Stellar Explorer.
---

Stellar Explorer uses the Next.js App Router with a nested dynamic segment pattern.

![Routing](../../../assets/diagrams/routing.svg)

## URL Pattern

Every page follows this structure:

```
/[locale]/[network]/(explorer)/[page]/[...params]
```

For example: `/en/public/tx/abc123` breaks down as:

| Segment | Value | Purpose |
|---|---|---|
| `[locale]` | `en` | Language (en, es, pt, fr, de, zh, ja, ko, it) |
| `[network]` | `public` | Network (public, testnet, futurenet) |
| `(explorer)` | — | Route group (not in URL) |
| `[page]` | `tx` | Page type |
| `[...params]` | `abc123` | Transaction hash |

## Route Group: `(explorer)`

The `(explorer)` route group organizes all main explorer pages without adding a URL segment. Pages include:

- `transactions/` and `tx/[hash]`
- `ledgers/` and `ledger/[sequence]`
- `accounts/` and `account/[id]`
- `assets/`
- `contracts/` and `contract/[id]`
- `search/`
- `watchlist/`

## File Structure

```
apps/explorer-web/src/app/
  [locale]/
    [network]/
      (explorer)/
        transactions/page.tsx
        tx/[hash]/page.tsx
        ledgers/page.tsx
        accounts/page.tsx
        ...
```

**Source:** [`apps/explorer-web/src/app/`](https://github.com/salazarsebas/stellar-explorer/tree/main/apps/explorer-web/src/app)
