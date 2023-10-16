## Migration E2E Defaults No Specs

An e2e project with all defaults, but no spec files. We should not show the auto rename step - nothing to rename.

The following migration steps will be used during this migration:

- [ ] automatic file rename
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [ ] setup component testing

## Automatic Migration

This step is not used, since there are no spec files to rename. For this reason it's highly unlikely `cypress/integration` exists either - this is created only when the initial integration specs are scaffolded (pre 10.x behavior - we no longer scaffold these automatically).

## Manual Files

This step is not used.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
