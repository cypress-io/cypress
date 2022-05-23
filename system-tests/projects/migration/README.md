## Migration 

This is the "kitchen sink" of migrations. It has E2E and Component Testing, a bunch of specs, a complex `cypress.json`,  and requires all the steps.

The following migration steps will be used during this migration:

- [x] automatic folder rename of cypress/integration to cypress/e2e
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [x] setup component testing

## Automatic Migration

- The project has a custom `testFiles` glob, so we will not attempt to rename their specs to use the `.cy` extension. They ARE using the default `integrationFolder`, `cypress/integration`, which we can automatically rename to `cypress/e2e`.
- Their `specPattern` will be inserted in step #4 for both `component` and `e2e`.

Unless the user skips this step, after this step, the filesystem will be:

| Before | After|
|---|---|
| `integration/app_spec.js` | `e2e/app_spec.js` |
| `integration/bar.spec.js` | `e2e/bar.spec.js` |
| `integration/blog-post-spec.ts` | `e2e/blog-post-spec.ts` |
| `integration/company.js` | `e2e/company.js` |
| `integration/homeSpec.js` | `e2e/homeSpec.js` |
| `integration/sign-up.js` | `e2e/sign-up.js` |
| `integration/someDir/someFile.js` | `e2e/someDir/someFile.js` |

## Manual Files

The user will need to rename and/or move their only component spec, `Radio.spec.js` to its new location.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

We can migrate to the new `cypress.config.js`. The expected output is in `expected-cypress.config.js`. The main points are:

- `specPattern` is nested under `e2e` and `component`, and formed by `integrationFolder` + `testFiles` for E2E and `componentFolder` + `testFiles` for component. We do NOT use the new default of `.cy.{js,jsx,ts,tsx}` because the project already has specified a custom testFiles pattern.
- `pluginsFile` is gone - it's now required inside of `setupNodeEvents`.
- `componentFolder` is gone.

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).