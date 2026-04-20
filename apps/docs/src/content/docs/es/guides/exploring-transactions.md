---
title: Explorar transacciones
description: Cómo encontrar y entender transacciones en Stellar Explorer.
---

Las transacciones son las unidades fundamentales de cambio en la red Stellar. Cada transacción contiene una o más operaciones que modifican el estado del ledger.

## Encontrar una transacción

Hay dos formas de encontrar una transacción:

1. **Por hash** — Pega el hash de la transacción en la barra de búsqueda
2. **Navegando** — Ve a la página de Transacciones para ver las transacciones recientes

## Detalles de la transacción

Cada página de transacción muestra:

- **Estado** — Si la transacción tuvo éxito o falló
- **Ledger** — El ledger que incluyó esta transacción
- **Cuenta de origen** — La cuenta que envió la transacción
- **Comisión** — La comisión pagada en XLM (en stroops en Modo desarrollador)
- **Operaciones** — La lista de operaciones dentro de la transacción
- **Efectos** — Los cambios resultantes en el ledger

## Operaciones

Una transacción puede contener hasta 100 operaciones. Los tipos de operación más comunes son:

| Operación | Descripción |
|---|---|
| `payment` | Transferir XLM u otro activo |
| `createAccount` | Financiar una nueva cuenta |
| `changeTrust` | Añadir o eliminar una línea de confianza |
| `manageData` | Establecer o eliminar entradas de datos de cuenta |
| `invokeHostFunction` | Ejecutar un contrato inteligente Soroban |

Cada operación se muestra en una tarjeta con su tipo, parámetros y las cuentas involucradas.
