The reporter is the in-browser UI panel that displays running test results, including pass/fail/pending stats, total duration, a command log with suites/tests/hooks/assertions, and controls for auto-scrolling and run state.

**Key Commands**

```bash
# Build for local testing (webpack bundle)
yarn workspace @packages/reporter build-for-tests

# Run Cypress component tests against a specific spec
yarn workspace @packages/reporter cypress:run:ct -- --spec <path-to-spec>

# Run Cypress component tests matching a glob
yarn workspace @packages/reporter cypress:run:ct -- --spec "<glob-pattern>"
```

**Architecture**

- `src/` — All React/MobX source code
  - `src/commands/` — Command log item rendering and command model
  - `src/runnables/` — Suite, test, and runnable tree rendering and store
  - `src/attempts/` — Retry attempt rendering
  - `src/hooks/` — Hook (before/after) rendering and model
  - `src/header/` — Stats bar, controls, and run state header
  - `src/errors/` — Error display with code frames and stack traces
  - `src/sessions/` — Session display and model
  - `src/studio/` — Studio test recording UI components
  - `src/agents/`, `src/routes/`, `src/instruments/` — Network stub and spy display
  - `src/lib/` — Shared utilities, state, events, and scroll management
  - `src/main.tsx` — Entry point (browser field in package.json)

**Gotchas / Notes**

- The reporter has no standalone build command; it is bundled via `@packages/runner`'s webpack build. Run `yarn workspace @packages/runner watch` to pick up reporter changes in the live app.
- Tests have moved from `cypress/integration` to component tests (`*.cy.tsx` files colocated in `src/`).
- The reporter uses MobX for state management — models in `src/runnables/`, `src/commands/`, etc. are observable.
- The `browser` field in `package.json` points to `src/main.tsx`, meaning this package is consumed as a browser bundle, not a Node module.

**Integration Points**

- Bundled into `@packages/runner` via webpack; changes here require rebuilding `@packages/runner`.
- Consumes types from `@packages/types` and UI components from `@packages/frontend-shared` and `@packages/app`.
- Driver events flow from `@packages/driver` into the reporter's event bus (`src/lib/events.ts`).
