# Plan: `cypress tap status`

Implementation plan for a new tap CLI command that reports **where a running
Cypress instance is in its lifecycle** — for polling and "where am I?" checks.

Branch: `davidr/feat/tap-cli/status-command`, stacked on
`davidr/feat/tap-cli/command-implementations`.

---

## 1. Goal & UX

`cypress tap status` answers one question: *what is this Cypress instance doing
right now?* It must report at every lifecycle stage, **including stages where no
browser is attached and where Cypress is not running at all** — that is what
makes it different from every existing per-instance command.

```
$ cypress tap status
{
  "pid": 22023,
  "projectRoot": "/Users/emily/dev/cypress/packages/reporter",
  "status": "running",
  "testingType": "e2e",
  "browserAttached": true,
  "totalSpecs": 14,
  "spec": "cypress/e2e/login.cy.ts",
  "results": { "passed": 3, "failed": 1, "pending": 0, "skipped": 0 },
  "totalTests": 8
}
```

Lifecycle stages it must distinguish:

| Stage | `status` value | Key fields available |
|---|---|---|
| Cypress not running / record stale | `not connected` | (none — nothing is live) |
| Running, no browser attached | `browser not selected` | pid, projectRoot, testingType |
| Browser attached, on spec list | `spec not selected` | + browserAttached:true, totalSpecs |
| On a spec | `running` \| `passed` \| `failed` | + spec, results, totalTests |

> **Not in scope:** the "testing type not selected" stage. Cypress does not
> support reaching a live-but-no-testing-type state for us to report yet, so
> `status` does not gate on it. `testingType` is still reported as a passthrough
> field (always `e2e` or `component` in practice); we never branch on it being
> `null`.

---

## 2. The central design decision

### Two existing classes of tap command

The stack already establishes two patterns in `cli/lib/exec/tap.ts`:

1. **Schema-discovered binding commands** (`health`, `specs`, `run`, `tests`,
   `commands`). The CLI calls `resolveRunner()` → `withTapSession()` and
   dispatches over CDP. **`resolveRunner()` throws `NO_BROWSER_ATTACHED` when no
   browser is up** (`cli/lib/runner-discovery/index.ts:166`), so these commands
   *cannot* run before a browser exists. They require a `ReadyRunnerState`.

2. **The CLI-native command** (`instances`). It short-circuits *before* any
   session (`tap.ts` — `if (command === 'instances')`), reads the discovery
   layer via `listLiveRunners()`, and reports `pid / projectRoot / serverPort /
   browserAttached` with **no binding and no browser required**.

### Why `status` cannot be an ordinary binding command

`status` must report `not connected` and `browser not selected` — stages where
the binding is unreachable (no runner page, often no browser). A pure
schema-discovered command routed through `resolveRunner()` would throw before it
could ever report those stages.

### Decision: `status` is a CLI-native command with an optional binding enrichment

Model `status` on `instances`: reserve it as a CLI-native command that
short-circuits before `resolveRunner()`. It derives the **pre-browser**
lifecycle entirely from the discovery record + liveness probe (data the CLI
already has), and **only when a browser is attached** does it open a tap session
to enrich the result with in-app run state from one new binding command.

```
cypress tap status
        │
        ├─ listLiveRunners / resolve (browser-optional)   ← discovery + probe
        │     • not live              → { status: 'not connected' }
        │     • browserAttached false → 'browser not selected'
        │
        └─ browserAttached === true
              └─ withTapSession → exec('run-state')        ← binding, over CDP
                    • spec === null  → 'spec not selected'  (+ totalSpecs)
                    • spec present   → 'running'|'passed'|'failed'
                                       (+ spec, results, totalTests)
```

**Rejected alternative — pure binding `status`:** the binding is unreachable for
the `not connected` and `browser not selected` stages, so the CLI would have to
synthesize them anyway. That collapses back into this hybrid; making `status`
CLI-native is the honest model.

Everything the CLI already has without the binding (confirmed in code):
`LiveRunnerState` = the on-disk record (`pid`, `projectRoot`, `serverPort`,
`instanceId`, **`testingType`**) + `cdpBrowserWsUrl` from the probe response
(`browserAttached = cdpBrowserWsUrl !== null`).

---

## 3. Output contract

The user's examples drop fields between stages. For a **polling primitive** a
stable superset is friendlier (a poller reads one `status` field and the rest
fill in as the lifecycle advances). Recommended single shape:

```ts
interface TapStatus {
  status:
    | 'not connected'
    | 'browser not selected'
    | 'spec not selected'
    | 'running' | 'passed' | 'failed'

  // Identity — present whenever an instance is live (omitted for 'not connected')
  pid?: number
  projectRoot?: string
  testingType?: 'e2e' | 'component' | null
  browserAttached?: boolean

  // Spec-list onward
  totalSpecs?: number

  // On a spec
  spec?: string                 // project-relative path of the active spec
  totalTests?: number
  results?: { passed: number, failed: number, pending: number, skipped: number }
}
```

> **DECISION (confirm):** stable superset (recommended) vs. literally matching
> the three trimmed shapes in the brief. Superset is recommended for pollers;
> easy to trim later if we'd rather match the brief exactly.

Rendered with the existing `renderResult` (pretty JSON), so no new output
machinery.

---

## 4. Field → source map

| Field | Source | Notes |
|---|---|---|
| `status` | derived in the CLI from the stage gates | the orchestration in §2 |
| `pid`, `projectRoot`, `serverPort` | discovery record (`LiveRunnerState`) | already read today |
| `testingType` | discovery record | passthrough field, not gated on — see §7 |
| `browserAttached` | `cdpBrowserWsUrl !== null` from probe | as `instances` computes it |
| `totalSpecs` | binding: `readRunModeSpecs().length` | same source as `specs` command |
| `spec` | binding: active spec path | from the app runner/route — **§6 open item** |
| `results`, `totalTests` | binding: aggregate `getTestsState('__never__')` | new aggregation in `test-state.ts` |
| `running`/`passed`/`failed` | binding: run lifecycle signal | **§6 open item** |

---

## 5. Implementation — CLI side (`cli/`)

### 5a. Browser-optional resolution
`resolveRunner()` throws `NO_BROWSER_ATTACHED`; `status` must not. Extract the
selection (it already doesn't check the browser — see `selectRunner`) into a
shared `resolveLiveRunner()` returning a `LiveRunnerState` selection, and let
the existing `resolveRunner()` wrap it by adding the browser-readiness check.
- `cli/lib/runner-discovery/index.ts` — add `resolveLiveRunner()`, refactor
  `resolveRunner()` to reuse it. Keep error semantics identical for callers.

### 5b. The CLI-native `status` command
- `cli/lib/exec/tap.ts`
  - Reserve `status` alongside `instances` (short-circuit before
    `resolveRunner`; add the "a binding that advertised `status` would be
    shadowed here" note, mirroring `instances`).
  - `runStatus(options)`:
    1. `resolveLiveRunner` with `{ project, instance, cwd }`. Catch
       `NO_DISCOVERY_FILE` / `STALE_DISCOVERY_FILE` → `{ status: 'not connected' }`.
    2. Build base from the `LiveRunnerState` (`pid`, `projectRoot`,
       `testingType` as a passthrough field, `browserAttached`).
    3. `!browserAttached` → `'browser not selected'`, return.
    4. Else `withTapSession(runner, session => session.call(TAP_EXEC_METHOD,
       ['run-state', {}, {}]))`, validate the envelope, merge:
       - `spec === null` → `'spec not selected'` + `totalSpecs`.
       - else → run `state` + `spec` + `results` + `totalTests` + `totalSpecs`.
    5. `renderResult(status)`.

### 5c. Help & exit semantics
- `cli/lib/tap/output.ts` — add `status` to `GENERIC_TAP_USAGE` (it is reachable
  without a live instance, like `instances`) and add a `STATUS_USAGE` + a
  `renderStatusHelp()`.
- **DECISION (confirm) — exit codes:** recommend `status` is a *reporter*, not a
  gate: **exit 0 for every successfully-determined stage, including
  `not connected`**, so polling scripts get a stable success and branch on the
  JSON `status` field. Reserve non-zero for genuine transport faults (browser
  attached but CDP/​binding unreachable). This diverges from the
  `renderFailure → exit 1` convention the other commands use, which is the point.

---

## 6. Implementation — binding side (`packages/app`)

One new registered command supplies the in-app slice the CLI can't get from
discovery. Registered commands are the only thing `exec` can dispatch, so it
will also be callable as `cypress tap run-state` (a reasonable standalone
building block).

- `packages/app/src/runner/tap/commands/run-state.ts` — `defineCommand`, no
  params. **Unlike `tests`/`commands` it must NOT throw `NO_RUN`**: on the spec
  list it returns `{ spec: null, totalSpecs, state: 'running'?, results: zeros,
  totalTests: 0 }`. Returns:
  ```ts
  interface RunState {
    spec: string | null            // project-relative; null on the spec list
    state: 'running' | 'passed' | 'failed'
    totalSpecs: number             // readRunModeSpecs().length
    totalTests: number
    results: { passed: number, failed: number, pending: number, skipped: number }
  }
  ```
- `packages/app/src/runner/tap/commands/index.ts` — register `'run-state'`.
- `packages/app/src/runner/tap/commands/test-state.ts` — add
  `aggregateResults(runner)` that folds `getTestsState('__never__')` into the
  four counts + `totalTests` (reuses the serializer the `tests` command relies
  on; keep JSON-clean, omit nothing — counts are always numbers).

### Open implementation item — run lifecycle & active spec
Two values need a definite in-frame source pinned during implementation (the
existing commands only ever read `getEventManager().getCypress().runner`, which
gives per-test state but not run-complete or the active spec path):

- **`running` vs settled.** Candidates: a run-complete flag tracked off the
  event-manager `run:start`/`run:end` bridge (`event-manager.ts:46`), or derived
  from whether every serialized test has settled. The reporter's
  `stats-store`/`app-state.isRunning` (`packages/reporter/src/...`) live in a
  separate frame and are **not** the consistent source — prefer the
  driver/event-manager side, matching the other commands.
- **active `spec` path.** The app knows it via the runner route/spec store (the
  `run` command navigates `?file=<relative>`); confirm the exact accessor.

`passed`/`failed` (when settled) derive from `results`: any failures → `failed`,
else `passed`.

---

## 7. Stack dependency — `testingType` (passthrough only)

`status.testingType` reads from the discovery record. The record on this base
(`command-implementations`) **does not yet carry `testingType`** — that field
was added on `13627-instance-discovery` (commit "feat: record testing type in
runner discovery record") and has not propagated up the stack.

Because we dropped the "testing type not selected" gate (§1), this is **no
longer a blocker** — `status` never branches on `testingType`. It is only needed
to *populate* the passthrough `testingType` field. Run `gh stack rebase` so
`13627`'s commits flow up to this branch and the field is present; until then,
`status` simply omits it (or reports `null`). Confirm
`cli/lib/runner-discovery/record.ts` carries `testingType` after the rebase.

---

## 8. Testing plan

- **CLI unit** (`cli/test/lib/exec/tap.spec.ts`, +
  `cli/test/lib/runner-discovery.spec.ts`): all four stages — not connected
  (no record / stale), no browser, spec list, and running/passed/failed — by
  stubbing discovery + the tap session. Cover the reserved-name short-circuit
  and the chosen exit-code semantics.
- **Binding component** (`packages/app/src/runner/tap/commands/run-state.cy.ts`):
  mirror `tests.cy.ts` / `specs.cy.ts` — stub `tapRunnerSource` and
  `window.__RUN_MODE_SPECS__`; assert the spec-list (no-run, no-throw) case,
  the in-progress case, and the settled passed/failed cases, plus
  `aggregateResults` counts.
- **e2e** (`packages/app/cypress/e2e/tap-binding.cy.ts`): extend if a real
  end-to-end `run-state` round-trip is wanted.

---

## 9. Edge cases

- Multiple live instances + no `--instance`: reuse `resolveLiveRunner`'s
  selection (cwd-match → lowest pid). `not connected` only when *nothing* matches
  the filters.
- `--instance <pid>` for a dead/stale pid → `not connected`.
- Browser attached but runner page still mounting → `withTapSession` throws
  `BINDING_NOT_FOUND`; treat as a transport fault (per §5c) — the runner is up
  but not yet answering; the caller can retry.
- Component vs e2e: `testingType` flows straight from the record; `totalSpecs`
  from `__RUN_MODE_SPECS__` is testing-type agnostic.

---

## 10. Sequencing

1. `gh stack rebase` to bring `testingType` into this branch (§7) — optional;
   only populates the passthrough field, not a blocker.
2. `resolveLiveRunner` refactor (§5a).
3. Binding `run-state` command + `aggregateResults` (§6) — resolve the two open
   items first.
4. CLI-native `status` orchestration + help (§5b/§5c).
5. Tests (§8).
6. Changelog entry (`cli/CHANGELOG.md`) + PR template; `gh stack submit`.

## Out of scope
- `status --watch`/streaming (this is poll-driven; a one-shot read).
- Surfacing per-test detail (that is the existing `tests` command).
