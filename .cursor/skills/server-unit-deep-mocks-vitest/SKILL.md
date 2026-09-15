---
name: server-unit-deep-mocks-vitest
description: >-
  Vitest vi.mock patterns for @packages/server: relative lib/ paths vs workspace
  package names, CJS spies with createRequire, hoisted stubs, importOriginal,
  and optional deps.inline for @cypress/*.
---

# Deep mocks (mockery → `vi.mock`) for `@packages/server`

Legacy Mocha tests use **mockery** (`registerMock`, `deregisterMock`) or **proxyquire**. Vitest uses **`vi.mock`**, **`vi.hoisted`**, and sometimes **`importOriginal`**.

**When this skill is too heavy:** if the only mockery usage is a **single npm package** (e.g. **`morgan`**) and no relative **`lib/`** paths, **`importOriginal`**, or **`@cypress/*`** edge cases — use **`.cursor/skills/server-unit-simple-mocks-vitest/SKILL.md`** instead so specs stay small and copyable.

## 1. Mock specifier must match the importer

**Vitest matches mocks by module id.** The string in **`vi.mock('…')`** must be the **same specifier** the code under test uses (after resolution), not “whatever path is convenient from the test file.”

| Importer uses | Use in `vi.mock` |
|---------------|------------------|
| `require('@cypress/webpack-batteries-included-preprocessor')` | **`vi.mock('@cypress/webpack-batteries-included-preprocessor', …)`** |
| `require('../../util/resolve')` from `lib/plugins/child/` | **`vi.mock('../../../../lib/util/resolve', …)`** from `test/unit/plugins/child/*.spec.ts` (path relative to **test file** that resolves to the **same file** as the SUT’s require) |

If the specifier differs (e.g. mock only a **relative** path but the SUT **`require`s a scoped package**), the SUT loads the **real** module and your stub never runs.

**Reference:** `packages/server/test/unit/plugins/child/run_plugins.spec.ts` mocks **`@cypress/webpack-batteries-included-preprocessor`** (same string as `lib/plugins/child/run_plugins.js`) and **`../../../../lib/util/resolve`** (matches `../../util/resolve` from that lib file).

## 2. Workspace / linked packages (`@cypress/*`, `0.0.0-development`)

Yarn workspaces link **`@cypress/...`** into **`packages/server/node_modules`**. Vite-node can resolve the same logical package through **different** ids than Node’s plain `require` in some cases.

**Mitigation in this repo:** `packages/server/vitest.config.ts` sets:

```typescript
server: {
  deps: {
    inline: [/^@cypress\//],
  },
},
```

so Vitest inlines those packages and keeps **`vi.mock('@cypress/…')`** aligned with **`require('@cypress/…')`** inside CJS.

## 3. Callable CJS `export =` (single function export)

Packages that compile to **`module.exports = function`** (e.g. some **`@cypress/*`** preprocessors) must be mocked so that **`require('pkg')`** is **the callable**, not **`{ default: fn }`**, or **`run_plugins`-style** `const x = require('pkg'); x(opts)` breaks.

Pattern:

```typescript
const wb = vi.hoisted(() => {
  const inner = vi.fn()
  const factory = vi.fn(() => inner)

  return { inner, factory }
})

vi.mock('@cypress/webpack-batteries-included-preprocessor', () => {
  return wb.factory
})
```

If the factory must return **`{ default }`** for ESM interop, confirm **`require()` in the SUT** actually calls **`.default`**; many Cypress server files use **plain `require` → function**.

## 4. `vi.spyOn` on modules loaded by CJS `require()`

**`import * as util from '…/util'`** + **`vi.spyOn(util, 'wrapChildPromise')`** can patch a **different object** than **`require('../util')`** inside a **`.js`** SUT (namespace / interop). **`vi.spyOn` then sees no calls.**

**Fix:** load the **same** exports the SUT uses:

```typescript
import { createRequire } from 'node:module'

const requireCjs = createRequire(import.meta.url)
const utilMod = requireCjs('../../../../lib/plugins/util.js')
const preprocessorMod = requireCjs('../../../../lib/plugins/child/preprocessor.js')

vi.spyOn(utilMod, 'wrapChildPromise')
vi.spyOn(preprocessorMod, 'wrap')
```

## 5. `importOriginal` + relative `lib/` paths (put_protocol style)

When you need the **real** module with one export replaced:

```typescript
vi.mock('../../../../lib/cloud/network/fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/network/fetch')>()

  return {
    ...actual,
    putFetch: stubs.putFetchStub,
  }
})
```

Keep the **`vi.mock` path** consistent with how the **imported TS file** resolves **`lib/`** (see **`put_protocol_artifact.spec.ts`**).

## 6. Hoisted stubs

Place **`vi.fn()`** values used inside **`vi.mock` factories** in **`vi.hoisted(() => ({ … }))`** so factories and tests share the same references (see **`put_protocol_artifact.spec.ts`**, **`cri-client.spec.ts`**).

## 7. When a scoped-package mock still does not intercept dynamic `require`

Some **`require('@cypress/…')`** calls **inside** CJS helpers may still resolve through a path Vitest does not alias to your mock. Options:

- Tighten **`server.deps.inline`** / **Vitest** issue search for “dynamic require mock”.
- Rely on **behavioral** assertions (registrations, IPC payloads, **`vi.spyOn`** on **local** `lib/` modules) instead of asserting the npm mock’s call count.

**Example:** `run_plugins.spec.ts` documents this for the default webpack preprocessor path.

## Related

- **`.cursor/skills/server-unit-two-hop-vi-mock/SKILL.md`** — chained `proxyquire` → single leaf `vi.mock`.
- **`packages/server/vitest.config.ts`** — includes deep-mocks / inline note in comments.
- **`packages/server/test/unit/cloud/api/put_protocol_artifact.spec.ts`** — `importOriginal` + relative `lib/` mocks.
