---
paths:
  - "**/*.spec.ts"
  - "**/*.spec.js"
  - "**/*.spec.tsx"
  - "**/*.cy.ts"
  - "**/*.cy.tsx"
---

# Picking the right test command

The runner is **per package**, not uniform. Check the package's own `package.json`
`test` / `test-unit` script before running anything.

| Runner | Where |
| --- | --- |
| vitest | most of `packages/`, `npm/`, and `cli` |
| **jest** (`--experimental-vm-modules`) | `@packages/data-context` — the only one |
| mocha | `@packages/server`, `@tooling/v8-snapshot`, `@tooling/electron-mksnapshot` |
| Cypress E2E/CT | `@packages/{app,launchpad,frontend-shared}`, `npm/{react,vue,vite-plugin-cypress-esm}` |

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

## Two traps

- `@packages/app`'s `test` script is literally `echo 'ok'`. A green run proves
  nothing; use `cypress:run:ct` or `cypress:run:e2e`.
- The Cypress-based suites launch a real browser and do not run in the sandbox.
  Give the user the exact command instead of running it.
