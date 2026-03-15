---
title: Configuración del entorno de desarrollo
description: Cómo configurar un entorno de desarrollo local.
---

## Requisitos previos

- [Bun](https://bun.sh/) (gestor de paquetes y runtime)
- [Docker](https://www.docker.com/) (para servicios de backend, opcional)
- [D2](https://d2lang.com/) (para renderizar diagramas, opcional)

## Inicio rápido

1. **Clonar el repositorio**

```bash
git clone https://github.com/salazarsebas/stellar-explorer.git
cd stellar-explorer
```

2. **Instalar dependencias**

```bash
bun install
```

3. **Iniciar el servidor de desarrollo**

```bash
bun run dev
```

El explorador estará disponible en `http://localhost:3000`.

## Servicios de backend (opcional)

Para la funcionalidad del indexador, inicia los servicios Docker:

```bash
docker compose up -d
```

Esto inicia PostgreSQL (puerto 54320), Redis (puerto 63790) y Typesense (puerto 18108).

## Variables de entorno

Copia el archivo de ejemplo y ajusta si es necesario:

```bash
cp .env.local.example .env.local
```

## Comandos disponibles

| Comando | Propósito |
|---|---|
| `bun run dev` | Iniciar servidor de desarrollo (puerto 3000) |
| `bun run build` | Build de producción |
| `bun run lint` | Ejecutar ESLint |
| `bun run format` | Formatear código con Prettier |
| `bun run test` | Ejecutar tests |
| `bun run test:watch` | Ejecutar tests en modo observación |
