---
title: Testing
description: How to write and run tests.
---

Stellar Explorer uses [Vitest](https://vitest.dev/) with the happy-dom environment.

## Running Tests

```bash
bun run test           # Run all tests once
bun run test:watch     # Run in watch mode
```

Run a single test file:

```bash
bunx vitest run src/lib/utils/format.test.ts
```

## Test File Location

Test files live alongside their source files using the `*.test.{ts,tsx}` naming convention:

```
src/lib/utils/
  format.ts
  format.test.ts
```

## Writing Tests

```typescript
import { describe, it, expect } from "vitest";
import { formatAmount } from "./format";

describe("formatAmount", () => {
  it("formats XLM amounts correctly", () => {
    expect(formatAmount("10000000")).toBe("1.0000000");
  });
});
```

## Environment

Tests run in [happy-dom](https://github.com/nicedoc/happy-dom), a lightweight browser environment. This allows testing React components without a full browser.
