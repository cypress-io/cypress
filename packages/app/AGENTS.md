# @packages/app

The main Vue 3 front-end for the Cypress browser-side UI. It renders the specs list, runner toolbar, Studio panel, test replay controls, and settings screens that appear inside the Cypress-controlled browser window during `cypress open`.

## Key Commands

```bash
# Build production assets
yarn workspace @packages/app build

# Open the app in cypress-in-cypress dev mode (run from repo root first with yarn watch)
yarn workspace @packages/app dev

# Run component tests against a specific file or glob
yarn workspace @packages/app cypress:run:ct -- --spec <path-to-spec>

# Run E2E tests against a specific spec
yarn workspace @packages/app cypress:run:e2e -- --spec <path-to-spec>

# Type-check
yarn workspace @packages/app check-ts

# Lint
yarn workspace @packages/app lint
```

## Architecture

```
src/
  components/    General-purpose UI components used across the app
  composables/   Vue composables (reactive state helpers)
  debug/         Debug panel views
  generated/     Auto-generated GraphQL fragment and query types
  layouts/       Top-level Vue layout wrappers
  navigation/    Sidebar and navigation components
  pages/         Route-level page components (one per view)
  prompt/        Prompt/dialog overlay components
  router/        Vue Router configuration
  runner/        AUT iframe container and runner toolbar components
  runs/          Cypress Cloud runs list and run details views
  settings/      Project and global settings views
  specs/         Specs list, spec search, and spec creation UI
  store/         Pinia stores for local UI state
  studio/        Studio panel and code generation UI
```

## Gotchas / Notes

- The app uses Vite for building but is **not** started directly — run `yarn watch` from the **repo root**, which spawns the Gulp pipeline. The `start` and `watch` scripts in this package intentionally error out to enforce this.
- Tests use a **cypress-in-cypress** self-testing pattern: the app itself is the AUT, with `CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT=1` set to enable self-testing mode. The env var `INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT` is passed via `--expose` to the child Cypress process.
- The `test` script is a no-op (`echo 'ok'`) — use `cypress:run:ct` or `cypress:run:e2e` directly.
- Module Federation (`@module-federation/runtime`) is used to load the runner and reporter bundles at runtime.
- `CYPRESS_SNAPSHOT_UPDATE=1` triggers mocha event snapshot updates during the dedicated snapshot E2E run.

## Integration Points

- Consumes **@packages/frontend-shared** for shared components, composables, and GraphQL fragment types.
- Consumes **@packages/data-context** for the GraphQL schema types (browser-side `src/index.ts` browser entry).
- Consumes **@packages/socket** for browser↔server real-time IPC.
- Consumed by **@packages/server** / **@packages/resolve-dist** which serves the built `dist/` assets to the browser.
