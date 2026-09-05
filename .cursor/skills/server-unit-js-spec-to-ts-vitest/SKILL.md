---
name: server-unit-js-spec-to-ts-vitest
description: >-
  Migrates @packages/server Mocha unit tests from JavaScript (*_spec.js) to TypeScript
  Vitest (*.spec.ts): module syntax, Chai to Vitest assertions, and paths. Use when
  migrating test/unit JS specs to TS, converting _spec.js to .spec.ts, or when the user
  mentions JS to TypeScript for server unit tests.
---

# Migrate `*_spec.js` → `*.spec.ts` (Vitest)

Applies to **[`packages/server/test/unit`](packages/server/test/unit)**. Same disjoint naming as other Vitest migrations: Mocha runs `*_spec.{js,ts}`, Vitest runs `*.spec.{js,ts}` — a migrated file **renames** to `foo.spec.ts` and drops the `_spec` suffix pattern.

## When to pick a JS file

Prefer **small, pure** specs first: few imports, no `proxyquire`/`mockery`, no snap-shot-it.

Examples:

- [`duration.spec.ts`](packages/server/test/unit/util/duration.spec.ts) — minimal (`lib` + assertions only).
- [`human_time.spec.ts`](packages/server/test/unit/util/human_time.spec.ts) — slightly larger: multiple `describe` blocks, extra npm import (`human-interval`), still no mocks.
- [`stream_buffer.spec.ts`](packages/server/test/unit/util/stream_buffer.spec.ts) — streams, `vi.spyOn` (replaces `sinon.spy`), async via **`new Promise((resolve) => { ... })`** (Vitest 3 deprecates Mocha-style `done` callbacks — the first `it` argument is **`TestContext`**, not `done`). `_.after(n, fn)` → manual counters. `pt.pipe(sb)` may need `sb as unknown as NodeJS.WritableStream` for typings. Self-read file: `fileURLToPath((import.meta as { url: string }).url)` (or align `import.meta` with your TS `module` setting).

- [`snapshot.spec.ts`](packages/server/test/unit/snapshot.spec.ts) — simplest **snap-shot-it** migration: `return snapshot('name', value)` → `expect(value).toMatchSnapshot()`; snapshots live under `test/unit/__snapshots__/*.snap`; use `vitest run -u` to update. Delete legacy `__snapshots__/<file>_spec.js` from the repo root `__snapshots__/` when migrating off snap-shot-it for that file.

- [`async_retry.spec.ts`](packages/server/test/unit/util/async_retry.spec.ts) — migrated from `async_retry_spec.ts`: **sinon** stubs → **`vi.fn`** with `mockResolvedValueOnce` / `mockRejectedValueOnce` chains; **sinon fake timers** → **`vi.useFakeTimers`**, **`vi.advanceTimersByTimeAsync`**, **`vi.runAllTimersAsync`**, **`vi.useRealTimers`** in `afterEach`. No `spec_helper`.

## CJS `module.exports` in `lib/`

If a spec `import`s a `lib/**/*.ts` file that only had `module.exports`, Vitest may not resolve it — add a TypeScript **`export { name }`** alongside removing duplicate `module.exports` when safe (see [`stream_buffer.ts`](packages/server/lib/util/stream_buffer.ts)). Keep `require()` consumers working via CommonJS emit.

If the implementation is still **`lib/**/*.js`** but it imports **`.ts`** (or mixed imports from `lib/**/*.ts`), migrate the source **`foo.js` → `foo.ts`** first — see [`server-lib-js-to-ts`](../server-lib-js-to-ts/SKILL.md) (e.g. `args.js` + `proxy.ts`).

## Steps

1. **Delete** `foo_spec.js` and add **`foo.spec.ts`** next to it (same directory). Keep one commit per file if you want a clear rename story in history.

2. **Remove** `require('../spec_helper')` and any global reliance on Chai/sinon from `spec_helper`.

3. **Modules**
   - `const x = require('path')` → `import x from 'path'` or `import * as x from 'path'` (match Node ESM/CJS interop).
   - `const { a } = require('../../lib/foo')` → `import { a } from '../../lib/foo'` or `import * as foo from '../../lib/foo'`.
   - Paths to `lib/` stay the same relative depth from `test/unit/...` (e.g. `test/unit/util/` → `../../../lib/...`).

4. **Vitest API**
   - `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'` — import only what you use.
   - `context` → `describe`.
   - Use Vitest only (see [server-unit-mocha-to-vitest](../server-unit-mocha-to-vitest/SKILL.md)); no sinon/chai.

5. **Chai → Vitest assertions (common)**

| Chai | Vitest |
|------|--------|
| `expect(x).to.eq(y)` | `expect(x).toBe(y)` (primitives; `eq` was `==`) |
| `expect(x).to.equal(y)` | `expect(x).toBe(y)` or `toEqual(y)` for deep |
| `expect(x).to.deep.equal(y)` | `expect(x).toEqual(y)` |

6. **TypeScript**
   - Add types only where they help (imports from `lib`, `as const`, interfaces for fixtures). Strictness is optional for pure rewrites; follow the repo ESLint config for `packages/server`.
   - `.ts` allows `import type` for type-only imports.

7. **spec_helper-heavy JS specs** — Audit nock/ctx/cache (see [server-unit-migrate-from-spec-helper](../server-unit-migrate-from-spec-helper/SKILL.md)); do not add a global Vitest `spec_helper`.

## Verify

```bash
yarn workspace @packages/server test-unit-vitest -- test/unit/path/to/foo.spec.ts
yarn workspace @packages/server test-unit
```

## Related

- [server-unit-mocha-to-vitest](../server-unit-mocha-to-vitest/SKILL.md) — naming, dual runner, `vi`.
- [server-unit-migrate-from-spec-helper](../server-unit-migrate-from-spec-helper/SKILL.md) — dropping `spec_helper`.
- [server-unit-sinon-to-vitest-mocks](../server-unit-sinon-to-vitest-mocks/SKILL.md) — sinon → `vi` for mocks and spies.
