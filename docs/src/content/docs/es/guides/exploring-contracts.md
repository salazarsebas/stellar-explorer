---
title: Explorar contratos inteligentes
description: Cómo navegar los contratos inteligentes Soroban en Stellar Explorer.
---

Soroban es la plataforma de contratos inteligentes de Stellar. Los contratos se identifican por un ID de contrato (que comienza con `C`).

## Encontrar un contrato

Pega un ID de contrato en la barra de búsqueda, o navega a la sección de Contratos.

## Detalles del contrato

La página del contrato muestra:

- **ID de contrato** — El identificador único
- **Código** — Información del binario WASM desplegado
- **Almacenamiento** — Datos clave-valor almacenados por el contrato
- **Eventos** — Eventos del contrato emitidos durante la ejecución

## Eventos del contrato

Los eventos son emitidos por los contratos durante la ejecución de transacciones. Cada evento muestra:

- **Tema** — De qué trata el evento
- **Datos** — La carga útil del evento
- **Transacción** — La transacción que activó el evento
- **Ledger** — Cuándo ocurrió el evento

:::note
Los datos del contrato se obtienen a través de Soroban RPC, que puede no estar disponible en todas las redes.
:::
