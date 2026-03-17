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

**Integration Points**

- Consumes virtually every other `@packages/*` package in the monorepo.
- `@packages/proxy` and `@packages/rewriter` handle all HTTP interception.
- `@packages/net-stubbing` provides `cy.intercept()` server-side state.
- `@packages/data-context` provides the GraphQL layer consumed by `@packages/launchpad` and `@packages/app`.
- `@packages/socket` provides the WebSocket bridge between the server and the browser driver.
