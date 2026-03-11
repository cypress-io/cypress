# @packages/launchpad

The Vue 3 application rendered by Electron when a user runs `cypress open`. It is the visual Cypress desktop UI responsible for login, project selection, global and project settings, browser selection, onboarding (scaffolding `cypress.config.js`, installing dependencies), and initiating test runs.

## Key Commands

```bash
# Build production assets
yarn workspace @packages/launchpad build

# Open launchpad in cypress-in-cypress dev mode (run yarn watch from repo root first)
yarn workspace @packages/launchpad dev

# Run component tests against a specific file or glob
yarn workspace @packages/launchpad cypress:run:ct -- --spec <path-to-spec>

# Run E2E tests against a specific spec
yarn workspace @packages/launchpad cypress:run:e2e -- --spec <path-to-spec>

# Type-check
yarn workspace @packages/launchpad check-ts

# Lint
yarn workspace @packages/launchpad lint
```

## Architecture

```
src/
  components/    Launchpad-specific Vue components (project picker, browser selector, etc.)
  generated/     Auto-generated GraphQL query and fragment types
  global/        App-wide utilities (error boundary, global styles)
  images/        Launchpad illustration assets
  setup/         Onboarding wizard steps (framework detection, config scaffolding, etc.)
  warning/       Deprecation and compatibility warning views
  welcome/       Welcome screen and initial project creation flow
  App.vue        Root application component
  main.ts        Vite entry point
  Main.vue       Top-level layout with router-view
```

## Gotchas / Notes

- Like `@packages/app`, `start` and `watch` scripts intentionally error — always run from the repo root with `yarn watch`.
- Tests use the **cypress-in-cypress** self-testing pattern (same `CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT=1` env var as `app`).
- The `test` script runs component tests only (`cypress:run:ct`). E2E system tests live in `@tooling/system-tests`.
- `nx.implicitDependencies` on `@packages/frontend-shared` and `@packages/data-context` means any change in those packages invalidates the launchpad build cache.

## Integration Points

- Depends on **@packages/frontend-shared** for shared Vue components, composables, and TailwindCSS config.
- Depends on **@packages/data-context** for the GraphQL backend (project state, Cloud data, onboarding actions).
- Depends on **@packages/scaffold-config** for framework detection and config file generation during onboarding.
- Consumed by **@packages/electron** which loads the built `dist/` as the Electron renderer.
