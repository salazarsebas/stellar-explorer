---
title: Enrutamiento
description: Cómo funciona el enrutamiento de URLs en Stellar Explorer.
---

Stellar Explorer usa el App Router de Next.js con un patrón de segmentos dinámicos anidados.

![Routing](../../../../assets/diagrams/routing.svg)

## Patrón de URL

Cada página sigue esta estructura:

```
/[locale]/[network]/(explorer)/[page]/[...params]
```

Por ejemplo: `/es/public/tx/abc123` se desglosa así:

| Segmento | Valor | Propósito |
|---|---|---|
| `[locale]` | `es` | Idioma (en, es, pt, fr, de, zh, ja, ko, it) |
| `[network]` | `public` | Red (public, testnet, futurenet) |
| `(explorer)` | — | Grupo de rutas (no aparece en la URL) |
| `[page]` | `tx` | Tipo de página |
| `[...params]` | `abc123` | Hash de transacción |

## Grupo de rutas: `(explorer)`

El grupo de rutas `(explorer)` organiza todas las páginas principales del explorador sin añadir un segmento de URL. Las páginas incluyen:

- `transactions/` y `tx/[hash]`
- `ledgers/` y `ledger/[sequence]`
- `accounts/` y `account/[id]`
- `assets/`
- `contracts/` y `contract/[id]`
- `search/`
- `watchlist/`

## Estructura de archivos

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

**Fuente:** [`apps/explorer-web/src/app/`](https://github.com/salazarsebas/stellar-explorer/tree/main/apps/explorer-web/src/app)
