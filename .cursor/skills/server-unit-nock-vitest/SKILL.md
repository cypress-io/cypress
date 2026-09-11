---
name: server-unit-nock-vitest
description: >-
  Migrates @packages/server unit tests that use nock for HTTP mocking from Mocha
  + global spec_helper nock setup to Vitest with explicit nock lifecycle (activate,
  disableNetConnect, enableNetConnect, cleanAll), env hygiene, and coordination with
  vi.spyOn / vi.mock. Use when porting *_spec files that call nock() or rely on
  global.nock from spec_helper.
---

# Nock + Vitest on `@packages/server`

## Reference migrations

| Spec | What it shows |
|------|----------------|
| [`create_instance.spec.ts`](packages/server/test/unit/cloud/api/create_instance.spec.ts) | **`nock(baseUrl).matchHeader(…).post(…).reply`**, **`.times`**, **`delayConnection`**, fake timers + **`vi.runAllTimersAsync`**, **`errors.warning`** stub to silence retry stdout |
| [`ensure_url.spec.ts`](packages/server/test/unit/util/ensure_url.spec.ts) | **No `spec_helper`**: same **activate / disableNetConnect / enableNetConnect(/localhost/) / cleanAll / enableNetConnect()** sequence as [`spec_helper`](packages/server/test/spec_helper.js); **`nock.enableNetConnect()`** with **no args** inside one test to allow all outbound (after global disable); **`vi.spyOn(connect|agent, …)`** next to nock; **`delete process.env.HTTP_PROXY`** in **`beforeEach`** when the SUT must take the non-proxy code path (legacy runs inherited clean env from spec_helper’s **`process.env` reset**) |

## Replacing global `spec_helper` nock behavior

[`spec_helper.js`](packages/server/test/spec_helper.js) (Mocha) does roughly:

| Hook | Behavior |
|------|----------|
| `beforeEach` | `nock.activate()` if inactive; `nock.disableNetConnect()`; `nock.enableNetConnect(/localhost/)` |
| `afterEach` | `nock.cleanAll()`; `nock.enableNetConnect()` |

**Vitest specs do not load `spec_helper`**, so each file that needs this must **inline the same hooks** (or a documented subset). Prefer **`beforeEach` / `afterEach`** on the outer `describe` that owns HTTP tests.

### Ordering with `vi.spyOn` / `vi.mock`

- **Spies on `@packages/network` (or other live modules)** run against the real module; register them in **`beforeEach`** for that test/describe, **`vi.restoreAllMocks()`** (or **`mockRestore`**) in **`afterEach`**.
- **Nock lifecycle** runs first at file/describe scope; **per-test** **`nock.enableNetConnect()`** (no argument = allow all) overrides the default “blocked except allowlist” policy — call it only in tests that need real TCP past nock (see [`ensure_url.spec.ts`](packages/server/test/unit/util/ensure_url.spec.ts) proxy case).
- **`vi.mock` for HTTP clients** is a different pattern (module substitution); combine with nock only if the SUT imports a client you still want to hit the network stack — prefer one strategy per test.

### Optional shared helper

Large files (**`api_spec.js`**, **`request_spec.js`**, **`cloud_request_spec.ts`**) can extract:

```ts
export function setupNockLikeSpecHelper () {
  if (!nock.isActive()) nock.activate()
  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)
}

export function teardownNockLikeSpecHelper () {
  nock.cleanAll()
  nock.enableNetConnect()
}
```

Import from a **test-only** module (e.g. `test/unit/helpers/nock_lifecycle.ts`) so lifecycle stays explicit and grepable.

## Process

1. **`import nock from 'nock'`** — do not rely on `global.nock`.
2. **Outer `beforeEach`**: activate nock if needed; restrict net (match legacy: block all then allow localhost if your SUT hits `http://localhost:…`).
3. **Define interceptors** in `beforeEach` (or nested `beforeEach`) with **`nock(baseUrl).matchHeader(…).post/get…`** then **`.reply()`** / **`.times()`** / **`.delayConnection()`** as before.
4. **Outer `afterEach`**: **`nock.cleanAll()`** and **`nock.enableNetConnect()`** so the next test or file does not inherit pending mocks.
5. **Chai → Vitest**: **`.to.deep.eq`** → **`toEqual`**; promise assertions → **`await expect(promise).resolves` / `rejects`** or **`try`/`catch`** where you inspect **`AggregateError`**.
6. **App state**: if the spec called **`api.setPreflightResult`** (or similar), call **`api.resetPreflightResult()`** in **`afterEach`** so cases do not leak.
7. **`process.env`**: if legacy tests assumed **`spec_helper`’s** **`afterEach` `process.env` reset**, replicate or delete keys (e.g. **`HTTP_PROXY`**) so the SUT does not accidentally take the proxy branch ([`ensure_url.spec.ts`](packages/server/test/unit/util/ensure_url.spec.ts)).

## Vitest fake timers (with nock)

See [Mocking timers](https://vitest.dev/guide/mocking/timers) and [`vi.runAllTimersAsync`](https://vitest.dev/api/vi#vi-runalltimersasync).

- **`vi.useFakeTimers()`** in **`beforeEach`**, **`vi.useRealTimers()`** in **`afterEach`** for suites that should not wait on real wall-clock delays.
- For async SUTs (axios, **`asyncRetry`**, Bluebird **`retryWithBackoff`**), start the **`Promise`**, then loop **`await vi.runAllTimersAsync()`** until the promise settles (same pattern as [`create_instance.spec.ts`](packages/server/test/unit/cloud/api/create_instance.spec.ts) **`runAllTimersUntilSettled`**).
- **Axios + nock `delayConnection`**: a single huge **`advanceTimersByTimeAsync(N)`** can fire the delayed connection before the shorter request timeout, consuming the wrong mock. Prefer **`runAllTimersAsync`** in rounds, or use **real timers** for that case only (documented in the reference spec).

## Notes

- **Retries / timeouts**: tests that use **`delayConnection`** may run **>1s** without fake timers; keep Vitest **`testTimeout`** default (10s in [`vitest.config.ts`](packages/server/vitest.config.ts)) or set **`it(..., { timeout: n })`** if needed.
- **`process.env`**: restore keys (e.g. **`API_RETRY_INTERVALS`**) in **`afterEach`** the same way as legacy Mocha; **`vi.stubEnv`** is optional when only one key toggles.
- Large suites (**`api_spec.js`**, **`request_spec.js`**) follow the same lifecycle; extract shared **`setupNock()`** / **`teardownNock()`** helpers only if it reduces duplication without hiding behavior.

## Related

- [Migrating off `spec_helper`](../server-unit-migrate-from-spec-helper/SKILL.md) — nock row in the audit table
- [Server unit Mocha → Vitest](../server-unit-mocha-to-vitest/SKILL.md)
