# Spike — Run Lifecycle Signal for `cypress inspect` (Phase 2)

**Status:** Resolved — 2026-04-22 (second attempt)
**Resolves:** `../design.md` §9.1, `./bugs/bug-001-spec-list-during-active-spec-run.md`
**Date:** 2026-04-22

## Context

`runSpec(specPath)` in `packages/data-context/src/actions/ProjectActions.ts` is
fire-and-forget. Phase 2 needs a run-lifecycle signal so that
`inspectSnapshot.activeRun`, `appRoute = SPEC_RUNNING`, and
`cypress inspect run --wait` can function.

The first attempt (reverted) piggybacked on the Mocha reporter path
(`onMocha` in `packages/server/lib/project-base.ts`). It failed because:

1. `onMocha` bails at the top when there is no `reporterInstance`, and
   `reporterInstance` is only constructed when `config.report === true` —
   only true for `cypress run` (`packages/server/lib/modes/index.ts:15-24`).
2. The driver only forwards `mocha start` / `mocha end` over the runner
   socket when `isTextTerminal` is true
   (`packages/driver/src/cypress.ts:520-550`). In `cypress open` the socket
   event never fires, so the server-side handler is unreachable.

## Signal source (open-mode compatible)

The driver unconditionally emits `Cypress.emit('run:start')` and
`Cypress.emit('run:end')` at `packages/driver/src/cypress.ts:522` and
`:543`. These are **internal** — they are not part of `cli/types/cypress.d.ts`
and have no `Cypress.on` overloads in the public API. Only first-party
packages listen (driver sessions, app event-manager, reporter, iframe-model).

That means we can:

1. Extend `this.emit('run:end')` to `this.emit('run:end', args[0])` — the
   aggregated Mocha stats payload already sitting one line above in the
   `maybeEmitCypressInCypress` call. Safe because every in-tree listener
   uses `() => {…}` (no signature collision).
2. Listen to both events in
   `packages/app/src/runner/event-manager.ts` (we already do, for memory
   profiling) and forward them over the runner socket via `this.ws.emit(...)`,
   gated on `!Cypress.config('isTextTerminal')`. This is the inverse of the
   driver's `mocha` gate, so run-mode traffic continues to flow through the
   authoritative reporter path while open-mode flows through this new bridge.

## Transport

A new socket event `run:lifecycle` on the existing runner (`/`) namespace.
The payload is a discriminated object:

```ts
{ phase: 'start', specPath?: string, startedAt?: string }
{ phase: 'end',   specPath?: string, endedAt?: string, stats?: { passes, failures, tests, duration } | null }
```

Server-side, `packages/server/lib/socket-base.ts` adds a `socket.on('run:lifecycle', ...)`
handler right next to the existing `mocha` handler (line 360). It:

- Skips when `this.inRunMode` is true (defense-in-depth — run-mode state is
  owned by the reporter path).
- Resolves `getCtx()` and dispatches to
  `ctx.actions.runState.recordStart({...})` /
  `ctx.actions.runState.recordEnd({...})`.

## data-context wiring

| Location | Change |
|---|---|
| `packages/data-context/src/data/coreDataShape.ts` | Add `activeRun: ActiveRunShape \| null` to `CoreDataShape` + initializer. |
| `packages/data-context/src/actions/RunStateActions.ts` | **New.** `recordLaunching`, `recordStart`, `recordEnd`, `clear`. Each mutates `coreData.activeRun` and fires `ctx.emitter.runStateChange()`. |
| `packages/data-context/src/actions/DataEmitterActions.ts` | Add `runStateChange()` emitter method. |
| `packages/data-context/src/DataActions.ts` | Instantiate and expose `runState` action. |
| `packages/data-context/src/actions/ProjectActions.ts` | Call `ctx.actions.runState.recordLaunching(spec.absolute)` just before `this.api.runSpec(spec)` so CLI `--wait` never races past a terminal state from the previous run. |

Why `recordLaunching` exists: the CLI `--wait` polls `activeRun.status`.
Without eager seeding, there is a window between "mutation returned" and
"driver fired run:start" where `activeRun` could still reflect the previous
run's `finished` state, tricking the poller into exiting 0 immediately.
Seeding `status: 'starting'` with the new `specPath` closes that gap; the
driver's `run:start` bridge then flips it to `running`.

## GraphQL surface

`gql-InspectSnapshot.ts`:

- `deriveAppRoute` gains a `SPEC_RUNNING` branch gated on
  `coreData.activeRun?.status === 'running'`. Terminal states
  (`finished` / `errored`) fall through to `SPEC_LIST` — matching what the
  UI actually shows once a spec finishes.
- `ActiveRun` type grows `endedAt` (nullable) and `stats` (nullable
  `ActiveRunStats { passes, failures, tests, duration }`).
- `activeRun` resolver returns `ctx.coreData.activeRun` instead of `null`.

## CLI

`cli/lib/tasks/inspect.ts`:

- `run` subcommand gains `--wait` / `--timeout <ms>` (default 120_000 ms).
- When `--wait` is set, poll `inspectSnapshot.activeRun` every 500 ms.
  Terminal condition: `specPath === launched.absolute && status ∈ { finished, errored }`.
- Exit codes: `0` on `finished`, `1` on `errored`, `124` on timeout.
- `inspect status` text output now prints
  `Active run: <basename> (<status>) — N passed, M failed`.

`cli/lib/cli.ts`: register `--wait` at the umbrella `inspect` command.
`--timeout` already existed for `switch`; the description is updated to note
it also applies to `run --wait`.

## Why this works where the first attempt didn't

| Concern | Mocha-reporter path (reverted) | This approach |
|---|---|---|
| Fires in open mode | ❌ Driver gated on `isTextTerminal` | ✅ `Cypress.emit('run:start'/'run:end')` unconditional |
| Reaches server | ❌ `reporterInstance` only in run mode | ✅ `this.ws.emit('run:lifecycle')` from app layer |
| Stats available | ❌ Run mode only | ✅ `args[0]` at `runner:end` is the Mocha stats object |

## Open issues & follow-ups

1. **Stats fidelity.** The `duration` field on the Mocha stats payload is
   wall-clock per the reporter conventions; we pass it through as-is.
   Anything finer (per-test timing) belongs in a future `activeRun.tests`
   array — not scoped here.
2. **Crash mid-run.** If Electron dies while status is `running`,
   `coreData.activeRun` is lost with the process. Descriptor-file cleanup
   (via `process.on('exit')`) + `inspect list` liveness pruning already
   guarantee the CLI can't poll a dead process.
3. **Interactive run events.** Users with `experimentalInteractiveRunEvents: true`
   still get the Mocha reporter path during open mode. We skip the
   `run:lifecycle` forward *only* when the driver-side `isTextTerminal` is
   true — experimental interactive events do not flip that flag, so we still
   emit. This is intentional: experimental path doesn't touch `activeRun`.
