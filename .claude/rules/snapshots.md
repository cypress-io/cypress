---
paths:
  - "**/__snapshots__/**"
  - "**/*.snap"
  - "**/*.ansi"
  - "packages/app/cypress/e2e/runner/snapshots/**"
---

# Updating snapshots

Never hand-edit a snapshot file, and never regenerate one to make a failure go away.
Four mechanisms live in this repo — using the wrong one is a hard error, not a no-op.

- **snap-shot-it `.js`** (`@packages/server`, `system-tests`, `@tooling/v8-snapshot`, root
  `__snapshots__/`) — `SNAPSHOT_UPDATE=1 <test command>`
- **vitest `.snap`** (`cli`, `@packages/{config,launcher}`, `npm/webpack-dev-server`) —
  `yarn test -u` in that workspace
- **`npm/webpack-preprocessor` `.snap`** — `yarn test-e2e -u`. Its `test` script is the
  webpack-5 matrix runner, which swallows `-u`, rewrites `package.json`, and reinstalls
  deps
- **`@packages/errors` `.ansi`** — `yarn test -u` from `packages/errors`; see
  [error handling](../../guides/error-handling.md)
- **`@packages/app` runner `.json`** — `yarn workspace @packages/app cypress:run:e2e:update:snapshots`

Details: [`packages/server/README.md`](../../packages/server/README.md) and
[`system-tests/README.md`](../../system-tests/README.md).

## Gotchas

- `UPDATE=1`, `UPDATE_SNAPSHOT=1`, and `UPDATE_SNAPSHOTS=1` each **throw** with a
  message naming the right variable. Only `SNAPSHOT_UPDATE=1` works.
- The app runner snapshots need the `CYPRESS_`-prefixed form
  (`CYPRESS_SNAPSHOT_UPDATE=1`) because they are read through `cy.env`.
- On a Retina display, add `SNAPSHOT_BROWSER=chrome` or the screenshot snapshots
  come out wrong.
- **Never run `vitest -u` to clear a host-dependent failure.** Regenerating buries
  the coupling instead of fixing it — normalize the shape (`&arch=[\w-]+`), never
  the value. See [`cli/AGENTS.md`](../../cli/AGENTS.md).
