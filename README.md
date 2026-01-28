# Stellar Explorer

A modern block explorer for the Stellar network. Browse transactions, accounts, assets, and Soroban smart contracts with a premium user experience.

## Features

- **Real-time data** — Live updates from Stellar Horizon API
- **Multi-network support** — Public, Testnet, and Futurenet
- **Asset discovery** — View token metadata and logos from stellar.toml
- **Smart contract explorer** — Browse Soroban contract events and data
- **Watchlist** — Track your favorite accounts and assets
- **Dark/Light mode** — Optimized for both themes

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TanStack Query
- Tailwind CSS 4
- Stellar SDK
- Bun

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

Open [http://localhost:3000](http://localhost:3000) to view the explorer.

## Scripts

| Command          | Description               |
| ---------------- | ------------------------- |
| `bun run dev`    | Start development server  |
| `bun run build`  | Build for production      |
| `bun run start`  | Start production server   |
| `bun run lint`   | Run ESLint                |
| `bun run format` | Format code with Prettier |

## License

MIT
