## Migration E2E Component Default With Types

A project with E2E and CT, both using default folders. Everything is default, and include types for support and plugins (`*.d.ts`), so, when reading the default files it ignores the types.

The following migration steps will be used during this migration:

- [x] automatic folder rename of cypress/integration to cypress/e2e
- [x] manual file rename
- [x] rename support
- [x] update config file
- [x] setup component testing

## Automatic Migration

Unless the user skips this step, after this step, the filesystem will be:

| Before | After|
|---|---|
| `integration/foo.spec.ts` | `e2e/foo.cy.ts` |
| `integration/spec.ts` | `e2e/spec.cy.ts` |
| `component/button.spec.js` | `component/button.cy.js` |

## Manual Files

The user will need to rename and/or move their only component spec, `button.cy.js` to its new location.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`. There is no such `cypress/support/component.js` created here - that's going to part of the component testing reconfiguration workflow.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

We can migrate to the new `cypress.config.js`. The expected output is in `expected-cypress.config.js`. The main points are:

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
