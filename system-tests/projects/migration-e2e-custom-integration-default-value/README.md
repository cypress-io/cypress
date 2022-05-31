## Migration E2E Custom Integration with default value

An e2e project with a custom `integrationFolder` named `cypress/integration`. It uses the default `testFiles`. We will not
update the config file to show the specPattern because the integration folder is the same as the default one

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
| `src/basic.test.js` | `src/basic.cy.js` |

## Manual Files

This step is not used.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

We can migrate to the new `cypress.config.js`. The expected output is in `expected-cypress.config.js`. The main points are:


The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).