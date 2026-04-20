---
title: Testing
description: Cómo escribir y ejecutar tests.
---

Stellar Explorer usa [Vitest](https://vitest.dev/) con el entorno happy-dom.

## Ejecutar tests

```bash
bun run test           # Ejecutar todos los tests una vez
bun run test:watch     # Ejecutar en modo observación
```

Ejecutar un único archivo de test:

```bash
bun --cwd apps/explorer-web x vitest run src/lib/utils/format.test.ts
```

## Ubicación de los archivos de test

Los archivos de test viven junto a sus archivos fuente usando la convención de nombres `*.test.{ts,tsx}`:

```
apps/explorer-web/src/lib/utils/
  format.ts
  format.test.ts
```

## Escribir tests

```typescript
import { describe, it, expect } from "vitest";
import { formatAmount } from "./format";

describe("formatAmount", () => {
  it("formats XLM amounts correctly", () => {
    expect(formatAmount("10000000")).toBe("1.0000000");
  });
});
```

## Entorno

Los tests se ejecutan en [happy-dom](https://github.com/nicedoc/happy-dom), un entorno de navegador ligero. Esto permite testear componentes React sin un navegador completo.
