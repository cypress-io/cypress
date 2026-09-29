---
name: server-mocha-to-vitest
description: >-
  Converts one @packages/server unit spec from mocha (test/unit/**/*_spec.ts) to
  vitest (*.spec.ts) without changing what the test proves. Use when migrating a
  server unit spec, when a converted spec passes but its mocks may not be
  intercepting, or when the user mentions spec_helper, mockery, proxyquire,
  sinon, snap-shot-it, or the mocha/vitest split in packages/server.
---

# Migrate a `@packages/server` unit spec from mocha to vitest

Scope: `packages/server/test/unit` only. Integration and performance suites stay on mocha.

This skill lists the things that go wrong *silently*: a converted spec that is green while
its mocks never engaged, or that asserts less than the mocha original did. Plain API
mapping (`sinon.stub` to `vi.fn`, `to.deep.equal` to `toEqual`, `context` to `describe`)
is not covered; you already know it. Parent issue: cypress-io/cypress#34846.

## The contract

- `*_spec.ts` runs on mocha via `test/scripts/run.js`. `*.spec.ts` runs on vitest via
  `packages/server/vitest.config.ts`. `yarn test-unit` runs both.
- Convert by `git mv foo_spec.ts foo.spec.ts` and rewriting the file. The mocha file must be
  gone when you finish. Never leave a file half-converted: every `it` in the original is
  ported, or the file is not touched at all.
- The new file imports from `vitest` explicitly and uses nothing else for test plumbing:
  no `spec_helper`, `mockery`, `proxyquire`, `sinon`, `chai` or its plugins, `snap-shot-it`,
  `mocked-env`. Keep `nock`, `supertest`, `express`, `lodash`, `bluebird` where the original
  used them for real work.
- Never weaken a test: no `.skip`, no dropped or loosened assertion, no `vitest -u` to make a
  snapshot agree. If a test cannot be made green, leave it failing and say why in the PR.
- Do not touch `.circleci/`, `vitest.config.ts`, or `cloud/environment_spec.ts`. The last one
  is named in four CI workflows and migrates in its own human PR.
- Specs never connect to a non-loopback address. Tests must pass on a sandboxed host.

## `spec_helper.js` is not ported. Inline what the file needs.

`test/spec_helper.js` installs root hooks for the whole mocha process. A mocha spec depends
on them even when it never imports `spec_helper`, because some other spec in the same run
did. Under vitest each file is on its own, so read `spec_helper.js` and inline only the
hooks this file actually relies on:

| Original behavior | Inline as |
|---|---|
| `setCtx(makeDataContext({}))` before, `getCtx()._reset()` + `clearCtx()` after | only if the SUT calls `getCtx()`; see the GraphQL note below before using `makeDataContext` |
| `nock.disableNetConnect()` + `nock.enableNetConnect(/localhost/)` before, `nock.cleanAll()` + `nock.enableNetConnect()` after | any spec that uses `nock`, even when the original had no hooks (`cloud/api/create_instance.spec.ts`) |
| `cache.remove()` before each | specs touching `lib/cache` |
| `GracefulExit.resetForTesting()` | specs that start servers; it is a silent no-op unless `globalThis.IS_TEST = true` is set first (`server-base.spec.ts`) |
| `process.env` cloned and restored after each | specs that set env; `vi.stubEnv` + `vi.unstubAllEnvs()` also works |
| `mockElectron(mockery)` | `vi.mock('electron', ...)` only if the SUT's import graph reaches `electron`; most do not |
| `sinon.restore()` after each | `vi.restoreAllMocks()`, with the caveat below |

A spec with no hooks is fine. `automation/commands/key_press.spec.ts` needs none.

## Mocks that load the real module without telling you

**Prove each mock intercepts.** Add a temporary `throw` or call count
to the factory, run the spec, then remove it. A green run alone proves nothing.

**`vi.mock` specifiers must be the string the importer wrote**, resolved from your spec's
location for relative paths. `vi.mock('../../../../lib/cloud/network/fetch')` from the spec
matches the SUT's `import ... from '../network/fetch'` because both resolve to the same file.
A path that resolves elsewhere is ignored and the real module loads.

**A bare `require()` inside the SUT is never intercepted by `vi.mock`**, with or without
`server.deps.inline`. vite-node hands transformed modules a plain node `require`, and
vitest's mocker only hooks ESM imports. Seed the CJS cache instead, which is what mockery did:

```ts
const requireCjs = createRequire(import.meta.url)
const morganPath = requireCjs.resolve('morgan')

requireCjs.cache[morganPath] = { exports: morganMockFactory } as NodeModule
// afterAll / afterEach: delete requireCjs.cache[morganPath]
```

The `exports` value is exactly what the SUT's `require()` returns, so a callable
`module.exports = function` package (`morgan`, the `@cypress/*` preprocessors) is mocked with
the function itself. Examples: `plugins/child/run_plugins.spec.ts`, `server-base.spec.ts`.

**Partial mocks of node builtins must override `default` too.** A SUT that does
`import fs from 'fs'` reads `fs.createReadStream` off the default export. Spread the actual
module into both the named exports and a rebuilt `default`, or the real function runs:

```ts
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()

  return { ...actual, createReadStream: stub, default: { ...actual, createReadStream: stub } }
})
```

Example: `cloud/api/put_protocol_artifact.spec.ts`.

**A two-hop `proxyquire` chain usually collapses to one `vi.mock` of the leaf.** The second
hop existed because proxyquire cannot reach a transitive dependency. `vi.mock` applies to the
whole module graph, so mock `chrome-remote-interface` once with `vi.hoisted` state and import
the SUT statically. Only reach for `vi.resetModules()` plus a dynamic import when the SUT
holds module-level mutable state that mocha reset by re-requiring. Example:
`browsers/cri-client.spec.ts`.

**`vi.spyOn` on an ESM namespace import does work** for `lib/*.ts` modules, because vite's
SSR transform rewrites named imports to live property reads. `vi.spyOn(ensureUrl, 'isListening')`
patches what `server-base.ts` sees. It keeps the real implementation unless you add
`.mockImplementation`, which `sinon.stub` did not.

## Assertions that flip meaning

**sinon `calledWith` is a prefix match. vitest `toHaveBeenCalledWith` is exact-arity.**
`client.send('Network.enable', opts, sessionId)` satisfies `calledWith('Network.enable')` but
fails `toHaveBeenCalledWith('Network.enable')`. Worse, `not.toHaveBeenCalledWith('Fetch.disable')`
passes vacuously against a 3-argument call. Either assert the full argument list or filter
`mock.calls` by leading arguments. Examples: `expectCalledWith` in `browsers/cri-client.spec.ts`,
`callsFor` in `server-base.spec.ts`.

**`sinon.stub().withArgs(x)` returns the filtered stub.** When the original assigned that return
value, the "filter" never gated anything and the stub answered every call. Porting it as an
argument-conditional mock returns `undefined` for the real calls. Read what the mocha stub
actually did before translating it.

**`vi.restoreAllMocks()` wipes `vi.fn().mockReturnValue(...)`.** `sinon.restore()` left
`.returns()` behavior on plain stubs alone. Shared fixtures need `vi.fn(() => value)` so the
implementation survives restore.

**Bluebird.** Server code still chains `.return()`, `.spread()`, `.tap()` on values it awaits.
Where the SUT chains Bluebird methods on a mocked return, `mockResolvedValue` hands back a
native promise and the SUT throws a confusing `not a function`. Return `Bluebird.resolve(...)`
from that mock. Check the current SUT first; many call sites are plain `await` now and native
promises are fine (`ensureUrl.isListening` in `server-base.ts` is one).

**The transpiler is visible in stringified functions.** A test that asserts on
`fn.toString()` of a handler defined in the spec reads esbuild's output under vitest, not
ts-node's. Keep the assertion exact and update the literal; do not normalize it away.

**Decomposed Unicode literals get normalized by editors.** `'é'` as `e` + U+0301 becomes
U+00E9 on save. Byte-compare string literals against `git show HEAD:<mocha file>` when a spec
contains combining characters (`automation/commands/key_press.spec.ts`).

## GraphQL, nock, timers

**Importing `lib/server-base`, `lib/routes`, or `lib/makeDataContext` builds the GraphQL
schema a second time** in the worker and `graphql` rejects the duplicate realm. Mock
`@packages/data-context/graphql/makeGraphQLServer` with `graphqlWS` and `graphQLHTTP` stubs.
Mocking that alone is not enough if you also call `makeDataContext`; use a minimal
`DataContext` object carrying only the members the SUT touches (`routes.spec.ts`).

**nock `delayConnection` with one large `advanceTimersByTimeAsync`** fires the delayed
connection before the request timeout and consumes the wrong interceptor. Use
`vi.runAllTimersAsync()` in rounds or step the clock in small increments. Also note that
chaining `delayConnection(5000)` then `delayConnection(0)` on the same interceptor mutates one
object, so both replies get delay 0; port that verbatim rather than "fixing" it.

**Fake timers:** `vi.useFakeTimers()` / `vi.useRealTimers()` in hooks. `clock.tickAsync(n)`
becomes `await vi.advanceTimersByTimeAsync(n)`. A non-async helper that the original `await`ed
must stay non-async, or you add a microtask and change what mid-flight assertions observe.

## Source edits for testability

Allowed only when obvious on sight: an optional parameter with a default that preserves
behavior, exporting a function that already exists, extracting an inline expression into a
named pure function in the same file. Not allowed: changing control flow, changing a signature
callers depend on, touching more than one `lib/` file per batch, or anything you cannot justify
in one sentence. Every source edit gets its own heading in the PR body. When in doubt, skip the
spec; it stays in the pool.

## Verify

```bash
yarn workspace @packages/server test-unit-vitest -- test/unit/<dir>/foo.spec.ts
yarn workspace @packages/server test-unit          # both runners, from a real terminal
yarn lint --scope @packages/server
yarn workspace @packages/server check-ts
```

Run the converted spec at least twice. Run `test-unit` from a terminal, not with stdout piped
to a file: `util/tty_spec` needs `process.stdout.getWindowSize`, which only exists on a TTY,
and fails on develop too when piped. Count `it(` in the mocha original and in the vitest file;
they must match (loops that generate tests expand at runtime, so compare the static count).

## Style

Single quotes, no semicolons, 2-space indent, trailing commas, blank line before `return`,
`import type` for type-only imports, no `console`. Prefer no comment; when one is needed, say
why in one or two lines and describe the present code, never how it used to work.
