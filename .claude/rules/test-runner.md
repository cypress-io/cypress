---
paths:
  - "**/*_spec.{ts,js,tsx,jsx}"
  - "**/*.spec.{ts,js,tsx,jsx}"
  - "**/*.cy.{ts,js,tsx,jsx}"
---

# Picking the right test command

Read the package's own scripts before running anything — the runner is per package,
and assuming vitest is wrong often enough to matter (`@packages/data-context` is on
jest, several are on mocha, several run Cypress itself):

```bash
node -e "console.log(require('./packages/server/package.json').scripts)"
```

Target one package through the workspace:

```bash
yarn workspace @packages/server test-unit -- <path-to-spec>
yarn workspace @packages/server test-unit -- --grep "<pattern>"
```

## Never use `yarn test --scope`

The root `test` script already hardcodes ~20 `--scope` flags, and lerna **unions**
scopes rather than narrowing them — so `yarn test --scope @packages/server` runs the
entire default suite *plus* server. `yarn lint --scope` and `yarn check-ts --scope`
do narrow correctly; those root scripts carry no pre-set scope.

## Green runs that prove nothing

Reading the `test` script tells you which runner starts. It does not tell you whether
the suite you care about ran at all:

- `@packages/app` — `test` is literally `echo 'ok'`. Use `cypress:run:ct` or
  `cypress:run:e2e`.
- `@packages/driver` — `test` is `vitest run`, which looks entirely normal and covers
  a handful of unit specs. The driver's real coverage is its Cypress specs under
  `cypress/e2e`, run with `yarn workspace @packages/driver cypress:run`. A green
  `test` says nothing about them.
- `npm/webpack-preprocessor` — `test` is a webpack-5 matrix script that rewrites
  `package.json` and reinstalls deps. Use `test-unit` / `test-e2e` to check a change.

The Cypress-based suites launch a real browser and do not run in the sandbox. Give the
user the exact command instead of running it.
