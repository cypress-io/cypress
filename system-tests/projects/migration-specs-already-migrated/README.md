## Migration when spec files have already been migrated but not the config file

An e2e project with all defaults. We rename the `integrationFolder` and spec extension.

The following migration steps will be used during this migration:

- [ ] automatic file rename
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [ ] setup component testing

## Automatic Migration

This step should be hidden since the rename is already done.

## Manual Files

This step is not used.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
