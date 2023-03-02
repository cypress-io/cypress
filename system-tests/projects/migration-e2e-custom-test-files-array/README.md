## Migration E2E Custom testFiles

An e2e project with a custom testFiles but default integrationFolder. We won't rename the specs, but we will rename `integration` to `e2e`. `testFiles` is an *array* of globs.

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
| `integration/basic.test.js` | `e2e/basic.test.js` |
| `integration/basic.spec.js` | `e2e/basic.spec.js` |

## Manual Files

This step is not used.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.js` | `cypress/support/e2e.js` |

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
