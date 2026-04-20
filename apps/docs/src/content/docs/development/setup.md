---
title: Development Setup
description: How to set up a local development environment.
---

## Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Docker](https://www.docker.com/) (for backend services, optional)
- [D2](https://d2lang.com/) (for diagram rendering, optional)

## Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/salazarsebas/stellar-explorer.git
cd stellar-explorer
```

2. **Install dependencies**

```bash
bun install
```

3. **Start the development server**

```bash
bun run dev
```

The explorer will be available at `http://localhost:3000`.

## Backend Services (Optional)

For indexer functionality, start the Docker services:

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts PostgreSQL (port 54320), Redis (port 63790), and Typesense (port 18108).

## Environment Variables

Copy the example file and adjust if needed:

```bash
cp .env.local.example .env.local
```

## Available Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Start development server (port 3000) |
| `bun run build` | Production build |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
