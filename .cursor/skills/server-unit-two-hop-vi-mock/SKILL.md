---
name: server-unit-two-hop-vi-mock
description: >-
  Vitest recipe for dependency chains where proxyquire used two (or more)
  injections (e.g. cri-client ← cdp-connection ← chrome-remote-interface):
  vi.mock order, vi.hoisted shared stubs, importOriginal, when one leaf mock
  is enough.
---

# Two-hop module graph under `vi.mock`

Legacy Mocha tests sometimes load the **system under test (SUT)** with **proxyquire** twice: first to build an intermediate module with a faked **leaf** dependency, then to inject that intermediate **export** into the SUT. In Vitest you replace this with **`vi.mock`**, **`vi.hoisted`**, and occasionally **`importOriginal`**.

## Vitest reference migration

`packages/server/test/unit/browsers/cri-client.spec.ts` — same scenarios as the legacy spec: **`vi.hoisted`** holds `{ state, criImport }`, **`vi.mock('chrome-remote-interface')`** supplies **`default: criImport`**, and **`beforeEach`** assigns **`state.criStub`** to fresh **`vi.fn()`** stubs (no second `vi.mock` for `./cdp-connection`).

## Reference pattern (proxyquire, legacy Mocha)

1. **`proxyquire('.../cdp-connection', { 'chrome-remote-interface': criImport })`** — builds `CDPConnection` with a fake Chrome Remote Interface client (`criImport` resolves to `criStub`: `send`, `on`, `off`, `close`, …).
2. **`proxyquire('.../cri-client', { './cdp-connection': { CDPConnection: CDPConnectionRef } })`** — loads `CriClient` so its `./cdp-connection` import is that first proxied module’s `CDPConnection`.

The **graph** is:

```text
cri-client  →  ./cdp-connection  →  chrome-remote-interface (leaf)
   SUT              middle                 stub here in legacy tests
```

See also: `.cursor/skills/server-unit-deep-mocks-vitest/SKILL.md` (general `vi.mock` / mockery migration). This skill is **only** the multi-hop injection story.

---

## Recipe A — Prefer a **single leaf** `vi.mock` (often enough)

If the **only** behavior you need to control is the **leaf** package (here `chrome-remote-interface`), you often **do not** need a second mock:

- `cdp-connection.ts` imports the leaf.
- `cri-client.ts` imports `cdp-connection`.

After **`vi.mock('chrome-remote-interface', factory)`**, the **first** load of `cdp-connection` in the test process uses the mock; **`cri-client`** then imports that same cached `cdp-connection` instance. One mock replaces **both** proxyquire hops **unless** you must replace `CDPConnection` itself or split module instances.

**Shared stub + factory** — use **`vi.hoisted`** so the factory and tests use the **same** `vi.fn` / stub object:

```typescript
import EventEmitter from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cri = vi.hoisted(() => {
  const criStub = {
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    _notifier: new EventEmitter(),
  }
  const criImport = Object.assign(
    vi.fn().mockResolvedValue(criStub),
    {
      New: vi.fn().mockResolvedValue({ webSocketDebuggerUrl: 'http://web/socket/url' }),
    },
  )

  return { criStub, criImport }
})

vi.mock('chrome-remote-interface', () => {
  return {
    default: cri.criImport,
  }
})

// Then: dynamic or static import of CriClient — it sees mocked chrome-remote-interface via cdp-connection.
import { CriClient } from '../../../lib/browsers/cri-client'
```

Tests assert on **`cri.criStub.send`**, **`cri.criImport`**, etc., like the migrated `cri-client.spec.ts` stubs.

**Why hoisted?** Mock factories are hoisted and run in an isolated scope; variables declared next to `import` are **not** in scope unless created inside **`vi.hoisted(...)`** (see Vitest docs).

---

## Recipe B — Explicit **middle** module mock (second hop)

Use when you must **replace** `./cdp-connection` for the SUT (custom class, partial API, or breaking the singleton instance) **while** the middle module’s **internals** should still see a mocked leaf.

1. Keep **`vi.mock('chrome-remote-interface', ...)`** first in source order (leaf).
2. **`vi.mock('./relative/path/to/cdp-connection', async (importOriginal) => { ... })`**:
   - **`await importOriginal()`** loads the **real** middle module **with** other mocks already applied, so its `CDPConnection` is the real class wired to the **fake** CRI.
   - Return **`{ ...actual, CDPConnection: YourSubclass }`** only if you need to override that export.

```typescript
vi.mock('chrome-remote-interface', () => ({ default: cri.criImport }))

vi.mock('../../../lib/browsers/cdp-connection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/browsers/cdp-connection')>()

  return {
    ...actual,
    CDPConnection: class extends actual.CDPConnection {
      // optional: spy on connect, etc.
    },
  }
})
```

**Path rule:** The string passed to **`vi.mock`** must match how **Node/Vitest resolves** the specifier from **`packages/server`** (same string family as the importing file under test). If resolution fails, try the path **`cri-client.ts` uses** (`./cdp-connection` is resolved from `lib/browsers/`, not from the test file).

---

## Order of mocks (after hoist)

All **`vi.mock`** calls are hoisted to the top of the file. **Execution order** follows their **original top-to-bottom order** in the source file.

- Put **leaf** (npm) mocks **above** mocks that exist only to re-wrap a local module, so when an `importOriginal` runs, the leaf is already stubbed.
- Avoid relying on **circular** `importOriginal` chains; split stubs or mock at the leaf.

---

## Shared stub checklist

| Concern | Approach |
|--------|-----------|
| Same `vi.fn` in factory and `it()` | **`vi.hoisted(() => ({ ... }))`** |
| Sinon `stub.withArgs(...).resolves(x)` | **`mockImplementation`** / **`mockResolvedValue`** on the hoisted `vi.fn` |
| `criStub.on.withArgs('event').args[0][1]` | **`vi.mocked(criStub.on).mock.calls`** — find the listener registered for `'event'` |

---

## When **not** to use two hops in Vitest

- If **only** the leaf’s behavior matters, **one** `vi.mock('leaf-package')` is simpler and matches how Node’s module cache propagates to all importers.
- If tests need **multiple conflicting** implementations of the middle module in one file, use **`vi.doMock` + `import()`** per case (advanced; prefer splitting files).

---

## Related

- **`packages/server/test/unit/browsers/cri-client.spec.ts`** — Vitest + single leaf mock; legacy used double `proxyquire`.
- **`.cursor/skills/server-unit-deep-mocks-vitest/SKILL.md`** — baseline `vi.mock` migration from mockery.
- **`.cursor/skills/server-unit-sinon-to-vitest-mocks/SKILL.md`** — Sinon → `vi`; mentions proxyquire only briefly; use **this** skill for chained module injection.
