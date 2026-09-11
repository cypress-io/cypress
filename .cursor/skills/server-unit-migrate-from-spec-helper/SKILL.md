---
name: server-unit-migrate-from-spec-helper
description: >-
  Migrates @packages/server unit tests away from spec_helper.js, Mocha globals, sinon,
  and chai to Vitest-only APIs without recreating spec_helper as a Vitest setup file.
  Notes sinon.usingPromise(Bluebird), configureLongStackTraces, and when SUT still uses
  Bluebird chains. Use when migrating *_spec files that import spec_helper, or when the
  user wants to drop spec_helper/sinon/chai from unit tests in packages/server.
---

# Migrate unit tests off `spec_helper` (Mocha) to Vitest

## Goal

**Do not** port [`packages/server/test/spec_helper.js`](packages/server/test/spec_helper.js) to a global Vitest setup that re-injects sinon, chai, mockery, or global `expect`. Those patterns are obsolete for migrated tests.

Each migrated `*.spec.ts` file should be **self-contained**: import what it needs from `vitest`, Node, and the SUT; add **only** the hooks (nock, data-context, cache) that file **actually** depends on.

## What `spec_helper` did (audit before migrating)

| Mechanism | Purpose | Vitest replacement |
| --------- | ------- | ------------------ |
| Global `expect` + Chai plugins | Assertions | `import { expect } from 'vitest'` (Jest-style matchers) |
| Global `sinon` | Stubs/spies | `vi.fn`, `vi.spyOn`, `vi.restoreAllMocks()` |
| `sinon.createStubInstance(Class)` | Stubbed class | Minimal object with `vi.fn()` methods + cast to interface (see [`remote_states.spec.ts`](packages/server/test/unit/remote_states.spec.ts)) |
| Global `nock` | HTTP mocking | `import nock from 'nock'`; mirror [`spec_helper`](packages/server/test/spec_helper.js) `beforeEach`/`afterEach` nock hooks in the spec file (`activate`, `disableNetConnect`/`enableNetConnect`, `cleanAll`). Full process: [server-unit-nock-vitest](../server-unit-nock-vitest/SKILL.md); references [`create_instance.spec.ts`](packages/server/test/unit/cloud/api/create_instance.spec.ts), [`ensure_url.spec.ts`](packages/server/test/unit/util/ensure_url.spec.ts). |
| `mockery` / `proxyquire` | Module substitution | Prefer `vi.mock` / `import()` patterns; keep dynamic requires only where unavoidable |
| `beforeEach`: `clearCtx` / `setCtx` / `makeDataContext` | GraphQL data context | Import from [`lib/makeDataContext`](packages/server/lib/makeDataContext.ts) **only if** the code under test or test uses `getCtx()` |
| `beforeEach`: `cache.remove()` | File cache | Import `cache` from [`lib/cache`](packages/server/lib/cache.ts) and call `cache.remove()` only if the SUT depends on it |
| `sinon.usingPromise(Promise)` where **`Promise` is Bluebird** ([`spec_helper`](packages/server/test/spec_helper.js)) | Sinon’s fake timers / stubs integrate with that promise implementation | **Do not** recreate in Vitest. **`vi`** and **`vi.fn().mockResolvedValue`** use **native `Promise`**. Most migrated tests behave the same; see [Bluebird / long-stack / Sinon](#bluebird--long-stack--sinon) when they do not. |
| `configureLongStackTraces()` (from [`spec_helper`](packages/server/test/spec_helper.js)) | Longer async stacks in dev/test | **Not** replicated in migrated Vitest files. Affects debugging, not typical pass/fail assertions. |
| `process.env` | Env vars | `vi.stubEnv` / `vi.unstubAllEnvs()` |
| `mocked-env` package | Env snapshot/restore | Prefer `vi.stubEnv` / `vi.unstubAllEnvs()` |
| Mocha `context` | Suite nesting | `describe` |

### Bluebird / long-stack / Sinon

**Usually you do not need a dedicated “Promise migration” pass.** Replacing Sinon with **`vi`** already moves stub resolution to native **`Promise`**. Assertions that **`await`** mocked async work stay equivalent.

**When it matters:**

- **SUT still returns Bluebird** (common in `packages/server` — e.g. **`.return()`**, **`.spread()`**, **`.catch`** chains that assume Bluebird). Stubs or spies must return what the **caller** expects: e.g. return a **Bluebird** from **`mockImplementation`** if the production code chains Bluebird-only methods on the result. See [server-unit-deep-mocks-vitest](../server-unit-deep-mocks-vitest/SKILL.md) patterns and **`server-base.spec.ts`** for **`ensureUrl.isListening`** + **`.return()`**.
- **Test** used Bluebird-only APIs on a **stubbed** return value (rare). Rewrite to **`async`/`await`** + native **`Promise`**, or keep an explicit **`Bluebird`** import only for that chain.

**Not Sinon-specific:** **`configureLongStackTraces()`** is global environment setup; Vitest specs do not inherit it from **`spec_helper`**. No skill change needed unless you are debugging missing stack depth.

## Assertion mapping (Chai → Vitest)

| Chai | Vitest |
|------|--------|
| `expect(x).to.deep.equal(y)` | `expect(x).toEqual(y)` |
| `expect(x).to.be.undefined` | `expect(x).toBeUndefined()` |
| `expect(x).to.be.null` | `expect(x).toBeNull()` |
| `expect(x).to.be.true` / `.false` | `expect(x).toBe(true)` / `toBe(false)` |
| `expect(x).to.not.be.undefined` | `expect(x).toBeDefined()` |
| `expect(promise).to.eventually...` | `await expect(promise).resolves...` / `rejects` |

## Workflow

1. Rename `foo_spec.ts` → `foo.spec.ts` (disjoint globs with Mocha — see [`server-unit-mocha-to-vitest`](server-unit-mocha-to-vitest/SKILL.md)).
2. Remove `require('../spec_helper')` and **all** redundant `chai` / `sinon` / `@cypress/sinon-chai` imports used only to mirror spec_helper.
3. Read the spec and list **which** spec_helper side effects the SUT needs (ctx, cache, nock). **Do not** copy the full stack “just in case.”
4. Replace stubs with `vi.*`; replace assertions with Vitest `expect`.
5. Run `yarn workspace @packages/server test-unit-vitest` and `yarn workspace @packages/server test-unit` (Mocha suite for remaining `_spec` files).

## Reference migration

[`packages/server/test/unit/remote_states.spec.ts`](packages/server/test/unit/remote_states.spec.ts) — previously required `spec_helper`; uses only a local `DocumentDomainInjection` stub (`vi.fn`) and Vitest assertions. No nock, global cache, or data-context in this file.

## Related

- [Primary migration guide (skill index & order)](../server-unit-vitest-migration-guide/SKILL.md)
- [Nock + Vitest](../server-unit-nock-vitest/SKILL.md)
- [Server unit Mocha → Vitest (naming & runner)](../server-unit-mocha-to-vitest/SKILL.md)
- [JS `*_spec.js` → TypeScript `*.spec.ts`](../server-unit-js-spec-to-ts-vitest/SKILL.md)
- [Sinon mocks → Vitest `vi`](../server-unit-sinon-to-vitest-mocks/SKILL.md)
