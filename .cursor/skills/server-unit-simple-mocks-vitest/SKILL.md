---
name: server-unit-simple-mocks-vitest
description: >-
  Minimal mockery → vi.mock for @packages/server: npm packages (e.g. morgan) with
  hoisted stubs; when to use this vs server-unit-deep-mocks-vitest.
---

# Simple npm mocks (mockery → `vi.mock`) for `@packages/server`

Many legacy specs only replace a **single npm dependency** (e.g. **`morgan`**) so the SUT does not hit real middleware. That is **not** the same as “deep” patterns (relative **`lib/`** paths, **`importOriginal`**, **`createRequire`** for CJS spies, **`@cypress/*` + `deps.inline`**).

**Prefer this doc** when the only mockery usage is `registerMock('some-npm-package', …)`. **Use** **`.cursor/skills/server-unit-deep-mocks-vitest/SKILL.md`** when you have relative **`lib/`** mocks, scoped packages, **`vi.spyOn`** on modules **`require`d** from CJS SUTs, or **`importOriginal`**.

## Pattern

1. **`vi.hoisted`** — any **`vi.fn()`** or stable object the tests assert on (e.g. the middleware function passed to **`app.use`**) must be created in **`vi.hoisted`** so the **`vi.mock`** factory and **`it`** blocks share the same reference.
2. **`vi.mock('package-name', factory)`** — the factory return value must match what **`require('package-name')`** is in the SUT (usually the **same string** as in **`require('morgan')`** — no path from the test file).
3. **No** **`server.deps.inline`** — unless the package is **`@cypress/*`** (see deep-mocks skill). Plain **`morgan`**-style packages do not need extra Vitest config.
4. **Sinon → Vitest** — **`sinon.spy` / `stub` / `mock`** → **`vi.spyOn`**, **`vi.fn`**, **`mockResolvedValue`**, etc. — **`.cursor/skills/server-unit-sinon-to-vitest-mocks/SKILL.md`**.

### Example (callable default export)

**`morgan`** is **`module.exports = function (format) { … }`**. A minimal stub that mirrors **`mockery.registerMock('morgan', () => morganFn)`** where **`require('morgan')('dev')`** must return a **stable** middleware for assertions:

```typescript
const morganStubs = vi.hoisted(() => {
  const morganFn = function () {}
  const morganModule = function () {
    return morganFn
  }

  return { morganFn, morganModule }
})

vi.mock('morgan', () => morganStubs.morganModule)
```

**Reference:** `packages/server/test/unit/server-base.spec.ts`.

## `server-base` / `open` extras (not “deep” — but easy to miss)

Importing **`lib/server-base`** still pulls **GraphQL** and **routes** (`createCommonRoutes`). Typical additions:

1. **`vi.mock('@packages/data-context/graphql/makeGraphQLServer', …)`** — return **`graphqlWS`**, **`graphQLHTTP`**, and any other exports the routes bundle reads (match **`routes.spec.ts`**). Avoids duplicate **`graphql`** realm errors and Vitest “missing export” failures when **`open()`** runs.
2. **`clearCtx` / `setCtx`** with a **minimal** **`DataContext`** (same idea as **`routes.spec.ts`**) **`open()`** calls **`getCtx()`** inside route setup.
3. **`setupFullConfigWithDefaults(..., getFilesByGlob)`** — you may pass **`vi.fn().mockResolvedValue([])`** instead of **`getCtx().file.getFilesByGlob`** if you don’t need a real globber.
4. **Bluebird** — code that chains **`.return()` / `.catch()`** on **`ensureUrl.isListening`** expects a **Bluebird** from the spy; use **`Bluebird.resolve` / `Bluebird.reject`** in **`mockImplementation`**, not only native **`Promise`**.
5. **`sinon.stub(Class.prototype, 'method')`** without calling the real method — **`vi.spyOn(..., 'mockImplementation(() => {})')`** so the real **`startListening`** (which needs **`automation.use`**) does not run.
6. **Portable “two addresses” checks** — if a test would **`connect`** to a non-loopback IP that may not exist (or may **`EPERM`** in a sandbox), **`vi.spyOn(connect, 'byPortAndAddress')`** and forward to the real **`connect.byPortAndAddress`** only when **`addr.address === '127.0.0.1'`**, otherwise **`Promise.reject({ code: 'ECONNREFUSED' })`**. **`createServer`** still binds real listeners on localhost; the assertion stays meaningful without a second NIC or outbound access to documentation ranges.

**Reference:** `packages/server/test/unit/server-base.spec.ts`.

## Related

- **`packages/server/vitest.config.ts`** — Vitest entry / related skills in comments.
- **`.cursor/skills/server-unit-deep-mocks-vitest/SKILL.md`** — relative **`lib/`**, **`@cypress/*`**, **`createRequire`**, **`importOriginal`**.
- **`packages/server/test/unit/routes.spec.ts`** — `graphQLHTTP` mock + minimal **`DataContext`**.
