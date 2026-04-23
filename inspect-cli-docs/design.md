# `cypress inspect` — CLI Introspection & Control of Open-Mode Instances

**Status:** Design proposal (MVP)
**Scope:** Add a `cypress inspect` command family to the CLI that can discover, query, and control running `cypress open` instances on the local machine.

---

## 1. Problem & Vision

Today the CLI dispatches `cypress open`, `cypress run`, etc. as one-shot operations. Once `cypress open` is running, the CLI that launched it has no channel to talk to it — the launching CLI spawns Electron via `cp.spawn()` and waits only for the exit code (`cli/lib/exec/spawn.ts:159-163`).

We want a second CLI affordance: from any fresh shell, inspect and drive a running open-mode instance.

```text
# Today
cypress open            # launches interactive GUI
# (no way to ask "what is it doing?" or "run this spec" from another shell)

# Proposed
cypress inspect                    # list running instances
cypress inspect status             # what is the active instance doing?
cypress inspect specs              # list specs in the active project
cypress inspect run <spec>         # launch a spec run (optionally wait for it)
cypress inspect switch <e2e|ct>    # switch testing type
```

This unlocks scripting, IDE integration, and agent-driven workflows against the open-mode runtime — without re-launching Cypress for every action.

---

## 2. Goals & Non-Goals

### MVP goals
- Discover running `cypress open` instances from a fresh shell.
- Query current state: project, testing type, browser status, current app route, active spec (if any).
- List specs in the active project.
- Trigger a spec run and optionally wait until it finishes.
- Switch testing type (e2e ↔ component) in a running instance.
- Machine-readable (`--json`) output on every subcommand.

### Non-goals (MVP)
- Remote/multi-machine inspection. `127.0.0.1` only.
- Streaming test output (stdout) to the inspecting CLI.
- UI automation beyond the existing GraphQL mutation surface (e.g. clicking arbitrary launchpad buttons).
- Inspecting `cypress run` (headless) processes — scope is `cypress open` only.
- Authentication hardening beyond a per-instance token + host/origin checks.

### Not doing
- **`inspect subscribe`** — streaming `graphql-refetch`-equivalent events over stdout as NDJSON. The polling surface (`inspectSnapshot` + `activeRun`) has proven sufficient for agent/editor integrations, and shipping a push channel would require closing the `/__launchpad/graphql-ws` auth gap flagged in §9.2 — cost outweighs the marginal UX win over poll.

---

## 3. Current Architecture (what we can reuse)

### 3.1 CLI layer (`cli/`)
- Parser: **commander.js**, top-level registration in `cli/lib/cli.ts:232-631`.
- Command pattern: `.command('<name>').option(...).action(async (opts) => { ... })`.
- Nested-subcommand precedent: `cypress cache (list|path|clear|prune)` at `cli/lib/cli.ts:541-583`.
- Handler modules live in `cli/lib/exec/` (spawn the binary) or `cli/lib/tasks/` (pure CLI-side work).
- **No existing `--json` convention** — we will establish one.

### 3.2 Open-mode runtime (`packages/data-context/`, `packages/server/`)
The GraphQL data-context **is already the brain**. Key files:
- GraphQL HTTP server: `packages/data-context/graphql/makeGraphQLServer.ts:66,88` — serves `/__launchpad/graphql` and `/__launchpad/graphql-ws`.
- Port: driven by `CYPRESS_INTERNAL_GRAPHQL_PORT`, otherwise OS-assigned (`makeGraphQLServer.ts:89`). Stored in-process only at `coreData.servers.gqlServerPort`.
- Binding: `127.0.0.1` only (`makeGraphQLServer.ts:94,104`). Good — blocks DNS-rebinding from remote pages.
- Central state: `packages/data-context/src/data/coreDataShape.ts:101-135` (`currentProject`, `currentTestingType`, `activeBrowser`, `app.browserStatus`, etc.).
- Real-time channels: GraphQL-WS and a socket.io namespace `/data-context` emit `graphql-refetch` (`DataEmitterActions.ts:177,195`) and domain events like `specsChange` (`gql-Subscription.ts:116-121`).

Existing mutations we will reuse as-is (all in `packages/data-context/graphql/schemaTypes/objectTypes/gql-Mutation.ts`):
| Purpose | Mutation |
|---|---|
| Switch testing type (re-launches browser) | `switchTestingTypeAndRelaunch(testingType)` |
| Set/clear testing type (no relaunch) | `setAndLoadCurrentTestingType`, `clearCurrentTestingType` |
| Launch a spec | `runSpec(specPath)` |
| Browser control | `launchpadSetBrowser`, `closeBrowser`, `focusActiveBrowserWindow` |
| Project control | `setCurrentProject`, `launchOpenProject` |

Existing queries we will reuse: `currentProject { specs, ... }`, `projects`, `versions`, `wizard`.

### 3.3 What the repo **does not** have (and we must add)
- **No discovery mechanism.** No pidfile, no portfile, no env var that fixes the port at invocation time. Multiple `cypress open` instances coexist without any coordination. Verified at `cli/lib/exec/spawn.ts:159-163` and `packages/server/lib/project-base.ts:192-209`.
- **No CLI ↔ server IPC** after spawn.
- **No auth** on the main GraphQL HTTP endpoint (relies solely on `127.0.0.1` binding).
- **No "run status" GraphQL field.** `runSpec` is fire-and-forget; there is no schema surface today that reports "spec X is running / passed / failed / finished" to external callers. **Needs follow-up research** (see §9).
- **No "current app route"** field describing where the launchpad/app UI is (intro, browser picker, spec list, spec runner). State exists implicitly across `wizard`, `currentTestingType`, `activeBrowser`, etc. but is not summarized for an external consumer.

The utility for per-user Cypress state paths already exists: `packages/server/lib/util/app_data.js:38-74` (`{ospath.data()}/Cypress/cy/{env}/…`). We will reuse it for the discovery file.

---

## 4. Proposed Architecture

Three additions; no new long-running process.

### 4.1 Discovery file (new)

When open mode finishes booting the GraphQL server, write an **instance descriptor** to disk. When the process exits (clean or crash), remove it.

**Path:** `{Cypress user data dir}/cy/{env}/running/{pid}.json`
(e.g. `~/Library/Application Support/Cypress/cy/production/running/54321.json`)

**Contents:**
```json
{
  "pid": 54321,
  "port": 58931,
  "token": "…32-byte hex…",
  "projectRoot": "/Users/me/code/my-app",
  "projectHash": "…md5(projectRoot)…",
  "cypressVersion": "15.x",
  "startedAt": "2026-04-22T15:40:12.000Z"
}
```

**Write site:** `packages/data-context/src/actions/ServersActions.ts` (where `appServerPort` is already recorded) — add `writeInstanceDescriptor()` immediately after the GraphQL server’s `listen()` resolves in `makeGraphQLServer.ts:89-96`.

**Cleanup:**
- `process.on('exit', …)` + `SIGINT`/`SIGTERM` handlers to `unlinkSync` the file.
- `cypress inspect list` self-heals: any descriptor whose `pid` is no longer alive (`process.kill(pid, 0)` throws) is deleted on read.

**Why one file per PID, not a single registry:** lock-free concurrent writes from multiple instances, trivial crash-cleanup semantics, and natural support for multiple concurrent instances.

### 4.2 Transport (reuse existing GraphQL)

The CLI client hits `http://127.0.0.1:{port}/__launchpad/graphql` with standard POST `{query, variables}`. No new server, no new protocol.

Add a single HTTP middleware to `makeGraphQLServer.ts`:
- Reject if `Origin` header is present and not `null` / `http://localhost:{port}` / `http://127.0.0.1:{port}`. (Blocks cross-origin browser use while allowing curl/Node/fetch from trusted tooling.)
- Require `X-Cypress-Inspect-Token` header matching the descriptor’s `token` for any request whose query/mutation name begins with `inspect…` **or** for every non-WS request — TBD in §9.

### 4.3 Schema extensions (new)

A thin `InspectSnapshot` type that aggregates what the CLI needs in one round-trip:

```graphql
type InspectSnapshot {
  pid: Int!
  cypressVersion: String!
  projectRoot: String
  testingType: TestingTypeEnum      # e2e | component | null
  browserStatus: String              # 'closed' | 'opening' | 'open' | 'closing'
  activeBrowser: Browser             # reuse existing Browser type
  appRoute: AppRoute!                # see enum below
  activeRun: ActiveRun               # null when idle
  specCount: Int!
}

enum AppRoute {
  INTRO
  ADD_PROJECT
  TESTING_TYPE_SELECTION
  BROWSER_SELECTION
  SPEC_LIST
  SPEC_RUNNING
  ERROR
}

type ActiveRun {
  specPath: String!
  startedAt: DateTime!
  status: String!       # 'starting' | 'running' | 'finished' | 'errored'
  # MVP: fields beyond `status` are best-effort; see §9 open questions
}

extend type Query {
  inspectSnapshot: InspectSnapshot!
}
```

`appRoute` is derived from `coreData` in a single resolver (`projectRoot` null → `INTRO`; `currentTestingType` null → `TESTING_TYPE_SELECTION`; `activeBrowser && browserStatus==='open' && activeRun` → `SPEC_RUNNING`; etc.). Consolidating this logic once, server-side, avoids forcing every CLI client to replicate it.

`activeRun.status` requires wiring a new lifecycle signal (§9). For MVP, accept that transitions between `running` and `finished` may be slightly lagged; the CLI’s `--wait` option polls until the status leaves `running` or until a timeout.

---

## 5. CLI UX

All commands return exit code `0` on success, `1` on error, `2` on "no matching instance". Every subcommand accepts `--json`. `--instance <pid|projectRoot>` selects among multiple instances; omitted when there is exactly one.

### `cypress inspect` / `cypress inspect list`
```
$ cypress inspect
PID     PORT    PROJECT                           MODE  BROWSER
54321   58931   /Users/me/code/my-app             e2e   chrome (open)
54398   60122   /Users/me/code/other-app          ct    —
```
With `--json`: array of the descriptor + snapshot, minus secrets (no token).

### `cypress inspect status`
Calls `inspectSnapshot`. Text output:
```
Project:        /Users/me/code/my-app
Testing type:   e2e
Browser:        chrome (open)
App route:      SPEC_LIST
Specs:          42
Active run:     —
```

### `cypress inspect specs`
Calls `currentProject { specs { relative, specType } }`. Prints one spec per line. `--json` prints the array.

### `cypress inspect run <spec>`
- Resolves `<spec>` against the project’s spec list (fuzzy match if no exact hit, error if ambiguous).
- Calls `mutation runSpec(specPath: …)`.
- Default: returns as soon as the mutation resolves (matches current fire-and-forget semantics).
- `--wait [--timeout <ms>]`: polls `inspectSnapshot.activeRun.status` every 500 ms until it leaves `running`; exit code `0` on `finished`, `1` on `errored`, `124` on timeout.

### `cypress inspect switch <e2e|component>`
Calls `mutation switchTestingTypeAndRelaunch`. Waits for `browserStatus` to return to `open` (or `closed`, if no browser was previously selected). `--no-relaunch` instead calls `setAndLoadCurrentTestingType`.

### Wiring changes in the CLI
- New file `cli/lib/exec/inspect.ts`: a thin GraphQL client (one `fetch` wrapper, one small set of queries/mutations), subcommand router, output formatters.
- New file `cli/lib/util/instance-discovery.ts`: reads `{user data dir}/cy/{env}/running/*.json`, validates liveness, resolves `--instance` selectors.
- `cli/lib/cli.ts:143-157`: add `'inspect'` to `knownCommands`.
- `cli/lib/cli.ts` within `init()` (near the `cache` command registration at `541-583`): register the `inspect` command and subcommands following the `cache` precedent.

---

## 6. Phased Delivery

Each phase lands independently behind the `cypress inspect` umbrella. Earlier phases are usable on their own.

### Phase 0 — Discovery + read-only status (smallest landable slice)
- Write/cleanup the instance descriptor in `ServersActions.ts`.
- Add `inspectSnapshot` Query resolver (derive `appRoute` + reuse existing coreData fields; leave `activeRun` as `null` for now).
- Add Origin/token middleware.
- CLI: `inspect list`, `inspect status`, `inspect specs` (reuse existing `currentProject.specs`).
- **Ships value without any lifecycle work on runs.**

### Phase 1 — Control
- CLI: `inspect run <spec>` (no `--wait`), `inspect switch <mode>`.
- No new GraphQL — reuses existing `runSpec`, `switchTestingTypeAndRelaunch`.

### Phase 2 — Run lifecycle ✅ Landed 2026-04-22 (second attempt)

**Spike:** `./spike-run-lifecycle.md`. The first attempt (emit `runStateChange` from `onMocha`) shipped and was reverted because the Mocha reporter path is run-mode-only. The redesign routes through the driver's unconditional `Cypress.emit('run:start' | 'run:end')` instead.

- Driver `packages/driver/src/cypress.ts:543` — pass Mocha stats through `run:end` as the first arg (still internal API; safe for all in-tree listeners).
- App `packages/app/src/runner/event-manager.ts:661,668` — forward both events over the runner socket as `run:lifecycle`, gated on `!isTextTerminal` so run mode keeps using the reporter path.
- Server `packages/server/lib/socket-base.ts:360` — new `socket.on('run:lifecycle', …)` routes into `ctx.actions.runState.recordStart/recordEnd`.
- `packages/data-context/src/actions/RunStateActions.ts` (new) — owns `coreData.activeRun`; emits `runStateChange`. Also exposes `recordLaunching`, called from `ProjectActions.runSpec` just before `api.runSpec(spec)` to seed `status: 'starting'` before the driver responds, so CLI `--wait` never races past a previous run's terminal state.
- `gql-InspectSnapshot.ts` — `SPEC_RUNNING` branch in `deriveAppRoute` (only while `activeRun.status === 'running'`; terminal states fall through to `SPEC_LIST`). `ActiveRun` gains `endedAt` + `stats: ActiveRunStats`.
- CLI `inspect run <spec> --wait [--timeout <ms>]` (default 120 000 ms): polls `inspectSnapshot.activeRun` every 500 ms. Exits `0` on `finished`, `1` on `errored` (≥1 failing test), `124` on timeout.

### Phase 2.5 — Browser control ✅ Landed

- CLI `inspect browser list` — wraps `currentProject.browsers`. Prints name/channel/version/displayName with a marker on the active browser.
- CLI `inspect browser open [name]` — wraps `launchpadSetBrowser` (only when `name` differs from the current default) + `launchOpenProject`. With no `name`, uses the instance's existing `activeBrowser` (Cypress seeds this on project load via `setInitialActiveBrowser` — CLI flag → `cypress.config.defaultBrowser` → last-used → first-found). Idempotent when the browser is already open. Polls `browserStatus` until `open` with a 30 s default timeout (exit 124).
- CLI `inspect browser close` — wraps `closeBrowser`. Idempotent when `browserStatus` is already `closed` or `null` (pre-picker). Polls `browserStatus` until `closed` with a 30 s default timeout (exit 124).

### Phase 2.6 — Project control ✅ Landed

No server-side changes — the `projects` query, `setCurrentProject`, `addProject`, and `clearCurrentProject` mutations already exist and are reused via the token-gated `/__inspect/graphql` mount.

- CLI `inspect project list` — wraps the `projects` Query. Prints `projectRoot` + `title` with a marker on the currently-loaded project.
- CLI `inspect project open <path>` — resolves `<path>` against recents (exact match → substring match → filesystem path). If the resolved path is in recents, calls `setCurrentProject`; otherwise falls back to `addProject({ open: true })` so a brand-new project can be loaded in one step. Idempotent when the requested project is already current. Polls `inspectSnapshot.projectRoot` until it matches (30 s default, exit 124). Emits a hint when `testingType` is null after load so scripted open-and-run flows get a clear next step.
- CLI `inspect project add <path>` — wraps `addProject({ open: false })`. Registers the project in recents without switching to it. Server-side no-op when the project is already in recents.
- CLI `inspect project clear` — wraps `clearCurrentProject`. Idempotent when no project is loaded. Polls `projectRoot` until `null` (30 s default, exit 124).

### Phase 3 (post-MVP)
- `--instance` ergonomics (tab-complete, short aliases).

---

## 7. Security

- **Binding:** Already `127.0.0.1`. Keep it. Do not add an `0.0.0.0` escape hatch in MVP.
- **Token:** 32 random bytes (`crypto.randomBytes(32).toString('hex')`) per boot. Written to the descriptor file with mode `0600`. The CLI reads the descriptor and passes the token in `X-Cypress-Inspect-Token`. Rotates every boot.
- **Origin/Host header check:** On the GraphQL server, reject requests with an `Origin` header that is not allowlisted. This prevents a browser page loaded from `http://evil.example` from making authenticated requests even if a token leaked. Non-browser clients (the CLI) send no `Origin` or a null origin — both accepted.
- **Descriptor file permissions:** `0600`. The parent `running/` directory `0700`. Matches the security posture of `~/.ssh/`.
- **Existing file-server token** (`packages/server/lib/file_server.ts:23-32`) is unrelated and stays unchanged.

### Threats we are **not** defending against in MVP
- Local privilege escalation (another user on the same machine reading `0600` files — the OS is the defense).
- Malicious native apps already running as the user. (Out of scope; equivalent attackers can read env / memory already.)

---

## 8. Testing Plan

- **Unit (`packages/data-context`):** resolver tests for `inspectSnapshot` + `appRoute` derivation covering each enum state; descriptor write/cleanup in `ServersActions`.
- **Unit (`cli`):** discovery file reader (dead-PID cleanup, multiple-instance disambiguation), Commander action wiring, `--json` output shape snapshots.
- **Integration (`packages/server`-level):** boot open mode, assert descriptor appears, kill `-9`, assert `inspect list` prunes it.
- **E2E (`system-tests`):** spawn `cypress open` headlessly against a fixture project, run `cypress inspect run <spec> --wait`, assert exit code tracks spec pass/fail.
- **Security smoke test:** `curl` the endpoint with a wrong `Origin` → 403; with a wrong token → 401; with correct token & no Origin → 200.

---

## 9. Open Questions

1. **Run completion signal.** ✅ **Resolved 2026-04-22 (second attempt)** — see updated `./spike-run-lifecycle.md`. Routes through the driver's unconditional `Cypress.emit('run:start' | 'run:end')`, forwarded over the runner socket as `run:lifecycle` (gated on `!isTextTerminal`), handled in `socket-base.ts`, and dispatched into `RunStateActions.recordStart/recordEnd`. Stats come through via `this.emit('run:end', args[0])` — one-line driver change, internal API. `--wait` exit codes: 0 finished, 1 errored, 124 timeout.

2. **Token scope.** ✅ **Resolved** — implemented during Phase 0; see `./spike-token-scope.md`. Separate `/__inspect/graphql` mount with `originMiddleware + tokenMiddleware` (`makeGraphQLServer.ts:119`). Existing Electron renderers untouched. Residual risk: `/__launchpad/graphql-ws` has no token gate — flag for Phase 3 if `inspect subscribe` lands.

3. **Multi-project "active" selection.** When two instances are running and neither `--instance` nor cwd-match disambiguates, do we prompt, pick the most recent, or error? MVP proposal: error with a list.

4. **`specPath` resolution.** `runSpec` takes an absolute spec path. Should the CLI accept relative paths, globs, or just-the-filename and resolve against `currentProject.specs`? MVP: accept absolute + relative-to-project + unique-basename; error on ambiguity.

5. **Dev-mode parity.** When the dev server runs (`yarn dev`, `CYPRESS_INTERNAL_GRAPHQL_PORT` set), descriptor is still written but points to the dev port. Acceptable — document it.

6. **Windows path length.** `os.tmpdir()` + long project paths have historically bitten us. The descriptor path uses `{user data dir}` not tmpdir, so we should be fine, but verify on Windows in Phase 0.

---

## 10. Summary of New/Changed Files

| File | Change |
|---|---|
| `packages/data-context/src/actions/ServersActions.ts` | Write/cleanup instance descriptor; generate + store inspect token. |
| `packages/data-context/graphql/makeGraphQLServer.ts` | Add Origin check + (optional) second `/__inspect/graphql` mount with token middleware. |
| `packages/data-context/graphql/schemaTypes/objectTypes/gql-InspectSnapshot.ts` | **New.** `InspectSnapshot`, `AppRoute`, `ActiveRun`. |
| `packages/data-context/graphql/schemaTypes/objectTypes/gql-Query.ts` | Add `inspectSnapshot` field. |
| `packages/data-context/src/data/coreDataShape.ts` | Add `inspect: { token, descriptorPath }` subtree. |
| `cli/lib/cli.ts` | Register `inspect` command + subcommands (pattern from `cache`). |
| `cli/lib/exec/inspect.ts` | **New.** Subcommand router, GraphQL client, formatters. |
| `cli/lib/util/instance-discovery.ts` | **New.** Read/validate descriptors, resolve `--instance`. |
| `system-tests/test/inspect_spec.ts` | **New.** E2E happy-path coverage. |

No changes to Electron, launchpad, app, driver, or any preprocessor package.

---

## Appendix A — Example session

```shell
$ cypress open --project ./my-app &
$ cypress inspect
PID    PORT   PROJECT                MODE  BROWSER
54321  58931  /Users/me/code/my-app  —     —

$ cypress inspect switch e2e
switched testing type to e2e
browser: chrome (open)

$ cypress inspect specs --json | jq '.[].relative' | head -3
"cypress/e2e/spec.cy.ts"
"cypress/e2e/login.cy.ts"
"cypress/e2e/checkout.cy.ts"

$ cypress inspect run cypress/e2e/login.cy.ts --wait --timeout 120000
launched login.cy.ts
…
finished in 14.2s — 3 passed, 0 failed
$ echo $?
0
```
