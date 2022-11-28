## Migration E2E Custom Integration with projectId

An e2e project with a custom `integrationFolder` named `src` and projectId. It uses the default `testFiles`. We will keep the custom `intergrationFolder`, but it'll be part of `e2e.specPattern`. We will **not** rename their specs to use the `.cy.js` extension because the project config includes a projectId

The following migration steps will be used during this migration:

- [ ] automatic file rename
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [ ] setup component testing


## Automatic Migration

This step is not used.

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