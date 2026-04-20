---
title: Estructura del proyecto
description: Descripción general de la organización del código.
---

## Directorios de nivel superior

``` 
stellar-explorer/
├── apps/
│   ├── explorer-web/ # Frontend Next.js del explorador
│   └── docs/         # Sitio de documentación Astro/Starlight
├── services/
│   └── indexer/      # Servicio Go de ingestión de datos
├── infra/
│   ├── docker/       # Configuración Docker
│   └── docker-compose.yml
└── .github/          # Workflows de CI
```

## Código fuente del frontend (`apps/explorer-web/src/`)

```
apps/explorer-web/src/
├── app/              # Páginas del App Router de Next.js
│   ├── [locale]/[network]/(explorer)/
│   └── api/          # Rutas API (fetcher TOML)
├── components/       # Componentes React
│   ├── ui/           # Componentes base de shadcn/ui
│   ├── layout/       # Encabezado, navegación, barras laterales
│   ├── cards/        # Tarjetas de transacción, operación, contrato
│   ├── charts/       # Visualizaciones con Recharts
│   ├── transactions/ # Componentes específicos de transacciones
│   ├── contracts/    # Componentes de contratos Soroban
│   ├── assets/       # Componentes de navegación de activos
│   ├── search/       # Interfaz de búsqueda
│   └── common/       # Componentes compartidos
├── lib/
│   ├── stellar/      # Clientes SDK y definiciones de consulta
│   ├── hooks/        # Hooks React personalizados
│   ├── providers/    # Proveedores de contexto
│   ├── constants/    # Constantes de la aplicación
│   ├── utils/        # Funciones de utilidad
│   └── types/        # Tipos TypeScript
└── i18n/             # Configuración de internacionalización
```

## Constantes clave

| Constante | Valor | Propósito |
|---|---|---|
| `STROOPS_PER_XLM` | `10.000.000` | Factor de conversión para cantidades XLM |
| `DEFAULT_PAGE_SIZE` | `20` | Elementos por lista paginada |
| `LIVE_LEDGER_POLL_INTERVAL` | `5.000 ms` | Intervalo de sondeo para datos en vivo |
| `STALE_TIME` | `10.000 ms` | Tiempo de caducidad predeterminado de TanStack Query |

## Stack de UI

- **Biblioteca de componentes:** shadcn/ui (estilo new-york)
- **Estilos:** Tailwind CSS 4
- **Gráficos:** Recharts
- **Alias de ruta:** `@/` apunta a `apps/explorer-web/src/`
