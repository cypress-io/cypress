---
name: server-unit-sinon-to-vitest-mocks
description: >-
  Maps sinon stubs/spies/sandboxes to Vitest vi.fn, vi.spyOn, vi.mock, and mock
  call inspection for @packages/server unit tests. Use when migrating specs that
  mock dependencies with sinon, replacing sinon-chai with Vitest expect, or when the
  user asks about sinon to vitest mocks.
---

# Sinon mocks → Vitest (`vi`) on `@packages/server`

## Reference migrations

1. [`packages/server/test/unit/cloud/api/transform_error.spec.ts`](packages/server/test/unit/cloud/api/transform_error.spec.ts) — builds a **partial Axios mock**, passes it to `installErrorTransform`, then reads the **error handler** from the **`interceptors.response.use`** registration. Previously used **`sinon.spy()`** on `use`; now uses **`vi.fn()`** and **`responseUse.mock.calls[0]`** instead of `sinonSpy.firstCall.args`.

2. [`packages/server/test/unit/cloud/network/fetch.spec.ts`](packages/server/test/unit/cloud/network/fetch.spec.ts) — replaces **`proxyquire.noCallThru`** on **`cross-fetch`** with **`vi.mock`**: **`importOriginal`** spreads real exports (e.g. **`Response`**) while **`default`** is a **`vi.fn()`** stub.

## Spies and stubs (object you control)

| Sinon | Vitest |
|-------|--------|
| `sinon.spy()` | `vi.fn()` |
| `sinon.spy(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| `spy.firstCall.args` / `.nthCall` | `spy.mock.calls[0]` / `mock.calls[n]` |
| `expect(spy).to.have.been.calledWith(x)` | `expect(spy).toHaveBeenCalledWith(x)` |
| `sinon.stub().resolves(v)` | `vi.fn().mockResolvedValue(v)` or chain `mockResolvedValueOnce` |
| `sinon.stub().rejects(e)` | `vi.fn().mockRejectedValue(e)` |
| `sinon.createStubInstance(Class)` | Plain object with `vi.fn()` per method + cast to interface (see [`remote_states.spec.ts`](packages/server/test/unit/remote_states.spec.ts)) |

## Restore / isolation

| Sinon | Vitest |
|-------|--------|
| `sinon.restore()` in `afterEach` | `vi.restoreAllMocks()` |
| `sinon.createSandbox()` | Prefer `vi.fn`/`vi.spyOn` + `vi.restoreAllMocks()`; or `vi.isolateModules` for module scope |

## Fake timers

| Sinon | Vitest |
|-------|--------|
| `sinon.useFakeTimers()` | `vi.useFakeTimers()` |
| `clock.tickAsync(ms)` | `vi.advanceTimersByTimeAsync(ms)` |
| `clock.runAllAsync()` | `vi.runAllTimersAsync()` |
| `sinon.restore()` after timers | `vi.useRealTimers()` in `afterEach` |

See [`async_retry.spec.ts`](packages/server/test/unit/util/async_retry.spec.ts) and [`stream_activity_monitor.spec.ts`](packages/server/test/unit/cloud/upload/stream_activity_monitor.spec.ts). Full workflow: [server-unit-fake-timers-vitest](../server-unit-fake-timers-vitest/SKILL.md).

## Mockery (many `registerMock` calls)

Legacy specs that disabled **global mockery** to avoid poisoning other Mocha tests should be rewritten with **`vi.mock`** per dependency — no global teardown. **`importOriginal`** keeps real exports when only one symbol is stubbed. See [server-unit-deep-mocks-vitest](../server-unit-deep-mocks-vitest/SKILL.md) and [`put_protocol_artifact.spec.ts`](packages/server/test/unit/cloud/api/put_protocol_artifact.spec.ts).

## Module substitution (dependency injection)

| Pattern | Approach |
|---------|----------|
| **`proxyquire`**, `mockery`, `require` hijack | Prefer **`vi.mock('module/path', factory)`** + `import()` after mocks, or refactor SUT to accept injectable deps (best). Example: [`fetch.spec.ts`](packages/server/test/unit/cloud/network/fetch.spec.ts) mocks **`cross-fetch`**’s **default** with **`vi.hoisted`**, keeps **`Response`** via **`importOriginal`** (tests still **`import { Response } from 'cross-fetch'`**). |
| Pass a **fake object** into the SUT (e.g. partial `AxiosInstance`) | Build a literal with **`vi.fn()`** where the implementation registers callbacks — no `vi.mock` needed. |

## Assertions (drop sinon-chai)

Use Vitest **`expect`** only; do not add **`@cypress/sinon-chai`**. Map `.to.have.been.called*` → `toHaveBeenCalled*`, `toHaveBeenCalledWith`, etc.

## Promises (`sinon.usingPromise` / Bluebird)

Legacy Mocha + **`spec_helper`** calls **`sinon.usingPromise(Promise)`** with **Bluebird** so Sinon’s async helpers align with that library. **Vitest does not use this** — **`vi.fn`** mocks resolve to **native `Promise`**.

For most specs, **`mockResolvedValue` / `mockRejectedValue`** + **`await`** is enough. If the **SUT** still chains **Bluebird-only** methods on a value your mock returns, the mock must return a compatible thenable (often **Bluebird** from **`mockImplementation`**) — see [server-unit-migrate-from-spec-helper](../server-unit-migrate-from-spec-helper/SKILL.md) (**Bluebird / long-stack / Sinon**) and [server-unit-deep-mocks-vitest](../server-unit-deep-mocks-vitest/SKILL.md).

## Related

- [server-unit-deep-mocks-vitest](../server-unit-deep-mocks-vitest/SKILL.md)
- [server-unit-fake-timers-vitest](../server-unit-fake-timers-vitest/SKILL.md)
- [server-unit-mocha-to-vitest](../server-unit-mocha-to-vitest/SKILL.md)
- [server-unit-js-spec-to-ts-vitest](../server-unit-js-spec-to-ts-vitest/SKILL.md)
- [server-unit-migrate-from-spec-helper](../server-unit-migrate-from-spec-helper/SKILL.md)
