## Migration E2E Defaults rename folder only

An e2e project with all defaults. We rename only `integrationFolder` and it should add custom specPattern

The following migration steps will be used during this migration:

- [x] automatic file rename
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [ ] setup component testing

## Automatic Migration

Unless the user skips this step, after this step, the filesystem will be:

| Before | After|
|---|---|
| `integration/basic.test.js` | `e2e/basic.cy.js` |

## Manual Files

This step is not used.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
