## Migration E2E Custom SupportFile

An e2e project with a custom `supportFile` named `src/platform/testing/e2e/cypress/support/index.js`. It includes
the default value on the path but is not the default.

The following migration steps will be used during this migration:

- [x] automatic file rename
- [ ] manual file rename
- [] rename support
- [x] update config file
- [ ] setup component testing


## Automatic Migration

Unless the user skips this step, after this step, the filesystem will be:

| Before | After|
|---|---|
| `src/basic.test.js` | `src/basic.cy.js` |

## Manual Files

This step is not used.

## Update Config

We can migrate to the new `cypress.config.js`. The expected output is in `expected-cypress.config.js`. The main points are:


The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).