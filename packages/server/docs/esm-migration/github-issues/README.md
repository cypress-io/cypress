# GitHub issues: @packages/server ESM migration

Each markdown file is **one GitHub issue** (title = first `# ...` heading). Create issues by copying the body (everything below the title) or use `gh issue create`.

**Start here:** create the **[epic](./epic-esm-server-migration.md)** first and link child issues from its checklist (replace `./foo.md` links with `#NNN` after filing).

## Suggested labels

`area/server`, `tech-debt` or `enhancement`, `esm-migration` (create if needed); epic: `epic`

## Issue files (1 epic + 45 children)

- [`epic-esm-server-migration.md`](./epic-esm-server-migration.md) — [Epic] [ESM] @packages/server — Node ESM migration (graph-ordered sub-issues)
- [`c1-1-runner-entry-eslint.md`](./c1-1-runner-entry-eslint.md) — [ESM] @packages/server C1.1 — Test runner, entries, ESLint (~527 LOC)
- [`c1-2-reporter-request.md`](./c1-2-reporter-request.md) — [ESM] @packages/server C1.2 — `reporter.js` + `request.js` (~1528 LOC)
- [`c1-3-plugins-child-small-js.md`](./c1-3-plugins-child-small-js.md) — [ESM] @packages/server C1.3 — Plugin child processes + small `lib` JS (~1109 LOC)
- [`c1-4-util-js.md`](./c1-4-util-js.md) — [ESM] @packages/server C1.4 — All `lib/util/*.js` (~2420 LOC)
- [`c1-5-unit-util-specs-batch-a.md`](./c1-5-unit-util-specs-batch-a.md) — [ESM] @packages/server C1.5 — `test/unit/util` specs batch A (~1337 LOC)
- [`c1-6-unit-util-specs-batch-b.md`](./c1-6-unit-util-specs-batch-b.md) — [ESM] @packages/server C1.6 — `test/unit/util` specs batch B (~2491 LOC)
- [`c1-7-unit-util-specs-batch-c.md`](./c1-7-unit-util-specs-batch-c.md) — [ESM] @packages/server C1.7 — `test/unit/util` specs batch C (~1141 LOC)
- [`c1-8-fixtures-support-automation-specs.md`](./c1-8-fixtures-support-automation-specs.md) — [ESM] @packages/server C1.8 — Fixtures, support helpers, automation specs (~1153 LOC)
- [`c1-8-http-requests-integration-spec.md`](./c1-8-http-requests-integration-spec.md) — [ESM] @packages/server C1.8 — `http_requests_spec.js` only (~4922 LOC, exceeds budget)
- [`c1-8-integration-cli-cypress-cloud.md`](./c1-8-integration-cli-cypress-cloud.md) — [ESM] @packages/server C1.8 — Integration: CLI, Cypress, cloud extract (~2382 LOC)
- [`c1-8-integration-server-websocket-performance.md`](./c1-8-integration-server-websocket-performance.md) — [ESM] @packages/server C1.8 — Integration + perf + mockery (~2335 LOC)
- [`c1-8-unit-browser-chrome-spec.md`](./c1-8-unit-browser-chrome-spec.md) — [ESM] @packages/server C1.8 — `chrome_spec.js` (~1468 LOC)
- [`c1-8-unit-browser-electron-memory.md`](./c1-8-unit-browser-electron-memory.md) — [ESM] @packages/server C1.8 — Electron + memory browser specs (~1786 LOC)
- [`c1-8-unit-cloud-api-errors-metadata.md`](./c1-8-unit-cloud-api-errors-metadata.md) — [ESM] @packages/server C1.8 — Cloud API errors + metadata specs (~2455 LOC)
- [`c1-8-unit-cloud-api-session-artifacts.md`](./c1-8-unit-cloud-api-session-artifacts.md) — [ESM] @packages/server C1.8 — Cloud API session / artifact specs (~2398 LOC)
- [`c1-8-unit-cloud-network-studio-user.md`](./c1-8-unit-cloud-network-studio-user.md) — [ESM] @packages/server C1.8 — Cloud network, studio, user specs (~2073 LOC)
- [`c1-8-unit-config-gui-errors-iframes-modes-info.md`](./c1-8-unit-config-gui-errors-iframes-modes-info.md) — [ESM] @packages/server C1.8 — Config, GUI, errors, iframes, modes info (~2438 LOC)
- [`c1-8-unit-modes-plugins-open-project.md`](./c1-8-unit-modes-plugins-open-project.md) — [ESM] @packages/server C1.8 — Modes, plugins, open_project specs (~2104 LOC)
- [`c1-8-unit-project-reporter-remote.md`](./c1-8-unit-project-reporter-remote.md) — [ESM] @packages/server C1.8 — Project base, reporter, remote_states (~2046 LOC)
- [`c1-8-unit-request-saved-screenshots-server-base.md`](./c1-8-unit-request-saved-screenshots-server-base.md) — [ESM] @packages/server C1.8 — Request, saved_state, screenshots, server-base (~2490 LOC)
- [`c1-8-unit-snapshot-socket-task-remaining.md`](./c1-8-unit-snapshot-socket-task-remaining.md) — [ESM] @packages/server C1.8 — Snapshot, socket, task, template, xhrs (~1573 LOC)
- [`c2-1-modes-upload-results.md`](./c2-1-modes-upload-results.md) — [ESM] @packages/server C2.1 — Modes SCC: upload + pass + results + print protocol error (~624 LOC)
- [`c2-2-modes-run.md`](./c2-2-modes-run.md) — [ESM] @packages/server C2.2 — Modes SCC: `run.ts` (~1242 LOC)
- [`c2-3-modes-record-print-run.md`](./c2-3-modes-record-print-run.md) — [ESM] @packages/server C2.3 — Modes SCC: `record.ts` + `print-run.ts` (~1582 LOC)
- [`c2-4-modes-index-info.md`](./c2-4-modes-index-info.md) — [ESM] @packages/server C2.4 — Modes barrel + `info` (blocked; ~183 LOC)
- [`c3-1-automation-scc.md`](./c3-1-automation-scc.md) — [ESM] @packages/server C3.1 — Automation SCC members (~876 LOC)
- [`c3-2-browsers-cdp-cri.md`](./c3-2-browsers-cdp-cri.md) — [ESM] @packages/server C3.2 — CDP + CRI client stack (~1477 LOC)
- [`c3-3-browsers-index-utils-memory.md`](./c3-3-browsers-index-utils-memory.md) — [ESM] @packages/server C3.3 — Browser index, types, utils, memory (~1414 LOC)
- [`c3-4-cloud-api-scc.md`](./c3-4-cloud-api-scc.md) — [ESM] @packages/server C3.4 — Cloud API SCC subset (~1357 LOC)
- [`c3-5-cloud-studio-cy-prompt.md`](./c3-5-cloud-studio-cy-prompt.md) — [ESM] @packages/server C3.5 — Cloud encryption, studio, cy-prompt lifecycle (~1531 LOC)
- [`c3-6-errors-fixture-plugins-controllers-cookies.md`](./c3-6-errors-fixture-plugins-controllers-cookies.md) — [ESM] @packages/server C3.6 — Errors, fixture, plugins, controllers, cookies (~1023 LOC)
- [`c3-7-routes-socket.md`](./c3-7-routes-socket.md) — [ESM] @packages/server C3.7 — Routes + socket stack (~1307 LOC)
- [`c3-8-project-server-base.md`](./c3-8-project-server-base.md) — [ESM] @packages/server C3.8 — `project-base` + `server-base` (~1844 LOC)
- [`c4-1-bidi-browser-cri.md`](./c4-1-bidi-browser-cri.md) — [ESM] @packages/server C4.1 — Blocked lib: BiDi + browser-cri-client (~1455 LOC)
- [`c4-2-chrome-electron.md`](./c4-2-chrome-electron.md) — [ESM] @packages/server C4.2 — Blocked lib: Chrome + Electron (~1335 LOC)
- [`c4-3-firefox-webkit-protocol.md`](./c4-3-firefox-webkit-protocol.md) — [ESM] @packages/server C4.3 — Blocked lib: Firefox + WebKit + protocol (~1411 LOC)
- [`c4-4-app-shell.md`](./c4-4-app-shell.md) — [ESM] @packages/server C4.4 — Blocked lib: App shell + settings (~1148 LOC)
- [`c5-1-integration-automation-keypress.md`](./c5-1-integration-automation-keypress.md) — [ESM] @packages/server C5.1 — Blocked tests: integration + key_press (~1093 LOC)
- [`c5-2-bidi-automation-spec.md`](./c5-2-bidi-automation-spec.md) — [ESM] @packages/server C5.2 — Blocked tests: `bidi_automation_spec` (~2401 LOC)
- [`c5-3-browser-cri-cdp-queue-connection.md`](./c5-3-browser-cri-cdp-queue-connection.md) — [ESM] @packages/server C5.3 — Blocked tests: browser-cri + browsers + CDP queue/connection (~1925 LOC)
- [`c5-4-cdp-automation-cri-firefox.md`](./c5-4-cdp-automation-cri-firefox.md) — [ESM] @packages/server C5.4 — Blocked tests: CDP automation + CRI + Firefox (~1845 LOC)
- [`c5-5-memory-protocol-cloud-api-artifacts.md`](./c5-5-memory-protocol-cloud-api-artifacts.md) — [ESM] @packages/server C5.5 — Blocked tests: memory, protocol, cloud API, artifacts (~2492 LOC)
- [`c5-6-cloud-lifecycle-specs.md`](./c5-6-cloud-lifecycle-specs.md) — [ESM] @packages/server C5.6 — Blocked tests: cy-prompt + studio lifecycle (~2402 LOC)
- [`c5-7-files-fixture-routes.md`](./c5-7-files-fixture-routes.md) — [ESM] @packages/server C5.7 — Blocked tests: files, fixture, routes (~942 LOC)
- [`merge-gate-package-type-module.md`](./merge-gate-package-type-module.md) — [ESM] @packages/server — Merge gate: `type: module`, tsconfig, snapshot, full matrix

## Regenerate

```bash
python3 packages/server/docs/esm-migration/github-issues/_generate_issues.py
```
