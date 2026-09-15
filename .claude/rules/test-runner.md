---
paths:
  - "**/*_spec.{ts,js,tsx,jsx}"
  - "**/*.spec.{ts,js,tsx,jsx}"
  - "**/*.cy.{ts,js,tsx,jsx}"
---

# Picking the right test command

The runner is **per package**, not uniform. Check the package's own `package.json`
`test` / `test-unit` script before running anything.

- **vitest** — most of `packages/`, `npm/`, and `cli`
- **jest** (`--experimental-vm-modules`) — `@packages/data-context`, the only one
- **mocha** — `@packages/server`, `@tooling/{v8-snapshot,electron-mksnapshot,packherd}`
- **Cypress E2E/CT** — `@packages/{app,launchpad,frontend-shared,driver}`,
  `npm/{react,vue,vite-plugin-cypress-esm}`
- **neither** — `npm/webpack-preprocessor`'s `test` is a webpack-5 matrix script;
  its real suites are `test-unit` and `test-e2e` (both vitest)

## Never use `yarn test --scope`

The root `test` script already hardcodes ~20 `--scope` flags, and lerna **unions**
scopes rather than narrowing them — so `yarn test --scope @packages/server` runs the
entire default suite *plus* server. To target one package, go through the workspace:

```bash
yarn workspace @packages/server test-unit -- <path-to-spec>   # mocha
yarn workspace @packages/config test -- <path-to-spec>        # vitest
```

`yarn lint --scope` and `yarn check-ts --scope` do narrow correctly — those root
scripts carry no pre-set scope.

## Green runs that prove nothing

Three packages have a `test` script that exits 0 without running the suite you
probably care about:

- `@packages/app` — `test` is literally `echo 'ok'`. Use `cypress:run:ct` or
  `cypress:run:e2e`.
- `@packages/driver` — `test` is `vitest run`, which covers a handful of unit specs.
  The driver's actual coverage is 100+ `.cy.js` specs under `cypress/e2e`, run with
  `yarn workspace @packages/driver cypress:run`. A green `test` says nothing about them.
- `npm/webpack-preprocessor` — `test` runs the webpack-5 matrix script, which rewrites
  `package.json` and reinstalls deps. Use `test-unit` / `test-e2e` to check your change.

The Cypress-based suites launch a real browser and do not run in the sandbox. Give the
user the exact command instead of running it.
