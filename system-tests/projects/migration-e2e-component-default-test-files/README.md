## Migration E2E Component Default Test Files

A project with E2E and CT, both using custom folders. Everything else default.

The following migration steps will be used during this migration:

- [x] automatic folder rename of cypress/integration to cypress/e2e
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [x] setup component testing

## Automatic Migration

Unless the user skips this step, after this step, the filesystem will be:

| Before | After|
|---|---|
| `cypress/custom-integration/foo.spec.ts` | `cypress/custom-integration/foo.cy.ts` |
| `cypress/custom-component/button.spec.js` | `cypress/custom-component/button.cy.js` |

## Manual Files

No manual migration, since the user has a non default componentFolder.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`. There is no such `cypress/support/component.js` created here - that's going to part of the component testing reconfiguration workflow.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

We can migrate to the new `cypress.config.js`. The expected output is in `expected-cypress.config.js`. The main points are:

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).