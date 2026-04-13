---
name: server-vitest-express
description: >-
  Vitest patterns for @packages/server route and Express tests: supertest vs
  mocked Router, GraphQL mocks, and minimal DataContext. Use when migrating
  *_spec.ts route/server tests or adding HTTP-layer unit tests.
---

# Server unit tests: Vitest + Express / routes

## Scope

- **Package**: `packages/server` Vitest config: `test/unit/**/*.spec.{js,ts}` (see `vitest.config.ts`).
- **Legacy**: `*_spec.{js,ts}` still run under Mocha; migrated files use `*.spec.{js,ts}` and Vitest (`expect`, `vi`).

## When to use `supertest`

Use **`import supertest from 'supertest'`** and **`supertest(app).get/...`** when you want a **real** `express()` app and HTTP semantics (status, headers, body).

- **Example in this repo**: `packages/proxy/test/integration/net-stubbing.spec.ts` (builds `express()`, mounts routes, uses `supertest`).
- **`spec_helper.js`** sets `global.supertest` for Mocha; in Vitest specs **import** `supertest` explicitly.

## When not to use `supertest` (router wiring / middleware)

When the test only needs **how routes are registered** or **middleware behavior** with fake `req`/`res`/`next`:

1. **`vi.mock('express', ...)`** with **`Router: vi.fn()`**.
2. In each **`setup*`** helper, build a **`router`** object with **`vi.fn()`** for `get`, `post`, `all`, `use`.
3. **`vi.mocked(express.Router).mockReturnValue(router as unknown as express.Router)`** so **every** `Router()` call inside the module under test returns the **same** router instance (matches how legacy sinon tests used `sinon.stub().returns(router)`).
4. Call **`createCommonRoutes(routeOptions)`** (or the exported API under test).
5. Inspect **`router.use.mock.calls`** / **`router.get.mock.calls`** or invoke the middleware you extracted from `use` calls.

- **Reference implementation**: `packages/server/test/unit/routes.spec.ts` (`lib/routes` https-upgrade and studio/cy-prompt wiring).

## Importing `lib/routes` under Vitest

`lib/routes` pulls **`graphQLHTTP`** from **`@packages/data-context/graphql/makeGraphQLServer`**, which loads GraphQL. In Vitest that can trigger **duplicate `graphql` “another module or realm”** errors.

**Fix**: mock the HTTP entry only:

```ts
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    graphQLHTTP: vi.fn(),
  }
})
```

Place **`vi.mock` calls** above static imports of `../../lib/routes` (Vitest hoists them; keep the pattern used in `routes.spec.ts`).

## Data context (`getCtx` / `setCtx`)

Specs that **do not** need a full app must still satisfy **`setCtx`** before code calls **`getCtx()`** (e.g. studio/cy-prompt tests).

- **Mocha + `spec_helper`**: uses **`makeDataContext({})`**, which loads GraphQL. That is fine under Mocha.
- **Vitest**: prefer a **minimal `DataContext` stub** (`coreData`, `lifecycleManager.mainProcessWillDisconnect`, `destroy`, `_reset`) passed to **`setCtx`**, with **`clearCtx`** in **`beforeEach`/`afterEach`**, so you **do not** import **`makeDataContext`** from `lib/makeDataContext` unless you resolve the GraphQL duplicate-realm issue at the Vitest config level.

See **`createRoutesTestContext`** in `packages/server/test/unit/routes.spec.ts`.

## Optional: real HTTP without supertest

For a **small** black-box check, you can **`listen()`** on an ephemeral port and use **`fetch`**. Prefer **`supertest`** when the app is already an Express instance; it avoids port races and teardown boilerplate.

## Related

- **Global `supertest`**: `packages/server/test/spec_helper.js` (Mocha).
- **Vitest exclude list**: legacy `*_spec` files in `packages/server/vitest.config.ts`.
