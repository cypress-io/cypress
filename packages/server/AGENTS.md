The server is the heart of the Cypress application — the Node.js process that proxies all browser traffic, manages browser automation, coordinates state between the Launchpad and Driver, handles file I/O, manages plugins and reporters, records video, and communicates with Cypress Cloud.

**Key Commands**

```bash
# Start the full Cypress application (dev mode)
yarn workspace @packages/server start

# NOTE: Full suite is slow (hundreds of tests); always target a specific file or grep pattern

# Run a specific unit test file
yarn workspace @packages/server test-unit -- <path-to-spec>

# Filter unit tests by name pattern
yarn workspace @packages/server test-unit -- --grep "handles request"

# Run a specific integration test file
yarn workspace @packages/server test-integration -- <path-to-spec>

# Filter integration tests by name pattern
yarn workspace @packages/server test-integration -- --grep "video capture"

# Build TypeScript to JS (production)
yarn workspace @packages/server build-prod
```

**Architecture**

- `lib/browsers/` — Browser launch, automation, and CDP/BiDi communication for Chrome, Firefox, Electron, and WebKit
- `lib/project-base.ts` — Base project class; orchestrates proxy, socket, and server setup
- `lib/server-base.ts` — HTTP/HTTPS server setup and routing
- `lib/socket-base.ts`, `lib/socket-e2e.ts`, `lib/socket-ct.ts` — WebSocket communication with the browser/driver
- `lib/open_project.ts` — Lifecycle management for open Cypress projects
- `lib/cypress.ts` — Top-level Cypress process entry
- `lib/routes.ts` — Express route definitions
- `lib/screenshots.ts` — Screenshot capture and processing
- `lib/video_capture.ts` — Video recording via ffmpeg
- `lib/session.ts` — Session management for `cy.session()`
- `lib/fixture.ts` — Fixture file loading
- `lib/exec.ts` — `cy.exec()` subprocess handling
- `lib/config.ts` — Server-side config resolution
- `lib/makeDataContext.ts` — Data context factory for GraphQL layer

**Gotchas / Notes**

- Do not build `.js` files manually during development; `@packages/ts` provides require-time transpilation.
- To disable the V8 snapshot for debugging, set `DISABLE_SNAPSHOT_REQUIRE=1`.
- To update test snapshots, prepend `SNAPSHOT_UPDATE=1` to any test command.
- E2E/system tests have moved to `system-tests/`; only unit and integration tests live in `test/unit` and `test/integration`.
- `better-sqlite3` requires native compilation; run `yarn workspace @packages/server rebuild-better-sqlite3` after an Electron version upgrade.
- Several dependencies (e.g., `axios`, `devtools-protocol`, `geckodriver`) are nohoisted to avoid version conflicts.

**Chrome/Chromium command-line switches**

When debugging browser launch behavior, adding/removing a Chrome flag, or checking whether a switch is real and what it does, use these in-repo sources of truth before searching the web:

- `lib/util/chromium_flags.ts` — `DEFAULT_FLAGS`, the switches Cypress launches Chrome/Electron with. Many entries carry an inline comment + GitHub issue link explaining *why* Cypress passes (or deliberately omits) them — read those before changing the list. Edit here to add/remove a flag.
- `lib/util/chrome-switches.json` — generated reference of valid switches: a sorted `{ "switch-name": "description" }` map where the description is Chromium's own source comment (`""` when none). It's the intersection of switches valid in **every** pinned Chrome version Cypress tests against (stable + beta), so you can look up whether a switch exists and what it does without leaving the repo. Do not hand-edit; it's regenerated.
- `test/unit/util/chromium_flags_spec.ts` — asserts every `DEFAULT_FLAGS` switch name is a key in `chrome-switches.json`. Chromium silently ignores unrecognized switches, so a typo'd or removed flag is a silent no-op; this test catches it offline. A failure here means a flag is misspelled, was removed from Chromium, or its literal moved to a source file the generator doesn't scrape yet.
- `../../scripts/generate-chrome-switches.mjs` — regenerates the JSON from Chromium source. Run `yarn workspace @packages/server generate-chrome-switches --write` to update, or `--check` to detect drift (needs network to `chromium.googlesource.com`; pins are read from `.circleci`). `SWITCH_SOURCE_FILES` lists the exact Chromium `*_switches.cc`/`.h` files scraped — add to it if a valid flag is reported unknown.
- Authoritative external references for deeper digging: the scraped `*_switches.cc`/`.h` files on `chromium.googlesource.com`, and <https://peter.sh/experiments/chromium-command-line-switches/>, which indexes every switch tree-wide with its defining file (tracks Chromium `main`, so it may be ahead of the pinned stable/beta — confirm against the pinned branch refs recorded in `chrome-switches.json`).
- Cypress officially supports only the last 3 major versions of any browser; the allowlist is intentionally scoped to the pinned tested versions, not all of Chromium history.

**Integration Points**

- Consumes virtually every other `@packages/*` package in the monorepo.
- `@packages/proxy` and `@packages/rewriter` handle all HTTP interception.
- `@packages/net-stubbing` provides `cy.intercept()` server-side state.
- `@packages/data-context` provides the GraphQL layer consumed by `@packages/launchpad` and `@packages/app`.
- `@packages/socket` provides the WebSocket bridge between the server and the browser driver.
