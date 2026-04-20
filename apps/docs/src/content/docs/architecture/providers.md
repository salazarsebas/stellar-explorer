---
title: Providers & Context
description: How context providers are structured in Stellar Explorer.
---

Stellar Explorer uses React context providers to share global state. The wrap order matters — inner providers can access outer providers but not the reverse.

![Providers](../../../assets/diagrams/providers.svg)

## Provider Hierarchy

The providers wrap the application in this order:

| Order | Provider | Purpose | Hook |
|---|---|---|---|
| 1 (outer) | `ThemeProvider` | Dark/light mode | `useTheme()` |
| 2 | `QueryProvider` | TanStack Query client | — |
| 3 | `NetworkProvider` | Current Stellar network | `useNetwork()` |
| 4 | `DeveloperModeProvider` | Show/hide technical details | `useDeveloperMode()` |
| 5 (inner) | `AnalyticsModeProvider` | Analytics view toggle | `useAnalyticsMode()` |

## Why Order Matters

- `NetworkProvider` needs `QueryProvider` to be above it so network changes can trigger query invalidation
- `DeveloperModeProvider` sits below `NetworkProvider` because developer mode preferences may be network-specific
- `ThemeProvider` is outermost because it has no dependencies on other providers

**Source:** [`apps/explorer-web/src/lib/providers/index.tsx`](https://github.com/salazarsebas/stellar-explorer/blob/main/apps/explorer-web/src/lib/providers/index.tsx)
