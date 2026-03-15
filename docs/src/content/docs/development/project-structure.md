---
title: Project Structure
description: Overview of the codebase organization.
---

## Top-Level Directories

```
stellar-explorer/
├── src/              # Application source code
├── messages/         # Translation files (9 locales)
├── public/           # Static assets
├── indexer/          # Go data ingestion service
├── migrations/       # SQL database migrations
├── docker/           # Docker configuration
└── docs/             # This documentation site
```

## Source Code (`src/`)

```
src/
├── app/              # Next.js App Router pages
│   ├── [locale]/[network]/(explorer)/
│   └── api/          # API routes (TOML fetcher)
├── components/       # React components
│   ├── ui/           # shadcn/ui base components
│   ├── layout/       # Header, navigation, sidebars
│   ├── cards/        # Transaction, operation, contract cards
│   ├── charts/       # Recharts visualizations
│   ├── transactions/ # Transaction-specific components
│   ├── contracts/    # Soroban contract components
│   ├── assets/       # Asset browsing components
│   ├── search/       # Search UI
│   └── common/       # Shared components
├── lib/
│   ├── stellar/      # SDK clients and query definitions
│   ├── hooks/        # Custom React hooks
│   ├── providers/    # Context providers
│   ├── constants/    # App-wide constants
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
└── i18n/             # Internationalization config
```

## Key Constants

| Constant | Value | Purpose |
|---|---|---|
| `STROOPS_PER_XLM` | `10,000,000` | Conversion factor for XLM amounts |
| `DEFAULT_PAGE_SIZE` | `20` | Items per paginated list |
| `LIVE_LEDGER_POLL_INTERVAL` | `5,000 ms` | Polling interval for live data |
| `STALE_TIME` | `10,000 ms` | Default TanStack Query stale time |

## UI Stack

- **Component library:** shadcn/ui (new-york style)
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Path alias:** `@/` maps to `src/`
