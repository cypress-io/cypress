# BUG-001 — `SPEC_LIST` during active spec run

**Status:** ✅ Resolved 2026-04-22 — second Phase 2 attempt (see `../spike-run-lifecycle.md`) routes run lifecycle through `Cypress.emit('run:start'/'run:end')` → app `event-manager.ts` → `socket.on('run:lifecycle')` → `RunStateActions`. Verified: `deriveAppRoute` now returns `SPEC_RUNNING` while `activeRun.status === 'running'`, and `inspectSnapshot.activeRun` carries `{ specPath, status, stats }`.
**Severity:** Medium (misleading state, not a crash)
**Affects:** Phase 0+
**Reported:** 2026-04-22

## Observed

With a `cypress open` instance running Kitchen Sink in e2e mode, after launching a spec via either the GUI or `cypress inspect run todo.cy.js`:

```
$ cypress inspect status
Project:        /Users/.../cypress-example-kitchensink
Testing type:   e2e
Browser:        chrome (open)
App route:      SPEC_LIST          # ← wrong, the spec is running
Specs:          477
Active run:     —                  # ← also wrong
```

JSON form shows the same values: `"appRoute": "SPEC_LIST"`, `"activeRun": null`.

## Expected

While a spec is executing, `appRoute` should be `SPEC_RUNNING` and `activeRun` should be an object describing the spec (path, startedAt, status).

## Root cause

Two intentional Phase 0 shortcuts, called out in the design doc (§4.3, §9.1) but not visible to end users:

1. `packages/data-context/graphql/schemaTypes/objectTypes/gql-InspectSnapshot.ts:27-45` — `deriveAppRoute` has no branch that returns `SPEC_RUNNING`. Once `currentProject`, `currentTestingType`, and `activeBrowser` are all set, it returns `SPEC_LIST` unconditionally.
2. Same file, line 112 — `activeRun` resolver returns `null` unconditionally.

The `SPEC_RUNNING` enum member is declared in `gql-AppRoute.ts` but currently unreachable. The `ActiveRun` object type exists but is never populated.

## Why this was deferred

Design doc §9.1 — "Run completion signal" — flags that the data-context currently has no GraphQL field or event for "a run started / ended / produced this outcome." `runSpec` is fire-and-forget. Wiring this up requires either a new emitter piggybacking on the Reporter's `run:end` / `runner:end-run` socket events, or deriving state from the existing `/data-context` socket.io namespace. The doc recommends a spike before committing to the `--wait` UX.

## Phase 2 attempt (reverted 2026-04-22)

Phase 2 added `coreData.activeRun`, `RunStateActions.recordStart/recordEnd`, a `SPEC_RUNNING` branch on `deriveAppRoute`, and the `--wait` CLI flag, with lifecycle driven by `onMocha` in `packages/server/lib/project-base.ts`.

It didn't work in open mode because:

1. `onMocha` bails at the top when there is no `reporterInstance`, and `reporterInstance` is only initialized when `config.report === true` — set only for `cypress run` (`packages/server/lib/modes/index.ts:15-24`).
2. The driver itself only forwards `mocha start` / `mocha end` over the socket when `isTextTerminal` is true (`packages/driver/src/cypress.ts:520-550`). So in open mode the socket event never fires and the server-side handler is never invoked.

## Fix (landed)

The second attempt avoids the Mocha reporter path entirely:

1. `packages/driver/src/cypress.ts:543` — pass aggregated stats through `run:end` (`this.emit('run:end', args[0])`). Internal-only API, safe for all in-tree listeners.
2. `packages/app/src/runner/event-manager.ts:661,668` — forward `run:start` / `run:end` over the runner socket as `run:lifecycle`, gated on `!Cypress.config('isTextTerminal')`.
3. `packages/server/lib/socket-base.ts:360` — new `socket.on('run:lifecycle', …)` that routes into `ctx.actions.runState.recordStart/recordEnd`.
4. `packages/data-context/src/actions/RunStateActions.ts` — new action class owning `coreData.activeRun` lifecycle; emits `runStateChange`.
5. `packages/data-context/graphql/schemaTypes/objectTypes/gql-InspectSnapshot.ts` — `SPEC_RUNNING` branch in `deriveAppRoute`; `activeRun` resolver returns `ctx.coreData.activeRun`; `ActiveRun` type grows `endedAt` + `stats`.
6. `cli/lib/tasks/inspect.ts` / `cli/lib/cli.ts` — `cypress inspect run <spec> --wait [--timeout ms]` polls the snapshot; exits `0`/`1`/`124`.
7. `packages/data-context/src/actions/ProjectActions.ts:640` — call `recordLaunching(spec.absolute)` synchronously on mutation dispatch so `--wait` never observes a stale terminal state from a previous run.

See `../spike-run-lifecycle.md` for the full spike writeup.
