## Migration E2E Plugins Modify Config

An e2e project where `cypress/plugins/index.js` modifies the `config`, specifically `integrationFolder` and `testFiles`.

The following migration steps will be used during this migration:

- [ ] automatic file rename
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [ ] setup component testing

## Automatic Migration

We do not show this step because both `integrationFolder` and `testFiles` are custom (via plugins).

## Manual Files

This step is not used.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
