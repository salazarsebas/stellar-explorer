# QA Report - Stellar Explorer v0.2.0

## February 2026

### Executive Summary

The Stellar Explorer is a Next.js 16 blockchain explorer built with React 19, TypeScript, TanStack Query, and @stellar/stellar-sdk. This QA audit identified 38 distinct issues across 4 severity levels. The most critical findings include zero test coverage, an SSRF vulnerability, duplicate SSE connections causing resource waste, and unsafe type assertions throughout the codebase.

### Findings Summary

| Severity  | Count  |
| --------- | ------ |
| Critical  | 4      |
| High      | 8      |
| Medium    | 13     |
| Low       | 13     |
| **Total** | **38** |

---

## Critical Issues

### C-1: Zero Test Coverage

- **Severity**: CRITICAL
- **Files**: Entire project
- **Description**: No test files exist anywhere in the project. No testing framework (Jest, Vitest, Playwright, Cypress, or Testing Library) is configured in package.json.
- **Impact**: No way to verify correctness, catch regressions, or safely refactor. This is the single largest risk.
- **Remediation**: Install Vitest + @testing-library/react. Create smoke tests for utilities and critical hooks.

### C-2: Duplicate SSE Streaming Connections

- **Severity**: CRITICAL
- **File**: `src/app/[locale]/(explorer)/page.tsx`
- **Lines**: 34, 168
- **Description**: `useLedgerStream({ enabled: true })` is called in both the `NetworkStats` child component (line 34) AND the parent `HomePage` component (line 168). This creates TWO simultaneous Server-Sent Event connections to the Horizon server for the same data.
- **Impact**: Doubles bandwidth usage per user session. May trigger Horizon rate limits.
- **Remediation**: Lift `useLedgerStream` to `HomePage` only; pass data via props to `NetworkStats`.

### C-3: Non-null Assertion on Potentially Undefined Values

- **Severity**: CRITICAL
- **File**: `src/lib/stellar/queries.ts`
- **Lines**: 251, 318
- **Description**: `counterIssuer!` and `buyingIssuer!` use the non-null assertion operator on `string | undefined` parameters. If a non-XLM asset is queried without providing the issuer, this creates an invalid `Asset` object causing a runtime crash.
- **Impact**: Runtime crash when querying trade aggregations or orderbook for non-XLM assets without an issuer.
- **Remediation**: Replace `!` with explicit validation: `if (!counterIssuer) throw new Error("...")`.

### C-4: SSRF Vulnerability in TOML API Route

- **Severity**: CRITICAL (Security)
- **File**: `src/app/api/toml/route.ts`
- **Line**: 36
- **Description**: The `url` query parameter is passed directly to `fetch()` without any URL validation. An attacker can pass internal network addresses (e.g., `http://169.254.169.254/latest/meta-data/` for AWS metadata, `http://localhost:3000/api/...`).
- **Impact**: Server-Side Request Forgery allowing access to internal infrastructure, cloud metadata services, or data exfiltration.
- **Remediation**: Validate URL protocol (HTTPS only), block private/localhost IPs, optionally restrict to `.well-known/stellar.toml` paths.

---

## High Severity Issues

### H-1: Unsafe `as unknown as` Type Assertions

- **Severity**: HIGH
- **File**: `src/app/[locale]/(explorer)/asset/[slug]/asset-content.tsx`
- **Lines**: 259, 361, 369, 372
- **Description**: The Horizon SDK `AssetRecord` is forcibly cast to custom `StellarAsset` type via `as unknown as StellarAsset`. If the SDK response shape diverges, these casts silently suppress TypeScript errors.
- **Impact**: Silent data access errors; properties may be undefined at runtime.
- **Remediation**: Create a proper interface extending `AssetRecord` or use safe property access.

### H-2: Unsafe Type Assertion in Ledger Query

- **Severity**: HIGH
- **File**: `src/lib/stellar/queries.ts`
- **Line**: 96
- **Description**: `return response as unknown as Horizon.ServerApi.LedgerRecord;` -- double-cast bypasses TypeScript entirely.
- **Remediation**: Use the correct return type from the SDK or create a type guard.

### H-3: Missing Operation Type Narrowing

- **Severity**: HIGH
- **File**: `src/app/[locale]/(explorer)/tx/[hash]/transaction-content.tsx`
- **Line**: 166
- **Description**: `const op = operation as Horizon.ServerApi.OperationRecord & Record<string, unknown>;` is used to access dynamic properties like `op.from`, `op.to`, `op.amount` without type narrowing based on `operation.type`.
- **Impact**: No type safety on operation property access; accessing wrong properties silently returns `undefined`.
- **Remediation**: Implement type narrowing based on `operation.type` discriminator.

### H-4: Explicit `any` in `decodeScVal`

- **Severity**: HIGH
- **File**: `src/lib/stellar/queries.ts`
- **Lines**: 577-578
- **Description**: `const decodeScVal = (val: any)` with eslint-disable comment. Should be typed as `xdr.ScVal`.
- **Remediation**: Import `xdr` type from SDK and use `xdr.ScVal` parameter type.

### H-5: N+1 Query Pattern in `topAssets`

- **Severity**: HIGH
- **File**: `src/lib/stellar/queries.ts`
- **Lines**: 341-418
- **Description**: The `topAssets` query makes 10 sequential HTTP requests (5 asset fetches + 5 trade aggregation fetches). Each is a separate API call to Horizon.
- **Impact**: Increases load time and Horizon API rate limit consumption.
- **Remediation**: Batch requests where possible. Ensure `Promise.all` is used for true parallelism (already partially done).

### H-6: Hardcoded Asset Issuers Duplicated

- **Severity**: HIGH
- **Files**: `src/lib/stellar/queries.ts` (lines 349-354), `src/app/[locale]/(explorer)/assets/page.tsx` (lines 213-218)
- **Description**: The same popular asset issuers (USDC, yXLM, AQUA, etc.) are hardcoded in two separate files with no shared constant.
- **Impact**: Maintenance hazard; data could become inconsistent between locations.
- **Remediation**: Create shared `POPULAR_ASSETS` constant in `src/lib/constants/index.ts`.

### H-7: StellarExpert Client Not Cached

- **Severity**: HIGH (resolved by Expert removal)
- **File**: `src/lib/stellar/stellar-expert.ts`
- **Lines**: 258-260
- **Description**: `getStellarExpertClient(network)` creates a new instance on every call, unlike Horizon/RPC clients which use a `Map` cache.
- **Status**: Resolved by removing Stellar Expert entirely.

### H-8: Missing Input Validation on Transaction Page

- **Severity**: HIGH
- **File**: `src/app/[locale]/(explorer)/tx/[hash]/page.tsx`
- **Lines**: 28-31
- **Description**: Transaction hash is passed to `TransactionContent` without validation. A non-hex, wrong-length string proceeds to the API call and only fails at network level.
- **Impact**: Unnecessary API calls for invalid hashes; no 404 for malformed input.
- **Remediation**: Validate hash format (64 hex characters) before rendering content component.

---

## Medium Severity Issues

### M-1: Triplicate `parseAssetSlug` Function

- **Files**: `src/app/[locale]/(explorer)/asset/[slug]/page.tsx`, `asset-content.tsx`, `opengraph-image.tsx`
- **Description**: The same function is defined three times in the same route directory. DRY violation.

### M-2: Unused `reconnectCount` in Streaming State

- **File**: `src/lib/hooks/use-streaming.ts` (lines 19, 30, 133)
- **Description**: `reconnectCount` is defined in state but never incremented or used.

### M-3: `formatNumber` Shadow in Analytics

- **File**: `src/app/[locale]/(explorer)/analytics/page.tsx` (line 274)
- **Description**: Local `formatNumber` shadows imported version with different behavior.

### M-4: `useCallback` Misused as `useMemo`

- **File**: `src/lib/hooks/use-chart-data.ts` (lines 143-161)
- **Description**: `useCallback` wraps a computation that is immediately invoked. Should use `useMemo`.

### M-5: Unconditional Query Execution in Transactions Page

- **File**: `src/app/[locale]/(explorer)/transactions/page.tsx` (lines 37-39)
- **Description**: All three query hooks fire unconditionally; relies on empty string/zero to disable.

### M-6: No Rate Limiting on TOML API Route

- **File**: `src/app/api/toml/route.ts`
- **Description**: No rate limiting on the proxy endpoint.

### M-7: In-Memory Cache Won't Work in Serverless

- **File**: `src/app/api/toml/route.ts` (lines 6-7)
- **Description**: `Map` cache is per-instance; in serverless (Vercel), each invocation has its own memory.

### M-8: localStorage Access Without Error Boundary

- **File**: `src/lib/providers/network-provider.tsx` (line 23)
- **Description**: Direct `localStorage.getItem()` without try/catch. Can throw in restricted browser contexts.

### M-9: Bug - "Total Fees" Shows Wrong Data

- **File**: `src/app/[locale]/(explorer)/ledger/[sequence]/ledger-content.tsx` (line 97)
- **Description**: Label says "Total Fees" but displays `ledger.total_coins` (total XLM in existence), not actual fees.
- **Impact**: Users see incorrect financial data.

### M-10: Misleading Asset Verification Badge

- **File**: `src/app/[locale]/(explorer)/asset/[slug]/asset-content.tsx` (lines 335-340)
- **Description**: Asset shown as "verified" if `!auth_required && !auth_revocable`. This is not what "verified" means in Stellar.

### M-11: Hardcoded `en-US` Locale in Formatting

- **File**: `src/lib/utils/format.ts` (lines 31, 42, 104, 116, 132)
- **Description**: All formatting functions use hardcoded "en-US" despite i18n support for 9 languages.

### M-12: Using `key={index}` for Dynamic Lists

- **File**: `src/app/[locale]/(explorer)/account/[id]/account-content.tsx` (line 128)
- **Description**: Using array index as key for balances list that may reorder.

### M-13: Unused `date-fns` Dependency

- **File**: `package.json` (line 30)
- **Description**: `date-fns` (~18KB gzipped) is listed but never imported in `src/`.

---

## Low Severity Issues

### L-1: Missing SEO Metadata on List Pages

- **Files**: transactions, ledgers, assets, contracts, accounts pages
- **Description**: Client-rendered list pages don't export `generateMetadata`.

### L-2: `queueMicrotask` Pattern in Streaming Hooks

- **File**: `src/lib/hooks/use-streaming.ts` (lines 109, 209, 319)
- **Description**: Uses `queueMicrotask` to avoid synchronous setState in useEffect.

### L-3: `timeRange` State Has No Effect

- **File**: `src/app/[locale]/(explorer)/analytics/page.tsx` (line 158)
- **Description**: Time range selector is purely decorative; value is never passed to any query.

### L-4: No Pagination on List Pages

- **Files**: transactions/page.tsx, assets/page.tsx
- **Description**: Only first page of results shown; no "load more" or pagination mechanism.

### L-5: `console.error` in Production Code

- **File**: `src/app/api/toml/route.ts` (line 82)

### L-6: Missing `aria-label` on Search Inputs

- **Files**: Multiple page components with search forms

### L-7: Missing `aria-busy` and `role` on Loading Skeletons

- **Files**: Home page and all list pages

### L-8: `router.replace()` Called During Render

- **File**: `src/app/[locale]/(explorer)/search/page.tsx` (line 39)

### L-9: `Buffer.isBuffer` in Client Component

- **File**: `src/app/[locale]/(explorer)/contract/[id]/contract-content.tsx` (line 177)
- **Description**: Relies on indirect polyfill from stellar-sdk.

### L-10: Inconsistent Link Component Usage

- **Description**: Some files use `next/link`, others use `@/i18n/navigation` Link.

### L-11: Unused Constants

- **File**: `src/lib/constants/index.ts`
- **Description**: `MIN_BALANCE_XLM`, `BASE_RESERVE_XLM`, `MAX_PAGE_SIZE`, `TRANSACTION_POLL_INTERVAL`, `ADDRESS_TRUNCATE_LENGTH` are never imported.

### L-12: Large Recharts Import

- **Description**: recharts (~180KB gzipped) loaded without dynamic imports.

### L-13: Unused `date-fns` Adds to Bundle

- **Description**: Adds ~18KB gzipped for zero usage (duplicate of M-13 for bundle perspective).

---

## Tools & Infrastructure Investigation

### Current Tools

| Tool                     | Version | Purpose                                                | Limitations                                                                                  |
| ------------------------ | ------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Horizon API**          | -       | Ledgers, transactions, accounts, assets, SSE streaming | No aggregate network stats. No asset ranking/sorting. Rate limited at high volume.           |
| **Soroban RPC**          | -       | Smart contracts, WASM, events, storage                 | **Only 7-day history window** for getTransaction/getEvents. No streaming. No aggregate data. |
| **@stellar/stellar-sdk** | 14.5.0  | Official JS/TS SDK for Horizon + RPC                   | Well maintained. Includes both Horizon and RPC clients.                                      |
| **Stellar Expert API**   | -       | Network stats, asset enrichment, contract verification | **Being removed** - unreliable results.                                                      |

### Alternative Tools Evaluated

| Tool                  | Type                   | Best For                                          | Pricing                       | Recommendation                                                  |
| --------------------- | ---------------------- | ------------------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| **Hubble (BigQuery)** | SDF public dataset     | Aggregate stats, top asset rankings, full history | 1TB/month free, then $6.25/TB | **Recommended for future** - best for network stats replacement |
| **Mercury**           | Stellar-native indexer | Real-time event tracking, contract subscriptions  | $5-50/month                   | Good for event-heavy features                                   |
| **SubQuery**          | Multi-chain indexer    | Custom GraphQL indexer                            | Free (self-hosted)            | Significant setup effort                                        |
| **BlockEden**         | RPC provider           | Alternative Soroban RPC endpoint                  | Not documented                | Redundancy only                                                 |
| **Ankr**              | RPC provider           | Alternative Horizon/RPC endpoints                 | Pay-as-you-go                 | Redundancy only                                                 |

### Recommendations

**Immediate (this iteration):**

- Remove Stellar Expert API entirely
- Use only Horizon + Soroban RPC (data already available)
- Accept loss of: aggregate network stats, contract verification status, asset rankings by trustlines/volume

**Future (Tier 2):**

- Integrate Hubble BigQuery via server-side API route with ISR caching for network statistics
- Build contract creator/creation lookup via Horizon operation search or Hubble
- Consider Mercury for real-time contract event subscriptions

---

## Technical Debt Summary

### Architecture

- No circular dependencies detected
- Folder structure is consistent and follows Next.js App Router patterns
- State management is appropriate (TanStack Query + React Context + localStorage)
- Several content components exceed 400-600 lines and could benefit from extraction

### Priority Matrix

| Priority | Category         | Items                                                                |
| -------- | ---------------- | -------------------------------------------------------------------- |
| P0       | Security         | SSRF fix (C-4)                                                       |
| P0       | Reliability      | Testing framework (C-1), SSE duplicates (C-2), Runtime crashes (C-3) |
| P1       | Type Safety      | All H-1 through H-4 type assertion issues                            |
| P1       | Performance      | N+1 queries (H-5)                                                    |
| P1       | Maintainability  | Duplicate constants (H-6), Input validation (H-8)                    |
| P2       | Data Correctness | Wrong ledger data (M-9), Misleading verification badge (M-10)        |
| P2       | i18n             | Hardcoded locale formatting (M-11)                                   |
| P3       | DX/UX            | SEO, accessibility, bundle size, pagination                          |

---

_Report generated: February 2026_
_Auditor: Claude Code QA_
_Project: Stellar Explorer v0.2.0_
