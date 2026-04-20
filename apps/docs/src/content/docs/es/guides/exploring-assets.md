---
title: Explorar activos
description: Cómo descubrir y analizar activos en la red Stellar.
---

Los activos en Stellar se identifican por un código (p. ej., `USDC`) y una cuenta emisora. XLM es el activo nativo y no tiene emisor.

## Descubrir activos

La página de Activos lista los activos disponibles en la red. Cada tarjeta de activo muestra:

- **Código y emisor** — El identificador del activo
- **Dominio** — El dominio del emisor (obtenido de su `stellar.toml`)
- **Estadísticas** — Número de titulares, líneas de confianza y volumen de intercambio

## Detalles del activo

Haz clic en cualquier activo para ver:

- **Metadatos** — Información del archivo `stellar.toml` del emisor (nombre, descripción, imagen)
- **Titulares** — Cuentas que poseen este activo
- **Intercambios** — Historial reciente de intercambios para este par de activos

## Información TOML

Stellar Explorer obtiene y muestra metadatos del archivo `stellar.toml` del emisor. Esto incluye el nombre oficial del activo, descripción, logo e información de cumplimiento. Los datos TOML se obtienen a través de un proxy seguro para prevenir ataques SSRF.
