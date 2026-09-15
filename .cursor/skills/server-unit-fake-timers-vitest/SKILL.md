---
name: server-unit-fake-timers-vitest
description: >-
  Migrates @packages/server unit tests that use sinon fake timers (useFakeTimers,
  clock.tickAsync) to Vitest vi.useFakeTimers, advanceTimersByTimeAsync, useRealTimers.
  Covers replacing spec_helper’s sinon._clock / patched restore — not needed in Vitest.
  Use when porting specs with timeouts, intervals, or async timer advancement.
---

# Fake timers (sinon → Vitest) on `@packages/server`

## Reference migrations

1. **[`packages/server/test/unit/cloud/upload/stream_activity_monitor.spec.ts`](packages/server/test/unit/cloud/upload/stream_activity_monitor.spec.ts)** — **`vi.useFakeTimers()`** in **`beforeEach`**, **`vi.useRealTimers()`** in **`afterEach`**, **`await vi.advanceTimersByTimeAsync(ms)`** where sinon used **`clock.tickAsync(ms)`**. Streams + **`Readable.fromWeb`**; no **`spec_helper`**.

2. **[`packages/server/test/unit/util/async_retry.spec.ts`](packages/server/test/unit/util/async_retry.spec.ts)** — **`vi.runAllTimersAsync()`**, **`advanceTimersByTimeAsync`**, **`vi.useRealTimers()`** after async work.

## Mapping

| Sinon | Vitest |
|-------|--------|
| `sinon.useFakeTimers()` | `vi.useFakeTimers()` |
| `clock.tickAsync(ms)` | `await vi.advanceTimersByTimeAsync(ms)` |
| `clock.runAllAsync()` | `await vi.runAllTimersAsync()` |
| `clock.restore()` | `vi.useRealTimers()` |

## `spec_helper` / `sinon._clock` — Mocha-only; **not** required in Vitest

[`packages/server/test/spec_helper.js`](packages/server/test/spec_helper.js) wraps **`sinon.useFakeTimers`** and **`sinon.restore`**:

1. **`sinon._clock`** — After **`sinon.useFakeTimers()`**, the real clock is stored on **`sinon._clock`**. Suites often call **`useFakeTimers()`** in **`beforeEach`** without keeping the return value; **`_clock`** gives a global handle so a test can call **`sinon._clock.restore()`** mid-file (e.g. legacy **`memory_spec.ts`**) to bring back **real** **`setTimeout` / `clearTimeout`** before stubbing them. Fake timers replace those globals, so the clock must be restored first.

2. **Patched `sinon.restore()`** — Restores **`sinon._clock`** (if set) **before** Sinon’s original **`restore`**, so teardown order is predictable and the fake clock does not leak.

**Vitest does not need any of this.** Migrated specs do not load **`spec_helper`**. There is no **`vi._clock`** pattern to replicate:

- Timer mode is controlled only by **`vi.useFakeTimers()`** / **`vi.useRealTimers()`**.
- To mirror **`sinon._clock.restore()`** for one test or block: use a **nested `describe`** with **`beforeEach(() => { vi.useRealTimers() })`** and **`afterEach(() => { vi.useFakeTimers() })`** (if the parent suite uses fakes), **or** call **`vi.useRealTimers()`** at the start of that **`it`** and **`vi.useFakeTimers()`** before returning (symmetric cleanup in **`try`/`finally`** if needed).
- Suite teardown: **`vi.useRealTimers()`** in **`afterEach`** (plus **`vi.restoreAllMocks()`** when using spies) is enough — no custom global **`restore`** that pokes at a clock field.

## Process (preserve this order)

1. **`beforeEach`**: call **`vi.useFakeTimers()`** (or once per suite if tests do not share state — prefer per-test isolation).
2. Advance time with **`await vi.advanceTimersByTimeAsync(ms)`** (or **`runAllTimersAsync`**) inside **`async`** tests — do not forget **`await`**.
3. **`afterEach`**: call **`vi.useRealTimers()`** so later tests and other packages are not stuck on fake time.

## Assertions

Use Vitest **`expect`** with **`toBe`**, **`toBeUndefined`**, **`toBeInstanceOf`** — not Chai + sinon-chai.

## Gotchas

- **`it((done) => …)`** is invalid in Vitest 3 — use **`async`/`await`** or **`return new Promise`**.
- If a test stubs **`global.setTimeout`** / **`clearTimeout`**, run that test under **real** timers (**`vi.useRealTimers()`** in a nested **`describe`** or at the start of the **`it`**). Do **not** introduce a Vitest equivalent of **`sinon._clock`** — see **`spec_helper / sinon._clock`** above.
- For **`@ts-expect-error`** on **`Readable.fromWeb`**, keep a one-line comment if the repo’s **`tsconfig`** still flags it.

## Related

- [server-unit-sinon-to-vitest-mocks](../server-unit-sinon-to-vitest-mocks/SKILL.md) — sinon table including timers
- [server-unit-mocha-to-vitest](../server-unit-mocha-to-vitest/SKILL.md)
- [server-unit-migrate-from-spec-helper](../server-unit-migrate-from-spec-helper/SKILL.md) — dropping **`spec_helper`** (including global **`sinon`** / **`sinon._clock`**)

**Legacy reference (Mocha):** [`packages/server/test/unit/browsers/memory/memory_spec.ts`](packages/server/test/unit/browsers/memory/memory_spec.ts) — **`sinon._clock.restore()`** before stubbing **`setTimeout`**; migrate with nested **`useRealTimers`** as above.
