# @packages/driver

The core JavaScript library loaded inside the browser that is responsible for executing Cypress commands and managing the test runtime. It implements the `cy` object, all built-in commands (`cy.get`, `cy.click`, `cy.intercept`, etc.), the Mocha integration, and the AUT lifecycle.

## Key Commands

```bash
# NOTE: Full suite is slow (hundreds of tests); always target a specific file or grep pattern

# Run a specific vitest unit test file
yarn workspace @packages/driver test -- <path-to-spec>

# Run vitest tests matching a glob pattern
yarn workspace @packages/driver test -- "<glob-pattern>"

# Run driver E2E tests against a specific spec
yarn workspace @packages/driver cypress:run -- --spec <path-to-spec>

# Type-check
yarn workspace @packages/driver check-ts
```

## Architecture

```
src/
  config/        Driver-level config helpers (reading resolved config inside the browser)
  cross-origin/  Cross-origin iframe communication: spec bridge, postMessage protocol
  cy/            Core cy object, command queue, stability waits, timeouts, chaining
  cypress/       Top-level Cypress singleton, mocha integration, error handling
  dom/           DOM utilities (selectors, traversal, visibility checks, screenshots)
  util/          Shared browser utilities (events, timers, serialization helpers)
  main.ts        Bundle entry point
  cypress.ts     Public Cypress API surface
```

## Gotchas / Notes

- The driver is consumed by `@packages/runner` (webpack bundle) and ultimately served to the browser. It is **not** built in isolation; changes are picked up by running `yarn watch` from the repo root or `yarn workspace @packages/runner watch`.
- `workspaces.nohoist: ["*"]` is set so that all dependencies are installed locally inside `packages/driver/node_modules` rather than hoisted — this prevents version conflicts with browser-targeted packages.
- Cypress tests for the driver itself use a local Express server (spawned automatically in `e2e.setupNodeEvents`) rather than a manually started dev server.
- `postinstall` runs `patch-package` to apply local patches to dependencies.
- Cross-origin testing (`cy.origin`) relies on the `cross-origin/` spec bridge and a secondary `cypress.ts` bundle injected into cross-origin frames.

## Integration Points

- Runtime dependency of **@packages/runner** (bundled) and implicitly **@packages/app** (loaded via Module Federation).
- Uses **@packages/net-stubbing** for the browser-side `cy.intercept()` implementation.
- Uses **@packages/socket** for browser↔server real-time communication.
- Uses **@packages/errors** for consistent error formatting.
